import { setActiveShareId, getActiveShareState } from '../state/activeShareStore';

type ShareListItem = {
  ledgerId: string;
  title: string;
  createdAt: string;
};

type ShareListItemWithState = ShareListItem & {
  active: boolean;
};

type ShareMenuService = {
  listShares: () => Promise<ShareListItem[]>;
  deleteShare: (ledgerId: string) => Promise<void>;
  clearAllData: () => Promise<void>;
};

export function createShareMenuController(service: ShareMenuService) {
  return {
    async loadShares(activeShareId: string | null): Promise<ShareListItemWithState[]> {
      const shares = await service.listShares();
      return shares.map((share) => ({ ...share, active: share.ledgerId === activeShareId }));
    },

    async switchActiveShare(ledgerId: string): Promise<void> {
      setActiveShareId(ledgerId);
    },

    getActiveShareId(): string | null {
      return getActiveShareState().activeShareId;
    },

    async deleteShare(ledgerId: string): Promise<void> {
      await service.deleteShare(ledgerId);
      if (getActiveShareState().activeShareId === ledgerId) {
        setActiveShareId(null);
      }
    },

    async resetAllData(confirmationToken: string): Promise<void> {
      if (confirmationToken !== 'CONFIRM_DELETE_ALL') {
        throw new Error('Confirmation required');
      }

      await service.clearAllData();
      setActiveShareId(null);
    },
  };
}
