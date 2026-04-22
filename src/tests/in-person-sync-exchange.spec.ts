import { describe, expect, test } from "vitest";

import type { AppendEventInput, EventRepository, StoredEvent } from "../domain/events/repository";
import { runBidirectionalSyncExchange } from "../domain/sync/exchange";
import type { SyncSessionDescriptor } from "../domain/sync/types";

function createFixtureRepository(seedEvents: StoredEvent[], seedCheckpoints: Record<string, number> = {}): {
  repository: EventRepository;
  appendedEvents: AppendEventInput[];
  checkpoints: Record<string, number>;
} {
  const events = [...seedEvents];
  const checkpoints = { ...seedCheckpoints };
  const appendedEvents: AppendEventInput[] = [];

  const repository: EventRepository = {
    async appendEvent(input) {
      appendedEvents.push(input);
      events.push({
        ...input,
        sequence: events.length + 1,
      });
    },
    async listEventsByLedger(ledgerId) {
      return events
        .filter((event) => event.ledgerId === ledgerId)
        .sort((left, right) => left.sequence - right.sequence);
    },
    async listEventsAfterSequence(ledgerId, afterSequence) {
      return events
        .filter((event) => event.ledgerId === ledgerId && event.sequence > afterSequence)
        .sort((left, right) => left.sequence - right.sequence);
    },
    async getSyncCheckpoint(peerId) {
      return checkpoints[peerId] ?? 0;
    },
    async setSyncCheckpoint(peerId, lastSequence) {
      checkpoints[peerId] = lastSequence;
    },
  };

  return { repository, appendedEvents, checkpoints };
}

describe("in-person bidirectional sync exchange", () => {
  const ledgerId = "ledger-sync-07";
  const session: SyncSessionDescriptor = {
    sessionId: "sync-session-ledger-sync-07-nonce-01",
    ledgerId,
    organizerDeviceId: "device-organizer-sync",
    contributorDeviceId: "device-contributor-sync",
    contributorCheckpoint: 1,
  };

  const localEvents: StoredEvent[] = [
    {
      id: "evt-local-1",
      ledgerId,
      eventType: "expense.note-added",
      eventVersion: 1,
      occurredAt: "2026-04-22T16:00:00.000Z",
      actorDeviceId: "device-organizer-sync",
      payloadJson: JSON.stringify({ note: "Local one" }),
      sequence: 1,
    },
    {
      id: "evt-local-2",
      ledgerId,
      eventType: "expense.note-added",
      eventVersion: 1,
      occurredAt: "2026-04-22T16:01:00.000Z",
      actorDeviceId: "device-organizer-sync",
      payloadJson: JSON.stringify({ note: "Local two" }),
      sequence: 2,
    },
    {
      id: "evt-local-3",
      ledgerId,
      eventType: "expense.note-added",
      eventVersion: 1,
      occurredAt: "2026-04-22T16:02:00.000Z",
      actorDeviceId: "device-organizer-sync",
      payloadJson: JSON.stringify({ note: "Local three" }),
      sequence: 3,
    },
  ];

  const remoteEvents: StoredEvent[] = [
    {
      id: "evt-remote-2",
      ledgerId,
      eventType: "expense.note-added",
      eventVersion: 1,
      occurredAt: "2026-04-22T16:03:00.000Z",
      actorDeviceId: "device-contributor-sync",
      payloadJson: JSON.stringify({ note: "Remote two" }),
      sequence: 2,
    },
    {
      id: "evt-local-2",
      ledgerId,
      eventType: "expense.note-added",
      eventVersion: 1,
      occurredAt: "2026-04-22T16:01:00.000Z",
      actorDeviceId: "device-organizer-sync",
      payloadJson: JSON.stringify({ note: "duplicate" }),
      sequence: 3,
    },
  ];

  test("SYNC-03/SYNC-04: one exchange returns upload and download deltas bounded by checkpoints", async () => {
    const { repository } = createFixtureRepository(localEvents, {
      [session.contributorDeviceId]: 1,
    });

    const result = await runBidirectionalSyncExchange({
      repository,
      session,
      remoteEvents,
    });

    expect(result.upload.events.map((event) => event.sequence)).toEqual([2, 3]);
    expect(result.download.events.map((event) => event.sequence)).toEqual([2, 3]);
  });

  test("SYNC-04: remote apply dedupes by event id and appends only unseen events", async () => {
    const { repository, appendedEvents } = createFixtureRepository(localEvents, {
      [session.contributorDeviceId]: 1,
    });

    await runBidirectionalSyncExchange({
      repository,
      session,
      remoteEvents,
    });

    expect(appendedEvents.map((event) => event.id)).toEqual(["evt-remote-2"]);
  });

  test("SYNC-03: exchange updates organizer checkpoint for contributor peer", async () => {
    const { repository, checkpoints } = createFixtureRepository(localEvents, {
      [session.contributorDeviceId]: 1,
    });

    await runBidirectionalSyncExchange({
      repository,
      session,
      remoteEvents,
    });

    expect(checkpoints[session.contributorDeviceId]).toBe(3);
  });

  test("SYNC-05: status timeline includes plain-language milestones", async () => {
    const { repository } = createFixtureRepository(localEvents, {
      [session.contributorDeviceId]: 1,
    });

    const result = await runBidirectionalSyncExchange({
      repository,
      session,
      remoteEvents,
    });

    expect(result.statusTimeline).toEqual([
      "QR request scanned",
      "Sending 2 changes",
      "Receiving 2 changes",
      "Sync complete",
    ]);
  });
});
