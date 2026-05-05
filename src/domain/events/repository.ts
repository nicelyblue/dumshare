import type { LedgerDb } from "../../data/sqlite/client";
import { and, asc, eq, gt, sql } from "drizzle-orm";

import { events, syncCheckpoints } from "../../data/sqlite/schema";
import type { EventInput, LedgerEvent } from "./types";

export type AppendEventInput = EventInput;
export type StoredEvent = LedgerEvent;

export type EventRepository = {
  appendEvent(input: AppendEventInput): Promise<void>;
  listEventsByLedger(ledgerId: string): Promise<StoredEvent[]>;
  listEventsAfterSequence(ledgerId: string, afterSequence: number): Promise<StoredEvent[]>;
  getSyncCheckpoint(peerId: string): Promise<number>;
  setSyncCheckpoint(peerId: string, lastSequence: number): Promise<void>;
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

    async getSyncCheckpoint(peerId: string): Promise<number> {
      const rows = await db.orm
        .select({ lastSequence: syncCheckpoints.last_sequence })
        .from(syncCheckpoints)
        .where(eq(syncCheckpoints.peer_id, peerId));

      return rows[0]?.lastSequence ?? 0;
    },

    async setSyncCheckpoint(peerId: string, lastSequence: number): Promise<void> {
      if (!Number.isInteger(lastSequence) || lastSequence < 0) {
        throw new Error("lastSequence must be a non-negative integer");
      }

      await db.orm
        .insert(syncCheckpoints)
        .values({
          peer_id: peerId,
          last_sequence: lastSequence,
        })
        .onConflictDoUpdate({
          target: syncCheckpoints.peer_id,
          set: {
            last_sequence: lastSequence,
          },
        });
    },
  };
}
