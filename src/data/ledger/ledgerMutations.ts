import { openLedgerDb } from '../../data/sqlite/client';
import { createEventRepository } from '../../domain/events/repository';
import type { EventRepository } from '../../domain/events/repository';
import { replayLedger } from '../../domain/projections';
import { resolveLatestLedgerId } from './latestLedgerId';

export type LedgerSetupInput = {
  title: string;
  settlementContext: string;
  organizerName?: string;
};

export type ParticipantRosterInput = {
  displayName: string;
};

export type ParticipantRenameInput = {
  participantId: string;
  displayName: string;
};

export type ParticipantRemoveInput = {
  participantId: string;
};

type LedgerSetupMutations = {
  saveLedgerSetup: (input: LedgerSetupInput, selectedLedgerId?: string | null) => Promise<string>;
  addParticipant: (input: ParticipantRosterInput, selectedLedgerId?: string | null) => Promise<string>;
  renameParticipant: (input: ParticipantRenameInput, selectedLedgerId?: string | null) => Promise<string>;
  removeParticipant: (input: ParticipantRemoveInput, selectedLedgerId?: string | null) => Promise<string>;
};

type NormalizedLedgerSetupInput = {
  title: string;
  settlementContext: string;
  organizerName: string;
};

type NormalizedParticipantNameInput = {
  displayName: string;
};

function sanitizePart(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function createEventId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function normalizeLedgerSetupInput(input: LedgerSetupInput): NormalizedLedgerSetupInput {
  const title = input.title.trim();
  const settlementContext = input.settlementContext.trim();
  const organizerName = (input.organizerName ?? '').trim();

  if (!title) {
    throw new Error('Enter a ledger title before creating the ledger');
  }

  if (!settlementContext) {
    throw new Error('Enter a settlement context before creating the ledger');
  }

  return { title, settlementContext, organizerName };
}

function normalizeParticipantNameInput(input: { displayName: string }): NormalizedParticipantNameInput {
  const displayName = input.displayName.trim();

  if (!displayName) {
    throw new Error('Enter a participant name');
  }

  return { displayName };
}

async function appendLedgerCreatedEvent(
  repository: EventRepository,
  ledgerId: string,
  input: NormalizedLedgerSetupInput,
  organizerParticipantId?: string,
): Promise<void> {
  await repository.appendEvent({
    id: createEventId('ledger-created'),
    ledgerId,
    eventType: 'ledger.created',
    eventVersion: 1,
    occurredAt: new Date().toISOString(),
    actorDeviceId: 'device-organizer-ui',
    payloadJson: JSON.stringify({
      title: input.title,
      settlementContext: input.settlementContext,
      organizerName: input.organizerName,
      organizerParticipantId,
    }),
  });
}

async function appendParticipantAddedEvent(
  repository: EventRepository,
  ledgerId: string,
  input: ParticipantRosterInput,
): Promise<string> {
  const normalized = normalizeParticipantNameInput(input);
  const participantId = `participant-${sanitizePart(normalized.displayName) || 'member'}-${Date.now()}`;

  await repository.appendEvent({
    id: createEventId('participant-added'),
    ledgerId,
    eventType: 'participant.added',
    eventVersion: 1,
    occurredAt: new Date().toISOString(),
    actorDeviceId: 'device-organizer-ui',
    payloadJson: JSON.stringify({
      participantId,
      displayName: normalized.displayName,
    }),
  });

  return participantId;
}

async function loadLedgerProjection(dbName: string, ledgerId: string) {
  const db = openLedgerDb(dbName);
  const repository = createEventRepository(db);
  const events = await repository.listEventsByLedger(ledgerId);
  return replayLedger(events);
}

function hasParticipantReferences(projection: ReturnType<typeof replayLedger>, participantId: string): boolean {
  if (projection.entries.some((entry) => entry.payers.some((payer) => payer.participantId === participantId))) {
    return true;
  }

  if (projection.entries.some((entry) => entry.owedShares.some((share) => share.participantId === participantId))) {
    return true;
  }

  if (projection.pendingSubmissions.some((submission) => submission.submittedByParticipantId === participantId)) {
    return true;
  }

  if (projection.invites.some((invite) => invite.participantId === participantId)) {
    return true;
  }

  if (projection.participantContributorDeviceClaims[participantId]) {
    return true;
  }

  return false;
}

export function createLedgerSetupMutations(dbName = 'dumshare-ui'): LedgerSetupMutations {
  const db = openLedgerDb(dbName);
  const repository = createEventRepository(db);

  return {
    async saveLedgerSetup(input: LedgerSetupInput, selectedLedgerId?: string | null): Promise<string> {
      const normalizedInput = normalizeLedgerSetupInput(input);
      const existingLedgerId = selectedLedgerId ?? (await resolveLatestLedgerId(dbName));
      const nextLedgerId =
        existingLedgerId ?? `ledger-${sanitizePart(normalizedInput.title) || 'trip'}-${Date.now()}`;

      if (!existingLedgerId) {
        const organizerName = normalizedInput.organizerName || 'Organizer';
        const organizerParticipantId = `participant-${sanitizePart(organizerName) || 'organizer'}-${Date.now()}`;
        await appendLedgerCreatedEvent(repository, nextLedgerId, { ...normalizedInput, organizerName }, organizerParticipantId);
        await repository.appendEvent({
          id: createEventId('participant-added'),
          ledgerId: nextLedgerId,
          eventType: 'participant.added',
          eventVersion: 1,
          occurredAt: new Date().toISOString(),
          actorDeviceId: 'device-organizer-ui',
          payloadJson: JSON.stringify({
            participantId: organizerParticipantId,
            displayName: organizerName,
          }),
        });
        return nextLedgerId;
      }

      await appendLedgerCreatedEvent(repository, nextLedgerId, normalizedInput);
      return nextLedgerId;
    },

    async addParticipant(input: ParticipantRosterInput, selectedLedgerId?: string | null): Promise<string> {
      const ledgerId = selectedLedgerId ?? (await resolveLatestLedgerId(dbName));

      if (!ledgerId) {
        throw new Error('Create the ledger before adding participants');
      }

      return appendParticipantAddedEvent(repository, ledgerId, input);
    },

    async renameParticipant(input: ParticipantRenameInput, selectedLedgerId?: string | null): Promise<string> {
      const ledgerId = selectedLedgerId ?? (await resolveLatestLedgerId(dbName));

      if (!ledgerId) {
        throw new Error('Create the ledger before editing participants');
      }

      const normalized = normalizeParticipantNameInput({ displayName: input.displayName });
      const projection = await loadLedgerProjection(dbName, ledgerId);
      const participant = projection.participants.find((candidate) => candidate.participantId === input.participantId);

      if (!participant) {
        throw new Error('Participant not found');
      }

      await repository.appendEvent({
        id: createEventId('participant-renamed'),
        ledgerId,
        eventType: 'participant.renamed',
        eventVersion: 1,
        occurredAt: new Date().toISOString(),
        actorDeviceId: 'device-organizer-ui',
        payloadJson: JSON.stringify({
          participantId: input.participantId,
          displayName: normalized.displayName,
        }),
      });

      return input.participantId;
    },

    async removeParticipant(input: ParticipantRemoveInput, selectedLedgerId?: string | null): Promise<string> {
      const ledgerId = selectedLedgerId ?? (await resolveLatestLedgerId(dbName));

      if (!ledgerId) {
        throw new Error('Create the ledger before removing participants');
      }

      const projection = await loadLedgerProjection(dbName, ledgerId);
      const participant = projection.participants.find((candidate) => candidate.participantId === input.participantId);

      if (!participant) {
        throw new Error('Participant not found');
      }

      if (projection.participants.length <= 1) {
        throw new Error('Keep at least one participant in the roster');
      }

      if (projection.organizerParticipantId && projection.organizerParticipantId === input.participantId) {
        throw new Error('Organizer cannot be removed from participant roster');
      }

      if (hasParticipantReferences(projection, input.participantId)) {
        throw new Error('Cannot remove participant with existing ledger activity or invites');
      }

      await repository.appendEvent({
        id: createEventId('participant-removed'),
        ledgerId,
        eventType: 'participant.removed',
        eventVersion: 1,
        occurredAt: new Date().toISOString(),
        actorDeviceId: 'device-organizer-ui',
        payloadJson: JSON.stringify({
          participantId: input.participantId,
        }),
      });

      return input.participantId;
    },
  };
}
