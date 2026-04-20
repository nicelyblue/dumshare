export type KnownEventType =
  | "ledger.created"
  | "expense.created"
  | "expense.note-added";

export type EventType = KnownEventType | string;

export type LedgerCreatedPayload = {
  title: string;
  settlementContext: string;
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
