import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { LedgerEvent } from "../domain/events/types";
import { replayLedger } from "../domain/projections";

describe("contributor amendment contracts", () => {
  test("EXPS-07: event contracts include amendment submission payload and event type", () => {
    const eventsTypesSource = readFileSync(resolve(process.cwd(), "src/domain/events/types.ts"), "utf8");

    expect(eventsTypesSource).toContain('"expense.amendment-submitted"');
    expect(eventsTypesSource).toContain("ExpenseAmendmentSubmittedPayload");
    expect(eventsTypesSource).toContain("amendmentId");
    expect(eventsTypesSource).toContain("targetExpenseId");
    expect(eventsTypesSource).toContain("proposedExpense");
  });

  test("projection contracts include pending contributor submissions queue", () => {
    const projectionTypesSource = readFileSync(
      resolve(process.cwd(), "src/domain/projections/types.ts"),
      "utf8",
    );

    expect(projectionTypesSource).toContain("pendingSubmissions");
    expect(projectionTypesSource).toContain("expense-amendment");
  });
});

describe("contributor amendment replay invariants", () => {
  const ledgerId = "ledger-trip-005";
  const organizerDeviceId = "device-organizer-1";
  const contributorDeviceId = "device-contributor-1";

  function setupEvents(): LedgerEvent[] {
    return [
      {
        id: "evt-ledger-created-1",
        ledgerId,
        eventType: "ledger.created",
        eventVersion: 1,
        occurredAt: "2026-04-22T10:00:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          title: "Phase 5 Amendments",
          settlementContext: "per-currency balances",
        }),
        sequence: 1,
      },
      {
        id: "evt-participant-added-1",
        ledgerId,
        eventType: "participant.added",
        eventVersion: 1,
        occurredAt: "2026-04-22T10:01:00.000Z",
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
        occurredAt: "2026-04-22T10:01:30.000Z",
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
        occurredAt: "2026-04-22T10:02:00.000Z",
        actorDeviceId: contributorDeviceId,
        payloadJson: JSON.stringify({
          inviteId: "invite-001",
          participantId: "participant-001",
          contributorDeviceId,
        }),
        sequence: 4,
      },
      {
        id: "evt-expense-created-1",
        ledgerId,
        eventType: "expense.created",
        eventVersion: 1,
        occurredAt: "2026-04-22T10:03:00.000Z",
        actorDeviceId: organizerDeviceId,
        payloadJson: JSON.stringify({
          expenseId: "expense-001",
          description: "Dinner",
          currency: "EUR",
          totalAmountMinor: 9000,
          expenseDate: "2026-04-22",
          creatorRole: "organizer",
          payers: [{ participantId: "participant-001", paidAmountMinor: 9000 }],
          split: {
            mode: "equal",
            participants: [{ participantId: "participant-001" }],
          },
        }),
        sequence: 5,
      },
    ];
  }

  function amendmentSubmissionEvent(
    actorDeviceId: string,
    sequence: number,
    targetExpenseId = "expense-001",
  ): LedgerEvent {
    return {
      id: `evt-amendment-${sequence}`,
      ledgerId,
      eventType: "expense.amendment-submitted",
      eventVersion: 1,
      occurredAt: "2026-04-22T10:04:00.000Z",
      actorDeviceId,
      payloadJson: JSON.stringify({
        amendmentId: `amendment-${sequence}`,
        targetExpenseId,
        reason: "Split correction",
        proposedExpense: {
          expenseId: "expense-001",
          description: "Dinner (corrected)",
          currency: "EUR",
          totalAmountMinor: 9000,
          expenseDate: "2026-04-22",
          creatorRole: "contributor",
          payers: [{ participantId: "participant-001", paidAmountMinor: 9000 }],
          split: {
            mode: "equal",
            participants: [{ participantId: "participant-001" }],
          },
        },
      }),
      sequence,
    };
  }

  function reviewEvent(
    submissionId: string,
    decision: "approved" | "rejected",
    sequence: number,
    actorDeviceId = organizerDeviceId,
  ): LedgerEvent {
    return {
      id: `evt-review-${sequence}`,
      ledgerId,
      eventType: "expense.submission-reviewed",
      eventVersion: 1,
      occurredAt: "2026-04-22T10:05:00.000Z",
      actorDeviceId,
      payloadJson: JSON.stringify({
        submissionId,
        decision,
        reviewReason: decision === "approved" ? "valid amendment" : "insufficient detail",
      }),
      sequence,
    };
  }

  test("claimed contributor submits amendment into pending queue without mutating approved entries", () => {
    const projection = replayLedger([...setupEvents(), amendmentSubmissionEvent(contributorDeviceId, 6)]);

    expect(projection.entries).toHaveLength(1);
    expect(projection.entries[0]?.description).toBe("Dinner");
    expect(projection.pendingSubmissions).toHaveLength(1);
    expect(projection.pendingSubmissions[0]).toMatchObject({
      submissionType: "expense-amendment",
      targetExpenseId: "expense-001",
      submittedByDeviceId: contributorDeviceId,
    });
  });

  test("unclaimed contributor device cannot submit amendment", () => {
    expect(() => replayLedger([...setupEvents(), amendmentSubmissionEvent("device-unknown-9", 6)])).toThrow(
      "Only claimed contributor devices can submit expense amendments",
    );
  });

  test("unknown amendment target expense is rejected", () => {
    expect(() =>
      replayLedger([
        ...setupEvents(),
        amendmentSubmissionEvent(contributorDeviceId, 6, "expense-404"),
      ]),
    ).toThrow("Expense amendment target references unknown expense");
  });

  test("APRV-05: rejected amendment review keeps approved entries unchanged", () => {
    const projection = replayLedger([
      ...setupEvents(),
      amendmentSubmissionEvent(contributorDeviceId, 6),
      reviewEvent("amendment-6", "rejected", 7),
    ]);

    expect(projection.entries).toHaveLength(1);
    expect(projection.entries[0]?.description).toBe("Dinner");
    expect(projection.pendingSubmissions).toHaveLength(0);
    expect(projection.reviewedSubmissions[0]).toMatchObject({
      submissionId: "amendment-6",
      decision: "rejected",
      reviewedByDeviceId: organizerDeviceId,
    });
  });

  test("APRV-05: approved amendment review applies proposed expense deterministically", () => {
    const projection = replayLedger([
      ...setupEvents(),
      amendmentSubmissionEvent(contributorDeviceId, 6),
      reviewEvent("amendment-6", "approved", 7),
    ]);

    expect(projection.entries).toHaveLength(1);
    expect(projection.entries[0]).toMatchObject({
      expenseId: "expense-001",
      description: "Dinner (corrected)",
      createdByDeviceId: contributorDeviceId,
    });
    expect(projection.pendingSubmissions).toHaveLength(0);
    expect(projection.reviewedSubmissions[0]?.decision).toBe("approved");
  });
});
