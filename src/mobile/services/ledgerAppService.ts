import {
  createLedger,
  deleteLedger,
  listLedgers,
  resolveInitialActiveLedgerId,
  type LedgerListItem,
} from '../../data/ledger/ledgers';
import { createLedgerSetupMutations } from '../../data/ledger/ledgerMutations';

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
};

function validateRequiredField(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
}

export function createLedgerAppService(dbName = 'dumshare-ui'): LedgerAppService {
  const setupMutations = createLedgerSetupMutations(dbName);

  return {
    listShares: () => listLedgers(dbName),
    createShare: async (input) => {
      const title = validateRequiredField(input.title, 'Share title');
      const organizerName = validateRequiredField(input.organizerName, 'Organizer name');
      return createLedger({ title, organizerName }, dbName);
    },
    deleteShare: async (ledgerId) => {
      const normalizedLedgerId = validateRequiredField(ledgerId, 'Ledger id');
      await deleteLedger(normalizedLedgerId, dbName);
    },
    resolveInitialActiveShareId: () => resolveInitialActiveLedgerId(dbName),
    addParticipant: async (input) => {
      const displayName = validateRequiredField(input.displayName, 'Participant name');
      return setupMutations.addParticipant({ displayName }, input.selectedLedgerId);
    },
    renameParticipant: async (input) => {
      const participantId = validateRequiredField(input.participantId, 'Participant id');
      const displayName = validateRequiredField(input.displayName, 'Participant name');
      return setupMutations.renameParticipant({ participantId, displayName }, input.selectedLedgerId);
    },
    removeParticipant: async (input) => {
      const participantId = validateRequiredField(input.participantId, 'Participant id');
      return setupMutations.removeParticipant({ participantId }, input.selectedLedgerId);
    },
  };
}
