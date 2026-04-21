export type LedgerEntry = {
  expenseId: string;
  description: string;
  amountMinor: number;
  currency: string;
  createdAt: string;
  createdByDeviceId: string;
  sourceEventId: string;
};

export type LedgerParticipant = {
  participantId: string;
  displayName: string;
  sourceEventId: string;
};

export type InviteState = "issued" | "revoked" | "consumed";

export type LedgerInvite = {
  inviteId: string;
  participantId: string;
  inviteCode: string;
  state: InviteState;
  sourceEventId: string;
  revokedReason?: string;
  consumedByDeviceId?: string;
};

export type LedgerProjection = {
  ledgerId: string;
  lastSequence: number;
  appliedEventIds: string[];
  entries: LedgerEntry[];
  participants: LedgerParticipant[];
  invites: LedgerInvite[];
  participantContributorDeviceClaims: Record<string, string>;
  syncHubDeviceId: string;
  approvalAuthorityDeviceId: string;
  title: string;
  settlementContext: string;
};
