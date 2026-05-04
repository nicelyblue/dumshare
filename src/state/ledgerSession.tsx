import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadLedgerDashboardSnapshot, type LedgerDashboardSnapshot } from '../data/ledger/ledgerSnapshot';
import { createLedgerSetupMutations } from '../data/ledger/ledgerMutations';
import { createExpenseDraftMutations } from '../data/ledger/expenseDrafts';

type LedgerSessionStatus = 'loading' | 'ready' | 'empty' | 'error';

type LedgerSessionState = {
  status: LedgerSessionStatus;
  snapshot: LedgerDashboardSnapshot;
  error: string | null;
};

export type LedgerSessionValue = LedgerSessionState & {
  refresh: () => Promise<void>;
  saveLedgerSetup: (input: { title: string; settlementContext: string }) => Promise<string>;
  addParticipant: (input: { displayName: string }) => Promise<string>;
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
};

type LedgerSessionProviderProps = {
  children: React.ReactNode;
  dbName?: string;
};

const LedgerSessionContext = createContext<LedgerSessionValue | null>(null);

function createEmptyState(): LedgerSessionState {
  return {
    status: 'loading',
    snapshot: {
      ledgerId: null,
      hasLedger: false,
      title: 'No ledger yet',
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
    error: null,
  };
}

export function LedgerSessionProvider({ children, dbName = 'dumshare-ui' }: LedgerSessionProviderProps) {
  const [state, setState] = useState<LedgerSessionState>(() => createEmptyState());
  const mutations = useMemo(() => createLedgerSetupMutations(dbName), [dbName]);
  const expenseDraftMutations = useMemo(() => createExpenseDraftMutations(dbName), [dbName]);

  const refresh = useCallback(async () => {
    setState((current) => ({ ...current, status: 'loading', error: null }));

    try {
      const snapshot = await loadLedgerDashboardSnapshot(dbName);

      setState({
        status: snapshot.hasLedger ? 'ready' : 'empty',
        snapshot,
        error: null,
      });
    } catch (error) {
      setState((current) => ({
        status: 'error',
        snapshot: current.snapshot,
        error: error instanceof Error ? error.message : 'Unable to load ledger state',
      }));
    }
  }, [dbName]);

  const saveLedgerSetup = useCallback(
    async (input: { title: string; settlementContext: string }) => {
      const ledgerId = await mutations.saveLedgerSetup(input);
      await refresh();
      return ledgerId;
    },
    [mutations, refresh],
  );

  const addParticipant = useCallback(
    async (input: { displayName: string }) => {
      const participantId = await mutations.addParticipant(input);
      await refresh();
      return participantId;
    },
    [mutations, refresh],
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
      const expenseId = await expenseDraftMutations.submitExpenseDraft(input);
      await refresh();
      return expenseId;
    },
    [expenseDraftMutations, refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const value = useMemo<LedgerSessionValue>(
    () => ({ ...state, refresh, saveLedgerSetup, addParticipant, submitExpenseDraft }),
    [addParticipant, refresh, saveLedgerSetup, state, submitExpenseDraft],
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