import type { ExpenseCreatedPayload, ExpenseSplitPayload, LedgerEvent } from "../events/types";

import type { LedgerEntry, LedgerParticipant, LedgerProjection } from "./types";

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

type OwedShare = {
  participantId: string;
  owedAmountMinor: number;
};

function parseSplitPayload(split: unknown): ExpenseSplitPayload {
  const parsed = split as Partial<ExpenseSplitPayload> & { participants?: unknown[] };

  if (
    !parsed ||
    (parsed.mode !== "equal" && parsed.mode !== "exact" && parsed.mode !== "percentage") ||
    !Array.isArray(parsed.participants) ||
    parsed.participants.length === 0
  ) {
    throw new Error("Invalid payload for eventType expense.created");
  }

  if (parsed.mode === "equal") {
    const participants = parsed.participants.map((participant) => participant as { participantId?: unknown });

    if (
      participants.some(
        (participant) =>
          typeof participant.participantId !== "string" || participant.participantId.trim().length === 0,
      )
    ) {
      throw new Error("Invalid payload for eventType expense.created");
    }

    return {
      mode: "equal",
      participants: participants as ExpenseSplitPayload["participants"],
    };
  }

  if (parsed.mode === "exact") {
    const participants = parsed.participants.map(
      (participant) => participant as { participantId?: unknown; owedAmountMinor?: unknown },
    );

    if (
      participants.some(
        (participant) =>
          typeof participant.participantId !== "string" ||
          participant.participantId.trim().length === 0 ||
          typeof participant.owedAmountMinor !== "number" ||
          !Number.isInteger(participant.owedAmountMinor) ||
          participant.owedAmountMinor <= 0,
      )
    ) {
      throw new Error("Invalid payload for eventType expense.created");
    }

    return {
      mode: "exact",
      participants: participants as ExpenseSplitPayload["participants"],
    };
  }

  const participants = parsed.participants.map(
    (participant) => participant as { participantId?: unknown; percentageBps?: unknown },
  );

  if (
    participants.some(
      (participant) =>
        typeof participant.participantId !== "string" ||
        participant.participantId.trim().length === 0 ||
        typeof participant.percentageBps !== "number" ||
        !Number.isInteger(participant.percentageBps) ||
        participant.percentageBps <= 0,
    )
  ) {
    throw new Error("Invalid payload for eventType expense.created");
  }

  return {
    mode: "percentage",
    participants: participants as ExpenseSplitPayload["participants"],
  };
}

function assertSplitParticipantsAreKnownAndUnique(
  split: ExpenseSplitPayload,
  knownParticipantIds: Set<string>,
): void {
  const seen = new Set<string>();

  for (const participant of split.participants) {
    if (seen.has(participant.participantId)) {
      throw new Error("Split participant IDs must be unique");
    }

    seen.add(participant.participantId);

    if (!knownParticipantIds.has(participant.participantId)) {
      throw new Error("Split participant references unknown participant");
    }
  }
}

function deriveEqualShares(totalAmountMinor: number, split: Extract<ExpenseSplitPayload, { mode: "equal" }>): OwedShare[] {
  const baseShare = Math.floor(totalAmountMinor / split.participants.length);
  let remainder = totalAmountMinor - baseShare * split.participants.length;

  return split.participants.map((participant) => {
    const bump = remainder > 0 ? 1 : 0;
    remainder -= bump;

    return {
      participantId: participant.participantId,
      owedAmountMinor: baseShare + bump,
    };
  });
}

function deriveExactShares(totalAmountMinor: number, split: Extract<ExpenseSplitPayload, { mode: "exact" }>): OwedShare[] {
  const exactTotal = split.participants.reduce((acc, participant) => acc + participant.owedAmountMinor, 0);

  if (exactTotal !== totalAmountMinor) {
    throw new Error("Exact split owed amounts must sum to totalAmountMinor");
  }

  return split.participants.map((participant) => ({
    participantId: participant.participantId,
    owedAmountMinor: participant.owedAmountMinor,
  }));
}

function derivePercentageShares(
  totalAmountMinor: number,
  split: Extract<ExpenseSplitPayload, { mode: "percentage" }>,
): OwedShare[] {
  const bpsTotal = split.participants.reduce((acc, participant) => acc + participant.percentageBps, 0);

  if (bpsTotal !== 10000) {
    throw new Error("Percentage split basis points must sum to 10000");
  }

  const rows = split.participants.map((participant, index) => {
    const numerator = totalAmountMinor * participant.percentageBps;
    return {
      participantId: participant.participantId,
      owedAmountMinor: Math.floor(numerator / 10000),
      remainder: numerator % 10000,
      order: index,
    };
  });

  let owedTotal = rows.reduce((acc, row) => acc + row.owedAmountMinor, 0);
  let remainderUnits = totalAmountMinor - owedTotal;

  rows
    .slice()
    .sort((left, right) => right.remainder - left.remainder || left.order - right.order)
    .forEach((row) => {
      if (remainderUnits <= 0) {
        return;
      }

      const target = rows[row.order];
      if (target) {
        target.owedAmountMinor += 1;
        remainderUnits -= 1;
        owedTotal += 1;
      }
    });

  if (owedTotal !== totalAmountMinor) {
    throw new Error("Percentage split owed amounts must sum to totalAmountMinor");
  }

  return rows.map((row) => ({
    participantId: row.participantId,
    owedAmountMinor: row.owedAmountMinor,
  }));
}

function deriveOwedShares(
  totalAmountMinor: number,
  split: ExpenseSplitPayload,
  knownParticipantIds: Set<string>,
): OwedShare[] {
  assertSplitParticipantsAreKnownAndUnique(split, knownParticipantIds);

  if (split.mode === "equal") {
    return deriveEqualShares(totalAmountMinor, split);
  }

  if (split.mode === "exact") {
    return deriveExactShares(totalAmountMinor, split);
  }

  return derivePercentageShares(totalAmountMinor, split);
}

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
  const split = parseSplitPayload(parsed.split);

  const payersAreValid =
    Array.isArray(parsed.payers) &&
    parsed.payers.length > 0 &&
    parsed.payers.every(
      (payer) =>
        typeof payer?.participantId === "string" &&
        payer.participantId.trim().length > 0 &&
        typeof payer.paidAmountMinor === "number" &&
        Number.isInteger(payer.paidAmountMinor) &&
        payer.paidAmountMinor > 0,
    );

  if (
    typeof parsed.expenseId !== "string" ||
    parsed.expenseId.trim().length === 0 ||
    typeof parsed.description !== "string" ||
    parsed.description.trim().length === 0 ||
    typeof parsed.currency !== "string" ||
    parsed.currency.trim().length === 0 ||
    typeof parsed.totalAmountMinor !== "number" ||
    !Number.isInteger(parsed.totalAmountMinor) ||
    parsed.totalAmountMinor <= 0 ||
    typeof parsed.expenseDate !== "string" ||
    parsed.expenseDate.trim().length === 0 ||
    (parsed.creatorRole !== "organizer" && parsed.creatorRole !== "contributor") ||
    !payersAreValid
  ) {
    throw new Error("Invalid payload for eventType expense.created");
  }

  return {
    expenseId: parsed.expenseId,
    description: parsed.description,
    currency: parsed.currency,
    totalAmountMinor: parsed.totalAmountMinor,
    expenseDate: parsed.expenseDate,
    creatorRole: parsed.creatorRole,
    payers: parsed.payers,
    split,
  };
}

function isExpenseCreatorAuthorized(projection: LedgerProjection, actorDeviceId: string): boolean {
  if (actorDeviceId === projection.syncHubDeviceId) {
    return true;
  }

  return Object.values(projection.participantContributorDeviceClaims).includes(actorDeviceId);
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

function toLedgerEntry(event: LedgerEvent, payload: ExpenseCreatedPayload, owedShares: OwedShare[]): LedgerEntry {
  return {
    expenseId: payload.expenseId,
    description: payload.description,
    totalAmountMinor: payload.totalAmountMinor,
    currency: payload.currency,
    expenseDate: payload.expenseDate,
    creatorRole: payload.creatorRole,
    payers: payload.payers,
    split: payload.split,
    owedShares,
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
      pendingSubmissions: [],
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
    pendingSubmissions: [],
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
        const payload = parseExpenseCreatedPayload(event.payloadJson);

        if (!isExpenseCreatorAuthorized(projection, event.actorDeviceId)) {
          throw new Error("Only organizer or a claimed contributor device can create expenses");
        }

        const participantIds = new Set(
          projection.participants.map((participant) => participant.participantId),
        );

        for (const payer of payload.payers) {
          if (!participantIds.has(payer.participantId)) {
            throw new Error("Expense payer references unknown participant");
          }
        }

        const owedShares = deriveOwedShares(
          payload.totalAmountMinor,
          payload.split,
          participantIds,
        );

        projection.entries.push(toLedgerEntry(event, payload, owedShares));
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
