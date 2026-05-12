import { describe, expect, test } from 'vitest';

import { loadHomeSnapshotModel } from '../mobile/controllers/homeSnapshotController';

describe('home snapshot controller', () => {
  test('maps participant net statuses and sorts by highest absolute net first', async () => {
    const model = await loadHomeSnapshotModel({
      selectedLedgerId: null,
      snapshot: {
        ledgerId: 'ledger-1',
        hasLedger: true,
        title: 'Weekend Trip',
        organizerName: 'Mila',
        organizerParticipantId: 'participant-1',
        participantCount: 3,
        latestActivityLabel: 'Expense recorded',
        latestActivityAt: '2026-05-12T10:00:00.000Z',
        balanceSummary: {
          participants: [
            {
              participantId: 'participant-1',
              displayName: 'Mila',
              balancesByCurrency: [{ currency: 'EUR', paidTotalMinor: 0, owedTotalMinor: 2100, netMinor: -2100 }],
            },
            {
              participantId: 'participant-2',
              displayName: 'Noah',
              balancesByCurrency: [{ currency: 'EUR', paidTotalMinor: 4200, owedTotalMinor: 0, netMinor: 4200 }],
            },
            {
              participantId: 'participant-3',
              displayName: '',
              balancesByCurrency: [{ currency: 'EUR', paidTotalMinor: 0, owedTotalMinor: 0, netMinor: 0 }],
            },
          ],
          metadata: {},
        },
      },
    });

    expect(model.participantRows.map((row) => row.participantName)).toEqual(['Noah', 'Mila', 'Participant 3']);
    expect(model.participantRows.map((row) => row.netAmountLabel)).toEqual(['+42.00 EUR', '-21.00 EUR', '+0.00 EUR']);
    expect(model.participantRows.map((row) => row.statusLabel)).toEqual(['is owed', 'owes', 'settled']);
  });

  test('includes latest expense summary card details when latest expense exists', async () => {
    const model = await loadHomeSnapshotModel({
      selectedLedgerId: 'ledger-1',
      snapshot: {
        ledgerId: 'ledger-1',
        hasLedger: true,
        title: 'Weekend Trip',
        organizerName: 'Mila',
        organizerParticipantId: 'participant-1',
        participantCount: 3,
        latestActivityLabel: 'Expense recorded',
        latestActivityAt: '2026-05-12T10:00:00.000Z',
        latestExpense: {
          payerName: 'Noah',
          amountLabel: '€42.00',
          participantCount: 3,
          relativeTimestamp: '2h ago',
        },
        balanceSummary: { participants: [], metadata: {} },
      },
    });

    expect(model.latestExpenseCard).toEqual({
      payerLabel: 'Noah paid',
      amountLabel: '€42.00',
      participantCountLabel: 'Split across 3 participants',
      timestampLabel: '2h ago',
    });
  });
});
