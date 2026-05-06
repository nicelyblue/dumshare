export type KnownEventType =
  | "ledger.created"
  | "participant.added"
  | "participant.renamed"
  | "participant.removed"
  | "invite.issued"
  | "invite.revoked"
  | "invite.consumed"
  | "expense.created"
  | "expense.submission-created"
  | "expense.submission-reviewed"
  | "expense.amendment-submitted"
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

export type ParticipantRenamedPayload = {
  participantId: string;
  displayName: string;
};

export type ParticipantRemovedPayload = {
  participantId: string;
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
  split: ExpenseSplitPayload;
};

export type EqualSplitParticipant = {
  participantId: string;
};

export type ExactSplitParticipant = {
  participantId: string;
  owedAmountMinor: number;
};

export type PercentageSplitParticipant = {
  participantId: string;
  percentageBps: number;
};

export type EqualSplitPayload = {
  mode: "equal";
  participants: EqualSplitParticipant[];
};

export type ExactSplitPayload = {
  mode: "exact";
  participants: ExactSplitParticipant[];
};

export type PercentageSplitPayload = {
  mode: "percentage";
  participants: PercentageSplitParticipant[];
};

export type ExpenseSplitPayload =
  | EqualSplitPayload
  | ExactSplitPayload
  | PercentageSplitPayload;

export type ExpenseAmendmentSubmittedPayload = {
  amendmentId: string;
  targetExpenseId: string;
  reason: string;
  proposedExpense: ExpenseCreatedPayload;
};

export type ExpenseSubmissionCreatedPayload = {
  submissionId: string;
  submissionType: "expense-create" | "expense-amendment";
  submittedByParticipantId: string;
  proposedExpense: ExpenseCreatedPayload;
  targetExpenseId?: string;
  reason?: string;
};

export type ExpenseSubmissionReviewedPayload = {
  submissionId: string;
  decision: "approved" | "rejected";
  reviewReason: string;
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
