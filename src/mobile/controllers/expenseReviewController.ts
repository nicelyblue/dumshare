import type { ExpenseReviewSnapshot } from '../../data/ledger/expenseReview';
import { createLedgerAppService } from '../services/ledgerAppService';

type SnapshotReviewItem = ExpenseReviewSnapshot['items'][number] & {
  proposedExpense: ExpenseReviewSnapshot['items'][number]['proposedExpense'] & {
    split?: {
      mode: 'equal' | 'exact' | 'percentage';
      participants: Array<Record<string, unknown>>;
    };
  };
  participants?: Array<{
    participantId: string;
    displayName: string;
    owedAmountMinor: number;
    paidAmountMinor: number;
  }>;
};

export type ExpenseReviewModel = {
  items: Array<{
    splitModeLabel: 'equal' | 'custom amount' | 'percentage';
    impactLines: string[];
  }>;
};

type LoadExpenseReviewInput = {
  selectedLedgerId?: string | null;
  snapshot?: Omit<ExpenseReviewSnapshot, 'items'> & { items: SnapshotReviewItem[] };
};

function formatAmount(minor: number, currency: string): string {
  return `${(minor / 100).toFixed(2)} ${currency}`;
}

function mapSplitModeLabel(mode: 'equal' | 'exact' | 'percentage' | undefined): 'equal' | 'custom amount' | 'percentage' {
  if (mode === 'percentage') {
    return 'percentage';
  }

  if (mode === 'exact') {
    return 'custom amount';
  }

  return 'equal';
}

export async function loadExpenseReviewModel(input: LoadExpenseReviewInput): Promise<ExpenseReviewModel> {
  const snapshot =
    input.snapshot ??
    (await createLedgerAppService().loadExpenseReviewSnapshot({ selectedLedgerId: input.selectedLedgerId }));

  const items = snapshot.items.map((item) => {
    const impactLines = (item.participants ?? []).map((participant, index) => {
      const participantName = participant.displayName.trim() || `Participant ${index + 1}`;
      if (participant.paidAmountMinor > 0) {
        return `${participantName} paid ${formatAmount(participant.paidAmountMinor, item.proposedExpense.currency)}`;
      }

      return `${participantName} owes ${formatAmount(participant.owedAmountMinor, item.proposedExpense.currency)}`;
    });

    return {
      splitModeLabel: mapSplitModeLabel(item.proposedExpense.split?.mode),
      impactLines,
    };
  });

  return { items };
}
