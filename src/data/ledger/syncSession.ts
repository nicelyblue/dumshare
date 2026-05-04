import { openLedgerDb } from '../../data/sqlite/client';
import { createEventRepository, type EventRepository, type StoredEvent } from '../../domain/events/repository';
import {
  decodeSyncRequestQr,
  encodeSyncRequestQr,
  establishSyncSession,
  runBidirectionalSyncExchange,
} from '../../domain/sync';
import { replayLedger } from '../../domain/projections';

export type ParsedSyncRequest =
  | { ok: true; payload: ReturnType<typeof decodeSyncRequestQr> }
  | { ok: false; error: string };

type RunSyncTransferInput = {
  dbName?: string;
  rawRequestQr: string;
  remoteEvents?: StoredEvent[];
  organizerDeviceId?: string;
  repository?: EventRepository;
};

function resolveLatestLedgerId(dbName: string): string | null {
  const db = openLedgerDb(dbName);
  const row = db.sqlite
    .prepare('SELECT ledger_id AS ledgerId FROM events ORDER BY sequence DESC LIMIT 1')
    .get() as { ledgerId?: string } | undefined;

  return row?.ledgerId ?? null;
}

export function parseSyncRequestQr(raw: string): ParsedSyncRequest {
  try {
    return { ok: true, payload: decodeSyncRequestQr(raw) };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : 'Unable to parse sync request payload',
    };
  }
}

export async function buildSyncRequestQr(dbName = 'dumshare-ui', requesterDeviceId = 'device-contributor-ui'): Promise<string> {
  const ledgerId = resolveLatestLedgerId(dbName);

  if (!ledgerId) {
    throw new Error('Create the ledger before generating a sync request');
  }

  const db = openLedgerDb(dbName);
  const repository = createEventRepository(db);
  const events = await repository.listEventsByLedger(ledgerId);

  return encodeSyncRequestQr({
    ledgerId,
    requesterDeviceId,
    lastSeenSequence: events[events.length - 1]?.sequence ?? 0,
    requestedAt: new Date().toISOString(),
    nonce: `sync-${Date.now()}`,
  });
}

export async function runSyncTransfer({
  dbName = 'dumshare-ui',
  rawRequestQr,
  remoteEvents = [],
  organizerDeviceId = 'device-organizer-ui',
  repository,
}: RunSyncTransferInput): Promise<{ statusTimeline: string[] }> {
  const parsed = parseSyncRequestQr(rawRequestQr);
  if (parsed.ok === false) {
    throw new Error(parsed.error);
  }

  const ledgerId = resolveLatestLedgerId(dbName);
  if (!ledgerId) {
    throw new Error('Create the ledger before running sync transfer');
  }

  const activeRepository = repository ?? createEventRepository(openLedgerDb(dbName));
  const localEvents = await activeRepository.listEventsByLedger(ledgerId);
  const projection = replayLedger(localEvents);
  const session = establishSyncSession(projection, organizerDeviceId, parsed.payload);
  const result = await runBidirectionalSyncExchange({
    repository: activeRepository,
    session,
    remoteEvents,
  });

  return { statusTimeline: result.statusTimeline };
}
