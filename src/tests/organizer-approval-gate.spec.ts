import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { LedgerEvent } from "../domain/events/types";
import { replayLedger } from "../domain/projections";

describe("organizer approval gate contracts", () => {
  test("APRV-01/APRV-02/APRV-03/APRV-04: event contracts include submission created/reviewed lifecycle types", () => {
    const source = readFileSync(resolve(process.cwd(), "src/domain/events/types.ts"), "utf8");

    expect(source).toContain('"expense.submission-created"');
    expect(source).toContain('"expense.submission-reviewed"');
    expect(source).toContain("ExpenseSubmissionCreatedPayload");
    expect(source).toContain("ExpenseSubmissionReviewedPayload");
    expect(source).toContain("submissionType");
    expect(source).toContain("decision");
  });

  test("projection contracts include pending create/amendment union and reviewed submission trail", () => {
    const source = readFileSync(resolve(process.cwd(), "src/domain/projections/types.ts"), "utf8");

    expect(source).toContain("pendingSubmissions");
    expect(source).toContain('submissionType: "expense-create"');
    expect(source).toContain('submissionType: "expense-amendment"');
    expect(source).toContain("reviewedSubmissions");
  });
});

describe("organizer approval gate replay invariants", () => {
  const ledgerId = "ledger-trip-006";
  const organizerDeviceId = "device-organizer-1";
  const contributorDeviceId = "device-contributor-1";

  function baseEvents(): LedgerEvent[] {
    return [
      {
        id: "evt-ledger-created-1",
        ledgerId,
        eventType: "ledger.created",
        eventVersion: 1,
        occurredAt: "2026-04-22T12:00:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          title: "Approval Gate",
          settlementContext: "per-currency balances",
        }),
        sequence: 1,
      },
      {
        id: "evt-participant-added-1",
        ledgerId,
        eventType: "participant.added",
        eventVersion: 1,
        occurredAt: "2026-04-22T12:01:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          participantId: "participant-001",
          displayName: "Alice",
        }),
        sequence: 2,
      },
      {
        id: "evt-invite-issued-1",
        ledgerId,
        eventType: "invite.issued",
        eventVersion: 1,
        occurredAt: "2026-04-22T12:01:30.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          inviteId: "invite-001",
          participantId: "participant-001",
          inviteCode: "JOIN-001",
        }),
        sequence: 3,
      },
      {
        id: "evt-invite-consumed-1",
        ledgerId,
        eventType: "invite.consumed",
        eventVersion: 1,
        occurredAt: "2026-04-22T12:02:00.000Z",
        actorDeviceId: contributorDeviceId,
        payloadJson: JSON.stringify({
          inviteId: "invite-001",
          participantId: "participant-001",
          contributorDeviceId,
        }),
        sequence: 4,
      },
    ];
  }

  test("APRV-01: contributor create submissions stay pending until organizer review", () => {
    const projection = replayLedger([
      ...baseEvents(),
      {
        id: "evt-submission-create-1",
        ledgerId,
        eventType: "expense.submission-created",
        eventVersion: 1,
        occurredAt: "2026-04-22T12:03:00.000Z",
        actorDeviceId: contributorDeviceId,
        payloadJson: JSON.stringify({
          submissionId: "submission-create-1",
          submissionType: "expense-create",
          submittedByParticipantId: "participant-001",
          proposedExpense: {
            expenseId: "expense-001",
            description: "Taxi",
            currency: "EUR",
            totalAmountMinor: 2400,
            expenseDate: "2026-04-22",
            creatorRole: "contributor",
            payers: [{ participantId: "participant-001", paidAmountMinor: 2400 }],
            split: { mode: "equal", participants: [{ participantId: "participant-001" }] },
          },
        }),
        sequence: 5,
      },
    ]);

    expect(projection.entries).toHaveLength(0);
    expect(projection.pendingSubmissions).toHaveLength(1);
  });

  test("APRV-03/APRV-04: review decisions are explicit and organizer-gated", () => {
    expect(() =>
      replayLedger([
        ...baseEvents(),
        {
          id: "evt-submission-create-1",
          ledgerId,
          eventType: "expense.submission-created",
          eventVersion: 1,
          occurredAt: "2026-04-22T12:03:00.000Z",
          actorDeviceId: contributorDeviceId,
          payloadJson: JSON.stringify({
            submissionId: "submission-create-1",
            submissionType: "expense-create",
            submittedByParticipantId: "participant-001",
            proposedExpense: {
              expenseId: "expense-001",
              description: "Taxi",
              currency: "EUR",
              totalAmountMinor: 2400,
              expenseDate: "2026-04-22",
              creatorRole: "contributor",
              payers: [{ participantId: "participant-001", paidAmountMinor: 2400 }],
              split: { mode: "equal", participants: [{ participantId: "participant-001" }] },
            },
          }),
          sequence: 5,
        },
        {
          id: "evt-submission-reviewed-1",
          ledgerId,
          eventType: "expense.submission-reviewed",
          eventVersion: 1,
          occurredAt: "2026-04-22T12:04:00.000Z",
          actorDeviceId: "device-unknown",
          payloadJson: JSON.stringify({
            submissionId: "submission-create-1",
            decision: "approved",
            reviewReason: "Looks good",
          }),
          sequence: 6,
        },
      ]),
    ).toThrow("Only organizer device can approve contributor submissions");
  });
});
