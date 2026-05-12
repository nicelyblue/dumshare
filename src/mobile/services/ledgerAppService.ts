import { loadExpenseReviewSnapshot, type ExpenseReviewSnapshot } from '../../data/ledger/expenseReview';
import { loadLedgerDashboardSnapshot, type LedgerDashboardSnapshot } from '../../data/ledger/ledgerSnapshot';

export type LedgerListItem = {
  id: string;
  title: string;
  organizerName: string;
};

type CreateShareInput = {
  title: string;
  organizerName: string;
};

type AddParticipantInput = {
  displayName: string;
  selectedLedgerId?: string | null;
};

type RenameParticipantInput = {
  participantId: string;
  displayName: string;
  selectedLedgerId?: string | null;
};

type RemoveParticipantInput = {
  participantId: string;
  selectedLedgerId?: string | null;
};

export type LedgerAppService = {
  listShares: () => Promise<LedgerListItem[]>;
  createShare: (input: CreateShareInput) => Promise<string>;
  deleteShare: (ledgerId: string) => Promise<void>;
  resolveInitialActiveShareId: () => Promise<string | null>;
  addParticipant: (input: AddParticipantInput) => Promise<string>;
  renameParticipant: (input: RenameParticipantInput) => Promise<string>;
  removeParticipant: (input: RemoveParticipantInput) => Promise<string>;
  loadHomeSnapshot: (input: { selectedLedgerId?: string | null }) => Promise<LedgerDashboardSnapshot>;
  loadExpenseReviewSnapshot: (input: { selectedLedgerId?: string | null }) => Promise<ExpenseReviewSnapshot>;
};

type InMemoryLedger = LedgerListItem & {
  participants: Array<{ id: string; displayName: string }>;
};

const inMemoryByDb = new Map<string, { ledgers: InMemoryLedger[] }>();

function getStore(dbName: string): { ledgers: InMemoryLedger[] } {
  const existing = inMemoryByDb.get(dbName);
  if (existing) {
    return existing;
  }

  const created = { ledgers: [] as InMemoryLedger[] };
  inMemoryByDb.set(dbName, created);
  return created;
}

function createId(prefix: string): string {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

function validateRequiredField(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
}

export function createLedgerAppService(dbName = 'dumshare-ui'): LedgerAppService {
  const store = getStore(dbName);

  function resolveTargetLedger(selectedLedgerId?: string | null): InMemoryLedger {
    const ledgerId = selectedLedgerId ?? store.ledgers[store.ledgers.length - 1]?.id;
    if (!ledgerId) {
      throw new Error('Create a share before editing participants');
    }

    const target = store.ledgers.find((ledger) => ledger.id === ledgerId);
    if (!target) {
      throw new Error('Selected share was not found');
    }

    return target;
  }

  return {
    listShares: async () => store.ledgers.map(({ id, title, organizerName }) => ({ id, title, organizerName })),
    createShare: async (input) => {
      const title = validateRequiredField(input.title, 'Share title');
      const organizerName = validateRequiredField(input.organizerName, 'Organizer name');
      const id = createId('ledger');
      store.ledgers.push({
        id,
        title,
        organizerName,
        participants: [],
      });
      return id;
    },
    deleteShare: async (ledgerId) => {
      const normalizedLedgerId = validateRequiredField(ledgerId, 'Ledger id');
      const index = store.ledgers.findIndex((ledger) => ledger.id === normalizedLedgerId);
      if (index === -1) {
        throw new Error('Ledger not found');
      }
      store.ledgers.splice(index, 1);
    },
    resolveInitialActiveShareId: async () => store.ledgers[0]?.id ?? null,
    addParticipant: async (input) => {
      const displayName = validateRequiredField(input.displayName, 'Participant name');
      const ledger = resolveTargetLedger(input.selectedLedgerId);
      const participantId = createId('participant');
      ledger.participants.push({ id: participantId, displayName });
      return participantId;
    },
    renameParticipant: async (input) => {
      const participantId = validateRequiredField(input.participantId, 'Participant id');
      const displayName = validateRequiredField(input.displayName, 'Participant name');
      const ledger = resolveTargetLedger(input.selectedLedgerId);
      const participant = ledger.participants.find((entry) => entry.id === participantId);
      if (!participant) {
        throw new Error('Participant not found');
      }
      participant.displayName = displayName;
      return participantId;
    },
    removeParticipant: async (input) => {
      const participantId = validateRequiredField(input.participantId, 'Participant id');
      const ledger = resolveTargetLedger(input.selectedLedgerId);
      const index = ledger.participants.findIndex((entry) => entry.id === participantId);
      if (index === -1) {
        throw new Error('Participant not found');
      }
      ledger.participants.splice(index, 1);
      return participantId;
    },
    loadHomeSnapshot: async (input) => {
      return loadLedgerDashboardSnapshot(dbName, input.selectedLedgerId);
    },
    loadExpenseReviewSnapshot: async (input) => {
      return loadExpenseReviewSnapshot(dbName, input.selectedLedgerId);
    },
  };
}
