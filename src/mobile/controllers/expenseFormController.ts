import { createLedgerAppService } from '../services/ledgerAppService';

export type ExpenseFormModel = {
  ledgerId: string | null;
  defaults: {
    expenseId?: string;
    description: string;
    totalAmountInput: string;
    currency: string;
    expenseDate: string;
    payerParticipantId: string;
    splitMode: 'equal' | 'exact';
  };
};

export async function loadExpenseFormModel(input: {
  selectedLedgerId?: string | null;
  editExpenseId?: string | null;
}): Promise<ExpenseFormModel> {
  if (!input.editExpenseId) {
    return {
      ledgerId: input.selectedLedgerId ?? null,
      defaults: {
        description: '',
        totalAmountInput: '',
        currency: 'EUR',
        expenseDate: new Date().toISOString().slice(0, 10),
        payerParticipantId: '',
        splitMode: 'equal',
      },
    };
  }

  const history = await createLedgerAppService().loadLedgerHistory({ selectedLedgerId: input.selectedLedgerId });
  const entry = history.entries.find((candidate) => candidate.expenseId === input.editExpenseId);
  if (!entry) {
    throw new Error('Expense not found for edit');
  }

  return {
    ledgerId: input.selectedLedgerId ?? null,
    defaults: {
      expenseId: entry.expenseId,
      description: entry.description,
      totalAmountInput: (entry.totalAmountMinor / 100).toFixed(2),
      currency: entry.currency,
      expenseDate: entry.expenseDate,
      payerParticipantId: entry.payers[0]?.participantId ?? '',
      splitMode: entry.splitLabel.includes('Custom') ? 'exact' : 'equal',
    },
  };
}

export async function submitExpenseForm(input: {
  selectedLedgerId?: string | null;
  editExpenseId?: string | null;
  description: string;
  totalAmountInput: string;
  currency: string;
  expenseDate: string;
  payerParticipantId: string;
  splitMode: 'equal' | 'exact';
  splitParticipantIds: string[];
  splitExactAmountsMinor?: Record<string, number>;
}): Promise<{ expenseId: string }> {
  const service = createLedgerAppService();
  const totalAmountMinor = Math.round(Number.parseFloat(input.totalAmountInput) * 100);
  const split =
    input.splitMode === 'equal'
      ? { mode: 'equal' as const, participants: input.splitParticipantIds.map((participantId) => ({ participantId })) }
      : {
          mode: 'exact' as const,
          participants: input.splitParticipantIds.map((participantId) => ({
            participantId,
            owedAmountMinor: input.splitExactAmountsMinor?.[participantId] ?? 0,
          })),
        };

  if (input.editExpenseId) {
    const nextExpenseId = await service.replaceExpense({
      expenseId: input.editExpenseId,
      selectedLedgerId: input.selectedLedgerId,
      draft: {
        description: input.description,
        currency: input.currency,
        totalAmountMinor,
        expenseDate: input.expenseDate,
        creatorRole: 'organizer',
        payers: [{ participantId: input.payerParticipantId, paidAmountMinor: totalAmountMinor }],
        split,
      },
    });
    return { expenseId: nextExpenseId };
  }

  const expenseId = await service.submitExpenseDraft(
    {
      description: input.description,
      currency: input.currency,
      totalAmountMinor,
      expenseDate: input.expenseDate,
      creatorRole: 'organizer',
      payers: [{ participantId: input.payerParticipantId, paidAmountMinor: totalAmountMinor }],
      split,
    },
    input.selectedLedgerId,
  );

  return { expenseId };
}
