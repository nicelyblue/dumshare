import { openLedgerDb } from '../../data/sqlite/client';
import { createEventRepository, type EventRepository, type StoredEvent } from '../../domain/events/repository';
import {
  decodeSyncRequestQr,
  encodeSyncRequestQr,
  establishSyncSession,
  runBidirectionalSyncExchange,
} from '../../domain/sync';
import { replayLedger } from '../../domain/projections';
import { resolveLatestLedgerId } from './latestLedgerId';

export type ParsedSyncRequest =
  | { ok: true; payload: ReturnType<typeof decodeSyncRequestQr> }
  | { ok: false; error: string };

type RunSyncTransferInput = {
  dbName?: string;
  rawRequestQr: string;
  selectedLedgerId?: string | null;
  recipientParticipantId?: string | null;
  remoteEvents?: StoredEvent[];
  organizerDeviceId?: string;
  repository?: EventRepository;
};

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

export async function buildSyncRequestQr(
  dbName = 'dumshare-ui',
  requesterDeviceId = 'device-contributor-ui',
  selectedLedgerId?: string | null,
): Promise<string> {
  const ledgerId = selectedLedgerId ?? (await resolveLatestLedgerId(dbName));

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
  selectedLedgerId,
  recipientParticipantId,
  remoteEvents = [],
  organizerDeviceId = 'device-organizer-ui',
  repository,
}: RunSyncTransferInput): Promise<{ statusTimeline: string[] }> {
  const parsed = parseSyncRequestQr(rawRequestQr);
  if (parsed.ok === false) {
    throw new Error(parsed.error);
  }

  const ledgerId = selectedLedgerId ?? (await resolveLatestLedgerId(dbName));
  if (!ledgerId) {
    throw new Error('Create the ledger before running sync transfer');
  }

  const activeRepository = repository ?? createEventRepository(openLedgerDb(dbName));
  let localEvents = await activeRepository.listEventsByLedger(ledgerId);
  let projection = replayLedger(localEvents);

  if (recipientParticipantId) {
    const participantExists = projection.participants.some(
      (participant) => participant.participantId === recipientParticipantId,
    );

    if (!participantExists) {
      throw new Error('Select a valid recipient participant before sharing ledger access');
    }

    const inviteId = `invite-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
    const inviteCode = `code-${Math.random().toString(16).slice(2, 10)}`;

    await activeRepository.appendEvent({
      id: `invite-issued-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      ledgerId,
      eventType: 'invite.issued',
      eventVersion: 1,
      occurredAt: new Date().toISOString(),
      actorDeviceId: organizerDeviceId,
      payloadJson: JSON.stringify({
        inviteId,
        participantId: recipientParticipantId,
        inviteCode,
      }),
    });

    await activeRepository.appendEvent({
      id: `invite-consumed-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
      ledgerId,
      eventType: 'invite.consumed',
      eventVersion: 1,
      occurredAt: new Date().toISOString(),
      actorDeviceId: organizerDeviceId,
      payloadJson: JSON.stringify({
        inviteId,
        participantId: recipientParticipantId,
        contributorDeviceId: parsed.payload.requesterDeviceId,
      }),
    });

    localEvents = await activeRepository.listEventsByLedger(ledgerId);
    projection = replayLedger(localEvents);
  }

  const session = establishSyncSession(projection, organizerDeviceId, parsed.payload);
  const result = await runBidirectionalSyncExchange({
    repository: activeRepository,
    session,
    remoteEvents,
  });

  return { statusTimeline: result.statusTimeline };
}
