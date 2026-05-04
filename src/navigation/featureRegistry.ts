import { APP_ROUTES } from './routes';
import type { AppScreenContract } from './types';

export type FeatureRegistryItem = AppScreenContract & {
  accent: string;
  eyebrow: string;
  primaryAction: string;
  secondaryAction: string;
};

export const FEATURE_REGISTRY = [
  {
    name: APP_ROUTES.dashboard,
    label: 'Dashboard',
    description: 'Review ledger health, pending approvals, and balance snapshots.',
    eyebrow: 'Trip overview',
    primaryAction: 'See current ledger status',
    secondaryAction: 'Check pending approvals',
    accent: '#b14f2e',
  },
  {
    name: APP_ROUTES.setup,
    label: 'Ledger Setup',
    description: 'Edit the trip title, participant roster, and organizer setup.',
    eyebrow: 'Trip setup',
    primaryAction: 'Open ledger setup',
    secondaryAction: 'Review participant roster',
    accent: '#2f5d62',
  },
  {
    name: APP_ROUTES.expenseEntry,
    label: 'Expense Entry',
    description: 'Capture trip costs with payer rows and split controls.',
    eyebrow: 'Expense capture',
    primaryAction: 'Start a new expense',
    secondaryAction: 'Review split modes',
    accent: '#6e4a7e',
  },
  {
    name: APP_ROUTES.sync,
    label: 'Sync',
    description: 'Prepare QR transfer and in-person exchange states.',
    eyebrow: 'Sync status',
    primaryAction: 'Begin sync exchange',
    secondaryAction: 'Check transfer state',
    accent: '#2f6f9f',
  },
  {
    name: APP_ROUTES.balances,
    label: 'Balances',
    description: 'Inspect settlement-ready balances per currency.',
    eyebrow: 'Settlement',
    primaryAction: 'Review balances',
    secondaryAction: 'Check per-currency totals',
    accent: '#8a6b2d',
  },
] as const satisfies readonly FeatureRegistryItem[];