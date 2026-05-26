import { describe, expect, test } from 'vitest';

import { createSettleUpFlowController } from '../mobile/controllers/settleUpFlowController';

describe('settle up screen flow', () => {
  test('completion payload uses explicit settlement summary language', async () => {
    const controller = createSettleUpFlowController({
      loadSettlementModel: async () => ({
        hasLedger: true,
        selectedCurrencyCode: 'EUR',
        currencyOptions: [{ code: 'EUR', label: 'Euro' }],
        recommendations: [{ fromLabel: 'Alex', toLabel: 'Sam', amountLabel: '42.50 EUR' }],
      }),
    });

    await controller.load({ selectedLedgerId: 'ledger-1', selectedCurrencyCode: 'EUR' });
    await controller.generateRecommendations();

    expect(controller.buildCompletionRoute().params.summary).toContain('pays');
  });

  test('currency selection updates selected settlement currency', async () => {
    const controller = createSettleUpFlowController({
      loadSettlementModel: async (input) => ({
        hasLedger: true,
        selectedCurrencyCode: input.selectedCurrencyCode,
        currencyOptions: [{ code: 'EUR', label: 'Euro' }],
        recommendations: [],
      }),
    });

    await controller.load({ selectedLedgerId: 'ledger-1', selectedCurrencyCode: 'EUR' });
    await controller.searchAndSelectCurrency({ query: 'usd', selectedCurrencyCode: 'USD' });

    expect(controller.getState().selectedCurrencyCode).toBe('USD');
  });

  test('settle trigger loads recommendation rows with details', async () => {
    const controller = createSettleUpFlowController({
      loadSettlementModel: async () => ({
        hasLedger: true,
        selectedCurrencyCode: 'EUR',
        currencyOptions: [{ code: 'EUR', label: 'Euro' }],
        recommendations: [{ fromLabel: 'Alex', toLabel: 'Sam', amountLabel: '42.50 EUR' }],
      }),
    });

    await controller.load({ selectedLedgerId: 'ledger-1', selectedCurrencyCode: 'EUR' });
    await controller.generateRecommendations();

    expect(controller.getState().recommendations).toEqual([
      { fromLabel: 'Alex', toLabel: 'Sam', amountLabel: '42.50 EUR' },
    ]);
  });

  test('successful settle action builds completion route payload', async () => {
    const controller = createSettleUpFlowController({
      loadSettlementModel: async () => ({
        hasLedger: true,
        selectedCurrencyCode: 'EUR',
        currencyOptions: [{ code: 'EUR', label: 'Euro' }],
        recommendations: [{ fromLabel: 'Alex', toLabel: 'Sam', amountLabel: '42.50 EUR' }],
      }),
    });

    await controller.load({ selectedLedgerId: 'ledger-1', selectedCurrencyCode: 'EUR' });
    await controller.generateRecommendations();

    expect(controller.buildCompletionRoute()).toEqual({
      pathname: '/settlement-complete',
      params: {
        currency: 'EUR',
        recommendationCount: '1',
        summary: 'Alex pays Sam 42.50 EUR',
      },
    });
  });
});
