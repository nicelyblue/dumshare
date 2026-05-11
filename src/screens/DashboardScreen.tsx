import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { APP_ROUTES } from '../navigation/routes';
import type { AppRouteName } from '../navigation/types';
import { AppShell } from '../ui/AppShell';
import { ActionButton } from '../ui/ActionButton';
import { FeatureCard } from '../ui/FeatureCard';
import { SurfaceCard } from '../ui/SurfaceCard';
import { SummaryCard } from '../ui/SummaryCard';
import { useLedgerSession } from '../state/ledgerSession';
import { colors, screenAccents } from '../theme/colors';

type DashboardScreenProps = {
  onNavigate: (routeName: AppRouteName) => void;
};

function formatCurrencyMinor(amountMinor: number): string {
  const absoluteValue = Math.abs(amountMinor);
  const wholeUnits = Math.floor(absoluteValue / 100);
  const fractionalUnits = String(absoluteValue % 100).padStart(2, '0');
  const prefix = amountMinor < 0 ? '-' : amountMinor > 0 ? '+' : '';
  return `${prefix}${wholeUnits}.${fractionalUnits}`;
}

export function DashboardScreen({ onNavigate }: DashboardScreenProps) {
  const { snapshot, status, error, refresh, clearSetupState } = useLedgerSession();
  const hasLedger = snapshot.hasLedger;

  // Clear setup state when dashboard comes into focus
  useFocusEffect(
    React.useCallback(() => {
      clearSetupState();
    }, [clearSetupState]),
  );

  const balanceRows = snapshot.balanceSummary.participants.flatMap((participant) =>
    participant.balancesByCurrency.map((row) => ({
      participantId: participant.participantId,
      displayName: participant.displayName,
      ...row,
    })),
  );

  const headerDetail =
    status === 'error'
      ? error ?? 'Unable to load dashboard'
      : snapshot.latestActivityAt
        ? `Updated ${snapshot.latestActivityAt}`
        : 'Local ledger view';

  return (
    <AppShell
      eyebrow="Dashboard"
      title={hasLedger ? snapshot.title : 'Dashboard'}
      description={hasLedger ? snapshot.settlementContext : 'Create the trip ledger in Setup to begin.'}
      accent={screenAccents.dashboard}
    >
      <View style={styles.headerBlock}>
        <Text style={styles.headerLabel}>Dashboard status</Text>
        <Text style={styles.headerValue}>{headerDetail}</Text>
      </View>

      {status === 'loading' ? <SummaryCard label="Loading" value="Refreshing ledger state" detail="Reading local events." tone="muted" /> : null}

      {status === 'error' ? (
        <SummaryCard label="Dashboard error" value="Could not load ledger" detail={error ?? 'Unknown error'} tone="warning" />
      ) : null}

      {status === 'empty' ? (
        <SummaryCard
          label="No ledger yet"
          value="Create the first trip ledger"
          detail="Go to Setup to create the title, settlement context, and participant roster."
          tone="accent"
        />
      ) : null}

      <View style={styles.metricsGrid}>
        <SummaryCard label="Ledger title" value={snapshot.title} detail={snapshot.ledgerId ?? 'No ledger selected'} tone="accent" />
        <SummaryCard label="Participants" value={String(snapshot.participantCount)} detail="Names loaded from the replayed projection." />
        <SummaryCard label="Pending approvals" value={String(snapshot.pendingApprovalCount)} detail={snapshot.balanceSummary.metadata.approvalScopeNote || 'All changes currently approved.'} tone={snapshot.pendingApprovalCount > 0 ? 'warning' : 'default'} />
        <SummaryCard label="Latest activity" value={snapshot.latestActivityLabel} detail={snapshot.latestActivityAt ?? 'No timestamp available'} tone="muted" />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Per-currency balance snapshot</Text>
        <View style={styles.balanceList}>
          {balanceRows.length > 0 ? (
            balanceRows.map((row) => (
              <SurfaceCard key={`${row.participantId}-${row.currency}`}>
                <View style={styles.balanceRowHeader}>
                  <Text style={styles.balanceName}>{row.displayName}</Text>
                  <Text style={styles.balanceCurrency}>{row.currency}</Text>
                </View>
                <Text style={styles.balanceDetail}>
                  Paid {formatCurrencyMinor(row.paidTotalMinor)} · Owed {formatCurrencyMinor(row.owedTotalMinor)} · Net {formatCurrencyMinor(row.netMinor)}
                </Text>
              </SurfaceCard>
            ))
          ) : (
            <SummaryCard label="No balances yet" value="Balances appear after the first expense" detail="Approved entries feed the per-currency snapshot." />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Quick navigation</Text>
        <View style={styles.quickActions}>
          <FeatureCard label="Ledgers" description="Switch or create ledgers" accent={screenAccents.ledgers} onPress={() => onNavigate(APP_ROUTES.ledgers)} actionLabel="Manage ledgers" />
          <FeatureCard label="Ledger Setup" description="Edit title and roster" accent={screenAccents.setup} onPress={() => onNavigate(APP_ROUTES.setup)} actionLabel="Open setup" />
          <FeatureCard label="Expense Entry" description="Capture a new expense" accent={screenAccents.expense} onPress={() => onNavigate(APP_ROUTES.expenseEntry)} actionLabel="Open entry" />
          <FeatureCard label="Balances" description="Inspect settlement detail" accent={screenAccents.balances} onPress={() => onNavigate(APP_ROUTES.balances)} actionLabel="Open balances" />
        </View>
      </View>

      <ActionButton label="Refresh dashboard" fullWidth onPress={refresh} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: 6,
  },
  headerLabel: {
    color: colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  headerValue: {
    color: colors.text.secondary,
    fontSize: 14,
    lineHeight: 20,
  },
  metricsGrid: {
    gap: 14,
  },
  section: {
    gap: 14,
  },
  sectionLabel: {
    color: colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  balanceList: {
    gap: 12,
  },
  balanceRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  balanceName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  balanceCurrency: {
    color: colors.accent.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  balanceDetail: {
    color: colors.text.subtle,
    fontSize: 14,
    lineHeight: 20,
  },
  quickActions: {
    gap: 14,
  },
});
