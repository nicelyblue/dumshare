export type PendingExpenseDraft = {
  expenseId: string;
  selectedLedgerId?: string | null;
};

let pendingDraft: PendingExpenseDraft | null = null;

export function setPendingExpenseDraft(nextDraft: PendingExpenseDraft): void {
  pendingDraft = { ...nextDraft };
}

export function consumePendingExpenseDraft(): PendingExpenseDraft | null {
  const next = pendingDraft;
  pendingDraft = null;
  return next;
}

export function clearPendingExpenseDraft(): void {
  pendingDraft = null;
}
