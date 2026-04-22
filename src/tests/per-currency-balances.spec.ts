import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { LedgerEvent } from "../domain/events/types";
import { replayLedger } from "../domain/projections";
import { derivePerCurrencyBalances } from "../domain/balances/derive";

describe("per-currency balance contracts", () => {
  test("BALN-01: balance types expose per-currency participant row contracts", () => {
    const source = readFileSync(resolve(process.cwd(), "src/domain/balances/types.ts"), "utf8");

    expect(source).toContain("export type CurrencyBalanceRow");
    expect(source).toContain("export type ParticipantCurrencyBalances");
    expect(source).toContain("balancesByCurrency");
  });
});

describe("per-currency balance replay invariants", () => {
  const ledgerId = "ledger-trip-008";
  const organizerDeviceId = "device-organizer-1";
  const contributorDeviceId = "device-contributor-1";

  function baseEvents(): LedgerEvent[] {
    return [
      {
        id: "evt-ledger-created-1",
        ledgerId,
        eventType: "ledger.created",
        eventVersion: 1,
        occurredAt: "2026-04-22T15:00:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          title: "Per-Currency Balances",
          settlementContext: "approved-only",
        }),
        sequence: 1,
      },
      {
        id: "evt-participant-added-1",
        ledgerId,
        eventType: "participant.added",
        eventVersion: 1,
        occurredAt: "2026-04-22T15:01:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({ participantId: "participant-001", displayName: "Alice" }),
        sequence: 2,
      },
      {
        id: "evt-participant-added-2",
        ledgerId,
        eventType: "participant.added",
        eventVersion: 1,
        occurredAt: "2026-04-22T15:01:10.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({ participantId: "participant-002", displayName: "Bob" }),
        sequence: 3,
      },
      {
        id: "evt-invite-issued-1",
        ledgerId,
        eventType: "invite.issued",
        eventVersion: 1,
        occurredAt: "2026-04-22T15:01:20.000Z",
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
        occurredAt: "2026-04-22T15:01:30.000Z",
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

  test("BALN-01: participant net equals paid minus owed for approved entries", () => {
    const projection = replayLedger([
      ...baseEvents(),
      {
        id: "evt-expense-created-1",
        ledgerId,
        eventType: "expense.created",
        eventVersion: 1,
        occurredAt: "2026-04-22T15:02:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          expenseId: "expense-001",
          description: "Dinner",
          currency: "EUR",
          totalAmountMinor: 3000,
          expenseDate: "2026-04-22",
          creatorRole: "organizer",
          payers: [{ participantId: "participant-001", paidAmountMinor: 3000 }],
          split: {
            mode: "equal",
            participants: [{ participantId: "participant-001" }, { participantId: "participant-002" }],
          },
        }),
        sequence: 6,
      },
    ]);

    const balances = derivePerCurrencyBalances(projection);

    expect(balances).toEqual([
      {
        participantId: "participant-001",
        displayName: "Alice",
        balancesByCurrency: [{ currency: "EUR", paidTotalMinor: 3000, owedTotalMinor: 1500, netMinor: 1500 }],
      },
      {
        participantId: "participant-002",
        displayName: "Bob",
        balancesByCurrency: [{ currency: "EUR", paidTotalMinor: 0, owedTotalMinor: 1500, netMinor: -1500 }],
      },
    ]);
  });

  test("BALN-01/D-06: mixed currencies stay separate and never merge", () => {
    const projection = replayLedger([
      ...baseEvents(),
      {
        id: "evt-expense-created-eur",
        ledgerId,
        eventType: "expense.created",
        eventVersion: 1,
        occurredAt: "2026-04-22T15:03:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          expenseId: "expense-eur",
          description: "Museum",
          currency: "EUR",
          totalAmountMinor: 1200,
          expenseDate: "2026-04-22",
          creatorRole: "organizer",
          payers: [{ participantId: "participant-001", paidAmountMinor: 1200 }],
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
        occurredAt: "2026-04-22T15:04:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          expenseId: "expense-usd",
          description: "Taxi",
          currency: "USD",
          totalAmountMinor: 800,
          expenseDate: "2026-04-22",
          creatorRole: "organizer",
          payers: [{ participantId: "participant-002", paidAmountMinor: 800 }],
          split: {
            mode: "equal",
            participants: [{ participantId: "participant-001" }, { participantId: "participant-002" }],
          },
        }),
        sequence: 7,
      },
    ]);

    const balances = derivePerCurrencyBalances(projection);
    const alice = balances[0];
    const bob = balances[1];

    expect(alice?.balancesByCurrency).toEqual([
      { currency: "EUR", paidTotalMinor: 1200, owedTotalMinor: 600, netMinor: 600 },
      { currency: "USD", paidTotalMinor: 0, owedTotalMinor: 400, netMinor: -400 },
    ]);
    expect(bob?.balancesByCurrency).toEqual([
      { currency: "EUR", paidTotalMinor: 0, owedTotalMinor: 600, netMinor: -600 },
      { currency: "USD", paidTotalMinor: 800, owedTotalMinor: 400, netMinor: 400 },
    ]);
  });

  test("D-03: rejected contributor submissions do not mutate approved-entry balances", () => {
    const submittedAt = "2026-04-22T15:05:00.000Z";

    const projectionBeforeReview = replayLedger([
      ...baseEvents(),
      {
        id: "evt-submission-create-1",
        ledgerId,
        eventType: "expense.submission-created",
        eventVersion: 1,
        occurredAt: submittedAt,
        actorDeviceId: contributorDeviceId,
        payloadJson: JSON.stringify({
          submissionId: "submission-create-1",
          submissionType: "expense-create",
          submittedByParticipantId: "participant-002",
          proposedExpense: {
            expenseId: "expense-proposed-1",
            description: "Proposed expense",
            currency: "EUR",
            totalAmountMinor: 900,
            expenseDate: "2026-04-22",
            creatorRole: "contributor",
            payers: [{ participantId: "participant-002", paidAmountMinor: 900 }],
            split: {
              mode: "equal",
              participants: [{ participantId: "participant-001" }, { participantId: "participant-002" }],
            },
          },
        }),
        sequence: 6,
      },
    ]);

    const projectionRejected = replayLedger([
      ...baseEvents(),
      {
        id: "evt-submission-create-1",
        ledgerId,
        eventType: "expense.submission-created",
        eventVersion: 1,
        occurredAt: submittedAt,
        actorDeviceId: contributorDeviceId,
        payloadJson: JSON.stringify({
          submissionId: "submission-create-1",
          submissionType: "expense-create",
          submittedByParticipantId: "participant-002",
          proposedExpense: {
            expenseId: "expense-proposed-1",
            description: "Proposed expense",
            currency: "EUR",
            totalAmountMinor: 900,
            expenseDate: "2026-04-22",
            creatorRole: "contributor",
            payers: [{ participantId: "participant-002", paidAmountMinor: 900 }],
            split: {
              mode: "equal",
              participants: [{ participantId: "participant-001" }, { participantId: "participant-002" }],
            },
          },
        }),
        sequence: 6,
      },
      {
        id: "evt-submission-reviewed-reject-1",
        ledgerId,
        eventType: "expense.submission-reviewed",
        eventVersion: 1,
        occurredAt: "2026-04-22T15:06:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          submissionId: "submission-create-1",
          decision: "rejected",
          reviewReason: "no receipt",
        }),
        sequence: 7,
      },
    ]);

    const beforeReviewBalances = derivePerCurrencyBalances(projectionBeforeReview);
    const rejectedBalances = derivePerCurrencyBalances(projectionRejected);

    expect(beforeReviewBalances).toEqual(rejectedBalances);
    expect(projectionBeforeReview.entries).toHaveLength(0);
    expect(projectionRejected.entries).toHaveLength(0);
  });
});
