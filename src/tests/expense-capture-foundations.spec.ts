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

  function participantAddedEvent(participantId: string, displayName: string, sequence: number): LedgerEvent {
    return {
      id: `evt-participant-added-${sequence}`,
      ledgerId,
      eventType: "participant.added",
      eventVersion: 1,
      occurredAt: "2026-04-21T10:01:00.000Z",
      actorDeviceId: organizerDeviceId,
      payloadJson: JSON.stringify({
        participantId,
        displayName,
      }),
      sequence,
    };
  }

  function inviteIssuedEvent(participantId: string, inviteId: string, sequence: number): LedgerEvent {
    return {
      id: `evt-invite-issued-${sequence}`,
      ledgerId,
      eventType: "invite.issued",
      eventVersion: 1,
      occurredAt: "2026-04-21T10:01:30.000Z",
      actorDeviceId: organizerDeviceId,
      payloadJson: JSON.stringify({
        inviteId,
        participantId,
        inviteCode: `JOIN-${sequence}`,
      }),
      sequence,
    };
  }

  function inviteConsumedEvent(participantId: string, deviceId: string, inviteId: string, sequence: number): LedgerEvent {
    return {
      id: `evt-invite-consumed-${sequence}`,
      ledgerId,
      eventType: "invite.consumed",
      eventVersion: 1,
      occurredAt: "2026-04-21T10:01:45.000Z",
      actorDeviceId: deviceId,
      payloadJson: JSON.stringify({
        inviteId,
        participantId,
        contributorDeviceId: deviceId,
      }),
      sequence,
    };
  }

  function equalSingleParticipantSplit(participantId: string) {
    return {
      mode: "equal" as const,
      participants: [{ participantId }],
    };
  }

  test("organizer can create expense with strict payload and payer rows (EXPS-01/EXPS-03)", () => {
    const projection = replayLedger([
      ledgerCreatedEvent(),
      participantAddedEvent("participant-001", "Alice", 2),
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
          split: equalSingleParticipantSplit("participant-001"),
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
        split: {
          mode: "equal",
          participants: [{ participantId: "participant-001" }],
        },
        owedShares: [{ participantId: "participant-001", owedAmountMinor: 7800 }],
        createdAt: "2026-04-21T10:02:00.000Z",
        createdByDeviceId: organizerDeviceId,
        sourceEventId: "evt-expense-created-1",
      },
    ]);
  });

  test("claimed contributor can create expense with strict payload and payer rows (EXPS-02)", () => {
    const projection = replayLedger([
      ledgerCreatedEvent(),
      participantAddedEvent("participant-001", "Alice", 2),
      inviteIssuedEvent("participant-001", "invite-001", 3),
      inviteConsumedEvent("participant-001", "device-contributor-1", "invite-001", 4),
      {
        id: "evt-expense-created-2",
        ledgerId,
        eventType: "expense.created",
        eventVersion: 1,
        occurredAt: "2026-04-21T10:03:00.000Z",
        actorDeviceId: "device-contributor-1",
        payloadJson: JSON.stringify({
          expenseId: "expense-002",
          description: "Taxi",
          currency: "EUR",
          totalAmountMinor: 2400,
          expenseDate: "2026-04-21",
          creatorRole: "contributor",
          payers: [{ participantId: "participant-001", paidAmountMinor: 2400 }],
          split: equalSingleParticipantSplit("participant-001"),
        }),
        sequence: 5,
      },
    ]);

    expect(projection.entries[0]?.createdByDeviceId).toBe("device-contributor-1");
    expect(projection.entries[0]?.creatorRole).toBe("contributor");
  });

  test("unknown payer participant is rejected with deterministic plain-language error", () => {
    expect(() =>
      replayLedger([
        ledgerCreatedEvent(),
        participantAddedEvent("participant-001", "Alice", 2),
        {
          id: "evt-expense-created-3",
          ledgerId,
          eventType: "expense.created",
          eventVersion: 1,
          occurredAt: "2026-04-21T10:04:00.000Z",
          actorDeviceId: organizerDeviceId,
          payloadJson: JSON.stringify({
            expenseId: "expense-003",
            description: "Museum",
            currency: "EUR",
            totalAmountMinor: 1500,
            expenseDate: "2026-04-21",
            creatorRole: "organizer",
            payers: [{ participantId: "participant-404", paidAmountMinor: 1500 }],
            split: equalSingleParticipantSplit("participant-404"),
          }),
          sequence: 3,
        },
      ]),
    ).toThrow("Expense payer references unknown participant");
  });

  test("unauthorized creator device is rejected and expense is not applied", () => {
    expect(() =>
      replayLedger([
        ledgerCreatedEvent(),
        participantAddedEvent("participant-001", "Alice", 2),
        {
          id: "evt-expense-created-4",
          ledgerId,
          eventType: "expense.created",
          eventVersion: 1,
          occurredAt: "2026-04-21T10:05:00.000Z",
          actorDeviceId: "device-unknown-1",
          payloadJson: JSON.stringify({
            expenseId: "expense-004",
            description: "Snacks",
            currency: "EUR",
            totalAmountMinor: 600,
            expenseDate: "2026-04-21",
            creatorRole: "contributor",
            payers: [{ participantId: "participant-001", paidAmountMinor: 600 }],
            split: equalSingleParticipantSplit("participant-001"),
          }),
          sequence: 3,
        },
      ]),
    ).toThrow("Only organizer or a claimed contributor device can create expenses");
  });

  test("invalid expense payload shape throws canonical invalid payload error", () => {
    expect(() =>
      replayLedger([
        ledgerCreatedEvent(),
        participantAddedEvent("participant-001", "Alice", 2),
        {
          id: "evt-expense-created-5",
          ledgerId,
          eventType: "expense.created",
          eventVersion: 1,
          occurredAt: "2026-04-21T10:06:00.000Z",
          actorDeviceId: organizerDeviceId,
          payloadJson: JSON.stringify({
            expenseId: "expense-005",
            description: "Coffee",
            currency: "EUR",
            expenseDate: "2026-04-21",
            creatorRole: "organizer",
            payers: [{ participantId: "participant-001", paidAmountMinor: 300 }],
          }),
          sequence: 3,
        },
      ]),
    ).toThrow("Invalid payload for eventType expense.created");
  });
});
