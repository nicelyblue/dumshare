import { describe, expect, it, vi } from 'vitest';
import { createParticipantActionsController } from '../mobile/controllers/participantActionsController';
import { createShareActionsController } from '../mobile/controllers/shareActionsController';

describe('long press action controllers', () => {
  it('participant actions expose edit and delete', async () => {
    const controller = createParticipantActionsController({
      renameParticipant: vi.fn(),
      removeParticipant: vi.fn(),
    });

    const actions = controller.getActions('participant-1');
    expect(actions).toEqual(['edit', 'delete']);
  });

  it('non-active share actions include make-active/edit/delete', () => {
    const controller = createShareActionsController({
      deleteShare: vi.fn(),
      makeActive: vi.fn(),
      editShare: vi.fn(),
    });

    const actions = controller.getActions({ ledgerId: 'l-2', activeShareId: 'l-1' });
    expect(actions).toEqual(['make-active', 'edit', 'delete']);
  });

  it('active share omits delete option', () => {
    const controller = createShareActionsController({
      deleteShare: vi.fn(),
      makeActive: vi.fn(),
      editShare: vi.fn(),
    });

    const actions = controller.getActions({ ledgerId: 'l-1', activeShareId: 'l-1' });
    expect(actions).toEqual(['edit']);
  });
});
