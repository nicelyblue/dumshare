import type { LedgerProjection } from "../projections/types";

import type { CurrencyBalanceRow, ParticipantCurrencyBalances } from "./types";

type RunningTotals = {
  paidTotalMinor: number;
  owedTotalMinor: number;
};

function getOrCreateTotals(currencyTotals: Map<string, RunningTotals>, currency: string): RunningTotals {
  const existing = currencyTotals.get(currency);
  if (existing) {
    return existing;
  }

  const created: RunningTotals = {
    paidTotalMinor: 0,
    owedTotalMinor: 0,
  };
  currencyTotals.set(currency, created);
  return created;
}

export function derivePerCurrencyBalances(
  projection: LedgerProjection,
): ParticipantCurrencyBalances[] {
  const participantOrder: string[] = [];
  const participantDisplayNames = new Map<string, string>();
  const perParticipantCurrencyTotals = new Map<string, Map<string, RunningTotals>>();

  for (const participant of projection.participants) {
    participantOrder.push(participant.participantId);
    participantDisplayNames.set(participant.participantId, participant.displayName);
    perParticipantCurrencyTotals.set(participant.participantId, new Map<string, RunningTotals>());
  }

  for (const entry of projection.entries) {
    for (const payer of entry.payers) {
      const currencyTotals = perParticipantCurrencyTotals.get(payer.participantId);
      if (!currencyTotals) {
        throw new Error(
          `Cannot derive balances for unknown participant payer: ${payer.participantId}`,
        );
      }

      const totals = getOrCreateTotals(currencyTotals, entry.currency);
      totals.paidTotalMinor += payer.paidAmountMinor;
    }

    for (const owedShare of entry.owedShares) {
      const currencyTotals = perParticipantCurrencyTotals.get(owedShare.participantId);
      if (!currencyTotals) {
        throw new Error(
          `Cannot derive balances for unknown participant owed share: ${owedShare.participantId}`,
        );
      }

      const totals = getOrCreateTotals(currencyTotals, entry.currency);
      totals.owedTotalMinor += owedShare.owedAmountMinor;
    }
  }

  return participantOrder.map((participantId) => {
    const displayName = participantDisplayNames.get(participantId);
    const currencyTotals = perParticipantCurrencyTotals.get(participantId);

    if (!displayName || !currencyTotals) {
      throw new Error(
        `Cannot derive balances for missing participant metadata: ${participantId}`,
      );
    }

    const balancesByCurrency: CurrencyBalanceRow[] = Array.from(currencyTotals.entries())
      .sort(([currencyA], [currencyB]) => currencyA.localeCompare(currencyB))
      .map(([currency, totals]) => ({
        currency,
        paidTotalMinor: totals.paidTotalMinor,
        owedTotalMinor: totals.owedTotalMinor,
        netMinor: totals.paidTotalMinor - totals.owedTotalMinor,
      }));

    return {
      participantId,
      displayName,
      balancesByCurrency,
    };
  });
}
