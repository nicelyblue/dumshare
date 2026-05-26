import { loadSettlementModel, type SettlementModel } from './settlementController';

type LoadSettlementModelFn = typeof loadSettlementModel;

type FlowState = SettlementModel & {
  selectedLedgerId: string | null;
  currencyQuery: string;
};

export function createSettleUpFlowController(deps?: { loadSettlementModel?: LoadSettlementModelFn }) {
  const loadModel = deps?.loadSettlementModel ?? loadSettlementModel;
  let state: FlowState = {
    hasLedger: false,
    selectedLedgerId: null,
    selectedCurrencyCode: 'USD',
    currencyQuery: '',
    currencyOptions: [],
    recommendations: [],
  };

  async function load(input: { selectedLedgerId: string | null; selectedCurrencyCode?: string }): Promise<FlowState> {
    const nextCurrencyCode = input.selectedCurrencyCode ?? state.selectedCurrencyCode;
    const model = await loadModel({
      selectedLedgerId: input.selectedLedgerId,
      selectedCurrencyCode: nextCurrencyCode,
      currencyQuery: '',
    });
    state = { ...model, selectedLedgerId: input.selectedLedgerId, currencyQuery: '', selectedCurrencyCode: nextCurrencyCode };
    return state;
  }

  async function searchAndSelectCurrency(input: {
    query: string;
    selectedCurrencyCode?: string;
  }): Promise<FlowState> {
    state.currencyQuery = input.query;
    const model = await loadModel({
      selectedLedgerId: state.selectedLedgerId,
      selectedCurrencyCode: input.selectedCurrencyCode ?? state.selectedCurrencyCode,
      currencyQuery: input.query,
    });
    state = {
      ...model,
      selectedLedgerId: state.selectedLedgerId,
      currencyQuery: input.query,
    };
    return state;
  }

  async function generateRecommendations(): Promise<FlowState> {
    const model = await loadModel({
      selectedLedgerId: state.selectedLedgerId,
      selectedCurrencyCode: state.selectedCurrencyCode,
      currencyQuery: state.currencyQuery,
    });
    state = { ...model, selectedLedgerId: state.selectedLedgerId, currencyQuery: state.currencyQuery };
    return state;
  }

  function buildCompletionRoute(): {
    pathname: '/settlement-complete';
    params: { currency: string; recommendationCount: string; summary: string };
  } {
    const first = state.recommendations[0];
    const summary = first ? `${first.fromLabel} pays ${first.toLabel} ${first.amountLabel}` : 'No transfer required';
    return {
      pathname: '/settlement-complete',
      params: {
        currency: state.selectedCurrencyCode,
        recommendationCount: `${state.recommendations.length}`,
        summary,
      },
    };
  }

  function getState(): FlowState {
    return state;
  }

  return {
    load,
    searchAndSelectCurrency,
    generateRecommendations,
    buildCompletionRoute,
    getState,
  };
}
