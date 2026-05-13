export type LedgerDashboardSnapshot = {
  ledgerId: string;
  hasLedger: boolean;
  title: string;
  organizerName: string;
  organizerParticipantId: string | null;
  participantCount: number;
  latestActivityLabel: string;
  latestActivityAt: string;
  balanceSummary: {
    participants: Array<{
      participantId: string;
      displayName: string;
      balancesByCurrency: Array<{
        currency: string;
        paidTotalMinor: number;
        owedTotalMinor: number;
        netMinor: number;
      }>;
    }>;
    metadata: Record<string, unknown>;
  };
};

export type ExpenseReviewSnapshot = {
  hasLedger: boolean;
  pendingCount: number;
  reviewedCount: number;
  items: Array<{
    submissionId: string;
    submissionType: string;
    submittedByParticipantId: string;
    submittedAt: string;
    status: string;
    statusLabel: string;
    proposedExpense: {
      expenseId: string;
      description: string;
      currency: string;
      totalAmountMinor: number;
      expenseDate: string;
      creatorRole: string;
      payers: Array<{ participantId: string; paidAmountMinor: number }>;
      splitSummary: string;
    };
    participants: Array<{
      participantId: string;
      displayName: string;
      owedAmountMinor: number;
      paidAmountMinor: number;
    }>;
  }>;
};

export type LedgerListItem = {
  id: string;
  title: string;
  organizerName: string;
};

type CreateShareInput = {
  title: string;
  organizerName: string;
};

type AddParticipantInput = {
  displayName: string;
  selectedLedgerId?: string | null;
};

type RenameParticipantInput = {
  participantId: string;
  displayName: string;
  selectedLedgerId?: string | null;
};

type RemoveParticipantInput = {
  participantId: string;
  selectedLedgerId?: string | null;
};

export type LedgerAppService = {
  listShares: () => Promise<LedgerListItem[]>;
  createShare: (input: CreateShareInput) => Promise<string>;
  deleteShare: (ledgerId: string) => Promise<void>;
  resolveInitialActiveShareId: () => Promise<string | null>;
  addParticipant: (input: AddParticipantInput) => Promise<string>;
  renameParticipant: (input: RenameParticipantInput) => Promise<string>;
  removeParticipant: (input: RemoveParticipantInput) => Promise<string>;
  loadHomeSnapshot: (input: { selectedLedgerId?: string | null }) => Promise<LedgerDashboardSnapshot>;
  loadExpenseReviewSnapshot: (input: { selectedLedgerId?: string | null }) => Promise<ExpenseReviewSnapshot>;
  submitExpenseDraft: (input: {
    description: string;
    currency: string;
    totalAmountMinor: number;
    expenseDate: string;
    creatorRole: 'organizer' | 'contributor';
    payers: Array<{ participantId: string; paidAmountMinor: number }>;
    split:
      | { mode: 'equal'; participants: Array<{ participantId: string }> }
      | { mode: 'exact'; participants: Array<{ participantId: string; owedAmountMinor: number }> }
      | { mode: 'percentage'; participants: Array<{ participantId: string; percentageBps: number }> };
  }, selectedLedgerId?: string | null) => Promise<string>;
  replaceExpense: (input: {
    expenseId: string;
    draft: {
      description: string;
      currency: string;
      totalAmountMinor: number;
      expenseDate: string;
      creatorRole: 'organizer' | 'contributor';
      payers: Array<{ participantId: string; paidAmountMinor: number }>;
      split:
        | { mode: 'equal'; participants: Array<{ participantId: string }> }
        | { mode: 'exact'; participants: Array<{ participantId: string; owedAmountMinor: number }> }
        | { mode: 'percentage'; participants: Array<{ participantId: string; percentageBps: number }> };
    };
    selectedLedgerId?: string | null;
  }) => Promise<string>;
  deleteExpense: (expenseId: string, selectedLedgerId?: string | null) => Promise<void>;
  loadLedgerHistory: (input: { selectedLedgerId?: string | null }) => Promise<{
    entries: Array<{
      expenseId: string;
      description: string;
      currency: string;
      totalAmountMinor: number;
      expenseDate: string;
      createdAt: string;
      payers: Array<{ participantId: string; paidAmountMinor: number }>;
      splitLabel: string;
    }>;
  }>;
};

type InMemoryLedger = LedgerListItem & {
  participants: Array<{ id: string; displayName: string }>;
  expenses: Array<{
    expenseId: string;
    description: string;
    currency: string;
    totalAmountMinor: number;
    expenseDate: string;
    createdAt: string;
    payers: Array<{ participantId: string; paidAmountMinor: number }>;
    splitLabel: string;
  }>;
};

const inMemoryByDb = new Map<string, { ledgers: InMemoryLedger[] }>();

function getStore(dbName: string): { ledgers: InMemoryLedger[] } {
  const existing = inMemoryByDb.get(dbName);
  if (existing) {
    return existing;
  }

  const created = { ledgers: [] as InMemoryLedger[] };
  inMemoryByDb.set(dbName, created);
  return created;
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function validateRequiredField(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
}

export function createLedgerAppService(dbName = 'dumshare-ui'): LedgerAppService {
  const store = getStore(dbName);

  function resolveTargetLedger(selectedLedgerId?: string | null): InMemoryLedger {
    const ledgerId = selectedLedgerId ?? store.ledgers[store.ledgers.length - 1]?.id;
    if (!ledgerId) {
      throw new Error('Create a share before editing participants');
    }

    const target = store.ledgers.find((ledger) => ledger.id === ledgerId);
    if (!target) {
      throw new Error('Selected share was not found');
    }

    return target;
  }

  function buildHomeSnapshot(selectedLedgerId?: string | null): LedgerDashboardSnapshot {
    const target = selectedLedgerId
      ? store.ledgers.find((ledger) => ledger.id === selectedLedgerId)
      : store.ledgers[store.ledgers.length - 1];

    if (!target) {
      return {
        ledgerId: '',
        hasLedger: false,
        title: '',
        organizerName: '',
        organizerParticipantId: null,
        participantCount: 0,
        latestActivityLabel: 'No activity',
        latestActivityAt: '',
        balanceSummary: {
          participants: [],
          metadata: {},
        },
      };
    }

    return {
      ledgerId: target.id,
      hasLedger: true,
      title: target.title,
      organizerName: target.organizerName,
      organizerParticipantId: null,
      participantCount: target.participants.length,
      latestActivityLabel: 'No expenses yet',
      latestActivityAt: '',
      balanceSummary: {
        participants: target.participants.map((participant) => ({
          participantId: participant.id,
          displayName: participant.displayName,
          balancesByCurrency: [{ currency: 'EUR', paidTotalMinor: 0, owedTotalMinor: 0, netMinor: 0 }],
        })),
        metadata: {},
      },
    };
  }

  function buildExpenseReviewSnapshot(selectedLedgerId?: string | null): ExpenseReviewSnapshot {
    const target = selectedLedgerId
      ? store.ledgers.find((ledger) => ledger.id === selectedLedgerId)
      : store.ledgers[store.ledgers.length - 1];

    return {
      hasLedger: Boolean(target),
      pendingCount: 0,
      reviewedCount: 0,
      items: [],
    };
  }

  async function submitExpenseDraft(
    input: {
      description: string;
      currency: string;
      totalAmountMinor: number;
      expenseDate: string;
      creatorRole: 'organizer' | 'contributor';
      payers: Array<{ participantId: string; paidAmountMinor: number }>;
      split:
        | { mode: 'equal'; participants: Array<{ participantId: string }> }
        | { mode: 'exact'; participants: Array<{ participantId: string; owedAmountMinor: number }> }
        | { mode: 'percentage'; participants: Array<{ participantId: string; percentageBps: number }> };
    },
    selectedLedgerId?: string | null,
  ): Promise<string> {
    const ledger = resolveTargetLedger(selectedLedgerId);
    const expenseId = createId('expense');
    const splitLabel = input.split.mode === 'equal' ? 'Equal split' : input.split.mode === 'exact' ? 'Custom amount split' : 'Percentage split';
    ledger.expenses.push({
      expenseId,
      description: validateRequiredField(input.description, 'Expense description'),
      currency: validateRequiredField(input.currency, 'Expense currency').toUpperCase(),
      totalAmountMinor: input.totalAmountMinor,
      expenseDate: validateRequiredField(input.expenseDate, 'Expense date'),
      createdAt: new Date().toISOString(),
      payers: input.payers,
      splitLabel,
    });
    return expenseId;
  }

  async function deleteExpense(expenseId: string, selectedLedgerId?: string | null): Promise<void> {
    const ledger = resolveTargetLedger(selectedLedgerId);
    const idx = ledger.expenses.findIndex((entry) => entry.expenseId === expenseId);
    if (idx === -1) {
      throw new Error('Expense not found');
    }
    ledger.expenses.splice(idx, 1);
  }

  return {
    listShares: async () => store.ledgers.map(({ id, title, organizerName }) => ({ id, title, organizerName })),
    createShare: async (input) => {
      const title = validateRequiredField(input.title, 'Share title');
      const organizerName = validateRequiredField(input.organizerName, 'Organizer name');
      const id = createId('ledger');
      store.ledgers.push({
        id,
        title,
        organizerName,
        participants: [],
        expenses: [],
      });
      return id;
    },
    deleteShare: async (ledgerId) => {
      const normalizedLedgerId = validateRequiredField(ledgerId, 'Ledger id');
      const index = store.ledgers.findIndex((ledger) => ledger.id === normalizedLedgerId);
      if (index === -1) {
        throw new Error('Ledger not found');
      }
      store.ledgers.splice(index, 1);
    },
    resolveInitialActiveShareId: async () => store.ledgers[0]?.id ?? null,
    addParticipant: async (input) => {
      const displayName = validateRequiredField(input.displayName, 'Participant name');
      const ledger = resolveTargetLedger(input.selectedLedgerId);
      const participantId = createId('participant');
      ledger.participants.push({ id: participantId, displayName });
      return participantId;
    },
    renameParticipant: async (input) => {
      const participantId = validateRequiredField(input.participantId, 'Participant id');
      const displayName = validateRequiredField(input.displayName, 'Participant name');
      const ledger = resolveTargetLedger(input.selectedLedgerId);
      const participant = ledger.participants.find((entry) => entry.id === participantId);
      if (!participant) {
        throw new Error('Participant not found');
      }
      participant.displayName = displayName;
      return participantId;
    },
    removeParticipant: async (input) => {
      const participantId = validateRequiredField(input.participantId, 'Participant id');
      const ledger = resolveTargetLedger(input.selectedLedgerId);
      const index = ledger.participants.findIndex((entry) => entry.id === participantId);
      if (index === -1) {
        throw new Error('Participant not found');
      }
      ledger.participants.splice(index, 1);
      return participantId;
    },
    loadHomeSnapshot: async (input) => {
      return buildHomeSnapshot(input.selectedLedgerId);
    },
    loadExpenseReviewSnapshot: async (input) => {
      return buildExpenseReviewSnapshot(input.selectedLedgerId);
    },
    submitExpenseDraft,
    replaceExpense: async (input) => {
      await deleteExpense(input.expenseId, input.selectedLedgerId);
      return submitExpenseDraft(input.draft, input.selectedLedgerId);
    },
    deleteExpense,
    loadLedgerHistory: async (input) => {
      const ledger = resolveTargetLedger(input.selectedLedgerId);
      return {
        entries: [...ledger.expenses].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      };
    },
  };
}
