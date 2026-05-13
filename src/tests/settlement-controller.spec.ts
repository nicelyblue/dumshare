import { describe, expect, test } from 'vitest';

import { loadSettlementModel } from '../mobile/controllers/settlementController';

describe('settlement controller', () => {
  test('filters ISO currency options for partial query', async () => {
    const model = await loadSettlementModel({
      currencyQuery: 'dol',
      snapshot: {
        hasLedger: true,
        recommendations: [],
      },
    });

    expect(model.currencyOptions.length).toBeGreaterThan(0);
    expect(
      model.currencyOptions.some(
        (option) => option.code === 'USD' && option.label.toLowerCase().includes('dollar'),
      ),
    ).toBe(true);
  });

  test('maps recommendation rows from settlement snapshot payload', async () => {
    const model = await loadSettlementModel({
      selectedCurrencyCode: 'EUR',
      snapshot: {
        hasLedger: true,
        recommendations: [
          {
            fromParticipantName: 'Alex',
            toParticipantName: 'Sam',
            amountMinor: 4250,
            currency: 'EUR',
          },
        ],
      },
    });

    expect(model.recommendations).toEqual([
      {
        fromLabel: 'Alex',
        toLabel: 'Sam',
        amountLabel: '42.50 EUR',
      },
    ]);
  });

  test('returns empty-state model when no ledger exists', async () => {
    const model = await loadSettlementModel({
      selectedCurrencyCode: 'EUR',
      snapshot: {
        hasLedger: false,
        recommendations: [],
      },
    });

    expect(model.hasLedger).toBe(false);
    expect(model.recommendations).toEqual([]);
  });
});
