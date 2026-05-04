import type {
  ExpenseCreatedPayload,
  ExpenseSplitPayload,
} from "../events/types";

export type LedgerEntry = {
  expenseId: string;
  description: string;
  totalAmountMinor: number;
  currency: string;
  expenseDate: string;
  creatorRole: "organizer" | "contributor";
  payers: {
    participantId: string;
    paidAmountMinor: number;
  }[];
  split: ExpenseSplitPayload;
  owedShares: {
    participantId: string;
    owedAmountMinor: number;
  }[];
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
  pendingSubmissions: ({
    submissionType: "expense-create";
    submissionId: string;
    submittedByParticipantId: string;
    proposedExpense: ExpenseCreatedPayload;
    submittedAt: string;
    submittedByDeviceId: string;
    sourceEventId: string;
  } | {
    submissionType: "expense-amendment";
    submissionId: string;
    submittedByParticipantId: string;
    targetExpenseId: string;
    reason: string;
    proposedExpense: ExpenseCreatedPayload;
    submittedAt: string;
    submittedByDeviceId: string;
    sourceEventId: string;
  })[];
  reviewedSubmissions: {
    submissionId: string;
    decision: "approved" | "rejected";
    reviewedAt: string;
    reviewedByDeviceId: string;
    sourceEventId: string;
    reviewReason: string;
  }[];
  syncHubDeviceId: string;
  approvalAuthorityDeviceId: string;
  title: string;
  settlementContext: string;
};
