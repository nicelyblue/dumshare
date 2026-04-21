export type KnownEventType =
  | "ledger.created"
  | "participant.added"
  | "invite.issued"
  | "invite.revoked"
  | "invite.consumed"
  | "expense.created"
  | "expense.note-added";

export type EventType = KnownEventType | string;

export type LedgerCreatedPayload = {
  title: string;
  settlementContext: string;
};

export type ParticipantAddedPayload = {
  participantId: string;
  displayName: string;
};

export type InviteIssuedPayload = {
  inviteId: string;
  participantId: string;
  inviteCode: string;
};

export type InviteRevokedPayload = {
  inviteId: string;
  revokedReason: string;
};

export type InviteConsumedPayload = {
  inviteId: string;
  participantId: string;
  contributorDeviceId: string;
};

export type ExpenseCreatedPayload = {
  expenseId: string;
  description: string;
  currency: string;
  totalAmountMinor: number;
  expenseDate: string;
  creatorRole: "organizer" | "contributor";
  payers: {
    participantId: string;
    paidAmountMinor: number;
  }[];
};

export type EventInput = {
  id: string;
  ledgerId: string;
  eventType: EventType;
  eventVersion: number;
  occurredAt: string;
  actorDeviceId: string;
  payloadJson: string;
};

export type LedgerEvent = EventInput & {
  sequence: number;
};
