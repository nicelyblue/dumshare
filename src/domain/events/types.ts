export type EventType = string;

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
