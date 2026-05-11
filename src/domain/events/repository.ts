import type { LedgerDb } from "../../data/sqlite/client";
import { and, asc, eq, gt, sql } from "drizzle-orm";

import { events } from "../../data/sqlite/schema";
import type { EventInput, LedgerEvent } from "./types";

export type AppendEventInput = EventInput;
export type StoredEvent = LedgerEvent;

export type EventRepository = {
  appendEvent(input: AppendEventInput): Promise<void>;
  listEventsByLedger(ledgerId: string): Promise<StoredEvent[]>;
  listEventsAfterSequence(ledgerId: string, afterSequence: number): Promise<StoredEvent[]>;
};

function mapRowToStoredEvent(row: typeof events.$inferSelect): StoredEvent {
  return {
    id: row.id,
    ledgerId: row.ledger_id,
    eventType: row.event_type,
    eventVersion: row.event_version,
    occurredAt: row.occurred_at,
    actorDeviceId: row.actor_device_id,
    payloadJson: row.payload_json,
    sequence: row.sequence,
  };
}

export function createEventRepository(db: LedgerDb): EventRepository {
  return {
    async appendEvent(input: AppendEventInput): Promise<void> {
      const [row] = await db.orm
        .select({ nextSequence: sql<number>`COALESCE(MAX(${events.sequence}), 0) + 1` })
        .from(events);
      const nextSequence = row?.nextSequence ?? 1;

      await db.orm.insert(events).values({
        id: input.id,
        ledger_id: input.ledgerId,
        event_type: input.eventType,
        event_version: input.eventVersion,
        occurred_at: input.occurredAt,
        actor_device_id: input.actorDeviceId,
        payload_json: input.payloadJson,
        sequence: nextSequence,
      });
    },

    async listEventsByLedger(ledgerId: string): Promise<StoredEvent[]> {
      const rows = await db.orm
        .select()
        .from(events)
        .where(eq(events.ledger_id, ledgerId))
        .orderBy(asc(events.sequence));

      return rows.map(mapRowToStoredEvent);
    },

    async listEventsAfterSequence(ledgerId: string, afterSequence: number): Promise<StoredEvent[]> {
      if (!Number.isInteger(afterSequence) || afterSequence < 0) {
        throw new Error("afterSequence must be a non-negative integer");
      }

      const rows = await db.orm
        .select()
        .from(events)
        .where(and(eq(events.ledger_id, ledgerId), gt(events.sequence, afterSequence)))
        .orderBy(asc(events.sequence));

      return rows.map(mapRowToStoredEvent);
    },
  };
}
