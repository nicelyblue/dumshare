import { describe, expect, test } from 'vitest';
import { APP_ROUTES } from '../navigation/routes';

describe('mockup-route-contract', () => {
  test('includes all mockup-aligned route names', () => {
    expect(APP_ROUTES.welcome).toBe('welcome');
    expect(APP_ROUTES.createShare).toBe('createShare');
    expect(APP_ROUTES.addParticipants).toBe('addParticipants');
    expect(APP_ROUTES.homeDashboard).toBe('homeDashboard');
    expect(APP_ROUTES.addExpense).toBe('addExpense');
    expect(APP_ROUTES.splitDetails).toBe('splitDetails');
    expect(APP_ROUTES.ledgerEntries).toBe('ledgerEntries');
    expect(APP_ROUTES.ledgerEntryDetail).toBe('ledgerEntryDetail');
    expect(APP_ROUTES.settleUp).toBe('settleUp');
    expect(APP_ROUTES.settlementResult).toBe('settlementResult');
  });
});
