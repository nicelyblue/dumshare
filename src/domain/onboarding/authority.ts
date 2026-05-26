import type { LedgerProjection } from "../projections/types";

export function assertOrganizerLedgerAuthority(
  projection: LedgerProjection,
  actorDeviceId: string,
): void {
  if (projection.organizerDeviceId !== actorDeviceId) {
    throw new Error("Only organizer device can run organizer-only actions");
  }
}

export function assertOrganizerApprovalAuthority(
  projection: LedgerProjection,
  actorDeviceId: string,
): void {
  if (projection.approvalAuthorityDeviceId !== actorDeviceId) {
    throw new Error("Only organizer device can approve contributor submissions");
  }
}
