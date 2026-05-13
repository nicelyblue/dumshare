import { CURRENCY_OPTIONS, fuzzyCurrencySearch, isSupportedCurrencyCode } from '../../domain/currency/catalog';
import { createLedgerAppService, type SettlementSnapshot } from '../services/ledgerAppService';

export type SettlementModel = {
  hasLedger: boolean;
  selectedCurrencyCode: string;
  currencyOptions: Array<{ code: string; label: string }>;
  recommendations: Array<{
    fromLabel: string;
    toLabel: string;
    amountLabel: string;
  }>;
};

type LoadSettlementModelInput = {
  selectedLedgerId?: string | null;
  selectedCurrencyCode?: string;
  currencyQuery?: string;
  snapshot?: SettlementSnapshot;
};

function resolveCurrencyCode(selectedCurrencyCode?: string): string {
  const normalized = selectedCurrencyCode?.trim().toUpperCase();
  if (normalized && isSupportedCurrencyCode(normalized)) {
    return normalized;
  }
  return 'EUR';
}

export async function loadSettlementModel(input: LoadSettlementModelInput): Promise<SettlementModel> {
  const selectedCurrencyCode = resolveCurrencyCode(input.selectedCurrencyCode);
  const currencyOptions = fuzzyCurrencySearch(CURRENCY_OPTIONS, input.currencyQuery ?? '').map((option) => ({
    code: option.code,
    label: option.label,
  }));

  const snapshot =
    input.snapshot ??
    (await createLedgerAppService().loadSettlementSnapshot({
      selectedLedgerId: input.selectedLedgerId,
      selectedCurrencyCode,
    }));

  if (!snapshot.hasLedger) {
    return {
      hasLedger: false,
      selectedCurrencyCode,
      currencyOptions,
      recommendations: [],
    };
  }

  return {
    hasLedger: true,
    selectedCurrencyCode,
    currencyOptions,
    recommendations: snapshot.recommendations.map((item) => ({
      fromLabel: item.fromParticipantName,
      toLabel: item.toParticipantName,
      amountLabel: `${(item.amountMinor / 100).toFixed(2)} ${item.currency}`,
    })),
  };
}
