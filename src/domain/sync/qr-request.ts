import type { SyncRequestQrPayload } from "./types";

function asNonEmptyString(value: unknown, fieldName: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`Sync request QR payload must include non-empty ${fieldName}`);
  }

  return value;
}

function asNonNegativeInteger(value: unknown, fieldName: string): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    throw new Error(`Sync request QR payload must include non-negative integer ${fieldName}`);
  }

  return value;
}

export function encodeSyncRequestQr(payload: SyncRequestQrPayload): string {
  return JSON.stringify(payload);
}

export function decodeSyncRequestQr(raw: string): SyncRequestQrPayload {
  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Sync request QR payload must be valid JSON");
  }

  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("Sync request QR payload must be a JSON object");
  }

  const candidate = parsed as Record<string, unknown>;

  return {
    ledgerId: asNonEmptyString(candidate.ledgerId, "ledgerId"),
    requesterDeviceId: asNonEmptyString(candidate.requesterDeviceId, "requesterDeviceId"),
    lastSeenSequence: asNonNegativeInteger(candidate.lastSeenSequence, "lastSeenSequence"),
    requestedAt: asNonEmptyString(candidate.requestedAt, "requestedAt"),
    nonce: asNonEmptyString(candidate.nonce, "nonce"),
  };
}
