import * as currencyCodes from 'currency-codes';

export type CurrencyOption = {
  code: string;
  label: string;
};

export const CURRENCY_OPTIONS: CurrencyOption[] = currencyCodes.data
  .map((item) => ({
    code: item.code.trim().toUpperCase(),
    label: item.currency.trim(),
  }))
  .filter((item) => /^[A-Z]{3}$/.test(item.code) && item.label.length > 0 && !item.code.startsWith('X'))
  .sort((a, b) => a.code.localeCompare(b.code));

const SUPPORTED_CURRENCY_CODES = new Set(CURRENCY_OPTIONS.map((option) => option.code));

export function isSupportedCurrencyCode(value: string): boolean {
  return SUPPORTED_CURRENCY_CODES.has(value.trim().toUpperCase());
}

export function fuzzyCurrencySearch(options: CurrencyOption[], query: string): CurrencyOption[] {
  const q = query.trim().toLowerCase();
  if (!q) {
    return options;
  }

  return options
    .map((option) => {
      const hay = `${option.code} ${option.label}`.toLowerCase();
      const direct = hay.includes(q) ? 100 : 0;
      let seq = 0;
      let cursor = 0;
      for (const char of q) {
        const next = hay.indexOf(char, cursor);
        if (next === -1) {
          seq = -1;
          break;
        }
        seq += 1;
        cursor = next + 1;
      }
      return { option, score: direct + (seq > 0 ? seq : 0) };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.option);
}
