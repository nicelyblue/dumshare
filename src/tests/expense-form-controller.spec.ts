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

  test('persists custom exact minor-unit allocations without recomputing them equally', async () => {
    const service = createLedgerAppService();
    const ledgerId = await service.createShare({ title: 'Weekend', organizerName: 'Alice' });
    const bobId = await service.addParticipant({ displayName: 'Bob', selectedLedgerId: ledgerId });
    const snapshot = await service.loadHomeSnapshot({ selectedLedgerId: ledgerId });
    const aliceId = snapshot.balanceSummary.participants.find((participant) => participant.displayName === 'Alice')?.participantId;
    expect(aliceId).toBeTruthy();

    const result = await submitExpenseForm({
      selectedLedgerId: ledgerId,
      description: 'Lunch',
      totalAmountInput: '10.01',
      currency: 'USD',
      expenseDate: '2026-08-18',
      payerParticipantId: aliceId!,
      splitMode: 'exact',
      splitParticipantIds: [aliceId!, bobId],
      splitExactAmountsMinor: { [aliceId!]: 333, [bobId]: 668 },
    });

    const details = await service.loadLedgerExpenseDetails({ expenseId: result.expenseId, selectedLedgerId: ledgerId });
    expect(details.splitMode).toBe('exact');
    expect(
      Object.fromEntries(details.participants.map((participant) => [participant.participantId, participant.owedAmountMinor])),
    ).toMatchObject({ [aliceId!]: 333, [bobId]: 668 });
  });
});
