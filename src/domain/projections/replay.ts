import type {
  EqualSplitParticipant,
  ExactSplitParticipant,
  ExpenseCreatedPayload,
  ExpenseSplitPayload,
  PercentageSplitParticipant,
  LedgerEvent,
} from "../events/types";

import type { LedgerEntry, LedgerParticipant, LedgerProjection } from "./types";

type LedgerCreatedPayload = {
  title: string;
  organizerParticipantId?: string;
  organizerName?: string;
};

type ParticipantAddedPayload = {
  participantId: string;
  displayName: string;
};

type ParticipantRenamedPayload = {
  participantId: string;
  displayName: string;
};

type ParticipantRemovedPayload = {
  participantId: string;
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

function parseExpenseCreatedPayloadObject(parsed: Partial<ExpenseCreatedPayload>): ExpenseCreatedPayload {
  const split = parseSplitPayload(parsed.split);
  const payers = parsed.payers;

  const payersAreValid =
    Array.isArray(payers) &&
    payers.length > 0 &&
    payers.every(
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
    payers,
    split,
  };
}

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
    const participants: EqualSplitParticipant[] = parsed.participants.map((participant) =>
      participant as EqualSplitParticipant,
    );

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
      participants,
    };
  }

  if (parsed.mode === "exact") {
    const participants: ExactSplitParticipant[] = parsed.participants.map((participant) =>
      participant as ExactSplitParticipant,
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
      participants,
    };
  }

  const participants: PercentageSplitParticipant[] = parsed.participants.map((participant) =>
    participant as PercentageSplitParticipant,
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
    participants,
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

  if (typeof parsed.title !== "string" || parsed.title.trim().length === 0) {
    throw new Error("Invalid payload for eventType ledger.created");
  }

  return {
    title: parsed.title.trim(),
  };
}

function parseExpenseCreatedPayload(payloadJson: string): ExpenseCreatedPayload {
  const parsed = JSON.parse(payloadJson) as Partial<ExpenseCreatedPayload>;
  return parseExpenseCreatedPayloadObject(parsed);
}

function parseExpenseAmendmentSubmittedPayload(
  payloadJson: string,
): ExpenseAmendmentSubmittedPayload {
  const parsed = JSON.parse(payloadJson) as Partial<ExpenseAmendmentSubmittedPayload>;

  if (
    typeof parsed.amendmentId !== "string" ||
    parsed.amendmentId.trim().length === 0 ||
    typeof parsed.targetExpenseId !== "string" ||
    parsed.targetExpenseId.trim().length === 0 ||
    typeof parsed.reason !== "string" ||
    parsed.reason.trim().length === 0 ||
    typeof parsed.proposedExpense !== "object" ||
    parsed.proposedExpense === null
  ) {
    throw new Error("Invalid payload for eventType expense.amendment-submitted");
  }

  let proposedExpense: ExpenseCreatedPayload;
  try {
    proposedExpense = parseExpenseCreatedPayloadObject(
      parsed.proposedExpense as Partial<ExpenseCreatedPayload>,
    );
  } catch {
    throw new Error("Invalid payload for eventType expense.amendment-submitted");
  }

  return {
    amendmentId: parsed.amendmentId,
    targetExpenseId: parsed.targetExpenseId,
    reason: parsed.reason,
    proposedExpense,
  };
}

function parseExpenseDeletedPayload(payloadJson: string): { expenseId: string } {
  const parsed = JSON.parse(payloadJson) as Partial<{ expenseId: string }>;

  if (typeof parsed.expenseId !== "string" || parsed.expenseId.trim().length === 0) {
    throw new Error("Invalid payload for eventType expense.deleted");
  }

  return {
    expenseId: parsed.expenseId,
  };
}

function isExpenseCreatorAuthorized(projection: LedgerProjection, actorDeviceId: string): boolean {
  if (actorDeviceId === projection.organizerDeviceId) {
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

function parseParticipantRenamedPayload(payloadJson: string): ParticipantRenamedPayload {
  const parsed = JSON.parse(payloadJson) as Partial<ParticipantRenamedPayload>;

  if (
    typeof parsed.participantId !== "string" ||
    parsed.participantId.trim().length === 0 ||
    typeof parsed.displayName !== "string" ||
    parsed.displayName.trim().length === 0
  ) {
    throw new Error("Invalid payload for eventType participant.renamed");
  }

  return {
    participantId: parsed.participantId,
    displayName: parsed.displayName,
  };
}

function parseParticipantRemovedPayload(payloadJson: string): ParticipantRemovedPayload {
  const parsed = JSON.parse(payloadJson) as Partial<ParticipantRemovedPayload>;

  if (typeof parsed.participantId !== "string" || parsed.participantId.trim().length === 0) {
    throw new Error("Invalid payload for eventType participant.removed");
  }

  return {
    participantId: parsed.participantId,
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
      organizerDeviceId: "",
      title: "",
      organizerParticipantId: "",
      organizerName: "",
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
    organizerDeviceId: "",
    title: "",
    organizerParticipantId: "",
    organizerName: "",
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
        projection.organizerParticipantId = payload.organizerParticipantId ?? projection.organizerParticipantId;
        projection.organizerName = payload.organizerName ?? projection.organizerName;
        projection.organizerDeviceId = event.actorDeviceId;
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
      case "expense.deleted": {
        const payload = parseExpenseDeletedPayload(event.payloadJson);
        
        const entryIndex = projection.entries.findIndex(
          (entry) => entry.expenseId === payload.expenseId,
        );

        if (entryIndex === -1) {
          throw new Error("Expense not found for deletion");
        }

        projection.entries.splice(entryIndex, 1);
        break;
      }
      case "participant.added": {
        projection.participants.push(toLedgerParticipant(event));
        break;
      }
      case "participant.renamed": {
        const payload = parseParticipantRenamedPayload(event.payloadJson);
        const participant = projection.participants.find(
          (candidate) => candidate.participantId === payload.participantId,
        );

        if (!participant) {
          throw new Error("Participant rename references unknown participant");
        }

        participant.displayName = payload.displayName;
        participant.sourceEventId = event.id;
        break;
      }
      case "participant.removed": {
        const payload = parseParticipantRemovedPayload(event.payloadJson);
        const participantIndex = projection.participants.findIndex(
          (candidate) => candidate.participantId === payload.participantId,
        );

        if (participantIndex === -1) {
          throw new Error("Participant removal references unknown participant");
        }

        if (
          payload.participantId === projection.organizerParticipantId ||
          projection.entries.some((entry) =>
            entry.payers.some((payer) => payer.participantId === payload.participantId),
          ) ||
          projection.entries.some((entry) =>
            entry.owedShares.some((share) => share.participantId === payload.participantId),
          ) ||
          projection.invites.some((invite) => invite.participantId === payload.participantId) ||
          Boolean(projection.participantContributorDeviceClaims[payload.participantId])
        ) {
          throw new Error("Participant removal is blocked by existing ledger activity");
        }

        projection.participants.splice(participantIndex, 1);
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
        // Ignore unknown or deprecated event types
        // This handles legacy events like expense.submission-created, expense.submission-reviewed, etc.
        break;
    }

    projection.lastSequence = event.sequence;
    projection.appliedEventIds.push(event.id);
  }

  return projection;
}
