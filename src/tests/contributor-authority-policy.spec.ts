import { describe, expect, test } from "vitest";

import type { LedgerProjection } from "../domain/projections/types";
import {
  assertOrganizerApprovalAuthority,
  assertOrganizerSyncHub,
} from "../domain/onboarding/authority";

describe("contributor-authority-policy guards", () => {
  const projection: LedgerProjection = {
    ledgerId: "ledger-trip-003",
    lastSequence: 1,
    appliedEventIds: ["evt-ledger-created-1"],
    entries: [],
    participants: [],
    invites: [],
    participantContributorDeviceClaims: {},
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
});
