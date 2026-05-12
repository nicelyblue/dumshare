import type { LedgerListItem } from '../../data/ledger/ledgers';
import { createShareMenuController } from '../controllers/shareMenuController';
import { createLedgerAppService } from '../services/ledgerAppService';
import { getThemePreference, toggleThemePreference } from '../state/preferencesStore';
import { resetLocalData } from '../actions/resetLocalData';

const shareMenuController = createShareMenuController({
  listShares: () => createLedgerAppService().listShares(),
  deleteShare: (ledgerId: string) => createLedgerAppService().deleteShare(ledgerId),
  clearAllData: () => resetLocalData('CONFIRM_DELETE_ALL'),
});

export type ShareDrawerContentModel = {
  shares: Array<LedgerListItem & { active: boolean }>;
  theme: 'light' | 'dark';
};

export async function buildShareDrawerContent(activeShareId: string | null): Promise<ShareDrawerContentModel> {
  const shares = await shareMenuController.loadShares(activeShareId);
  return {
    shares,
    theme: getThemePreference(),
  };
}

export function onThemeToggle(): 'light' | 'dark' {
  return toggleThemePreference();
}

export default function ShareDrawerContent(): null {
  return null;
}
