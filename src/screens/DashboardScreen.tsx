import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { APP_ROUTES } from '../navigation/routes';
import type { AppRouteName } from '../navigation/types';
import { AppShell } from '../ui/AppShell';
import { FeatureCard } from '../ui/FeatureCard';
import { SummaryCard } from '../ui/SummaryCard';
import { useLedgerSession } from '../state/ledgerSession';

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
  const { snapshot, status, error, refresh } = useLedgerSession();

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
      eyebrow="Trip overview"
      title={snapshot.title}
      description={snapshot.settlementContext}
      accent="#2f6f9f"
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
              <View key={`${row.participantId}-${row.currency}`} style={styles.balanceRow}>
                <View style={styles.balanceRowHeader}>
                  <Text style={styles.balanceName}>{row.displayName}</Text>
                  <Text style={styles.balanceCurrency}>{row.currency}</Text>
                </View>
                <Text style={styles.balanceDetail}>
                  Paid {formatCurrencyMinor(row.paidTotalMinor)} · Owed {formatCurrencyMinor(row.owedTotalMinor)} · Net {formatCurrencyMinor(row.netMinor)}
                </Text>
              </View>
            ))
          ) : (
            <SummaryCard label="No balances yet" value="Balances appear after the first expense" detail="Approved entries feed the per-currency snapshot." />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Quick navigation</Text>
        <View style={styles.quickActions}>
          <FeatureCard label="Ledger Setup" description="Edit title and roster" accent="#2f5d62" onPress={() => onNavigate(APP_ROUTES.setup)} actionLabel="Open setup" />
          <FeatureCard label="Expense Entry" description="Capture a new expense" accent="#6e4a7e" onPress={() => onNavigate(APP_ROUTES.expenseEntry)} actionLabel="Open entry" />
          <FeatureCard label="Sync" description="Prepare QR transfer" accent="#2f6f9f" onPress={() => onNavigate(APP_ROUTES.sync)} actionLabel="Open sync" />
          <FeatureCard label="Balances" description="Inspect settlement detail" accent="#8a6b2d" onPress={() => onNavigate(APP_ROUTES.balances)} actionLabel="Open balances" />
        </View>
      </View>

      <Pressable onPress={refresh} accessibilityRole="button" style={styles.refreshButton}>
        <Text style={styles.refreshLabel}>Refresh dashboard</Text>
      </Pressable>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  headerBlock: {
    gap: 4,
  },
  headerLabel: {
    color: '#7a634b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  headerValue: {
    color: '#38485f',
    fontSize: 14,
    lineHeight: 20,
  },
  metricsGrid: {
    gap: 12,
  },
  section: {
    gap: 12,
  },
  sectionLabel: {
    color: '#7a634b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  balanceList: {
    gap: 10,
  },
  balanceRow: {
    borderRadius: 18,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d9d0bf',
    padding: 14,
    gap: 6,
  },
  balanceRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  balanceName: {
    color: '#10203a',
    fontSize: 16,
    fontWeight: '700',
  },
  balanceCurrency: {
    color: '#2f6f9f',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  balanceDetail: {
    color: '#51617a',
    fontSize: 14,
    lineHeight: 20,
  },
  quickActions: {
    gap: 12,
  },
  refreshButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#10203a',
  },
  refreshLabel: {
    color: '#f5efe4',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});