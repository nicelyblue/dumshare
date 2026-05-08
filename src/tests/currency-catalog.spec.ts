import { describe, expect, test } from 'vitest';

import { CURRENCY_OPTIONS, fuzzyCurrencySearch, isSupportedCurrencyCode } from '../domain/currency/catalog';

describe('currency catalog provider', () => {
  test('builds normalized code/label options from package data', () => {
    expect(CURRENCY_OPTIONS.length).toBeGreaterThan(100);
    expect(CURRENCY_OPTIONS.some((option) => option.code === 'EUR')).toBe(true);
    expect(CURRENCY_OPTIONS.every((option) => /^[A-Z]{3}$/.test(option.code))).toBe(true);
    expect(CURRENCY_OPTIONS.every((option) => option.label.trim().length > 0)).toBe(true);
  });

  test('fuzzy search matches by code and label', () => {
    const byCode = fuzzyCurrencySearch(CURRENCY_OPTIONS, 'eur');
    const byLabel = fuzzyCurrencySearch(CURRENCY_OPTIONS, 'dollar');

    expect(byCode.some((option) => option.code === 'EUR')).toBe(true);
    expect(byLabel.length).toBeGreaterThan(0);
  });

  test('supports strict code membership checks', () => {
    expect(isSupportedCurrencyCode('eur')).toBe(true);
    expect(isSupportedCurrencyCode('ZZZ')).toBe(false);
  });
});
