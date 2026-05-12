import { describe, expect, test } from "vitest";

import type { LedgerEvent } from "../domain/events/types";
import { replayLedger } from "../domain/projections";
import { buildApprovedBalanceSummary } from "../domain/balances";

describe("per-currency balance summary invariants", () => {
  const ledgerId = "ledger-trip-008-summary";
  const organizerDeviceId = "device-organizer-1";
  const contributorDeviceId = "device-contributor-1";

  function baseEvents(): LedgerEvent[] {
    return [
      {
        id: "evt-ledger-created-1",
        ledgerId,
        eventType: "ledger.created",
        eventVersion: 1,
        occurredAt: "2026-04-22T16:00:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          title: "Balance Summary",
          settlementContext: "per-currency",
        }),
        sequence: 1,
      },
      {
        id: "evt-participant-added-1",
        ledgerId,
        eventType: "participant.added",
        eventVersion: 1,
        occurredAt: "2026-04-22T16:01:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({ participantId: "participant-001", displayName: "Alice" }),
        sequence: 2,
      },
      {
        id: "evt-participant-added-2",
        ledgerId,
        eventType: "participant.added",
        eventVersion: 1,
        occurredAt: "2026-04-22T16:01:10.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({ participantId: "participant-002", displayName: "Bob" }),
        sequence: 3,
      },
      {
        id: "evt-invite-issued-1",
        ledgerId,
        eventType: "invite.issued",
        eventVersion: 1,
        occurredAt: "2026-04-22T16:01:20.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          inviteId: "invite-001",
          participantId: "participant-002",
          inviteCode: "JOIN-002",
        }),
        sequence: 4,
      },
      {
        id: "evt-invite-consumed-1",
        ledgerId,
        eventType: "invite.consumed",
        eventVersion: 1,
        occurredAt: "2026-04-22T16:01:30.000Z",
        actorDeviceId: contributorDeviceId,
        payloadJson: JSON.stringify({
          inviteId: "invite-001",
          participantId: "participant-002",
          contributorDeviceId,
        }),
        sequence: 5,
      },
    ];
  }

  test("BALN-02/BALN-03: summary preserves per-currency separation and paid/owed/net detail", () => {
    const projection = replayLedger([
      ...baseEvents(),
      {
        id: "evt-expense-created-eur",
        ledgerId,
        eventType: "expense.created",
        eventVersion: 1,
        occurredAt: "2026-04-22T16:02:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          expenseId: "expense-eur",
          description: "Dinner",
          currency: "EUR",
          totalAmountMinor: 2000,
          expenseDate: "2026-04-22",
          creatorRole: "organizer",
          payers: [{ participantId: "participant-001", paidAmountMinor: 2000 }],
          split: {
            mode: "equal",
            participants: [{ participantId: "participant-001" }, { participantId: "participant-002" }],
          },
        }),
        sequence: 6,
      },
      {
        id: "evt-expense-created-usd",
        ledgerId,
        eventType: "expense.created",
        eventVersion: 1,
        occurredAt: "2026-04-22T16:03:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          expenseId: "expense-usd",
          description: "Taxi",
          currency: "USD",
          totalAmountMinor: 1000,
          expenseDate: "2026-04-22",
          creatorRole: "organizer",
          payers: [{ participantId: "participant-002", paidAmountMinor: 1000 }],
          split: {
            mode: "equal",
            participants: [{ participantId: "participant-001" }, { participantId: "participant-002" }],
          },
        }),
        sequence: 7,
      },
    ]);

    const summary = buildApprovedBalanceSummary(projection);

    expect(summary.participants).toEqual([
      {
        participantId: "participant-001",
        displayName: "Alice",
        balancesByCurrency: [
          { currency: "EUR", paidTotalMinor: 2000, owedTotalMinor: 1000, netMinor: 1000 },
          { currency: "USD", paidTotalMinor: 0, owedTotalMinor: 500, netMinor: -500 },
        ],
      },
      {
        participantId: "participant-002",
        displayName: "Bob",
        balancesByCurrency: [
          { currency: "EUR", paidTotalMinor: 0, owedTotalMinor: 1000, netMinor: -1000 },
          { currency: "USD", paidTotalMinor: 1000, owedTotalMinor: 500, netMinor: 500 },
        ],
      },
    ]);

    expect(summary.metadata).toEqual({});
  });
});
