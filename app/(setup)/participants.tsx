import { createLedgerAppService } from '../../src/mobile/services/ledgerAppService';
import { createSetupController } from '../../src/mobile/controllers/setupController';
import { ParticipantList } from '../../src/mobile/components/ParticipantList';

const controller = createSetupController(createLedgerAppService());

export function addParticipantDraft(displayName: string): string[] {
  controller.addParticipantDraft(displayName);
  return controller.getParticipantDrafts();
}

export default function ParticipantsScreen(): null {
  ParticipantList({ participants: controller.getParticipantDrafts() });
  return null;
}
