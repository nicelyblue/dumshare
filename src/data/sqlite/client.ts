export type LedgerDb = {
  readonly name: string;
};

export function openLedgerDb(dbName: string): LedgerDb {
  throw new Error("Not implemented");
}

export function closeLedgerDb(_db: LedgerDb): void {
  throw new Error("Not implemented");
}

export function clearLedgerDb(_dbName: string): void {
  throw new Error("Not implemented");
}
