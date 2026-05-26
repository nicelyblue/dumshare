type ShareAction = 'make-active' | 'edit' | 'delete';

type ShareActionService = {
  deleteShare: (ledgerId: string) => Promise<void>;
  makeActive: (ledgerId: string) => Promise<void>;
  editShare: (ledgerId: string, nextTitle: string) => Promise<void>;
};

type ShareActionArgs = {
  ledgerId: string;
  activeShareId: string | null;
};

export function createShareActionsController(service: ShareActionService) {
  return {
    getActions(args: ShareActionArgs): ShareAction[] {
      if (args.ledgerId === args.activeShareId) {
        return ['edit'];
      }

      return ['make-active', 'edit', 'delete'];
    },

    async runAction(action: ShareAction, ledgerId: string, nextTitle?: string): Promise<void> {
      if (action === 'make-active') {
        await service.makeActive(ledgerId);
        return;
      }

      if (action === 'edit') {
        const title = nextTitle?.trim();
        if (!title) {
          throw new Error('Share title is required');
        }

        await service.editShare(ledgerId, title);
        return;
      }

      await service.deleteShare(ledgerId);
    },
  };
}
