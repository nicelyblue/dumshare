import { asc, eq } from 'drizzle-orm';
import { openLedgerDb } from '../sqlite/client';
import { events } from '../sqlite/schema';
import { resolveLatestLedgerId } from './latestLedgerId';
import { createEventRepository } from '../../domain/events/repository';

export type LedgerListItem = {
  ledgerId: string;
  title: string;
  createdAt: string;
};

function safeParseLedgerCreated(payloadJson: string): { title: string } {
  const fallback = {
    title: 'Untitled ledger',
  };

  try {
    const parsed = JSON.parse(payloadJson) as Record<string, unknown>;
    const title = typeof parsed.title === 'string' && parsed.title.trim() ? parsed.title.trim() : fallback.title;
    return { title };
  } catch {
    return fallback;
  }
}

export async function listLedgers(dbName = 'dumshare-ui'): Promise<LedgerListItem[]> {
  const db = openLedgerDb(dbName);
  const rows = await db.orm
    .select()
    .from(events)
    .where(eq(events.event_type, 'ledger.created'))
    .orderBy(asc(events.occurred_at));

  const byLedger = new Map<string, LedgerListItem>();

  rows.forEach((row) => {
    const payload = safeParseLedgerCreated(row.payload_json);
    byLedger.set(row.ledger_id, {
      ledgerId: row.ledger_id,
      title: payload.title,
      createdAt: row.occurred_at,
    });
  });

  return Array.from(byLedger.values()).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

export async function createLedger(
  input: { title: string; organizerName: string },
  dbName = 'dumshare-ui',
): Promise<string> {
  const title = input.title.trim();
  const organizerName = input.organizerName.trim();

  if (!title) {
    throw new Error('Enter a ledger title before creating the ledger');
  }

  if (!organizerName) {
    throw new Error('Enter organizer name before creating the ledger');
  }

  const ledgerId = `ledger-${title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'trip'}-${Date.now()}`;
  const eventId = `ledger-created-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const repository = createEventRepository(openLedgerDb(dbName));

  const organizerParticipantId = `participant-${organizerName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'organizer'}-${Date.now()}`;

  await repository.appendEvent({
    id: eventId,
    ledgerId,
    eventType: 'ledger.created',
    eventVersion: 1,
    occurredAt: new Date().toISOString(),
    actorDeviceId: 'device-organizer-ui',
    payloadJson: JSON.stringify({ title, organizerName, organizerParticipantId }),
  });

  await repository.appendEvent({
    id: `participant-added-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    ledgerId,
    eventType: 'participant.added',
    eventVersion: 1,
    occurredAt: new Date().toISOString(),
    actorDeviceId: 'device-organizer-ui',
    payloadJson: JSON.stringify({
      participantId: organizerParticipantId,
      displayName: organizerName,
    }),
  });

  return ledgerId;
}

export async function deleteLedger(ledgerId: string, dbName = 'dumshare-ui'): Promise<void> {
  const db = openLedgerDb(dbName);
  await db.orm.delete(events).where(eq(events.ledger_id, ledgerId));
}

export async function resolveInitialActiveLedgerId(dbName = 'dumshare-ui'): Promise<string | null> {
  return resolveLatestLedgerId(dbName);
}
