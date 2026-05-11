export const APP_ROUTES = {
  welcome: 'welcome',
  createShare: 'createShare',
  addParticipants: 'addParticipants',
  homeDashboard: 'homeDashboard',
  addExpense: 'addExpense',
  splitDetails: 'splitDetails',
  ledgerEntries: 'ledgerEntries',
  ledgerEntryDetail: 'ledgerEntryDetail',
  settleUp: 'settleUp',
  settlementResult: 'settlementResult',
  dashboard: 'dashboard',
  ledgers: 'ledgers',
  setup: 'setup',
  expenseEntry: 'expenseEntry',
  balances: 'balances',
} as const;

export const APP_FEATURES = [
  {
    name: APP_ROUTES.welcome,
    label: 'Welcome',
    description: 'Start a new share flow when no ledger exists.',
  },
  {
    name: APP_ROUTES.createShare,
    label: 'Create Share',
    description: 'Create a new share title and owner.',
  },
  {
    name: APP_ROUTES.addParticipants,
    label: 'Add Participants',
    description: 'Add members to the active share.',
  },
  {
    name: APP_ROUTES.homeDashboard,
    label: 'Home Dashboard',
    description: 'View trip summary and quick actions.',
  },
  {
    name: APP_ROUTES.addExpense,
    label: 'Add Expense',
    description: 'Capture expense details before split.',
  },
  {
    name: APP_ROUTES.splitDetails,
    label: 'Split Details',
    description: 'Configure split participants and mode.',
  },
  {
    name: APP_ROUTES.ledgerEntries,
    label: 'Ledger Entries',
    description: 'Browse ledger submissions and entries.',
  },
  {
    name: APP_ROUTES.ledgerEntryDetail,
    label: 'Ledger Entry Detail',
    description: 'Inspect a single ledger submission detail.',
  },
  {
    name: APP_ROUTES.settleUp,
    label: 'Settle Up',
    description: 'Review balances before settlement.',
  },
  {
    name: APP_ROUTES.settlementResult,
    label: 'Settlement Result',
    description: 'View calculated settlement summary.',
  },
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
    name: APP_ROUTES.balances,
    label: 'Balances',
    description: 'Inspect settlement-ready balances per currency.',
  },
] as const;
