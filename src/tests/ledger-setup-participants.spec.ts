import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, test } from "vitest";

import { replayLedger } from "../domain/projections";

describe("ledger-setup-participants", () => {
  const ledgerId = "ledger-trip-setup-001";
  const organizerDeviceId = "device-organizer-1";

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
    const events = [
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
          amountMinor: 7800,
          currency: "EUR",
        }),
        sequence: 2,
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
    ];

    const firstReplay = replayLedger(events);
    const secondReplay = replayLedger(events);

    expect(secondReplay).toEqual(firstReplay);
    expect(firstReplay.appliedEventIds).toEqual([
      "evt-ledger-created-1",
      "evt-expense-created-1",
    ]);
    expect(firstReplay.lastSequence).toBe(2);
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
});
