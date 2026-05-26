import { desc } from 'drizzle-orm';

import { openLedgerDb } from '../sqlite/client';
import { events } from '../sqlite/schema';

export async function resolveLatestLedgerId(dbName: string): Promise<string | null> {
  const db = openLedgerDb(dbName);
  const rows = await db.orm
    .select({ ledgerId: events.ledger_id })
    .from(events)
    .orderBy(desc(events.sequence))
    .limit(1);

  return rows[0]?.ledgerId ?? null;
}
