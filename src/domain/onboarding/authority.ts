import type { LedgerProjection } from "../projections/types";

export function assertOrganizerSyncHub(
  projection: LedgerProjection,
  actorDeviceId: string,
): void {
  if (projection.syncHubDeviceId !== actorDeviceId) {
    throw new Error("Only organizer device can run sync hub actions");
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
