import type { LedgerDashboardSnapshot } from '../../data/ledger/ledgerSnapshot';
import { createLedgerAppService } from '../services/ledgerAppService';

export type HomeParticipantRow = {
  participantName: string;
  netAmountLabel: string;
  statusLabel: 'owes' | 'is owed' | 'settled';
};

export type HomeSnapshotModel = {
  participantRows: HomeParticipantRow[];
  latestExpenseCard: {
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
      payerName: string;
      amountLabel: string;
      participantCount: number;
      relativeTimestamp: string;
    };
  };
};

function formatMoney(netMinor: number, currency: string): string {
  const sign = netMinor >= 0 ? '+' : '-';
  return `${sign}${Math.abs(netMinor / 100).toFixed(2)} ${currency}`;
}

export async function loadHomeSnapshotModel(input: LoadHomeSnapshotInput): Promise<HomeSnapshotModel> {
  const snapshot =
    input.snapshot ?? (await createLedgerAppService().loadHomeSnapshot({ selectedLedgerId: input.selectedLedgerId }));

  const participantRows = snapshot.balanceSummary.participants
    .map((participant, index) => {
      const primaryBalance = participant.balancesByCurrency[0] ?? { netMinor: 0, currency: 'EUR' };
      const statusLabel =
        primaryBalance.netMinor < 0 ? 'owes' : primaryBalance.netMinor > 0 ? 'is owed' : 'settled';

      return {
        participantName: participant.displayName.trim() || `Participant ${index + 1}`,
        netAmountLabel: formatMoney(primaryBalance.netMinor, primaryBalance.currency),
        statusLabel,
      };
    })
    .sort((left, right) => Math.abs(Number.parseFloat(right.netAmountLabel)) - Math.abs(Number.parseFloat(left.netAmountLabel)));

  const latestExpenseCard = input.snapshot?.latestExpense
    ? {
        payerLabel: `${input.snapshot.latestExpense.payerName} paid`,
        amountLabel: input.snapshot.latestExpense.amountLabel,
        participantCountLabel: `Split across ${input.snapshot.latestExpense.participantCount} participants`,
        timestampLabel: input.snapshot.latestExpense.relativeTimestamp,
      }
    : null;

  return {
    participantRows,
    latestExpenseCard,
  };
}
