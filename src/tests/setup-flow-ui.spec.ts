import { describe, expect, it, vi } from 'vitest';
import { createSetupController } from '../mobile/controllers/setupController';

describe('setupController', () => {
  it('rejects empty share title', async () => {
    const controller = createSetupController({
      createShare: vi.fn(),
      addParticipant: vi.fn(),
    });

    await expect(controller.handleCreateShare({ title: '  ', organizerName: 'M' })).rejects.toThrow(
      'Share title is required',
    );
  });

  it('creates share and returns add-now branch token', async () => {
    const controller = createSetupController({
      createShare: vi.fn().mockResolvedValue('ledger-1'),
      addParticipant: vi.fn(),
    });

    const result = await controller.handleCreateShare({
      title: 'Trip',
      organizerName: 'M',
      nextStep: 'add-now',
    });

    expect(result.ledgerId).toBe('ledger-1');
    expect(result.nextStep).toBe('add-now');
  });

  it('clears stale drafts when starting a new share', async () => {
    const controller = createSetupController({
      createShare: vi.fn().mockResolvedValue('ledger-2'),
      addParticipant: vi.fn(),
    });

    controller.addParticipantDraft('Old Draft');

    await controller.handleCreateShare({ title: 'Fresh Trip', organizerName: 'M', nextStep: 'add-now' });

    expect(controller.getParticipantDrafts()).toEqual([]);
  });

  it('appends participant drafts before save', async () => {
    const controller = createSetupController({
      createShare: vi.fn(),
      addParticipant: vi.fn(),
    });

    controller.addParticipantDraft('Ana');
    controller.addParticipantDraft('Bo');

    expect(controller.getParticipantDrafts()).toEqual(['Ana', 'Bo']);
  });

  it('clears participant drafts after commit', async () => {
    const addParticipant = vi.fn().mockResolvedValue('ok');
    const controller = createSetupController({
      createShare: vi.fn(),
      addParticipant,
    });

    controller.addParticipantDraft('Ana');
    controller.addParticipantDraft('Bo');

    await controller.commitParticipantDrafts('ledger-1');

    expect(addParticipant).toHaveBeenNthCalledWith(1, { displayName: 'Ana', selectedLedgerId: 'ledger-1' });
    expect(addParticipant).toHaveBeenNthCalledWith(2, { displayName: 'Bo', selectedLedgerId: 'ledger-1' });
    expect(controller.getParticipantDrafts()).toEqual([]);
  });
});
