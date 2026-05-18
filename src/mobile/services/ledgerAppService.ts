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

export type SettlementSnapshot = {
  hasLedger: boolean;
  recommendations: Array<{
    fromParticipantName: string;
    toParticipantName: string;
    amountMinor: number;
    currency: string;
  }>;
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
      participantCount: number;
      splitLabel: string;
    }>;
  }>;
  loadLedgerExpenseDetails: (input: {
    expenseId: string;
    selectedLedgerId?: string | null;
  }) => Promise<{
    expenseId: string;
    title: string;
    currency: string;
    totalAmountMinor: number;
    expenseDate: string;
    createdAt: string;
    splitLabel: string;
    splitMode: 'equal' | 'exact' | 'percentage';
    participantCount: number;
    payers: Array<{ participantId: string; paidAmountMinor: number }>;
    participants: Array<{
      participantId: string;
      displayName: string;
      owedAmountMinor: number;
      paidAmountMinor: number;
      netAmountMinor: number;
    }>;
    organizerParticipantId: string;
  }>;
  loadSettlementSnapshot: (input: { selectedLedgerId?: string | null; selectedCurrencyCode: string }) => Promise<SettlementSnapshot>;
};

type InMemoryLedger = LedgerListItem & {
  organizerParticipantId: string;
  participants: Array<{ id: string; displayName: string }>;
  expenses: Array<{
    expenseId: string;
    description: string;
    currency: string;
    totalAmountMinor: number;
    expenseDate: string;
    createdAt: string;
    payers: Array<{ participantId: string; paidAmountMinor: number }>;
    split:
      | { mode: 'equal'; participants: Array<{ participantId: string }> }
      | { mode: 'exact'; participants: Array<{ participantId: string; owedAmountMinor: number }> }
      | { mode: 'percentage'; participants: Array<{ participantId: string; percentageBps: number }> };
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

function splitEvenly(totalMinor: number, participantIds: string[]): Map<string, number> {
  const owedByParticipant = new Map<string, number>();
  if (participantIds.length === 0) {
    return owedByParticipant;
  }

  const baseShare = Math.floor(totalMinor / participantIds.length);
  let remainder = totalMinor - baseShare * participantIds.length;

  for (const participantId of participantIds) {
    const extra = remainder > 0 ? 1 : 0;
    owedByParticipant.set(participantId, baseShare + extra);
    remainder = Math.max(0, remainder - 1);
  }

  return owedByParticipant;
}

function splitByPercentage(
  totalMinor: number,
  percentages: Array<{ participantId: string; percentageBps: number }>,
): Map<string, number> {
  const owedByParticipant = new Map<string, number>();
  if (percentages.length === 0) {
    return owedByParticipant;
  }

  let assigned = 0;
  for (const entry of percentages) {
    const share = Math.floor((totalMinor * entry.percentageBps) / 10000);
    owedByParticipant.set(entry.participantId, share);
    assigned += share;
  }

  let remainder = totalMinor - assigned;
  if (remainder > 0) {
    const byWeight = [...percentages].sort((a, b) => b.percentageBps - a.percentageBps);
    let index = 0;
    while (remainder > 0 && byWeight.length > 0) {
      const participantId = byWeight[index % byWeight.length]?.participantId;
      if (!participantId) {
        break;
      }
      owedByParticipant.set(participantId, (owedByParticipant.get(participantId) ?? 0) + 1);
      remainder -= 1;
      index += 1;
    }
  }

  return owedByParticipant;
}

function buildOwedByParticipant(
  totalMinor: number,
  split:
    | { mode: 'equal'; participants: Array<{ participantId: string }> }
    | { mode: 'exact'; participants: Array<{ participantId: string; owedAmountMinor: number }> }
    | { mode: 'percentage'; participants: Array<{ participantId: string; percentageBps: number }> },
): Map<string, number> {
  if (split.mode === 'equal') {
    return splitEvenly(totalMinor, split.participants.map((participant) => participant.participantId));
  }

  if (split.mode === 'exact') {
    return new Map(split.participants.map((participant) => [participant.participantId, participant.owedAmountMinor]));
  }

  return splitByPercentage(totalMinor, split.participants);
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

    const balancesByParticipantCurrency = new Map<string, Map<string, { paidTotalMinor: number; owedTotalMinor: number }>>();
    for (const participant of target.participants) {
      balancesByParticipantCurrency.set(participant.id, new Map());
    }

    for (const expense of target.expenses) {
      const currency = expense.currency;
      const owedByParticipant = buildOwedByParticipant(expense.totalAmountMinor, expense.split);

      for (const payer of expense.payers) {
        const balancesByCurrency = balancesByParticipantCurrency.get(payer.participantId);
        if (!balancesByCurrency) {
          continue;
        }

        const totals = balancesByCurrency.get(currency) ?? { paidTotalMinor: 0, owedTotalMinor: 0 };
        totals.paidTotalMinor += payer.paidAmountMinor;
        balancesByCurrency.set(currency, totals);
      }

      for (const [participantId, owedMinor] of owedByParticipant.entries()) {
        const balancesByCurrency = balancesByParticipantCurrency.get(participantId);
        if (!balancesByCurrency) {
          continue;
        }

        const totals = balancesByCurrency.get(currency) ?? { paidTotalMinor: 0, owedTotalMinor: 0 };
        totals.owedTotalMinor += owedMinor;
        balancesByCurrency.set(currency, totals);
      }
    }

    return {
      ledgerId: target.id,
      hasLedger: true,
      title: target.title,
      organizerName: target.organizerName,
      organizerParticipantId: target.organizerParticipantId,
      participantCount: target.participants.length,
      latestActivityLabel: 'No expenses yet',
      latestActivityAt: '',
      balanceSummary: {
        participants: target.participants.map((participant) => ({
          participantId: participant.id,
          displayName: participant.displayName,
          balancesByCurrency: (() => {
            const computed = Array.from(balancesByParticipantCurrency.get(participant.id)?.entries() ?? []).map(([currency, totals]) => ({
              currency,
              paidTotalMinor: totals.paidTotalMinor,
              owedTotalMinor: totals.owedTotalMinor,
              netMinor: totals.paidTotalMinor - totals.owedTotalMinor,
            }));

            return computed.length > 0 ? computed : [{ currency: '', paidTotalMinor: 0, owedTotalMinor: 0, netMinor: 0 }];
          })(),
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

  function buildSettlementSnapshot(input: {
    selectedLedgerId?: string | null;
    selectedCurrencyCode: string;
  }): SettlementSnapshot {
    const target = input.selectedLedgerId
      ? store.ledgers.find((ledger) => ledger.id === input.selectedLedgerId)
      : store.ledgers[store.ledgers.length - 1];

    if (!target) {
      return { hasLedger: false, recommendations: [] };
    }

    const selectedCurrencyCode = validateRequiredField(input.selectedCurrencyCode, 'Settlement currency').toUpperCase();
    const participantCount = target.participants.length;
    if (participantCount < 2) {
      return { hasLedger: true, recommendations: [] };
    }

    const netByParticipant = new Map<string, number>();
    for (const participant of target.participants) {
      netByParticipant.set(participant.id, 0);
    }

    for (const expense of target.expenses) {
      if (expense.currency !== selectedCurrencyCode) {
        continue;
      }

      const shareMinor = Math.round(expense.totalAmountMinor / participantCount);
      for (const participant of target.participants) {
        netByParticipant.set(participant.id, (netByParticipant.get(participant.id) ?? 0) - shareMinor);
      }
      for (const payer of expense.payers) {
        netByParticipant.set(payer.participantId, (netByParticipant.get(payer.participantId) ?? 0) + payer.paidAmountMinor);
      }
    }

    const debtors = target.participants
      .map((participant) => ({ participant, amountMinor: Math.abs(Math.min(0, netByParticipant.get(participant.id) ?? 0)) }))
      .filter((entry) => entry.amountMinor > 0)
      .sort((a, b) => b.amountMinor - a.amountMinor);
    const creditors = target.participants
      .map((participant) => ({ participant, amountMinor: Math.max(0, netByParticipant.get(participant.id) ?? 0) }))
      .filter((entry) => entry.amountMinor > 0)
      .sort((a, b) => b.amountMinor - a.amountMinor);

    const recommendations: SettlementSnapshot['recommendations'] = [];
    let debtorIndex = 0;
    let creditorIndex = 0;
    while (debtorIndex < debtors.length && creditorIndex < creditors.length) {
      const debtor = debtors[debtorIndex];
      const creditor = creditors[creditorIndex];
      const transferMinor = Math.min(debtor.amountMinor, creditor.amountMinor);

      recommendations.push({
        fromParticipantName: debtor.participant.displayName,
        toParticipantName: creditor.participant.displayName,
        amountMinor: transferMinor,
        currency: selectedCurrencyCode,
      });

      debtor.amountMinor -= transferMinor;
      creditor.amountMinor -= transferMinor;

      if (debtor.amountMinor === 0) {
        debtorIndex += 1;
      }
      if (creditor.amountMinor === 0) {
        creditorIndex += 1;
      }
    }

    return {
      hasLedger: true,
      recommendations,
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
      split: input.split,
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
      const organizerParticipantId = createId('participant');
      store.ledgers.push({
        id,
        title,
        organizerName,
        organizerParticipantId,
        participants: [{ id: organizerParticipantId, displayName: organizerName }],
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
    resolveInitialActiveShareId: async () => store.ledgers[store.ledgers.length - 1]?.id ?? null,
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
        entries: [...ledger.expenses]
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
          .map((expense) => ({
            expenseId: expense.expenseId,
            description: expense.description,
            currency: expense.currency,
            totalAmountMinor: expense.totalAmountMinor,
            expenseDate: expense.expenseDate,
            createdAt: expense.createdAt,
            payers: expense.payers,
            participantCount: expense.split.participants.length,
            splitLabel: expense.splitLabel,
          })),
      };
    },
    loadLedgerExpenseDetails: async (input) => {
      const ledger = resolveTargetLedger(input.selectedLedgerId);
      const expense = ledger.expenses.find((entry) => entry.expenseId === input.expenseId);
      if (!expense) {
        throw new Error('Expense not found');
      }

      const owedByParticipant = buildOwedByParticipant(expense.totalAmountMinor, expense.split);
      const paidByParticipant = new Map<string, number>();
      for (const payer of expense.payers) {
        paidByParticipant.set(payer.participantId, (paidByParticipant.get(payer.participantId) ?? 0) + payer.paidAmountMinor);
      }

      return {
        expenseId: expense.expenseId,
        title: expense.description,
        currency: expense.currency,
        totalAmountMinor: expense.totalAmountMinor,
        expenseDate: expense.expenseDate,
        createdAt: expense.createdAt,
        splitLabel: expense.splitLabel,
        splitMode: expense.split.mode,
        participantCount: expense.split.participants.length,
        payers: expense.payers,
        participants: ledger.participants.map((participant) => {
          const owedAmountMinor = owedByParticipant.get(participant.id) ?? 0;
          const paidAmountMinor = paidByParticipant.get(participant.id) ?? 0;
          return {
            participantId: participant.id,
            displayName: participant.displayName,
            owedAmountMinor,
            paidAmountMinor,
            netAmountMinor: paidAmountMinor - owedAmountMinor,
          };
        }),
        organizerParticipantId: ledger.organizerParticipantId,
      };
    },
    loadSettlementSnapshot: async (input) => {
      return buildSettlementSnapshot(input);
    },
  };
}
