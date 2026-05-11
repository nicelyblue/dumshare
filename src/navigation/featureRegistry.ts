import { APP_ROUTES } from './routes';
import type { AppScreenContract } from './types';
import { screenAccents } from '../theme/colors';

export type FeatureRegistryItem = AppScreenContract & {
  screenKind: 'dashboard' | 'ledgers' | 'setup' | 'expense' | 'balances';
  accent: string;
  eyebrow: string;
  primaryAction: string;
  secondaryAction: string;
};

export const FEATURE_REGISTRY = [
  {
    name: APP_ROUTES.dashboard,
    screenKind: 'dashboard',
    label: 'Dashboard',
    description: 'Review ledger health, pending approvals, and balance snapshots.',
    eyebrow: 'Trip overview',
    primaryAction: 'See current ledger status',
    secondaryAction: 'Check pending approvals',
    accent: screenAccents.dashboard,
  },
  {
    name: APP_ROUTES.ledgers,
    screenKind: 'ledgers',
    label: 'Ledgers',
    description: 'Select an active ledger, create new trips, or delete old ones.',
    eyebrow: 'Ledger management',
    primaryAction: 'Manage ledgers',
    secondaryAction: 'Switch active ledger',
    accent: screenAccents.ledgers,
  },
  {
    name: APP_ROUTES.setup,
    screenKind: 'setup',
    label: 'Ledger Setup',
    description: 'Edit the trip title, participant roster, and organizer setup.',
    eyebrow: 'Trip setup',
    primaryAction: 'Open ledger setup',
    secondaryAction: 'Review participant roster',
    accent: screenAccents.setup,
  },
  {
    name: APP_ROUTES.expenseEntry,
    screenKind: 'expense',
    label: 'Expense Entry',
    description: 'Capture trip costs with payer rows and split controls.',
    eyebrow: 'Expense capture',
    primaryAction: 'Start a new expense',
    secondaryAction: 'Review split modes',
    accent: screenAccents.expense,
  },
  {
    name: APP_ROUTES.balances,
    screenKind: 'balances',
    label: 'Balances',
    description: 'Inspect settlement-ready balances per currency.',
    eyebrow: 'Settlement',
    primaryAction: 'Review balances',
    secondaryAction: 'Check per-currency totals',
    accent: screenAccents.balances,
  },
] as const satisfies readonly FeatureRegistryItem[];
