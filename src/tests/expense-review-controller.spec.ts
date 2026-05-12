import { describe, expect, test } from 'vitest';

import { loadExpenseReviewModel } from '../mobile/controllers/expenseReviewController';

describe('expense review controller', () => {
  test('maps split mode labels and participant impact lines', async () => {
    const model = await loadExpenseReviewModel({
      selectedLedgerId: 'ledger-1',
      snapshot: {
        hasLedger: true,
        pendingCount: 2,
        reviewedCount: 1,
        items: [
          {
            submissionId: 'submission-1',
            submissionType: 'expense-create',
            submittedByParticipantId: 'participant-1',
            submittedAt: '2026-05-12T08:00:00.000Z',
            status: 'pending',
            statusLabel: 'Pending organizer approval',
            proposedExpense: {
              expenseId: 'expense-1',
              description: 'Dinner',
              currency: 'EUR',
              totalAmountMinor: 6000,
              expenseDate: '2026-05-12',
              creatorRole: 'organizer',
              payers: [{ participantId: 'participant-2', paidAmountMinor: 6000 }],
              splitSummary: 'Equal split across 3 participant(s)',
              split: {
                mode: 'equal',
                participants: [
                  { participantId: 'participant-1', owedAmountMinor: 2000 },
                  { participantId: 'participant-2', owedAmountMinor: 2000 },
                  { participantId: 'participant-3', owedAmountMinor: 2000 },
                ],
              },
            },
            participants: [
              { participantId: 'participant-1', displayName: 'Mila', owedAmountMinor: 2000, paidAmountMinor: 0 },
              { participantId: 'participant-2', displayName: 'Noah', owedAmountMinor: 2000, paidAmountMinor: 6000 },
              { participantId: 'participant-3', displayName: '', owedAmountMinor: 2000, paidAmountMinor: 0 },
            ],
          },
        ],
      },
    });

    expect(model.items[0]?.splitModeLabel).toBe('equal');
    expect(model.items[0]?.impactLines).toEqual([
      'Mila owes 20.00 EUR',
      'Noah paid 60.00 EUR',
      'Participant 3 owes 20.00 EUR',
    ]);
  });

  test('maps exact and percentage split labels', async () => {
    const model = await loadExpenseReviewModel({
      selectedLedgerId: 'ledger-1',
      snapshot: {
        hasLedger: true,
        pendingCount: 2,
        reviewedCount: 0,
        items: [
          {
            submissionId: 'submission-2',
            submissionType: 'expense-create',
            submittedByParticipantId: 'participant-1',
            submittedAt: '2026-05-12T08:00:00.000Z',
            status: 'pending',
            statusLabel: 'Pending organizer approval',
            proposedExpense: {
              expenseId: 'expense-2',
              description: 'Taxi',
              currency: 'EUR',
              totalAmountMinor: 3000,
              expenseDate: '2026-05-12',
              creatorRole: 'organizer',
              payers: [{ participantId: 'participant-1', paidAmountMinor: 3000 }],
              splitSummary: 'Exact split total 30',
              split: {
                mode: 'exact',
                participants: [
                  { participantId: 'participant-1', owedAmountMinor: 1000 },
                  { participantId: 'participant-2', owedAmountMinor: 2000 },
                ],
              },
            },
            participants: [],
          },
          {
            submissionId: 'submission-3',
            submissionType: 'expense-create',
            submittedByParticipantId: 'participant-1',
            submittedAt: '2026-05-12T08:00:00.000Z',
            status: 'pending',
            statusLabel: 'Pending organizer approval',
            proposedExpense: {
              expenseId: 'expense-3',
              description: 'Hotel',
              currency: 'EUR',
              totalAmountMinor: 10000,
              expenseDate: '2026-05-12',
              creatorRole: 'organizer',
              payers: [{ participantId: 'participant-1', paidAmountMinor: 10000 }],
              splitSummary: 'Percentage split total 100%',
              split: {
                mode: 'percentage',
                participants: [
                  { participantId: 'participant-1', percentageBps: 6000 },
                  { participantId: 'participant-2', percentageBps: 4000 },
                ],
              },
            },
            participants: [],
          },
        ],
      },
    });

    expect(model.items.map((item) => item.splitModeLabel)).toEqual(['custom amount', 'percentage']);
  });
});
