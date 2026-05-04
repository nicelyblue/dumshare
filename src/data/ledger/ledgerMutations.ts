import { openLedgerDb } from '../../data/sqlite/client';
import { createEventRepository } from '../../domain/events/repository';
import type { EventRepository } from '../../domain/events/repository';

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

function resolveLatestLedgerId(dbName: string): string | null {
  const db = openLedgerDb(dbName);
  const row = db.sqlite
    .prepare('SELECT ledger_id AS ledgerId FROM events ORDER BY sequence DESC LIMIT 1')
    .get() as { ledgerId?: string } | undefined;

  return row?.ledgerId ?? null;
}

async function appendLedgerCreatedEvent(
  repository: EventRepository,
  ledgerId: string,
  input: LedgerSetupInput,
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
      const existingLedgerId = resolveLatestLedgerId(dbName);
      const nextLedgerId = existingLedgerId ?? `ledger-${sanitizePart(input.title) || 'trip'}-${Date.now()}`;

      await appendLedgerCreatedEvent(repository, nextLedgerId, input);
      return nextLedgerId;
    },

    async addParticipant(input: ParticipantRosterInput): Promise<string> {
      const ledgerId = resolveLatestLedgerId(dbName);

      if (!ledgerId) {
        throw new Error('Create the ledger before adding participants');
      }

      return appendParticipantAddedEvent(repository, ledgerId, input);
    },
  };
}