import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { LedgerEvent } from "../domain/events/types";
import { replayLedger } from "../domain/projections";

describe("expense split mode contracts", () => {
  test("EXPS-04/EXPS-05/EXPS-06: event contract includes equal/exact/percentage split fields", () => {
    const eventsTypesSource = readFileSync(resolve(process.cwd(), "src/domain/events/types.ts"), "utf8");

    expect(eventsTypesSource).toContain('mode: "equal"');
    expect(eventsTypesSource).toContain('mode: "exact"');
    expect(eventsTypesSource).toContain('mode: "percentage"');
    expect(eventsTypesSource).toContain("percentageBps");
    expect(eventsTypesSource).toContain("ExpenseSplitPayload");
  });

  test("projection contract includes split metadata and owedShares rows", () => {
    const projectionTypesSource = readFileSync(
      resolve(process.cwd(), "src/domain/projections/types.ts"),
      "utf8",
    );

    expect(projectionTypesSource).toContain("split");
    expect(projectionTypesSource).toContain("owedShares");
  });
});

describe("expense split mode replay invariants", () => {
  const ledgerId = "ledger-trip-005";
  const organizerDeviceId = "device-organizer-1";

  function ledgerCreatedEvent(): LedgerEvent {
    return {
      id: "evt-ledger-created-1",
      ledgerId,
      eventType: "ledger.created",
      eventVersion: 1,
      occurredAt: "2026-04-22T09:00:00.000Z",
      actorDeviceId: organizerDeviceId,
      payloadJson: JSON.stringify({
        title: "Phase 5 Split Modes",
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
      occurredAt: "2026-04-22T09:01:00.000Z",
      actorDeviceId: organizerDeviceId,
      payloadJson: JSON.stringify({ participantId, displayName }),
      sequence,
    };
  }

  test("equal split derives deterministic owed shares that sum to total (EXPS-04)", () => {
    const projection = replayLedger([
      ledgerCreatedEvent(),
      participantAddedEvent("participant-001", "Alice", 2),
      participantAddedEvent("participant-002", "Bob", 3),
      participantAddedEvent("participant-003", "Cleo", 4),
      {
        id: "evt-expense-created-1",
        ledgerId,
        eventType: "expense.created",
        eventVersion: 1,
        occurredAt: "2026-04-22T09:02:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          expenseId: "expense-001",
          description: "Lunch",
          currency: "EUR",
          totalAmountMinor: 1000,
          expenseDate: "2026-04-22",
          creatorRole: "organizer",
          payers: [{ participantId: "participant-001", paidAmountMinor: 1000 }],
          split: {
            mode: "equal",
            participants: [
              { participantId: "participant-001" },
              { participantId: "participant-002" },
              { participantId: "participant-003" },
            ],
          },
        }),
        sequence: 5,
      },
    ]);

    expect(projection.entries[0]?.owedShares).toEqual([
      { participantId: "participant-001", owedAmountMinor: 334 },
      { participantId: "participant-002", owedAmountMinor: 333 },
      { participantId: "participant-003", owedAmountMinor: 333 },
    ]);
  });

  test("exact split must match totalAmountMinor or replay rejects (EXPS-05)", () => {
    expect(() =>
      replayLedger([
        ledgerCreatedEvent(),
        participantAddedEvent("participant-001", "Alice", 2),
        participantAddedEvent("participant-002", "Bob", 3),
        {
          id: "evt-expense-created-2",
          ledgerId,
          eventType: "expense.created",
          eventVersion: 1,
          occurredAt: "2026-04-22T09:03:00.000Z",
          actorDeviceId: organizerDeviceId,
          payloadJson: JSON.stringify({
            expenseId: "expense-002",
            description: "Museum",
            currency: "EUR",
            totalAmountMinor: 1500,
            expenseDate: "2026-04-22",
            creatorRole: "organizer",
            payers: [{ participantId: "participant-001", paidAmountMinor: 1500 }],
            split: {
              mode: "exact",
              participants: [
                { participantId: "participant-001", owedAmountMinor: 1000 },
                { participantId: "participant-002", owedAmountMinor: 400 },
              ],
            },
          }),
          sequence: 4,
        },
      ]),
    ).toThrow("Exact split owed amounts must sum to totalAmountMinor");
  });

  test("percentage split must sum to 10000 bps or replay rejects (EXPS-06)", () => {
    expect(() =>
      replayLedger([
        ledgerCreatedEvent(),
        participantAddedEvent("participant-001", "Alice", 2),
        participantAddedEvent("participant-002", "Bob", 3),
        {
          id: "evt-expense-created-3",
          ledgerId,
          eventType: "expense.created",
          eventVersion: 1,
          occurredAt: "2026-04-22T09:04:00.000Z",
          actorDeviceId: organizerDeviceId,
          payloadJson: JSON.stringify({
            expenseId: "expense-003",
            description: "Tickets",
            currency: "EUR",
            totalAmountMinor: 2000,
            expenseDate: "2026-04-22",
            creatorRole: "organizer",
            payers: [{ participantId: "participant-001", paidAmountMinor: 2000 }],
            split: {
              mode: "percentage",
              participants: [
                { participantId: "participant-001", percentageBps: 6000 },
                { participantId: "participant-002", percentageBps: 3000 },
              ],
            },
          }),
          sequence: 4,
        },
      ]),
    ).toThrow("Percentage split basis points must sum to 10000");
  });
});
