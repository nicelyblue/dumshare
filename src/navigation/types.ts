import { APP_ROUTES } from './routes';

export type AppRouteName = keyof typeof APP_ROUTES;

export type RootStackParamList = {
  welcome: undefined;
  createShare: undefined;
  addParticipants: undefined;
  homeDashboard: undefined;
  addExpense: undefined;
  splitDetails: undefined;
  ledgerEntries: undefined;
  ledgerEntryDetail: { submissionId: string };
  settleUp: undefined;
  settlementResult: undefined;
  dashboard: undefined;
  ledgers: undefined;
  setup: undefined;
  expenseEntry: undefined;
  balances: undefined;
};

export type AppScreenContract = {
  name: AppRouteName;
  label: string;
  description: string;
};
