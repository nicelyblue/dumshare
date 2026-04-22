import { beforeEach, describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { clearLedgerDb, closeLedgerDb, openLedgerDb } from "../data/sqlite/client";
import { createEventRepository } from "../domain/events/repository";
import { replayLedger } from "../domain/projections";

test("ledger setup contracts include ledger.created payload and projection metadata fields", () => {
  const eventsTypesSource = readFileSync(
    resolve(process.cwd(), "src/domain/events/types.ts"),
    "utf8",
  );
  const projectionTypesSource = readFileSync(
    resolve(process.cwd(), "src/domain/projections/types.ts"),
    "utf8",
  );

  expect(eventsTypesSource).toContain('"ledger.created"');
  expect(eventsTypesSource).toContain("title");
  expect(eventsTypesSource).toContain("settlementContext");

  expect(projectionTypesSource).toContain("title");
  expect(projectionTypesSource).toContain("settlementContext");
});

describe("local-data-backbone", () => {
  const dbName = "local-data-backbone-test-db";
  const ledgerId = "ledger-trip-001";
  const eventId = "evt-001";
  const deviceId = "device-abc";

  beforeEach(() => {
    clearLedgerDb(dbName);
  });

  test("persists events across reopen", async () => {
    const db = openLedgerDb(dbName);
    const repository = createEventRepository(db);

    await repository.appendEvent({
      id: eventId,
      ledgerId,
      eventType: "expense.created",
      eventVersion: 1,
      occurredAt: "2026-04-20T16:00:00.000Z",
      actorDeviceId: deviceId,
      payloadJson: JSON.stringify({ amountMinor: 5000, currency: "USD" }),
    });

    closeLedgerDb(db);

    const reopened = openLedgerDb(dbName);
    const reopenedRepository = createEventRepository(reopened);
    const events = await reopenedRepository.listEventsByLedger(ledgerId);

    expect(events).toHaveLength(1);
    expect(events[0]).toMatchObject({
      id: eventId,
      ledgerId,
      eventType: "expense.created",
      eventVersion: 1,
      occurredAt: "2026-04-20T16:00:00.000Z",
      actorDeviceId: deviceId,
      payloadJson: JSON.stringify({ amountMinor: 5000, currency: "USD" }),
      sequence: 1,
    });
  });

  test("does not mutate prior events", async () => {
    const db = openLedgerDb(dbName);
    const repository = createEventRepository(db);

    await repository.appendEvent({
      id: "evt-immutable-1",
      ledgerId,
      eventType: "expense.created",
      eventVersion: 1,
      occurredAt: "2026-04-20T16:00:00.000Z",
      actorDeviceId: deviceId,
      payloadJson: JSON.stringify({ amountMinor: 1000, currency: "USD" }),
    });

    expect("updateEvent" in repository).toBe(false);
    expect("deleteEvent" in repository).toBe(false);

    const firstRead = await repository.listEventsByLedger(ledgerId);

    await repository.appendEvent({
      id: "evt-immutable-2",
      ledgerId,
      eventType: "expense.note-added",
      eventVersion: 1,
      occurredAt: "2026-04-20T16:01:00.000Z",
      actorDeviceId: deviceId,
      payloadJson: JSON.stringify({ note: "Taxi" }),
    });

    const secondRead = await repository.listEventsByLedger(ledgerId);

    expect(secondRead).toHaveLength(2);
    expect(secondRead[0]).toEqual(firstRead[0]);
  });

  test("returns events in deterministic append sequence", async () => {
    const db = openLedgerDb(dbName);
    const repository = createEventRepository(db);

    await repository.appendEvent({
      id: "evt-order-2",
      ledgerId,
      eventType: "expense.created",
      eventVersion: 1,
      occurredAt: "2026-04-20T16:10:00.000Z",
      actorDeviceId: deviceId,
      payloadJson: JSON.stringify({ amountMinor: 2200, currency: "EUR" }),
    });

    await repository.appendEvent({
      id: "evt-order-1",
      ledgerId,
      eventType: "expense.created",
      eventVersion: 1,
      occurredAt: "2026-04-20T16:09:00.000Z",
      actorDeviceId: deviceId,
      payloadJson: JSON.stringify({ amountMinor: 1400, currency: "EUR" }),
    });

    const events = await repository.listEventsByLedger(ledgerId);
    expect(events.map((event) => event.sequence)).toEqual([1, 2]);
    expect(events.map((event) => event.id)).toEqual(["evt-order-2", "evt-order-1"]);
  });

  test("replayLedger returns identical output for identical ordered event arrays", async () => {
    const db = openLedgerDb(dbName);
    const repository = createEventRepository(db);

    await repository.appendEvent({
      id: "evt-ledger-created-1",
      ledgerId,
      eventType: "ledger.created",
      eventVersion: 1,
      occurredAt: "2026-04-20T16:19:00.000Z",
      actorDeviceId: deviceId,
      payloadJson: JSON.stringify({
        title: "Backbone Replay",
        settlementContext: "per-currency balances",
      }),
    });

    await repository.appendEvent({
      id: "evt-participant-added-1",
      ledgerId,
      eventType: "participant.added",
      eventVersion: 1,
      occurredAt: "2026-04-20T16:19:30.000Z",
      actorDeviceId: deviceId,
      payloadJson: JSON.stringify({
        participantId: "participant-001",
        displayName: "Alice",
      }),
    });

    await repository.appendEvent({
      id: "evt-replay-1",
      ledgerId,
      eventType: "expense.created",
      eventVersion: 1,
      occurredAt: "2026-04-20T16:20:00.000Z",
      actorDeviceId: deviceId,
      payloadJson: JSON.stringify({
        expenseId: "expense-1",
        description: "Train",
        currency: "EUR",
        totalAmountMinor: 2500,
        expenseDate: "2026-04-20",
        creatorRole: "organizer",
        payers: [{ participantId: "participant-001", paidAmountMinor: 2500 }],
        split: {
          mode: "equal",
          participants: [{ participantId: "participant-001" }],
        },
      }),
    });

    await repository.appendEvent({
      id: "evt-replay-2",
      ledgerId,
      eventType: "expense.created",
      eventVersion: 1,
      occurredAt: "2026-04-20T16:21:00.000Z",
      actorDeviceId: deviceId,
      payloadJson: JSON.stringify({
        expenseId: "expense-2",
        description: "Lunch",
        currency: "EUR",
        totalAmountMinor: 1800,
        expenseDate: "2026-04-20",
        creatorRole: "organizer",
        payers: [{ participantId: "participant-001", paidAmountMinor: 1800 }],
        split: {
          mode: "equal",
          participants: [{ participantId: "participant-001" }],
        },
      }),
    });

    const events = await repository.listEventsByLedger(ledgerId);

    const firstReplay = replayLedger(events);
    const secondReplay = replayLedger(events);

    expect(secondReplay).toEqual(firstReplay);
  });

  test("replays persisted events identically after reopen reconstruction", async () => {
    const db = openLedgerDb(dbName);
    const repository = createEventRepository(db);

    await repository.appendEvent({
      id: "evt-ledger-created-1",
      ledgerId,
      eventType: "ledger.created",
      eventVersion: 1,
      occurredAt: "2026-04-20T16:29:00.000Z",
      actorDeviceId: deviceId,
      payloadJson: JSON.stringify({
        title: "Backbone Replay",
        settlementContext: "per-currency balances",
      }),
    });

    await repository.appendEvent({
      id: "evt-participant-added-1",
      ledgerId,
      eventType: "participant.added",
      eventVersion: 1,
      occurredAt: "2026-04-20T16:29:30.000Z",
      actorDeviceId: deviceId,
      payloadJson: JSON.stringify({
        participantId: "participant-001",
        displayName: "Alice",
      }),
    });

    await repository.appendEvent({
      id: "evt-reopen-replay-1",
      ledgerId,
      eventType: "expense.created",
      eventVersion: 1,
      occurredAt: "2026-04-20T16:30:00.000Z",
      actorDeviceId: deviceId,
      payloadJson: JSON.stringify({
        expenseId: "expense-a",
        description: "Museum",
        currency: "USD",
        totalAmountMinor: 3200,
        expenseDate: "2026-04-20",
        creatorRole: "organizer",
        payers: [{ participantId: "participant-001", paidAmountMinor: 3200 }],
        split: {
          mode: "equal",
          participants: [{ participantId: "participant-001" }],
        },
      }),
    });

    const beforeCloseEvents = await repository.listEventsByLedger(ledgerId);
    const projectionBeforeClose = replayLedger(beforeCloseEvents);

    closeLedgerDb(db);

    const reopened = openLedgerDb(dbName);
    const reopenedRepository = createEventRepository(reopened);
    const afterReopenEvents = await reopenedRepository.listEventsByLedger(ledgerId);
    const projectionAfterReopen = replayLedger(afterReopenEvents);

    expect(projectionAfterReopen).toEqual(projectionBeforeClose);
  });

  test("throws explicit error for unsupported eventType", () => {
    expect(() =>
      replayLedger([
        {
          id: "evt-unknown-1",
          ledgerId,
          eventType: "expense.unknown",
          eventVersion: 1,
          occurredAt: "2026-04-20T16:40:00.000Z",
          actorDeviceId: deviceId,
          payloadJson: JSON.stringify({ some: "payload" }),
          sequence: 1,
        },
      ]),
    ).toThrow(/Unsupported eventType/);
  });
});
