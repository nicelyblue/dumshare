import { beforeEach, describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { clearLedgerDb, closeLedgerDb, openLedgerDb } from "../data/sqlite/client";
import type { LedgerEvent } from "../domain/events/types";
import { createEventRepository } from "../domain/events/repository";
import { replayLedger } from "../domain/projections";

describe("ledger-setup-participants", () => {
  const dbName = "ledger-setup-participants-test-db";
  const ledgerId = "ledger-trip-setup-001";
  const organizerDeviceId = "device-organizer-1";

  beforeEach(() => {
    clearLedgerDb(dbName);
  });

  test("participant.added contract requires participantId and displayName payload fields", () => {
    const eventsTypesSource = readFileSync(
      resolve(process.cwd(), "src/domain/events/types.ts"),
      "utf8",
    );

    expect(eventsTypesSource).toContain('"participant.added"');
    expect(eventsTypesSource).toContain("participantId");
    expect(eventsTypesSource).toContain("displayName");
  });

  test("ledger projection contract exposes participants list for roster flows", () => {
    const projectionTypesSource = readFileSync(
      resolve(process.cwd(), "src/domain/projections/types.ts"),
      "utf8",
    );

    expect(projectionTypesSource).toContain("participants");
  });

  test("replayLedger applies ledger.created into ledger metadata projection", () => {
    const projection = replayLedger([
      {
        id: "evt-ledger-created-1",
        ledgerId,
        eventType: "ledger.created",
        eventVersion: 1,
        occurredAt: "2026-04-20T17:00:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          title: "Barcelona Weekend",
          settlementContext: "per-currency balances",
        }),
        sequence: 1,
      },
    ]);

    expect(projection).toMatchObject({
      ledgerId,
      title: "Barcelona Weekend",
      settlementContext: "per-currency balances",
      lastSequence: 1,
      appliedEventIds: ["evt-ledger-created-1"],
      entries: [],
    });
  });

  test("replayLedger is deterministic for identical event sequences", () => {
    const events: LedgerEvent[] = [
      {
        id: "evt-expense-created-1",
        ledgerId,
        eventType: "expense.created",
        eventVersion: 1,
        occurredAt: "2026-04-20T17:05:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          expenseId: "expense-001",
          description: "Dinner",
          currency: "EUR",
          totalAmountMinor: 7800,
          expenseDate: "2026-04-20",
          creatorRole: "organizer",
          payers: [{ participantId: "participant-001", paidAmountMinor: 7800 }],
        }),
        sequence: 3,
      },
      {
        id: "evt-ledger-created-1",
        ledgerId,
        eventType: "ledger.created",
        eventVersion: 1,
        occurredAt: "2026-04-20T17:00:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          title: "Barcelona Weekend",
          settlementContext: "per-currency balances",
        }),
        sequence: 1,
      },
      {
        id: "evt-participant-added-1",
        ledgerId,
        eventType: "participant.added",
        eventVersion: 1,
        occurredAt: "2026-04-20T17:01:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          participantId: "participant-001",
          displayName: "Alice",
        }),
        sequence: 2,
      },
    ];

    const firstReplay = replayLedger(events);
    const secondReplay = replayLedger(events);

    expect(secondReplay).toEqual(firstReplay);
    expect(firstReplay.appliedEventIds).toEqual([
      "evt-ledger-created-1",
      "evt-participant-added-1",
      "evt-expense-created-1",
    ]);
    expect(firstReplay.lastSequence).toBe(3);
    expect(firstReplay.title).toBe("Barcelona Weekend");
    expect(firstReplay.settlementContext).toBe("per-currency balances");
  });

  test("replayLedger keeps explicit unsupported eventType errors", () => {
    expect(() =>
      replayLedger([
        {
          id: "evt-unknown-1",
          ledgerId,
          eventType: "expense.unknown",
          eventVersion: 1,
          occurredAt: "2026-04-20T17:10:00.000Z",
          actorDeviceId: organizerDeviceId,
          payloadJson: JSON.stringify({ some: "payload" }),
          sequence: 1,
        },
      ]),
    ).toThrow(/Unsupported eventType/);
  });

  test("replayLedger includes participant names from participant.added events", () => {
    const projection = replayLedger([
      {
        id: "evt-ledger-created-1",
        ledgerId,
        eventType: "ledger.created",
        eventVersion: 1,
        occurredAt: "2026-04-20T17:00:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          title: "Barcelona Weekend",
          settlementContext: "per-currency balances",
        }),
        sequence: 1,
      },
      {
        id: "evt-participant-added-1",
        ledgerId,
        eventType: "participant.added",
        eventVersion: 1,
        occurredAt: "2026-04-20T17:01:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          participantId: "participant-001",
          displayName: "Alice",
        }),
        sequence: 2,
      },
    ]);

    expect(projection.participants).toEqual([
      {
        participantId: "participant-001",
        displayName: "Alice",
        sourceEventId: "evt-participant-added-1",
      },
    ]);
  });

  test("replaying persisted events after reopen keeps the same participant roster", async () => {
    const db = openLedgerDb(dbName);
    const repository = createEventRepository(db);

    await repository.appendEvent({
      id: "evt-ledger-created-1",
      ledgerId,
      eventType: "ledger.created",
      eventVersion: 1,
      occurredAt: "2026-04-20T17:00:00.000Z",
      actorDeviceId: organizerDeviceId,
      payloadJson: JSON.stringify({
        title: "Barcelona Weekend",
        settlementContext: "per-currency balances",
      }),
    });

    await repository.appendEvent({
      id: "evt-participant-added-1",
      ledgerId,
      eventType: "participant.added",
      eventVersion: 1,
      occurredAt: "2026-04-20T17:01:00.000Z",
      actorDeviceId: organizerDeviceId,
      payloadJson: JSON.stringify({
        participantId: "participant-001",
        displayName: "Alice",
      }),
    });

    const beforeCloseEvents = await repository.listEventsByLedger(ledgerId);
    const beforeCloseProjection = replayLedger(beforeCloseEvents);

    closeLedgerDb(db);

    const reopened = openLedgerDb(dbName);
    const reopenedRepository = createEventRepository(reopened);
    const afterReopenEvents = await reopenedRepository.listEventsByLedger(ledgerId);
    const afterReopenProjection = replayLedger(afterReopenEvents);

    expect(afterReopenProjection.participants).toEqual(beforeCloseProjection.participants);
  });

  test("participant roster ordering follows event sequence deterministically", () => {
    const events = [
      {
        id: "evt-participant-added-2",
        ledgerId,
        eventType: "participant.added",
        eventVersion: 1,
        occurredAt: "2026-04-20T17:02:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          participantId: "participant-002",
          displayName: "Bob",
        }),
        sequence: 3,
      },
      {
        id: "evt-ledger-created-1",
        ledgerId,
        eventType: "ledger.created",
        eventVersion: 1,
        occurredAt: "2026-04-20T17:00:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          title: "Barcelona Weekend",
          settlementContext: "per-currency balances",
        }),
        sequence: 1,
      },
      {
        id: "evt-participant-added-1",
        ledgerId,
        eventType: "participant.added",
        eventVersion: 1,
        occurredAt: "2026-04-20T17:01:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          participantId: "participant-001",
          displayName: "Alice",
        }),
        sequence: 2,
      },
    ];

    const firstReplay = replayLedger(events);
    const secondReplay = replayLedger(events);

    expect(secondReplay.participants).toEqual(firstReplay.participants);
    expect(firstReplay.participants.map((participant) => participant.displayName)).toEqual([
      "Alice",
      "Bob",
    ]);
  });

  test("participant.added replay rejects invalid payload fields", () => {
    expect(() =>
      replayLedger([
        {
          id: "evt-ledger-created-1",
          ledgerId,
          eventType: "ledger.created",
          eventVersion: 1,
          occurredAt: "2026-04-20T17:00:00.000Z",
          actorDeviceId: organizerDeviceId,
          payloadJson: JSON.stringify({
            title: "Barcelona Weekend",
            settlementContext: "per-currency balances",
          }),
          sequence: 1,
        },
        {
          id: "evt-participant-added-invalid-1",
          ledgerId,
          eventType: "participant.added",
          eventVersion: 1,
          occurredAt: "2026-04-20T17:01:00.000Z",
          actorDeviceId: organizerDeviceId,
          payloadJson: JSON.stringify({
            participantId: "",
            displayName: "",
          }),
          sequence: 2,
        },
      ]),
    ).toThrow(/Invalid payload for eventType participant.added/);
  });
});
