import type { LedgerDb } from "../../data/sqlite/client";

export type AppendEventInput = {
  id: string;
  ledgerId: string;
  eventType: string;
  eventVersion: number;
  occurredAt: string;
  actorDeviceId: string;
  payloadJson: string;
};

export type StoredEvent = AppendEventInput & {
  sequence: number;
};

export type EventRepository = {
  appendEvent(input: AppendEventInput): Promise<void>;
  listEventsByLedger(ledgerId: string): Promise<StoredEvent[]>;
};

export function createEventRepository(_db: LedgerDb): EventRepository {
  throw new Error("Not implemented");
}
