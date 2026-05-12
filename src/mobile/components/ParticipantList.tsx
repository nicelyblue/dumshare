import { createParticipantActionsController } from '../controllers/participantActionsController';
import { LongPressActionSheet, type ActionSheetOption } from './LongPressActionSheet';

type ParticipantListProps = {
  participants: string[];
};

const controller = createParticipantActionsController({
  renameParticipant: async () => undefined,
  removeParticipant: async () => undefined,
});

export function getParticipantLongPressOptions(participantId: string): ActionSheetOption[] {
  return controller.getActions(participantId).map((action) => ({
    key: action,
    label: action === 'edit' ? 'Edit participant' : 'Delete participant',
    destructive: action === 'delete',
  }));
}

export function ParticipantList({ participants }: ParticipantListProps): null {
  LongPressActionSheet({ visible: false, options: [] });
  participants.length;
  return null;
}
