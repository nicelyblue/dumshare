import { assertOrganizerSyncHub } from "../onboarding/authority";
import type { LedgerProjection } from "../projections/types";

import type { SyncRequestQrPayload, SyncSessionDescriptor } from "./types";

function sanitizeSessionPart(value: string): string {
  return value.replace(/[^a-zA-Z0-9-]/g, "-");
}

export function establishSyncSession(
  projection: LedgerProjection,
  organizerActorDeviceId: string,
  request: SyncRequestQrPayload,
): SyncSessionDescriptor {
  assertOrganizerSyncHub(projection, organizerActorDeviceId);

  if (projection.ledgerId !== request.ledgerId) {
    throw new Error("Sync request ledgerId does not match organizer ledger");
  }

  const sessionId = `sync-session-${sanitizeSessionPart(request.ledgerId)}-${sanitizeSessionPart(request.nonce)}`;

  return {
    sessionId,
    ledgerId: request.ledgerId,
    organizerDeviceId: organizerActorDeviceId,
    contributorDeviceId: request.requesterDeviceId,
    contributorCheckpoint: request.lastSeenSequence,
  };
}
