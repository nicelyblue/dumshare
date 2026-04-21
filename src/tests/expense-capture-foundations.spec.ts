import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { LedgerEvent } from "../domain/events/types";
import { replayLedger } from "../domain/projections";

describe("expense-capture-foundations contracts", () => {
  test("EXPS-01/EXPS-02/EXPS-03: expense.created payload contract exposes strict required fields", () => {
    const eventsTypesSource = readFileSync(
      resolve(process.cwd(), "src/domain/events/types.ts"),
      "utf8",
    );

    expect(eventsTypesSource).toContain('"expense.created"');
    expect(eventsTypesSource).toContain("type ExpenseCreatedPayload");
    expect(eventsTypesSource).toContain("expenseId");
    expect(eventsTypesSource).toContain("description");
    expect(eventsTypesSource).toContain("currency");
    expect(eventsTypesSource).toContain("totalAmountMinor");
    expect(eventsTypesSource).toContain("expenseDate");
    expect(eventsTypesSource).toContain("creatorRole");
    expect(eventsTypesSource).toContain("payers");
    expect(eventsTypesSource).toContain("paidAmountMinor");
  });

  test("projection contract exposes payer rows and creator metadata for deterministic replay", () => {
    const projectionTypesSource = readFileSync(
      resolve(process.cwd(), "src/domain/projections/types.ts"),
      "utf8",
    );

    expect(projectionTypesSource).toContain("totalAmountMinor");
    expect(projectionTypesSource).toContain("expenseDate");
    expect(projectionTypesSource).toContain("creatorRole");
    expect(projectionTypesSource).toContain("payers");
    expect(projectionTypesSource).toContain("paidAmountMinor");
  });
});

describe("expense-capture-foundations replay invariants", () => {
  const ledgerId = "ledger-trip-004";
  const organizerDeviceId = "device-organizer-1";

  function ledgerCreatedEvent(): LedgerEvent {
    return {
      id: "evt-ledger-created-1",
      ledgerId,
      eventType: "ledger.created",
      eventVersion: 1,
      occurredAt: "2026-04-21T10:00:00.000Z",
      actorDeviceId: organizerDeviceId,
      payloadJson: JSON.stringify({
        title: "Phase 4 Expense Capture",
        settlementContext: "per-currency balances",
      }),
      sequence: 1,
    };
  }

  test("organizer can create expense with strict payload and payer rows (EXPS-01/EXPS-03)", () => {
    const projection = replayLedger([
      ledgerCreatedEvent(),
      {
        id: "evt-participant-added-1",
        ledgerId,
        eventType: "participant.added",
        eventVersion: 1,
        occurredAt: "2026-04-21T10:01:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          participantId: "participant-001",
          displayName: "Alice",
        }),
        sequence: 2,
      },
      {
        id: "evt-expense-created-1",
        ledgerId,
        eventType: "expense.created",
        eventVersion: 1,
        occurredAt: "2026-04-21T10:02:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          expenseId: "expense-001",
          description: "Dinner",
          currency: "EUR",
          totalAmountMinor: 7800,
          expenseDate: "2026-04-21",
          creatorRole: "organizer",
          payers: [{ participantId: "participant-001", paidAmountMinor: 7800 }],
        }),
        sequence: 3,
      },
    ]);

    expect(projection.entries).toEqual([
      {
        expenseId: "expense-001",
        description: "Dinner",
        totalAmountMinor: 7800,
        currency: "EUR",
        expenseDate: "2026-04-21",
        creatorRole: "organizer",
        payers: [{ participantId: "participant-001", paidAmountMinor: 7800 }],
        createdAt: "2026-04-21T10:02:00.000Z",
        createdByDeviceId: organizerDeviceId,
        sourceEventId: "evt-expense-created-1",
      },
    ]);
  });
});
