import { describe, expect, test } from 'vitest';
import { createLedgerAppService } from '../mobile/services/ledgerAppService';

describe('settlement currency conversion', () => {
  test('converts settlement recommendations into the selected currency', async () => {
    const service = createLedgerAppService('settlement-conversion-spec');
    const ledgerId = await service.createShare({ title: 'Trip', organizerName: 'Alex' });
    const blairId = await service.addParticipant({ displayName: 'Blair', selectedLedgerId: ledgerId });

    const snapshot = await service.loadHomeSnapshot({ selectedLedgerId: ledgerId });
    const alexId = snapshot.organizerParticipantId as string;

    await service.submitExpenseDraft(
      {
        description: 'Hotel',
        currency: 'EUR',
        totalAmountMinor: 10000,
        expenseDate: '2026-05-25',
        creatorRole: 'organizer',
        payers: [{ participantId: alexId, paidAmountMinor: 10000 }],
        split: {
          mode: 'equal',
          participants: [{ participantId: alexId }, { participantId: blairId }],
        },
      },
      ledgerId,
    );

    const settlement = await service.loadSettlementSnapshot({ selectedLedgerId: ledgerId, selectedCurrencyCode: 'USD' });

    // 100 EUR (50 EUR each after split) converted to USD at live rate (~1.162)
    // = 50 * 116.2 = 5810 (approximately, depends on live rate)
    // Just verify it was converted (not 5000)
    expect(settlement.recommendations[0]?.amountMinor).toBeGreaterThan(5700);
    expect(settlement.recommendations[0]?.currency).toBe('USD');
  });

  test('converts USD expenses to different settlement currencies', async () => {
    const service = createLedgerAppService('usd-to-afn-spec');
    const ledgerId = await service.createShare({ title: 'Trip', organizerName: 'Alex' });
    const blairId = await service.addParticipant({ displayName: 'Blair', selectedLedgerId: ledgerId });

    const snapshot = await service.loadHomeSnapshot({ selectedLedgerId: ledgerId });
    const alexId = snapshot.organizerParticipantId as string;

    // Create a USD expense
    await service.submitExpenseDraft(
      {
        description: 'Expense',
        currency: 'USD',
        totalAmountMinor: 3225, // 32.25 USD
        expenseDate: '2026-05-25',
        creatorRole: 'organizer',
        payers: [{ participantId: alexId, paidAmountMinor: 3225 }],
        split: {
          mode: 'equal',
          participants: [{ participantId: alexId }, { participantId: blairId }],
        },
      },
      ledgerId,
    );

    // Convert to AFN (USD per AFN is 0.0093 from fallback table)
    const settlementUSD = await service.loadSettlementSnapshot({ selectedLedgerId: ledgerId, selectedCurrencyCode: 'USD' });
    const settlementAFN = await service.loadSettlementSnapshot({ selectedLedgerId: ledgerId, selectedCurrencyCode: 'AFN' });

    // In USD: Blair owes Alex 16.125 USD (half of 32.25)
    expect(settlementUSD.recommendations[0]?.amountMinor).toBe(1612); // 16.12 USD (rounded)
    
    // In AFN: should be converted (1613 USD * (1/0.0093) AFN ≈ 1745 AFN)
    // But should NOT be the same value (32.25 AFN would be wrong)
    expect(settlementAFN.recommendations[0]?.amountMinor).toBeGreaterThan(1613);
    expect(settlementAFN.recommendations[0]?.currency).toBe('AFN');
  });
});
