import { createLedgerAppService } from '../../src/mobile/services/ledgerAppService';
import { createSetupController } from '../../src/mobile/controllers/setupController';

const controller = createSetupController(createLedgerAppService());

export async function submitCreateShare(title: string, organizerName: string, nextStep: 'add-now' | 'later') {
  return controller.handleCreateShare({ title, organizerName, nextStep });
}

export default function CreateShareScreen(): null {
  return null;
}
