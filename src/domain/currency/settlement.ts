import { isSupportedCurrencyCode } from './catalog';

export type SettlementMode = 'per-currency' | 'by-ledger-currency';

export type ParsedSettlement = {
  mode: SettlementMode;
  ledgerCurrency: string | null;
};

export function parseSettlementContext(value: string): ParsedSettlement | null {
  const normalized = value.trim();

  if (normalized === 'per-currency') {
    return { mode: 'per-currency', ledgerCurrency: null };
  }

  if (!normalized.startsWith('by-ledger-currency:')) {
    return null;
  }

  const ledgerCurrency = normalized.slice('by-ledger-currency:'.length).trim().toUpperCase();
  if (!isSupportedCurrencyCode(ledgerCurrency)) {
    return null;
  }

  return { mode: 'by-ledger-currency', ledgerCurrency };
}

export function assertValidSettlementContext(value: string): void {
  if (!parseSettlementContext(value)) {
    throw new Error('Settlement mode must be per-currency or by-ledger-currency:<ISO code>');
  }
}
