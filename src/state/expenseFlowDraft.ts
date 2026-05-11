import type { ExpenseSplitPayload } from '../domain/events/types';

export type ExpenseFlowDraft = {
  description: string;
  currency: string;
  expenseDate: string;
  totalAmountMinor: number;
  creatorRole: 'organizer' | 'contributor';
  payers: { participantId: string; paidAmountMinor: number }[];
  split: ExpenseSplitPayload;
};

let currentDraft: ExpenseFlowDraft | null = null;

export function saveExpenseFlowDraft(draft: ExpenseFlowDraft): void {
  currentDraft = draft;
}

export function readExpenseFlowDraft(): ExpenseFlowDraft | null {
  return currentDraft;
}

export function clearExpenseFlowDraft(): void {
  currentDraft = null;
}
