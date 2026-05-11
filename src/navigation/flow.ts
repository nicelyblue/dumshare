import { APP_ROUTES } from './routes';
import type { AppRouteName } from './types';

export const FLOW_TRANSITIONS: Record<string, AppRouteName> = {
  onboardingStart: APP_ROUTES.welcome,
  onboardingCreateShareNext: APP_ROUTES.addParticipants,
  onboardingCompleteNext: APP_ROUTES.homeDashboard,
  expenseDetailsNext: APP_ROUTES.splitDetails,
  ledgerListDetail: APP_ROUTES.ledgerEntryDetail,
  settleUpNext: APP_ROUTES.settlementResult,
};
