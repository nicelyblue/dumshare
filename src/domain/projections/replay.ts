import type { LedgerEvent } from "../events/types";

import type { LedgerEntry, LedgerProjection } from "./types";

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

export function replayLedger(events: LedgerEvent[]): LedgerProjection {
  const ordered = [...events].sort((left, right) => left.sequence - right.sequence);

  if (ordered.length === 0) {
    return {
      ledgerId: "",
      lastSequence: 0,
      appliedEventIds: [],
      entries: [],
      title: "",
      settlementContext: "",
    };
  }

  const projection: LedgerProjection = {
    ledgerId: ordered[0].ledgerId,
    lastSequence: 0,
    appliedEventIds: [],
    entries: [],
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
        break;
      }
      case "expense.created": {
        projection.entries.push(toLedgerEntry(event));
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
