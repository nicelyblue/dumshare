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
  split: {
    mode: "equal" | "exact" | "percentage";
    participants: {
      participantId: string;
      owedAmountMinor?: number;
      percentageBps?: number;
    }[];
  };
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
  pendingSubmissions: {
    submissionType: "expense-amendment";
    amendmentId: string;
    targetExpenseId: string;
    reason: string;
    proposedExpense: {
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
      split: {
        mode: "equal" | "exact" | "percentage";
        participants: {
          participantId: string;
          owedAmountMinor?: number;
          percentageBps?: number;
        }[];
      };
    };
    submittedAt: string;
    submittedByDeviceId: string;
    sourceEventId: string;
  }[];
  syncHubDeviceId: string;
  approvalAuthorityDeviceId: string;
  title: string;
  settlementContext: string;
};
