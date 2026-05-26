export type CurrencyBalanceRow = {
  currency: string;
  paidTotalMinor: number;
  owedTotalMinor: number;
  netMinor: number;
};

export type ParticipantCurrencyBalances = {
  participantId: string;
  displayName: string;
  balancesByCurrency: CurrencyBalanceRow[];
};
