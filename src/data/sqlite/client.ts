import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";

import { events } from "./schema";

export type LedgerDb = {
  readonly name: string;
  readonly sqlite: Database.Database;
  readonly orm: ReturnType<typeof drizzle>;
};

const openHandles = new Map<string, LedgerDb>();
const inMemoryStores = new Map<string, Database.Database>();

function ensureSchema(sqlite: Database.Database): void {
  sqlite.exec(`
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

function isInMemoryDb(dbName: string): boolean {
  return !dbName.includes("/") && !dbName.includes("\\") && !dbName.endsWith(".db");
}

function getSqliteHandle(dbName: string): Database.Database {
  if (isInMemoryDb(dbName)) {
    const existing = inMemoryStores.get(dbName);
    if (existing) {
      return existing;
    }
    const sqlite = new Database(":memory:");
    inMemoryStores.set(dbName, sqlite);
    return sqlite;
  }

  return new Database(dbName);
}

export function openLedgerDb(dbName: string): LedgerDb {
  const existing = openHandles.get(dbName);
  if (existing) {
    return existing;
  }

  const sqlite = getSqliteHandle(dbName);
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

  if (isInMemoryDb(db.name)) {
    return;
  }

  db.sqlite.close();
}

export function clearLedgerDb(dbName: string): void {
  const open = openHandles.get(dbName);
  if (open) {
    closeLedgerDb(open);
  }

  const memoryDb = inMemoryStores.get(dbName);
  if (memoryDb) {
    memoryDb.close();
    inMemoryStores.delete(dbName);
  }
}
