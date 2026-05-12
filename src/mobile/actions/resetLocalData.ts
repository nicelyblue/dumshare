import { clearLedgerDb } from '../../data/sqlite/client';
import { setActiveShareId } from '../state/activeShareStore';

export async function resetLocalData(confirmationToken: string, dbName = 'dumshare-ui'): Promise<void> {
  if (confirmationToken !== 'CONFIRM_DELETE_ALL') {
    throw new Error('Delete all local app data? This will erase all shares and expenses on this device.');
  }

  clearLedgerDb(dbName);
  setActiveShareId(null);
}
