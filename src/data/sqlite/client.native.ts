import { drizzle } from "drizzle-orm/expo-sqlite";
import { deleteDatabaseSync, openDatabaseSync, type SQLiteDatabase } from "expo-sqlite";

import { events } from "./schema";

export type LedgerDb = {
  readonly name: string;
  readonly sqlite: SQLiteDatabase;
  readonly orm: ReturnType<typeof drizzle>;
};

const openHandles = new Map<string, LedgerDb>();

function ensureSchema(sqlite: SQLiteDatabase): void {
  sqlite.execSync(`
    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      ledger_id TEXT NOT NULL,
      event_type TEXT NOT NULL,
      event_version INTEGER NOT NULL,
      occurred_at TEXT NOT NULL,
      actor_device_id TEXT NOT NULL,
      payload_json TEXT NOT NULL,
      sequence INTEGER NOT NULL UNIQUE
    );

  `);
}

export function openLedgerDb(dbName: string): LedgerDb {
  const existing = openHandles.get(dbName);
  if (existing) {
    return existing;
  }

  const sqlite = openDatabaseSync(`${dbName}.db`);
  ensureSchema(sqlite);

  const orm = drizzle(sqlite, {
    schema: {
      events,
    },
  });

  const db: LedgerDb = {
    name: dbName,
    sqlite,
    orm,
  };

  openHandles.set(dbName, db);
  return db;
}

export function closeLedgerDb(db: LedgerDb): void {
  openHandles.delete(db.name);
  db.sqlite.closeSync();
}

export function clearLedgerDb(dbName: string): void {
  const open = openHandles.get(dbName);
  if (open) {
    closeLedgerDb(open);
  }

  deleteDatabaseSync(`${dbName}.db`);
}
