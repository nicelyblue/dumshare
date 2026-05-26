import { describe, expect, it, vi } from 'vitest';
import { createShareMenuController } from '../mobile/controllers/shareMenuController';

describe('shareMenuController', () => {
  it('loads shares and marks active', async () => {
    const controller = createShareMenuController({
      listShares: vi.fn().mockResolvedValue([{ ledgerId: 'a', title: 'A', createdAt: '2020' }]),
      deleteShare: vi.fn(),
      clearAllData: vi.fn(),
    });

    const result = await controller.loadShares('a');
    expect(result[0]?.active).toBe(true);
  });

  it('switches active share', async () => {
    const controller = createShareMenuController({
      listShares: vi.fn().mockResolvedValue([]),
      deleteShare: vi.fn(),
      clearAllData: vi.fn(),
    });

    await controller.switchActiveShare('ledger-2');
    expect(controller.getActiveShareId()).toBe('ledger-2');
  });

  it('requires reset confirmation token', async () => {
    const clearAllData = vi.fn();
    const controller = createShareMenuController({
      listShares: vi.fn().mockResolvedValue([]),
      deleteShare: vi.fn(),
      clearAllData,
    });

    await expect(controller.resetAllData('nope')).rejects.toThrow('Confirmation required');
    expect(clearAllData).not.toHaveBeenCalled();
  });
});
