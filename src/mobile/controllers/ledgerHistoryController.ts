import { createLedgerAppService } from '../services/ledgerAppService';
import { formatDateTimeLabel } from '../utils/formatDateTimeLabel';

export type LedgerHistoryModel = {
  summary: {
    currencyTotals: Array<{
      currency: string;
      totalLabel: string;
    }>;
  };
  entries: Array<{
    expenseId: string;
    title: string;
    amountLabel: string;
    payerLabel: string;
    participantCount: number;
    participantCountLabel: string;
    splitLabel: string;
    createdAtLabel: string;
  }>;
};

export type LedgerExpenseDetailsModel = {
  expenseId: string;
  title: string;
  timestampLabel: string;
  totalAmountLabel: string;
  totalCurrencyLabel: string;
  paidByLabel: string;
  paidAmountLabel: string;
  splitTitleLabel: string;
  splitAmountLabel: string;
  participants: Array<{
    participantId: string;
    displayName: string;
    amountLabel: string;
    statusLabel: string;
    isYou: boolean;
  }>;
};

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

function formatAmountNoCurrency(minor: number): string {
  return (minor / 100).toFixed(2);
}

export async function loadLedgerHistoryModel(input: { selectedLedgerId?: string | null }): Promise<LedgerHistoryModel> {
  const service = createLedgerAppService();
  let snapshot;
  let history;
  try {
    [snapshot, history] = await Promise.all([service.loadHomeSnapshot(input), service.loadLedgerHistory(input)]);
  } catch {
    return {
      summary: {
        currencyTotals: [],
      },
      entries: [],
    };
  }

  const participantById = new Map(snapshot.balanceSummary.participants.map((participant) => [participant.participantId, participant.displayName]));
  const totalsByCurrency = new Map<string, number>();
  for (const entry of history.entries) {
    totalsByCurrency.set(entry.currency, (totalsByCurrency.get(entry.currency) ?? 0) + entry.totalAmountMinor);
  }
  const currencyTotals = Array.from(totalsByCurrency.entries())
    .map(([currency, totalMinor]) => ({
      currency,
      totalLabel: formatAmount(totalMinor, currency),
    }))
    .sort((left, right) => left.currency.localeCompare(right.currency));

  return {
    summary: {
      currencyTotals,
    },
    entries: history.entries.map((entry) => ({
      expenseId: entry.expenseId,
      title: entry.description,
      amountLabel: `${(entry.totalAmountMinor / 100).toFixed(2)} ${entry.currency}`,
      payerLabel: entry.payers[0]
        ? `Paid by ${participantById.get(entry.payers[0].participantId) ?? entry.payers[0].participantId}`
        : 'No payer',
      participantCount: entry.participantCount,
      participantCountLabel: `${entry.participantCount} participant${entry.participantCount === 1 ? '' : 's'}`,
      splitLabel: entry.splitLabel,
      createdAtLabel: formatDateTimeLabel(entry.createdAt),
    })),
  };
}

export async function loadLedgerExpenseDetailsModel(input: {
  expenseId: string;
  selectedLedgerId?: string | null;
}): Promise<LedgerExpenseDetailsModel> {
  const details = await createLedgerAppService().loadLedgerExpenseDetails(input);
  const participantById = new Map(details.participants.map((participant) => [participant.participantId, participant.displayName]));
  const primaryPayer = details.payers[0]?.participantId;
  const paidByLabel = primaryPayer ? participantById.get(primaryPayer) ?? primaryPayer : 'Unknown';

  return {
    expenseId: details.expenseId,
    title: details.title,
    timestampLabel: `${details.expenseDate} • ${new Date(details.createdAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })}`,
    totalAmountLabel: formatAmount(details.totalAmountMinor, details.currency),
    totalCurrencyLabel: details.currency,
    paidByLabel: paidByLabel === participantById.get(details.organizerParticipantId) ? 'You' : paidByLabel,
    paidAmountLabel: formatAmount(details.totalAmountMinor, details.currency),
    splitTitleLabel: details.splitMode === 'equal' ? `Equally (${details.participantCount} people)` : details.splitLabel,
    splitAmountLabel:
      details.splitMode === 'equal' && details.participantCount > 0
        ? `${formatAmountNoCurrency(Math.round(details.totalAmountMinor / details.participantCount))} / person`
        : `${formatAmountNoCurrency(details.totalAmountMinor)} total`,
    participants: details.participants.map((participant) => {
      const isYou = participant.participantId === details.organizerParticipantId;
      const statusLabel = isYou ? (participant.paidAmountMinor > 0 ? 'Paid' : 'You') : participant.netAmountMinor < 0 ? 'Owes you' : 'Settled';
      return {
        participantId: participant.participantId,
        displayName: isYou ? 'You' : participant.displayName,
        amountLabel: formatAmount(participant.owedAmountMinor, details.currency),
        statusLabel,
        isYou,
      };
    }),
  };
}

export async function deleteExpenseById(input: { expenseId: string; selectedLedgerId?: string | null }): Promise<void> {
  await createLedgerAppService().deleteExpense(input.expenseId, input.selectedLedgerId);
}
