import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadLedgerDashboardSnapshot, type LedgerDashboardSnapshot } from '../data/ledger/ledgerSnapshot';
import { createLedgerSetupMutations } from '../data/ledger/ledgerMutations';
import { createExpenseDraftMutations } from '../data/ledger/expenseDrafts';
import {
  createExpenseReviewMutations,
  loadExpenseReviewSnapshot,
  type ExpenseReviewSnapshot,
} from '../data/ledger/expenseReview';
import { loadBalanceDetailSnapshot, type BalanceDetailSnapshot } from '../data/ledger/balanceDetails';
import {
  buildSyncRequestQr as buildSyncRequestQrData,
  parseSyncRequestQr as parseSyncRequestQrData,
  runSyncTransfer as runSyncTransferData,
} from '../data/ledger/syncSession';
import { clearLedgerDb } from '../data/sqlite/client';
import {
  createLedger,
  deleteLedger,
  listLedgers,
  resolveInitialActiveLedgerId,
  type LedgerListItem,
} from '../data/ledger/ledgers';

type LedgerSessionStatus = 'loading' | 'ready' | 'empty' | 'error';

type SetupStep = 'step1' | 'step2';

type SetupState = {
  activeStep: SetupStep;
  step1Data: {
    title: string;
    organizerName: string;
  } | null;
  step2Data: {
    participantIds: string[];
  } | null;
  isComplete: boolean;
};

type LedgerSessionState = {
  status: LedgerSessionStatus;
  activeLedgerId: string | null;
  ledgers: LedgerListItem[];
  snapshot: LedgerDashboardSnapshot;
  reviewSnapshot: ExpenseReviewSnapshot;
  balanceDetailSnapshot: BalanceDetailSnapshot;
  error: string | null;
  setupState: SetupState;
};

export type LedgerSessionValue = LedgerSessionState & {
  setActiveLedger: (ledgerId: string) => Promise<void>;
  createLedger: (input: { title: string; settlementContext: string; organizerName: string }) => Promise<string>;
  deleteLedger: (ledgerId: string) => Promise<void>;
  refresh: () => Promise<void>;
  saveLedgerSetup: (input: { title: string; settlementContext: string }) => Promise<string>;
  addParticipant: (input: { displayName: string }) => Promise<string>;
  renameParticipant: (input: { participantId: string; displayName: string }) => Promise<string>;
  removeParticipant: (input: { participantId: string }) => Promise<string>;
  submitExpenseDraft: (input: {
    description: string;
    currency: string;
    totalAmountMinor: number;
    expenseDate: string;
    creatorRole: 'organizer' | 'contributor';
    payers: { participantId: string; paidAmountMinor: number }[];
    split: {
      mode: 'equal';
      participants: { participantId: string }[];
    } | {
      mode: 'exact';
      participants: { participantId: string; owedAmountMinor: number }[];
    } | {
      mode: 'percentage';
      participants: { participantId: string; percentageBps: number }[];
    };
  }) => Promise<string>;
  submitExpenseReview: (input: {
    submissionId: string;
    decision: 'approved' | 'rejected';
    reviewReason: string;
  }) => Promise<string>;
  buildSyncRequestQr: () => Promise<string>;
  parseSyncRequestQr: (raw: string) => { ok: true; payload: { ledgerId: string; requesterDeviceId: string; lastSeenSequence: number; requestedAt: string; nonce: string } } | { ok: false; error: string };
  runSyncTransfer: (rawRequestQr: string, recipientParticipantId?: string | null) => Promise<string[]>;
  resetAppData: () => Promise<void>;
  // Setup state machine actions
  startSetup: () => void;
  setStep1Data: (data: { title: string; organizerName: string }) => void;
  progressToStep2: () => void;
  setStep2Data: (participantIds: string[]) => void;
  completeSetup: () => void;
  clearSetupState: () => void;
};

type LedgerSessionProviderProps = {
  children: React.ReactNode;
  dbName?: string;
};

const LedgerSessionContext = createContext<LedgerSessionValue | null>(null);

function createEmptyState(): LedgerSessionState {
  return {
    status: 'loading',
      activeLedgerId: null,
      ledgers: [],
      snapshot: {
      ledgerId: null,
      hasLedger: false,
      title: 'No ledger yet',
      organizerName: '',
      organizerParticipantId: null,
      settlementContext: 'Create the trip ledger in Setup to begin.',
      participantCount: 0,
      pendingApprovalCount: 0,
      latestActivityLabel: 'Waiting for the first ledger event',
      latestActivityAt: null,
      balanceSummary: {
        participants: [],
        metadata: {
          pendingSubmissionCount: 0,
          reviewedSubmissionCount: 0,
          approvalScopeNote: '',
        },
        },
      },
      reviewSnapshot: {
        hasLedger: false,
        pendingCount: 0,
        reviewedCount: 0,
        items: [],
      },
      balanceDetailSnapshot: {
        hasLedger: false,
        participants: [],
        metadata: {
          pendingSubmissionCount: 0,
          reviewedSubmissionCount: 0,
          approvalScopeNote: '',
        },
      },
      error: null,
      setupState: {
        activeStep: 'step1',
        step1Data: null,
        step2Data: null,
        isComplete: false,
      },
  };
}

export function LedgerSessionProvider({ children, dbName = 'dumshare-ui' }: LedgerSessionProviderProps) {
  const [state, setState] = useState<LedgerSessionState>(() => createEmptyState());
  const mutations = useMemo(() => createLedgerSetupMutations(dbName), [dbName]);
  const expenseDraftMutations = useMemo(() => createExpenseDraftMutations(dbName), [dbName]);
  const expenseReviewMutations = useMemo(() => createExpenseReviewMutations(dbName), [dbName]);

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: null }));

    try {
      const activeLedgerId = state.activeLedgerId ?? (await resolveInitialActiveLedgerId(dbName));
      const [snapshot, reviewSnapshot, balanceDetailSnapshot] = await Promise.all([
        loadLedgerDashboardSnapshot(dbName, activeLedgerId),
        loadExpenseReviewSnapshot(dbName, activeLedgerId),
        loadBalanceDetailSnapshot(dbName, activeLedgerId),
      ]);
      const ledgers = await listLedgers(dbName);
      const resolvedActiveLedgerId =
        activeLedgerId && ledgers.some((ledger) => ledger.ledgerId === activeLedgerId)
          ? activeLedgerId
          : ledgers[0]?.ledgerId ?? null;

      setState({
        status: snapshot.hasLedger ? 'ready' : 'empty',
        activeLedgerId: resolvedActiveLedgerId,
        ledgers,
        snapshot,
        reviewSnapshot,
        balanceDetailSnapshot,
        error: null,
      });
    } catch (error) {
      setState((current) => ({
        ...current,
        status: 'error',
        snapshot: current.snapshot,
        reviewSnapshot: current.reviewSnapshot,
        balanceDetailSnapshot: current.balanceDetailSnapshot,
        error: error instanceof Error ? error.message : 'Unable to load ledger state',
      }));
    }
  }, [dbName, state.activeLedgerId]);

  const setActiveLedger = useCallback(
    async (ledgerId: string) => {
      setState((current) => ({ ...current, activeLedgerId: ledgerId }));
      const [snapshot, reviewSnapshot, balanceDetailSnapshot, ledgers] = await Promise.all([
        loadLedgerDashboardSnapshot(dbName, ledgerId),
        loadExpenseReviewSnapshot(dbName, ledgerId),
        loadBalanceDetailSnapshot(dbName, ledgerId),
        listLedgers(dbName),
      ]);
      setState((current) => ({
        ...current,
        status: snapshot.hasLedger ? 'ready' : 'empty',
        activeLedgerId: ledgerId,
        ledgers,
        snapshot,
        reviewSnapshot,
        balanceDetailSnapshot,
        error: null,
      }));
    },
    [dbName],
  );

  const createLedgerAction = useCallback(
    async (input: { title: string; settlementContext: string; organizerName: string }) => {
      const ledgerId = await createLedger(input, dbName);
      await setActiveLedger(ledgerId);
      return ledgerId;
    },
    [dbName, setActiveLedger],
  );

  const deleteLedgerAction = useCallback(
    async (ledgerId: string) => {
      await deleteLedger(ledgerId, dbName);
      const ledgers = await listLedgers(dbName);
      const nextActive = ledgers[0]?.ledgerId ?? null;
      if (nextActive) {
        await setActiveLedger(nextActive);
        return;
      }
      setState(createEmptyState());
      await refresh();
    },
    [dbName, refresh, setActiveLedger],
  );

  const saveLedgerSetup = useCallback(
    async (input: { title: string; settlementContext: string }) => {
      const targetLedgerId = await mutations.saveLedgerSetup(input, state.activeLedgerId);
      await refresh();
      return targetLedgerId;
    },
    [mutations, refresh, state.activeLedgerId],
  );

  const addParticipant = useCallback(
    async (input: { displayName: string }) => {
      const participantId = await mutations.addParticipant(input, state.activeLedgerId);
      await refresh();
      return participantId;
    },
    [mutations, refresh, state.activeLedgerId],
  );

  const renameParticipant = useCallback(
    async (input: { participantId: string; displayName: string }) => {
      const participantId = await mutations.renameParticipant(input, state.activeLedgerId);
      await refresh();
      return participantId;
    },
    [mutations, refresh, state.activeLedgerId],
  );

  const removeParticipant = useCallback(
    async (input: { participantId: string }) => {
      const participantId = await mutations.removeParticipant(input, state.activeLedgerId);
      await refresh();
      return participantId;
    },
    [mutations, refresh, state.activeLedgerId],
  );

  const submitExpenseDraft = useCallback(
    async (input: {
      description: string;
      currency: string;
      totalAmountMinor: number;
      expenseDate: string;
      creatorRole: 'organizer' | 'contributor';
      payers: { participantId: string; paidAmountMinor: number }[];
      split: {
        mode: 'equal';
        participants: { participantId: string }[];
      } | {
        mode: 'exact';
        participants: { participantId: string; owedAmountMinor: number }[];
      } | {
        mode: 'percentage';
        participants: { participantId: string; percentageBps: number }[];
      };
    }) => {
      const expenseId = await expenseDraftMutations.submitExpenseDraft(input, state.activeLedgerId);
      await refresh();
      return expenseId;
    },
    [expenseDraftMutations, refresh, state.activeLedgerId],
  );

  const submitExpenseReview = useCallback(
    async (input: {
      submissionId: string;
      decision: 'approved' | 'rejected';
      reviewReason: string;
    }) => {
      const submissionId = await expenseReviewMutations.submitExpenseReview(input, state.activeLedgerId);
      await refresh();
      return submissionId;
    },
    [expenseReviewMutations, refresh, state.activeLedgerId],
  );

  const buildSyncRequestQr = useCallback(
    async () => buildSyncRequestQrData(dbName, 'device-contributor-ui', state.activeLedgerId),
    [dbName, state.activeLedgerId],
  );
  const parseSyncRequestQr = useCallback((raw: string) => parseSyncRequestQrData(raw), []);
  const runSyncTransfer = useCallback(
    async (rawRequestQr: string, recipientParticipantId?: string | null) => {
      const result = await runSyncTransferData({
        dbName,
        rawRequestQr,
        selectedLedgerId: state.activeLedgerId,
        recipientParticipantId,
      });
      await refresh();
      return result.statusTimeline;
    },
    [dbName, refresh, state.activeLedgerId],
  );

  const resetAppData = useCallback(async () => {
    clearLedgerDb(dbName);
    setState(createEmptyState());
    await refresh();
  }, [dbName, refresh]);

  // Setup state machine dispatch actions
  const startSetup = useCallback(() => {
    setState((current) => ({
      ...current,
      setupState: {
        activeStep: 'step1',
        step1Data: null,
        step2Data: null,
        isComplete: false,
      },
    }));
  }, []);

  const setStep1Data = useCallback((data: { title: string; organizerName: string }) => {
    setState((current) => ({
      ...current,
      setupState: {
        ...current.setupState,
        step1Data: data,
      },
    }));
  }, []);

  const progressToStep2 = useCallback(() => {
    setState((current) => ({
      ...current,
      setupState: {
        ...current.setupState,
        activeStep: 'step2',
      },
    }));
  }, []);

  const setStep2Data = useCallback((participantIds: string[]) => {
    setState((current) => ({
      ...current,
      setupState: {
        ...current.setupState,
        step2Data: {
          participantIds,
        },
      },
    }));
  }, []);

  const completeSetup = useCallback(() => {
    setState((current) => ({
      ...current,
      setupState: {
        ...current.setupState,
        isComplete: true,
      },
    }));
  }, []);

  const clearSetupState = useCallback(() => {
    setState((current) => ({
      ...current,
      setupState: {
        activeStep: 'step1',
        step1Data: null,
        step2Data: null,
        isComplete: false,
      },
    }));
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<LedgerSessionValue>(
    () => ({
      ...state,
      setActiveLedger,
      createLedger: createLedgerAction,
      deleteLedger: deleteLedgerAction,
      refresh,
      saveLedgerSetup,
      addParticipant,
      renameParticipant,
      removeParticipant,
      submitExpenseDraft,
      submitExpenseReview,
      buildSyncRequestQr,
      parseSyncRequestQr,
      runSyncTransfer,
      resetAppData,
      startSetup,
      setStep1Data,
      progressToStep2,
      setStep2Data,
      completeSetup,
      clearSetupState,
    }),
    [addParticipant, buildSyncRequestQr, clearSetupState, completeSetup, createLedgerAction, deleteLedgerAction, parseSyncRequestQr, progressToStep2, refresh, removeParticipant, renameParticipant, resetAppData, runSyncTransfer, saveLedgerSetup, setActiveLedger, setStep1Data, setStep2Data, startSetup, state, submitExpenseDraft, submitExpenseReview],
  );

  return <LedgerSessionContext.Provider value={value}>{children}</LedgerSessionContext.Provider>;
}

export function useLedgerSession(): LedgerSessionValue {
  const value = useContext(LedgerSessionContext);

  if (!value) {
    throw new Error('useLedgerSession must be used within a LedgerSessionProvider');
  }

  return value;
}

export function useOptionalLedgerSession(): LedgerSessionValue | null {
  return useContext(LedgerSessionContext);
}
