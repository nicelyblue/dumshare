import { describe, expect, test } from 'vitest';

import { normalizeExpenseDraft } from '../data/ledger/expenseDrafts';

describe('expense currency validation', () => {
  test('rejects unsupported currency codes', () => {
    expect(() =>
      normalizeExpenseDraft({
        description: 'Dinner',
        currency: 'ZZZ',
        totalAmountMinor: 1200,
        expenseDate: '2026-05-08',
        creatorRole: 'organizer',
        payers: [{ participantId: 'participant-1', paidAmountMinor: 1200 }],
        split: { mode: 'equal', participants: [{ participantId: 'participant-1' }] },
      }),
    ).toThrow('Select a supported expense currency');
  });

  test('accepts supported currency codes', () => {
    const payload = normalizeExpenseDraft({
      description: 'Dinner',
      currency: 'eur',
      totalAmountMinor: 1200,
      expenseDate: '2026-05-08',
      creatorRole: 'organizer',
      payers: [{ participantId: 'participant-1', paidAmountMinor: 1200 }],
      split: { mode: 'equal', participants: [{ participantId: 'participant-1' }] },
    });

    expect(payload.currency).toBe('EUR');
  });
});
