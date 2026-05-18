import type { LedgerDashboardSnapshot } from '../../data/ledger/ledgerSnapshot';
import { createLedgerAppService } from '../services/ledgerAppService';
import { formatDateTimeLabel } from '../utils/formatDateTimeLabel';

export type HomeParticipantRow = {
  participantName: string;
  netAmountLabel: string;
  balanceLabels: string[];
  statusLabel: 'owes' | 'is owed' | 'settled' | 'mixed';
};

export type HomeCurrencyTotal = {
  currency: string;
  totalAmountLabel: string;
};

export type HomeSnapshotModel = {
  shareTitle: string | null;
  latestActivityLabel: string;
  participantCount: number;
  expenseCount: number;
  totalAmountLabel: string;
  currencyTotals: HomeCurrencyTotal[];
  participantRows: HomeParticipantRow[];
  latestExpenseCard: {
    expenseId: string;
    title: string;
    payerLabel: string;
    amountLabel: string;
    participantCountLabel: string;
    timestampLabel: string;
  } | null;
};

type LoadHomeSnapshotInput = {
  selectedLedgerId?: string | null;
  snapshot?: LedgerDashboardSnapshot & {
    latestExpense?: {
      expenseId?: string;
      payerName: string;
      amountLabel: string;
      participantCount: number;
      relativeTimestamp: string;
    };
  };
};

function formatMoney(netMinor: number, currency: string): string {
  const sign = netMinor >= 0 ? '+' : '-';
  const suffix = currency.trim() ? ` ${currency}` : '';
  return `${sign}${Math.abs(netMinor / 100).toFixed(2)}${suffix}`;
}

function currencySymbol(code: string): string {
  if (code === 'EUR') {
    return 'EUR ';
  }
  if (code === 'USD') {
    return '$';
  }
  if (code === 'GBP') {
    return 'GBP ';
  }
  return `${code} `;
}

function formatAmount(minor: number, currency: string): string {
  if (!currency.trim()) {
    return (minor / 100).toFixed(2);
  }
  return `${currencySymbol(currency)}${(minor / 100).toFixed(2)}`;
}

export async function loadHomeSnapshotModel(input: LoadHomeSnapshotInput): Promise<HomeSnapshotModel> {
  const snapshot =
    input.snapshot ?? (await createLedgerAppService().loadHomeSnapshot({ selectedLedgerId: input.selectedLedgerId }));

  if (!snapshot.hasLedger) {
    return {
      shareTitle: null,
      latestActivityLabel: 'No activity',
      participantCount: 0,
      expenseCount: 0,
      totalAmountLabel: '0.00',
      currencyTotals: [],
      participantRows: [],
      latestExpenseCard: null,
    };
  }

  const history = input.snapshot
    ? null
    : await createLedgerAppService().loadLedgerHistory({ selectedLedgerId: input.selectedLedgerId });

  const participantRows = snapshot.balanceSummary.participants
    .map((participant, index) => {
      const balances = [...participant.balancesByCurrency].sort((left, right) => Math.abs(right.netMinor) - Math.abs(left.netMinor));
      const primaryBalance = balances[0] ?? { netMinor: 0, currency: '' };
      const hasPositive = balances.some((balance) => balance.netMinor > 0);
      const hasNegative = balances.some((balance) => balance.netMinor < 0);
      const statusLabel =
        hasPositive && hasNegative
          ? 'mixed'
          : primaryBalance.netMinor < 0
            ? 'owes'
            : primaryBalance.netMinor > 0
              ? 'is owed'
              : 'settled';

      return {
        participantName: participant.displayName.trim() || `Participant ${index + 1}`,
        netAmountLabel: formatMoney(primaryBalance.netMinor, primaryBalance.currency),
        balanceLabels: balances.map((balance) => formatMoney(balance.netMinor, balance.currency)),
        statusLabel,
      };
    })
    .sort((left, right) => Math.abs(Number.parseFloat(right.netAmountLabel)) - Math.abs(Number.parseFloat(left.netAmountLabel)));

  const latestHistoryExpense = history?.entries[0] ?? null;
  const participantById = new Map(snapshot.balanceSummary.participants.map((participant) => [participant.participantId, participant.displayName]));
  const latestExpenseCard = input.snapshot?.latestExpense
    ? {
        expenseId: input.snapshot.latestExpense.expenseId ?? 'latest-expense',
        title: 'Latest expense',
        payerLabel: `Paid by ${input.snapshot.latestExpense.payerName}`,
        amountLabel: input.snapshot.latestExpense.amountLabel,
        participantCountLabel: `Split across ${input.snapshot.latestExpense.participantCount} participants`,
        timestampLabel: input.snapshot.latestExpense.relativeTimestamp,
      }
    : latestHistoryExpense
      ? {
          expenseId: latestHistoryExpense.expenseId,
          title: latestHistoryExpense.description,
          payerLabel: `Paid by ${participantById.get(latestHistoryExpense.payers[0]?.participantId ?? '') ?? 'Unknown participant'}`,
          amountLabel: formatAmount(latestHistoryExpense.totalAmountMinor, latestHistoryExpense.currency),
          participantCountLabel: `Split: ${latestHistoryExpense.splitLabel}`,
          timestampLabel: formatDateTimeLabel(latestHistoryExpense.createdAt),
        }
      : null;

  const totalsByCurrency = new Map<string, number>();
  if (history) {
    for (const entry of history.entries) {
      totalsByCurrency.set(entry.currency, (totalsByCurrency.get(entry.currency) ?? 0) + entry.totalAmountMinor);
    }
  } else {
    for (const participant of snapshot.balanceSummary.participants) {
      for (const balance of participant.balancesByCurrency) {
        totalsByCurrency.set(balance.currency, (totalsByCurrency.get(balance.currency) ?? 0) + balance.paidTotalMinor);
      }
    }
  }
  const currencyTotals = Array.from(totalsByCurrency.entries())
    .map(([currency, totalMinor]) => ({
      currency,
      totalAmountLabel: formatAmount(totalMinor, currency),
    }))
    .sort((left, right) => left.currency.localeCompare(right.currency));
  const primaryCurrencyTotal = currencyTotals[0]?.totalAmountLabel ?? '0.00';

  return {
    shareTitle: snapshot.hasLedger ? snapshot.title : null,
    latestActivityLabel: snapshot.latestActivityLabel,
    participantCount: snapshot.participantCount,
    expenseCount: history?.entries.length ?? 0,
    totalAmountLabel: primaryCurrencyTotal,
    currencyTotals,
    participantRows,
    latestExpenseCard,
  };
}
