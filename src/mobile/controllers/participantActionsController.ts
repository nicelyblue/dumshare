type ParticipantAction = 'edit' | 'delete';

type ParticipantService = {
  renameParticipant: (participantId: string, displayName: string) => Promise<void>;
  removeParticipant: (participantId: string) => Promise<void>;
};

export function createParticipantActionsController(service: ParticipantService) {
  return {
    getActions(participantId: string): ParticipantAction[] {
      if (!participantId.trim()) {
        return [];
      }

      return ['edit', 'delete'];
    },

    async runAction(action: ParticipantAction, participantId: string, nextName?: string): Promise<void> {
      if (action === 'edit') {
        if (!nextName?.trim()) {
          throw new Error('Participant name is required');
        }
        await service.renameParticipant(participantId, nextName.trim());
        return;
      }

      await service.removeParticipant(participantId);
    },
  };
}
