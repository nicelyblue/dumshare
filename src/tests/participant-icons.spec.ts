import { describe, expect, it } from 'vitest';
import { getDefaultParticipantIcon, getParticipantIconOptions } from '../mobile/utils/participantIcons';

describe('participantIcons', () => {
  it('returns deterministic default icon for name', () => {
    expect(getDefaultParticipantIcon('Sarah Johnson')).toBe(getDefaultParticipantIcon('sarah johnson'));
  });

  it('returns unique icon options', () => {
    const options = getParticipantIconOptions('Mike Chen');
    expect(options.length).toBeGreaterThan(0);
    expect(new Set(options).size).toBe(options.length);
  });
});
