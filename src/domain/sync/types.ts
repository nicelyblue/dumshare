export type SyncRequestQrPayload = {
  ledgerId: string;
  requesterDeviceId: string;
  lastSeenSequence: number;
  requestedAt: string;
  nonce: string;
};

export type SyncSessionDescriptor = {
  sessionId: string;
  ledgerId: string;
  organizerDeviceId: string;
  contributorDeviceId: string;
  contributorCheckpoint: number;
};

export type SyncStatusMessage = {
  text: string;
};
