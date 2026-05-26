import { int, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const events = sqliteTable("events", {
  id: text("id").primaryKey(),
  ledger_id: text("ledger_id").notNull(),
  event_type: text("event_type").notNull(),
  event_version: int("event_version").notNull(),
  occurred_at: text("occurred_at").notNull(),
  actor_device_id: text("actor_device_id").notNull(),
  payload_json: text("payload_json").notNull(),
  sequence: int("sequence").notNull().unique(),
});
