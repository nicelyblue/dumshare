import { describe, expect, test } from 'vitest';
import { FLOW_TRANSITIONS } from '../navigation/flow';
import { APP_ROUTES } from '../navigation/routes';

describe('navigation-flow-transitions', () => {
  test('covers onboarding flow transitions', () => {
    expect(FLOW_TRANSITIONS.onboardingStart).toBe(APP_ROUTES.welcome);
    expect(FLOW_TRANSITIONS.onboardingCreateShareNext).toBe(APP_ROUTES.addParticipants);
    expect(FLOW_TRANSITIONS.onboardingCompleteNext).toBe(APP_ROUTES.homeDashboard);
  });

  test('covers expense, ledger, and settlement transitions', () => {
    expect(FLOW_TRANSITIONS.expenseDetailsNext).toBe(APP_ROUTES.splitDetails);
    expect(FLOW_TRANSITIONS.ledgerListDetail).toBe(APP_ROUTES.ledgerEntryDetail);
    expect(FLOW_TRANSITIONS.settleUpNext).toBe(APP_ROUTES.settlementResult);
  });
});
