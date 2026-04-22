import { beforeEach, describe, expect, test } from "vitest";

import { clearLedgerDb, openLedgerDb } from "../data/sqlite/client";
import { createEventRepository, type StoredEvent } from "../domain/events/repository";
import { assertOrganizerSyncHub } from "../domain/onboarding/authority";
import { establishSyncSession } from "../domain/sync/session";
import { decodeSyncRequestQr, encodeSyncRequestQr } from "../domain/sync/qr-request";
import type { SyncRequestQrPayload } from "../domain/sync/types";

describe("in-person sync handshake contracts", () => {
  const dbName = "in-person-sync-handshake-db";
  const ledgerId = "ledger-sync-07";
  const organizerDeviceId = "device-organizer-sync";
  const contributorDeviceId = "device-contributor-sync";

  beforeEach(() => {
    clearLedgerDb(dbName);
  });

  test("SYNC-01: encode/decode keeps required sync request fields", () => {
    const payload: SyncRequestQrPayload = {
      ledgerId,
      requesterDeviceId: contributorDeviceId,
      lastSeenSequence: 2,
      requestedAt: "2026-04-22T16:00:00.000Z",
      nonce: "nonce-01",
    };

    const raw = encodeSyncRequestQr(payload);
    const decoded = decodeSyncRequestQr(raw);

    expect(decoded).toEqual(payload);
  });

  test("SYNC-01: decoder rejects malformed or unsafe checkpoint values", () => {
    expect(() => decodeSyncRequestQr("not-json")).toThrow("must be valid JSON");
    expect(() =>
      decodeSyncRequestQr(
        JSON.stringify({
          requesterDeviceId: contributorDeviceId,
          lastSeenSequence: 1,
          requestedAt: "2026-04-22T16:00:00.000Z",
          nonce: "nonce-01",
        }),
      ),
    ).toThrow("ledgerId");
    expect(() =>
      decodeSyncRequestQr(
        JSON.stringify({
          ledgerId,
          requesterDeviceId: contributorDeviceId,
          lastSeenSequence: -1,
          requestedAt: "2026-04-22T16:00:00.000Z",
          nonce: "nonce-01",
        }),
      ),
    ).toThrow("lastSeenSequence");
  });

  test("SYNC-02: organizer actor can establish sync session from decoded QR payload", () => {
    const projection = {
      ledgerId,
      lastSequence: 4,
      appliedEventIds: [],
      entries: [],
      participants: [],
      invites: [],
      participantContributorDeviceClaims: {},
      pendingSubmissions: [],
      reviewedSubmissions: [],
      syncHubDeviceId: organizerDeviceId,
      approvalAuthorityDeviceId: organizerDeviceId,
      title: "Trip Sync",
      settlementContext: "per-currency balances",
    };

    const decoded = decodeSyncRequestQr(
      JSON.stringify({
        ledgerId,
        requesterDeviceId: contributorDeviceId,
        lastSeenSequence: 3,
        requestedAt: "2026-04-22T16:00:00.000Z",
        nonce: "nonce-01",
      }),
    );

    const session = establishSyncSession(projection, organizerDeviceId, decoded);

    expect(session.sessionId.startsWith("sync-session-")).toBe(true);
    expect(session).toMatchObject({
      ledgerId,
      organizerDeviceId,
      contributorDeviceId,
      contributorCheckpoint: 3,
    });
  });

  test("SYNC-02/SYNC-03 foundation: non-organizer is rejected and repository exposes checkpoint deltas", async () => {
    const projection = {
      ledgerId,
      lastSequence: 4,
      appliedEventIds: [],
      entries: [],
      participants: [],
      invites: [],
      participantContributorDeviceClaims: {},
      pendingSubmissions: [],
      reviewedSubmissions: [],
      syncHubDeviceId: organizerDeviceId,
      approvalAuthorityDeviceId: organizerDeviceId,
      title: "Trip Sync",
      settlementContext: "per-currency balances",
    };

    expect(() => assertOrganizerSyncHub(projection, "device-not-organizer")).toThrow(
      "Only organizer device can run sync hub actions",
    );

    const db = openLedgerDb(dbName);
    const repository = createEventRepository(db);

    await repository.appendEvent({
      id: "evt-sync-1",
      ledgerId,
      eventType: "expense.note-added",
      eventVersion: 1,
      occurredAt: "2026-04-22T16:01:00.000Z",
      actorDeviceId: organizerDeviceId,
      payloadJson: JSON.stringify({ note: "One" }),
    });
    await repository.appendEvent({
      id: "evt-sync-2",
      ledgerId,
      eventType: "expense.note-added",
      eventVersion: 1,
      occurredAt: "2026-04-22T16:02:00.000Z",
      actorDeviceId: organizerDeviceId,
      payloadJson: JSON.stringify({ note: "Two" }),
    });

    const unseen = await repository.listEventsAfterSequence(ledgerId, 1);
    expect(unseen.map((event: StoredEvent) => event.sequence)).toEqual([2]);

    const initialCheckpoint = await repository.getSyncCheckpoint(contributorDeviceId);
    expect(initialCheckpoint).toBe(0);

    await repository.setSyncCheckpoint(contributorDeviceId, 2);
    const updatedCheckpoint = await repository.getSyncCheckpoint(contributorDeviceId);
    expect(updatedCheckpoint).toBe(2);
  });
});
