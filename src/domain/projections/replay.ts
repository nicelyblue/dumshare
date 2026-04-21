import type { LedgerEvent } from "../events/types";

import type { LedgerEntry, LedgerParticipant, LedgerProjection } from "./types";

type ExpenseCreatedPayload = {
  expenseId: string;
  description: string;
  amountMinor: number;
  currency: string;
};

type LedgerCreatedPayload = {
  title: string;
  settlementContext: string;
};

type ParticipantAddedPayload = {
  participantId: string;
  displayName: string;
};

type InviteIssuedPayload = {
  inviteId: string;
  participantId: string;
  inviteCode: string;
};

type InviteRevokedPayload = {
  inviteId: string;
  revokedReason: string;
};

type InviteConsumedPayload = {
  inviteId: string;
  participantId: string;
  contributorDeviceId: string;
};

function parseLedgerCreatedPayload(payloadJson: string): LedgerCreatedPayload {
  const parsed = JSON.parse(payloadJson) as Partial<LedgerCreatedPayload>;

  if (
    typeof parsed.title !== "string" ||
    parsed.title.trim().length === 0 ||
    typeof parsed.settlementContext !== "string" ||
    parsed.settlementContext.trim().length === 0
  ) {
    throw new Error("Invalid payload for eventType ledger.created");
  }

  return {
    title: parsed.title,
    settlementContext: parsed.settlementContext,
  };
}

function parseExpenseCreatedPayload(payloadJson: string): ExpenseCreatedPayload {
  const parsed = JSON.parse(payloadJson) as Partial<ExpenseCreatedPayload>;

  if (
    typeof parsed.expenseId !== "string" ||
    typeof parsed.description !== "string" ||
    typeof parsed.amountMinor !== "number" ||
    typeof parsed.currency !== "string"
  ) {
    throw new Error("Invalid payload for eventType expense.created");
  }

  return {
    expenseId: parsed.expenseId,
    description: parsed.description,
    amountMinor: parsed.amountMinor,
    currency: parsed.currency,
  };
}

function parseParticipantAddedPayload(payloadJson: string): ParticipantAddedPayload {
  const parsed = JSON.parse(payloadJson) as Partial<ParticipantAddedPayload>;

  if (
    typeof parsed.participantId !== "string" ||
    parsed.participantId.trim().length === 0 ||
    typeof parsed.displayName !== "string" ||
    parsed.displayName.trim().length === 0
  ) {
    throw new Error("Invalid payload for eventType participant.added");
  }

  return {
    participantId: parsed.participantId,
    displayName: parsed.displayName,
  };
}

function parseInviteIssuedPayload(payloadJson: string): InviteIssuedPayload {
  const parsed = JSON.parse(payloadJson) as Partial<InviteIssuedPayload>;

  if (
    typeof parsed.inviteId !== "string" ||
    parsed.inviteId.trim().length === 0 ||
    typeof parsed.participantId !== "string" ||
    parsed.participantId.trim().length === 0 ||
    typeof parsed.inviteCode !== "string" ||
    parsed.inviteCode.trim().length === 0
  ) {
    throw new Error("Invalid payload for eventType invite.issued");
  }

  return {
    inviteId: parsed.inviteId,
    participantId: parsed.participantId,
    inviteCode: parsed.inviteCode,
  };
}

function parseInviteRevokedPayload(payloadJson: string): InviteRevokedPayload {
  const parsed = JSON.parse(payloadJson) as Partial<InviteRevokedPayload>;

  if (
    typeof parsed.inviteId !== "string" ||
    parsed.inviteId.trim().length === 0 ||
    typeof parsed.revokedReason !== "string" ||
    parsed.revokedReason.trim().length === 0
  ) {
    throw new Error("Invalid payload for eventType invite.revoked");
  }

  return {
    inviteId: parsed.inviteId,
    revokedReason: parsed.revokedReason,
  };
}

function parseInviteConsumedPayload(payloadJson: string): InviteConsumedPayload {
  const parsed = JSON.parse(payloadJson) as Partial<InviteConsumedPayload>;

  if (
    typeof parsed.inviteId !== "string" ||
    parsed.inviteId.trim().length === 0 ||
    typeof parsed.participantId !== "string" ||
    parsed.participantId.trim().length === 0 ||
    typeof parsed.contributorDeviceId !== "string" ||
    parsed.contributorDeviceId.trim().length === 0
  ) {
    throw new Error("Invalid payload for eventType invite.consumed");
  }

  return {
    inviteId: parsed.inviteId,
    participantId: parsed.participantId,
    contributorDeviceId: parsed.contributorDeviceId,
  };
}

function toLedgerEntry(event: LedgerEvent): LedgerEntry {
  const payload = parseExpenseCreatedPayload(event.payloadJson);

  return {
    expenseId: payload.expenseId,
    description: payload.description,
    amountMinor: payload.amountMinor,
    currency: payload.currency,
    createdAt: event.occurredAt,
    createdByDeviceId: event.actorDeviceId,
    sourceEventId: event.id,
  };
}

function toLedgerParticipant(event: LedgerEvent): LedgerParticipant {
  const payload = parseParticipantAddedPayload(event.payloadJson);

  return {
    participantId: payload.participantId,
    displayName: payload.displayName,
    sourceEventId: event.id,
  };
}

export function replayLedger(events: LedgerEvent[]): LedgerProjection {
  const ordered = [...events].sort((left, right) => left.sequence - right.sequence);

  if (ordered.length === 0) {
    return {
      ledgerId: "",
      lastSequence: 0,
      appliedEventIds: [],
      entries: [],
      participants: [],
      invites: [],
      participantContributorDeviceClaims: {},
      syncHubDeviceId: "",
      approvalAuthorityDeviceId: "",
      title: "",
      settlementContext: "",
    };
  }

  const projection: LedgerProjection = {
    ledgerId: ordered[0].ledgerId,
    lastSequence: 0,
    appliedEventIds: [],
    entries: [],
    participants: [],
    invites: [],
    participantContributorDeviceClaims: {},
    syncHubDeviceId: "",
    approvalAuthorityDeviceId: "",
    title: "",
    settlementContext: "",
  };

  for (const event of ordered) {
    if (event.ledgerId !== projection.ledgerId) {
      throw new Error(
        `Mismatched ledgerId during replay: expected ${projection.ledgerId}, received ${event.ledgerId}`,
      );
    }

    switch (event.eventType) {
      case "ledger.created": {
        const payload = parseLedgerCreatedPayload(event.payloadJson);
        projection.title = payload.title;
        projection.settlementContext = payload.settlementContext;
        projection.syncHubDeviceId = event.actorDeviceId;
        projection.approvalAuthorityDeviceId = event.actorDeviceId;
        break;
      }
      case "expense.created": {
        projection.entries.push(toLedgerEntry(event));
        break;
      }
      case "participant.added": {
        projection.participants.push(toLedgerParticipant(event));
        break;
      }
      case "invite.issued": {
        const payload = parseInviteIssuedPayload(event.payloadJson);

        projection.invites.push({
          inviteId: payload.inviteId,
          participantId: payload.participantId,
          inviteCode: payload.inviteCode,
          state: "issued",
          sourceEventId: event.id,
        });
        break;
      }
      case "invite.revoked": {
        const payload = parseInviteRevokedPayload(event.payloadJson);
        const invite = projection.invites.find((candidate) => candidate.inviteId === payload.inviteId);

        if (!invite) {
          throw new Error(`Invalid invite lifecycle: invite ${payload.inviteId} not found for revoke`);
        }

        if (invite.state === "consumed") {
          throw new Error("This invitation was already used; request a new code from organizer.");
        }

        invite.state = "revoked";
        invite.revokedReason = payload.revokedReason;
        break;
      }
      case "invite.consumed": {
        const payload = parseInviteConsumedPayload(event.payloadJson);
        const invite = projection.invites.find((candidate) => candidate.inviteId === payload.inviteId);

        if (!invite) {
          throw new Error(`Invalid invite lifecycle: invite ${payload.inviteId} not found for consume`);
        }

        if (invite.participantId !== payload.participantId) {
          throw new Error("Invalid invite lifecycle: invite participant mismatch");
        }

        if (invite.state === "revoked") {
          throw new Error("This invitation was revoked; request a new code from organizer.");
        }

        if (invite.state === "consumed") {
          throw new Error("This invitation was already used; request a new code from organizer.");
        }

        const claimedDeviceId =
          projection.participantContributorDeviceClaims[payload.participantId];

        if (claimedDeviceId && claimedDeviceId !== payload.contributorDeviceId) {
          throw new Error(
            "This participant is already claimed on another device. Ask organizer for help.",
          );
        }

        invite.state = "consumed";
        invite.consumedByDeviceId = payload.contributorDeviceId;
        projection.participantContributorDeviceClaims[payload.participantId] =
          payload.contributorDeviceId;
        break;
      }
      default:
        throw new Error(`Unsupported eventType: ${event.eventType}`);
    }

    projection.lastSequence = event.sequence;
    projection.appliedEventIds.push(event.id);
  }

  return projection;
}
