export const APP_ROUTES = {
  dashboard: 'dashboard',
  ledgers: 'ledgers',
  setup: 'setup',
  expenseEntry: 'expenseEntry',
  sync: 'sync',
  balances: 'balances',
} as const;

export const APP_FEATURES = [
  {
    name: APP_ROUTES.dashboard,
    label: 'Dashboard',
    description: 'Review ledger health, approvals, and balance snapshot.',
  },
  {
    name: APP_ROUTES.ledgers,
    label: 'Ledgers',
    description: 'Select, create, and delete trip ledgers.',
  },
  {
    name: APP_ROUTES.setup,
    label: 'Ledger Setup',
    description: 'Edit the trip title, participants, and organizer-facing setup.',
  },
  {
    name: APP_ROUTES.expenseEntry,
    label: 'Expense Entry',
    description: 'Capture trip costs with payer rows and split controls.',
  },
  {
    name: APP_ROUTES.sync,
    label: 'Sync',
    description: 'Prepare QR transfer and in-person exchange states.',
  },
  {
    name: APP_ROUTES.balances,
    label: 'Balances',
    description: 'Inspect settlement-ready balances per currency.',
  },
] as const;
