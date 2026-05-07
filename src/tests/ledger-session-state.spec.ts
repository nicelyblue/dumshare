import { describe, expect, test } from 'vitest';
import { createEmptyState, mergeHydratedLedgerSessionState } from '../state/ledgerSession';
import type { LedgerListItem } from '../data/ledger/ledgers';

describe('ledger-session-state', () => {
  test('empty state initializes setupState before any screen reads it', () => {
    const emptyState = createEmptyState();

    expect(emptyState.setupState.activeStep).toBe('step1');
    expect(emptyState.setupState.step1Data).toBeNull();
    expect(emptyState.setupState.step2Data).toBeNull();
    expect(emptyState.setupState.isComplete).toBe(false);
  });

  test('hydrating loaded ledger data preserves setupState', () => {
    const current = {
      status: 'loading' as const,
      activeLedgerId: null,
      ledgers: [],
      snapshot: {
        ledgerId: null,
        hasLedger: false,
        title: 'No ledger yet',
        organizerName: '',
        organizerParticipantId: null,
        settlementContext: 'Create the trip ledger in Setup to begin.',
        participantCount: 0,
        pendingApprovalCount: 0,
        latestActivityLabel: 'Waiting for the first ledger event',
        latestActivityAt: null,
        balanceSummary: {
          participants: [],
          metadata: {
            pendingSubmissionCount: 0,
            reviewedSubmissionCount: 0,
            approvalScopeNote: '',
          },
        },
      },
      reviewSnapshot: {
        hasLedger: false,
        pendingCount: 0,
        reviewedCount: 0,
        items: [],
      },
      balanceDetailSnapshot: {
        hasLedger: false,
        participants: [],
        metadata: {
          pendingSubmissionCount: 0,
          reviewedSubmissionCount: 0,
          approvalScopeNote: '',
        },
      },
      error: null,
      setupState: {
        activeStep: 'step2' as const,
        step1Data: {
          title: 'Barcelona Weekend',
          organizerName: 'Alex',
        },
        step2Data: {
          participantIds: ['participant-1'],
        },
        isComplete: false,
      },
    };

    const hydrated = mergeHydratedLedgerSessionState(current, {
      status: 'ready',
      activeLedgerId: 'ledger-1',
      ledgers: [
        {
          ledgerId: 'ledger-1',
          title: 'Barcelona Weekend',
          settlementContext: 'per-currency balances',
          createdAt: '2026-05-07T10:00:00.000Z',
        } satisfies LedgerListItem,
      ],
      snapshot: {
        ledgerId: 'ledger-1',
        hasLedger: true,
        title: 'Barcelona Weekend',
        organizerName: 'Alex',
        organizerParticipantId: 'participant-organizer',
        settlementContext: 'per-currency balances',
        participantCount: 2,
        pendingApprovalCount: 0,
        latestActivityLabel: 'Ledger created',
        latestActivityAt: '2026-05-07T10:00:00.000Z',
        balanceSummary: {
          participants: [],
          metadata: {
            pendingSubmissionCount: 0,
            reviewedSubmissionCount: 0,
            approvalScopeNote: '',
          },
        },
      },
      reviewSnapshot: {
        hasLedger: true,
        pendingCount: 0,
        reviewedCount: 0,
        items: [],
      },
      balanceDetailSnapshot: {
        hasLedger: true,
        participants: [],
        metadata: {
          pendingSubmissionCount: 0,
          reviewedSubmissionCount: 0,
          approvalScopeNote: '',
        },
      },
      error: null,
    });

    expect(hydrated.status).toBe('ready');
    expect(hydrated.activeLedgerId).toBe('ledger-1');
    expect(hydrated.setupState).toEqual(current.setupState);
    expect(hydrated.setupState.step1Data).toEqual(current.setupState.step1Data);
  });
});