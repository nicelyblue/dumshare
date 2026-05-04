import { describe, expect, test } from "vitest";

import type { LedgerProjection } from "../domain/projections/types";
import type { LedgerEvent } from "../domain/events/types";
import {
  assertOrganizerApprovalAuthority,
  assertOrganizerSyncHub,
} from "../domain/onboarding/authority";
import { replayLedger } from "../domain/projections";

describe("contributor-authority-policy guards", () => {
  const projection: LedgerProjection = {
    ledgerId: "ledger-trip-003",
    lastSequence: 1,
    appliedEventIds: ["evt-ledger-created-1"],
    entries: [],
    participants: [],
    invites: [],
    participantContributorDeviceClaims: {},
    pendingSubmissions: [],
    reviewedSubmissions: [],
    syncHubDeviceId: "device-organizer-1",
    approvalAuthorityDeviceId: "device-organizer-1",
    title: "Phase 3 Onboarding",
    settlementContext: "per-currency balances",
  };

  test("organizer device passes sync hub authority check", () => {
    expect(() => assertOrganizerSyncHub(projection, "device-organizer-1")).not.toThrow();
  });

  test("non-organizer device is rejected for sync hub authority", () => {
    expect(() => assertOrganizerSyncHub(projection, "device-contributor-1")).toThrow(
      "Only organizer device can run sync hub actions",
    );
  });

  test("organizer device passes approval authority check", () => {
    expect(() =>
      assertOrganizerApprovalAuthority(projection, "device-organizer-1"),
    ).not.toThrow();
  });

  test("non-organizer device is rejected for approval authority", () => {
    expect(() =>
      assertOrganizerApprovalAuthority(projection, "device-contributor-1"),
    ).toThrow("Only organizer device can approve contributor submissions");
  });

  test("guards accept replay-derived organizer authority and reject non-organizer", () => {
    const events: LedgerEvent[] = [
      {
        id: "evt-ledger-created-1",
        ledgerId: "ledger-trip-003",
        eventType: "ledger.created",
        eventVersion: 1,
        occurredAt: "2026-04-21T11:00:00.000Z",
        actorDeviceId: "device-organizer-1",
        payloadJson: JSON.stringify({
          title: "Phase 3 Onboarding",
          settlementContext: "per-currency balances",
        }),
        sequence: 1,
      },
      {
        id: "evt-participant-added-1",
        ledgerId: "ledger-trip-003",
        eventType: "participant.added",
        eventVersion: 1,
        occurredAt: "2026-04-21T11:01:00.000Z",
        actorDeviceId: "device-organizer-1",
        payloadJson: JSON.stringify({
          participantId: "participant-001",
          displayName: "Alice",
        }),
        sequence: 2,
      },
    ];

    const replayProjection = replayLedger(events);

    expect(() => assertOrganizerSyncHub(replayProjection, "device-organizer-1")).not.toThrow();
    expect(() =>
      assertOrganizerApprovalAuthority(replayProjection, "device-organizer-1"),
    ).not.toThrow();

    expect(() => assertOrganizerSyncHub(replayProjection, "device-contributor-1")).toThrow(
      "Only organizer device can run sync hub actions",
    );
    expect(() =>
      assertOrganizerApprovalAuthority(replayProjection, "device-contributor-1"),
    ).toThrow("Only organizer device can approve contributor submissions");
  });
});
