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
    expect(model.participantRows.map((row) => row.balanceLabels)).toEqual([['+42.00 EUR'], ['-21.00 EUR'], ['+0.00 EUR']]);
    expect(model.participantRows.map((row) => row.statusLabel)).toEqual(['is owed', 'owes', 'settled']);
    expect(model.currencyTotals).toEqual([{ currency: 'EUR', totalAmountLabel: 'EUR 42.00' }]);
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
      expenseId: 'latest-expense',
      title: 'Latest expense',
      payerLabel: 'Paid by Noah',
      amountLabel: '€42.00',
      participantCountLabel: 'Split across 3 participants',
      timestampLabel: '2h ago',
    });
  });

  test('returns per-currency participant balances and totals', async () => {
    const model = await loadHomeSnapshotModel({
      selectedLedgerId: null,
      snapshot: {
        ledgerId: 'ledger-1',
        hasLedger: true,
        title: 'Weekend Trip',
        organizerName: 'Mila',
        organizerParticipantId: 'participant-1',
        participantCount: 2,
        latestActivityLabel: 'Expense recorded',
        latestActivityAt: '2026-05-12T10:00:00.000Z',
        balanceSummary: {
          participants: [
            {
              participantId: 'participant-1',
              displayName: 'Mila',
              balancesByCurrency: [
                { currency: 'USD', paidTotalMinor: 10000, owedTotalMinor: 5000, netMinor: 5000 },
                { currency: 'EUR', paidTotalMinor: 0, owedTotalMinor: 4000, netMinor: -4000 },
              ],
            },
            {
              participantId: 'participant-2',
              displayName: 'Noah',
              balancesByCurrency: [
                { currency: 'USD', paidTotalMinor: 0, owedTotalMinor: 5000, netMinor: -5000 },
                { currency: 'EUR', paidTotalMinor: 4000, owedTotalMinor: 0, netMinor: 4000 },
              ],
            },
          ],
          metadata: {},
        },
      },
    });

    expect(model.participantRows.map((row) => row.balanceLabels)).toEqual([
      ['+50.00 USD', '-40.00 EUR'],
      ['-50.00 USD', '+40.00 EUR'],
    ]);
    expect(model.participantRows.map((row) => row.statusLabel)).toEqual(['mixed', 'mixed']);
    expect(model.currencyTotals).toEqual([
      { currency: 'EUR', totalAmountLabel: 'EUR 40.00' },
      { currency: 'USD', totalAmountLabel: '$100.00' },
    ]);
  });
});
