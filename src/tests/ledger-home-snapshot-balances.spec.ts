import { describe, expect, test } from 'vitest';
import { createLedgerAppService } from '../mobile/services/ledgerAppService';

describe('ledger home snapshot balances', () => {
  test('computes participant net balances from submitted expenses', async () => {
    const service = createLedgerAppService('ledger-home-snapshot-balances-spec');
    const ledgerId = await service.createShare({ title: 'Trip', organizerName: 'Marko' });
    const nevenaId = await service.addParticipant({ displayName: 'Nevena', selectedLedgerId: ledgerId });

    const snapshotBefore = await service.loadHomeSnapshot({ selectedLedgerId: ledgerId });
    expect(snapshotBefore.balanceSummary.participants.every((participant) => participant.balancesByCurrency[0]?.netMinor === 0)).toBe(true);
    expect(snapshotBefore.organizerParticipantId).toBeTruthy();
    const organizerParticipantId = snapshotBefore.organizerParticipantId as string;

    await service.submitExpenseDraft(
      {
        description: 'Gas',
        currency: 'USD',
        totalAmountMinor: 10000,
        expenseDate: '2026-05-15',
        creatorRole: 'organizer',
        payers: [{ participantId: organizerParticipantId, paidAmountMinor: 10000 }],
        split: {
          mode: 'equal',
          participants: [
            { participantId: organizerParticipantId },
            { participantId: nevenaId },
          ],
        },
      },
      ledgerId,
    );

    const snapshotAfter = await service.loadHomeSnapshot({ selectedLedgerId: ledgerId });
    const byName = new Map(snapshotAfter.balanceSummary.participants.map((participant) => [participant.displayName, participant]));

    const marko = byName.get('Marko');
    const nevena = byName.get('Nevena');

    expect(marko?.balancesByCurrency[0]?.currency).toBe('USD');
    expect(marko?.balancesByCurrency[0]?.netMinor).toBe(5000);
    expect(nevena?.balancesByCurrency[0]?.currency).toBe('USD');
    expect(nevena?.balancesByCurrency[0]?.netMinor).toBe(-5000);
  });
});
