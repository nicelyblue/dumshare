import { createLedgerAppService } from '../services/ledgerAppService';

export type LedgerHistoryModel = {
  entries: Array<{
    expenseId: string;
    title: string;
    amountLabel: string;
    payerLabel: string;
    splitLabel: string;
    createdAtLabel: string;
  }>;
};

export async function loadLedgerHistoryModel(input: { selectedLedgerId?: string | null }): Promise<LedgerHistoryModel> {
  let snapshot;
  try {
    snapshot = await createLedgerAppService().loadLedgerHistory(input);
  } catch {
    return { entries: [] };
  }
  return {
    entries: snapshot.entries.map((entry) => ({
      expenseId: entry.expenseId,
      title: entry.description,
      amountLabel: `${(entry.totalAmountMinor / 100).toFixed(2)} ${entry.currency}`,
      payerLabel: entry.payers[0] ? `Paid by ${entry.payers[0].participantId}` : 'No payer',
      splitLabel: entry.splitLabel,
      createdAtLabel: new Date(entry.createdAt).toLocaleString(),
    })),
  };
}

export async function deleteExpenseById(input: { expenseId: string; selectedLedgerId?: string | null }): Promise<void> {
  await createLedgerAppService().deleteExpense(input.expenseId, input.selectedLedgerId);
}
