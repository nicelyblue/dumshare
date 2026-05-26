import { describe, expect, test } from 'vitest';
import { submitExpenseForm } from '../mobile/controllers/expenseFormController';
import { createLedgerAppService } from '../mobile/services/ledgerAppService';

describe('expense form controller', () => {
  test('maps equal split payload for submit', async () => {
    const service = createLedgerAppService();
    const ledgerId = await service.createShare({ title: 'Trip', organizerName: 'Alice' });
    await service.addParticipant({ displayName: 'Bob', selectedLedgerId: ledgerId });

    const result = await submitExpenseForm({
      selectedLedgerId: ledgerId,
      description: 'Dinner',
      totalAmountInput: '12.50',
      currency: 'eur',
      expenseDate: '2026-05-01',
      payerParticipantId: 'participant-1',
      splitMode: 'equal',
      splitParticipantIds: ['participant-1'],
    });

    expect(result.expenseId).toContain('expense-');
  });
});
