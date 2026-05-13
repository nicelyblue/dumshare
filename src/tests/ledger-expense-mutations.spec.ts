import { describe, expect, test } from 'vitest';
import { createLedgerAppService } from '../mobile/services/ledgerAppService';

describe('ledger expense mutations', () => {
  test('replace composes delete + submit through service API', async () => {
    const service = createLedgerAppService('ledger-expense-mutations-spec');
    const ledgerId = await service.createShare({ title: 'Trip', organizerName: 'Alice' });
    const participantId = await service.addParticipant({ displayName: 'Bob', selectedLedgerId: ledgerId });
    const firstExpenseId = await service.submitExpenseDraft(
      {
        description: 'Lunch',
        currency: 'EUR',
        totalAmountMinor: 1200,
        expenseDate: '2026-05-01',
        creatorRole: 'organizer',
        payers: [{ participantId, paidAmountMinor: 1200 }],
        split: { mode: 'equal', participants: [{ participantId }] },
      },
      ledgerId,
    );

    await service.replaceExpense({
      expenseId: firstExpenseId,
      selectedLedgerId: ledgerId,
      draft: {
        description: 'Dinner',
        currency: 'EUR',
        totalAmountMinor: 1500,
        expenseDate: '2026-05-01',
        creatorRole: 'organizer',
        payers: [{ participantId, paidAmountMinor: 1500 }],
        split: { mode: 'equal', participants: [{ participantId }] },
      },
    });

    const history = await service.loadLedgerHistory({ selectedLedgerId: ledgerId });
    expect(history.entries).toHaveLength(1);
    expect(history.entries[0]?.description).toBe('Dinner');
  });
});
