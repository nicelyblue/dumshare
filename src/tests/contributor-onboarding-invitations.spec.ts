import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import type { LedgerEvent } from "../domain/events/types";
import { replayLedger } from "../domain/projections";

describe("contributor-onboarding-invitations contracts", () => {
  test("event contract includes invite lifecycle event names", () => {
    const eventsTypesSource = readFileSync(
      resolve(process.cwd(), "src/domain/events/types.ts"),
      "utf8",
    );

    expect(eventsTypesSource).toContain('"invite.issued"');
    expect(eventsTypesSource).toContain('"invite.revoked"');
    expect(eventsTypesSource).toContain('"invite.consumed"');
  });

  test("event payload contract includes onboarding fields", () => {
    const eventsTypesSource = readFileSync(
      resolve(process.cwd(), "src/domain/events/types.ts"),
      "utf8",
    );

    expect(eventsTypesSource).toContain("inviteId");
    expect(eventsTypesSource).toContain("participantId");
    expect(eventsTypesSource).toContain("inviteCode");
    expect(eventsTypesSource).toContain("revokedReason");
    expect(eventsTypesSource).toContain("contributorDeviceId");
  });

  test("projection contract includes invite and participant claim state", () => {
    const projectionTypesSource = readFileSync(
      resolve(process.cwd(), "src/domain/projections/types.ts"),
      "utf8",
    );

    expect(projectionTypesSource).toContain("issued");
    expect(projectionTypesSource).toContain("revoked");
    expect(projectionTypesSource).toContain("consumed");
    expect(projectionTypesSource).toContain("invites");
    expect(projectionTypesSource).toContain("participantContributorDeviceClaims");
  });
});

describe("contributor-onboarding-invitations replay invariants", () => {
  const ledgerId = "ledger-trip-003";
  const organizerDeviceId = "device-organizer-1";

  function baseLedgerCreatedEvent(): LedgerEvent {
    return {
      id: "evt-ledger-created-1",
      ledgerId,
      eventType: "ledger.created",
      eventVersion: 1,
      occurredAt: "2026-04-21T10:00:00.000Z",
      actorDeviceId: organizerDeviceId,
      payloadJson: JSON.stringify({
        title: "Phase 3 Onboarding",
        settlementContext: "per-currency balances",
      }),
      sequence: 1,
    };
  }

  function inviteIssuedEvent(): LedgerEvent {
    return {
      id: "evt-invite-issued-1",
      ledgerId,
      eventType: "invite.issued",
      eventVersion: 1,
      occurredAt: "2026-04-21T10:01:00.000Z",
      actorDeviceId: organizerDeviceId,
      payloadJson: JSON.stringify({
        inviteId: "invite-001",
        participantId: "participant-001",
        inviteCode: "JOIN-001",
      }),
      sequence: 2,
    };
  }

  function inviteConsumedEvent(actorDeviceId: string, sequence: number): LedgerEvent {
    return {
      id: `evt-invite-consumed-${sequence}`,
      ledgerId,
      eventType: "invite.consumed",
      eventVersion: 1,
      occurredAt: "2026-04-21T10:02:00.000Z",
      actorDeviceId,
      payloadJson: JSON.stringify({
        inviteId: "invite-001",
        participantId: "participant-001",
        contributorDeviceId: actorDeviceId,
      }),
      sequence,
    };
  }

  test("invite.issued then invite.consumed marks invite as consumed once", () => {
    const projection = replayLedger([
      baseLedgerCreatedEvent(),
      inviteIssuedEvent(),
      inviteConsumedEvent("device-contributor-1", 3),
    ]);

    expect(projection.invites).toEqual([
      {
        inviteId: "invite-001",
        participantId: "participant-001",
        inviteCode: "JOIN-001",
        state: "consumed",
        sourceEventId: "evt-invite-issued-1",
        consumedByDeviceId: "device-contributor-1",
      },
    ]);
  });

  test("invite.consumed after invite.revoked is blocked with plain-language message", () => {
    expect(() =>
      replayLedger([
        baseLedgerCreatedEvent(),
        inviteIssuedEvent(),
        {
          id: "evt-invite-revoked-1",
          ledgerId,
          eventType: "invite.revoked",
          eventVersion: 1,
          occurredAt: "2026-04-21T10:01:30.000Z",
          actorDeviceId: organizerDeviceId,
          payloadJson: JSON.stringify({
            inviteId: "invite-001",
            revokedReason: "Organizer canceled",
          }),
          sequence: 3,
        },
        inviteConsumedEvent("device-contributor-1", 4),
      ]),
    ).toThrow(/revoked|request a new code/);
  });

  test("second consume of same invite is deterministically blocked as already used", () => {
    expect(() =>
      replayLedger([
        baseLedgerCreatedEvent(),
        inviteIssuedEvent(),
        inviteConsumedEvent("device-contributor-1", 3),
        inviteConsumedEvent("device-contributor-1", 4),
      ]),
    ).toThrow(/already used|request a new code/);
  });

  test("participant cannot be claimed from second device", () => {
    expect(() =>
      replayLedger([
        baseLedgerCreatedEvent(),
        inviteIssuedEvent(),
        inviteConsumedEvent("device-contributor-1", 3),
        {
          id: "evt-invite-issued-2",
          ledgerId,
          eventType: "invite.issued",
          eventVersion: 1,
          occurredAt: "2026-04-21T10:03:00.000Z",
          actorDeviceId: organizerDeviceId,
          payloadJson: JSON.stringify({
            inviteId: "invite-002",
            participantId: "participant-001",
            inviteCode: "JOIN-002",
          }),
          sequence: 4,
        },
        {
          id: "evt-invite-consumed-5",
          ledgerId,
          eventType: "invite.consumed",
          eventVersion: 1,
          occurredAt: "2026-04-21T10:04:00.000Z",
          actorDeviceId: "device-contributor-2",
          payloadJson: JSON.stringify({
            inviteId: "invite-002",
            participantId: "participant-001",
            contributorDeviceId: "device-contributor-2",
          }),
          sequence: 5,
        },
      ]),
    ).toThrow(/already claimed on another device/);
  });
});
