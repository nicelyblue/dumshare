type CreateShareArgs = {
  title: string;
  organizerName: string;
  nextStep?: 'add-now' | 'later';
};

type SetupService = {
  createShare: (input: { title: string; organizerName: string }) => Promise<string>;
  addParticipant: (input: { displayName: string; selectedLedgerId?: string | null }) => Promise<string>;
};

type CreateShareResult = {
  ledgerId: string;
  nextStep: 'add-now' | 'later';
};

function requireValue(value: string, fieldName: string): string {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error(`${fieldName} is required`);
  }

  return normalized;
}

export function createSetupController(service: SetupService) {
  const participantDrafts: string[] = [];

  return {
    async handleCreateShare(input: CreateShareArgs): Promise<CreateShareResult> {
      const title = requireValue(input.title, 'Share title');
      const organizerName = requireValue(input.organizerName, 'Organizer name');
      const ledgerId = await service.createShare({ title, organizerName });
      participantDrafts.length = 0;

      return {
        ledgerId,
        nextStep: input.nextStep ?? 'later',
      };
    },

    addParticipantDraft(displayName: string): void {
      const normalized = requireValue(displayName, 'Participant name');
      participantDrafts.push(normalized);
    },

    getParticipantDrafts(): string[] {
      return [...participantDrafts];
    },

    removeParticipantDraftAt(index: number): string[] {
      if (!Number.isInteger(index) || index < 0 || index >= participantDrafts.length) {
        return [...participantDrafts];
      }

      participantDrafts.splice(index, 1);
      return [...participantDrafts];
    },

    async commitParticipantDrafts(ledgerId: string): Promise<void> {
      const selectedLedgerId = requireValue(ledgerId, 'Ledger id');

      for (const displayName of participantDrafts) {
        await service.addParticipant({ displayName, selectedLedgerId });
      }

      participantDrafts.length = 0;
    },
  };
}
