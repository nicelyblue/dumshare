import { describe, expect, test } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

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
