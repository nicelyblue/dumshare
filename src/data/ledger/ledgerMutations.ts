import { openLedgerDb } from '../../data/sqlite/client';
import { createEventRepository } from '../../domain/events/repository';
import type { EventRepository } from '../../domain/events/repository';
import { resolveLatestLedgerId } from './latestLedgerId';

export type LedgerSetupInput = {
  title: string;
  settlementContext: string;
};

export type ParticipantRosterInput = {
  displayName: string;
};

type LedgerSetupMutations = {
  saveLedgerSetup: (input: LedgerSetupInput) => Promise<string>;
  addParticipant: (input: ParticipantRosterInput) => Promise<string>;
};

type NormalizedLedgerSetupInput = {
  title: string;
  settlementContext: string;
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

  if (!title) {
    throw new Error('Enter a ledger title before creating the ledger');
  }

  if (!settlementContext) {
    throw new Error('Enter a settlement context before creating the ledger');
  }

  return { title, settlementContext };
}

async function appendLedgerCreatedEvent(
  repository: EventRepository,
  ledgerId: string,
  input: NormalizedLedgerSetupInput,
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
    }),
  });
}

async function appendParticipantAddedEvent(
  repository: EventRepository,
  ledgerId: string,
  input: ParticipantRosterInput,
): Promise<string> {
  const participantId = `participant-${sanitizePart(input.displayName) || 'member'}-${Date.now()}`;

  await repository.appendEvent({
    id: createEventId('participant-added'),
    ledgerId,
    eventType: 'participant.added',
    eventVersion: 1,
    occurredAt: new Date().toISOString(),
    actorDeviceId: 'device-organizer-ui',
    payloadJson: JSON.stringify({
      participantId,
      displayName: input.displayName,
    }),
  });

  return participantId;
}

export function createLedgerSetupMutations(dbName = 'dumshare-ui'): LedgerSetupMutations {
  const db = openLedgerDb(dbName);
  const repository = createEventRepository(db);

  return {
    async saveLedgerSetup(input: LedgerSetupInput): Promise<string> {
      const normalizedInput = normalizeLedgerSetupInput(input);
      const existingLedgerId = await resolveLatestLedgerId(dbName);
      const nextLedgerId =
        existingLedgerId ?? `ledger-${sanitizePart(normalizedInput.title) || 'trip'}-${Date.now()}`;

      await appendLedgerCreatedEvent(repository, nextLedgerId, normalizedInput);
      return nextLedgerId;
    },

    async addParticipant(input: ParticipantRosterInput): Promise<string> {
      const ledgerId = await resolveLatestLedgerId(dbName);

      if (!ledgerId) {
        throw new Error('Create the ledger before adding participants');
      }

      return appendParticipantAddedEvent(repository, ledgerId, input);
    },
  };
}
