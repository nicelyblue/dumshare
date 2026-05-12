import type { LedgerListItem } from '../../data/ledger/ledgers';
import { createShareMenuController } from '../controllers/shareMenuController';
import { createShareActionsController } from '../controllers/shareActionsController';
import { createLedgerAppService } from '../services/ledgerAppService';
import { getThemePreference, toggleThemePreference } from '../state/preferencesStore';
import { resetLocalData } from '../actions/resetLocalData';
import type { ActionSheetOption } from './LongPressActionSheet';

const shareMenuController = createShareMenuController({
  listShares: () => createLedgerAppService().listShares(),
  deleteShare: (ledgerId: string) => createLedgerAppService().deleteShare(ledgerId),
  clearAllData: () => resetLocalData('CONFIRM_DELETE_ALL'),
});

const shareActionsController = createShareActionsController({
  deleteShare: (ledgerId: string) => createLedgerAppService().deleteShare(ledgerId),
  makeActive: async () => undefined,
  editShare: async () => undefined,
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

export function getShareLongPressOptions(ledgerId: string, activeShareId: string | null): ActionSheetOption[] {
  return shareActionsController.getActions({ ledgerId, activeShareId }).map((action) => ({
    key: action,
    label:
      action === 'make-active'
        ? 'Make active'
        : action === 'edit'
          ? 'Edit share'
          : 'Delete share permanently',
    destructive: action === 'delete',
  }));
}

export default function ShareDrawerContent(): null {
  return null;
}
