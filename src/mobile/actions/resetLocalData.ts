import { setActiveShareId } from '../state/activeShareStore';

export async function resetLocalData(confirmationToken: string): Promise<void> {
  if (confirmationToken !== 'CONFIRM_DELETE_ALL') {
    throw new Error('Delete all local app data? This will erase all shares and expenses on this device.');
  }

  setActiveShareId(null);
}
