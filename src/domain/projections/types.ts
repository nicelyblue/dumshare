export type LedgerEntry = {
  expenseId: string;
  description: string;
  amountMinor: number;
  currency: string;
  createdAt: string;
  createdByDeviceId: string;
  sourceEventId: string;
};

export type LedgerProjection = {
  ledgerId: string;
  lastSequence: number;
  appliedEventIds: string[];
  entries: LedgerEntry[];
  title: string;
  settlementContext: string;
};
