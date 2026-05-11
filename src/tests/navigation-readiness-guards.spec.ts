import { describe, expect, test } from 'vitest';
import { shouldRedirectAddExpense, shouldRedirectHome } from '../navigation/guards';

describe('navigation-readiness-guards', () => {
  test('redirects home to welcome when no ledger exists', () => {
    expect(shouldRedirectHome(false)).toBe('welcome');
    expect(shouldRedirectHome(true)).toBeNull();
  });

  test('redirects add-expense when ledger or participants are missing', () => {
    expect(shouldRedirectAddExpense({ hasLedger: false, participantCount: 0 })).toBe('welcome');
    expect(shouldRedirectAddExpense({ hasLedger: true, participantCount: 0 })).toBe('addParticipants');
    expect(shouldRedirectAddExpense({ hasLedger: true, participantCount: 2 })).toBeNull();
  });
});
