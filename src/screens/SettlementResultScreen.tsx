import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../ui/AppShell';
import { ActionButton } from '../ui/ActionButton';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';
import { useLedgerSession } from '../state/ledgerSession';
import { colors, screenAccents } from '../theme/colors';

type SettlementPayment = {
  fromName: string;
  toName: string;
  amountMinor: number;
};

function buildSettlementRows(input: { displayName: string; netMinor: number }[]): SettlementPayment[] {
  const creditors = input
    .filter((item) => item.netMinor > 0)
    .map((item) => ({ ...item, remaining: item.netMinor }));
  const debtors = input
    .filter((item) => item.netMinor < 0)
    .map((item) => ({ ...item, remaining: Math.abs(item.netMinor) }));

  const payments: SettlementPayment[] = [];
  let ci = 0;
  let di = 0;

  while (ci < creditors.length && di < debtors.length) {
    const creditor = creditors[ci];
    const debtor = debtors[di];
    const transfer = Math.min(creditor.remaining, debtor.remaining);
    if (transfer > 0) {
      payments.push({
        fromName: debtor.displayName,
        toName: creditor.displayName,
        amountMinor: transfer,
      });
      creditor.remaining -= transfer;
      debtor.remaining -= transfer;
    }

    if (creditor.remaining === 0) {
      ci += 1;
    }
    if (debtor.remaining === 0) {
      di += 1;
    }
  }

  return payments;
}

export function SettlementResultScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { balanceDetailSnapshot } = useLedgerSession();
  const participantNets = balanceDetailSnapshot.participants.map((participant) => ({
    displayName: participant.displayName,
    netMinor: participant.balancesByCurrency.reduce((sum, row) => sum + row.netMinor, 0),
  }));
  const payments = buildSettlementRows(participantNets);
  const totalPayMinor = payments.reduce((sum, payment) => sum + payment.amountMinor, 0);

  return (
    <AppShell
      eyebrow="Settlement"
      title="Settlement Summary"
      description="Calculated payment summary based on current balances."
      accent={screenAccents.balances}
      activeRoute={APP_ROUTES.settleUp}
      onNavigate={(routeName) => navigation.navigate(routeName)}
      enableShellNav
    >
      <View style={styles.successWrap}>
        <View style={styles.successIcon}>
          <Text style={styles.successGlyph}>✓</Text>
        </View>
        <Text style={styles.successTitle}>Settlement Calculated!</Text>
        <Text style={styles.successSubtitle}>Here's the optimal way to settle all balances</Text>
      </View>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Total Transactions</Text>
          <Text style={styles.summaryValue}>{payments.length} payments</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Settlement Amount</Text>
          <Text style={styles.summaryValue}>${(totalPayMinor / 100).toFixed(2)}</Text>
        </View>
      </View>

      <Text style={styles.sectionLabel}>Required Payments</Text>
      <View style={styles.stack}>
        {payments.map((payment) => (
          <View key={`${payment.fromName}-${payment.toName}-${payment.amountMinor}`} style={styles.paymentCard}>
            <Text style={styles.paymentText}>{payment.fromName} pays {payment.toName}</Text>
            <Text style={styles.paymentAmount}>${(payment.amountMinor / 100).toFixed(2)}</Text>
          </View>
        ))}
      </View>

      <ActionButton label="Mark as Settled" onPress={() => navigation.navigate(APP_ROUTES.homeDashboard)} fullWidth />
      <ActionButton label="Back to Settle Up" onPress={() => navigation.navigate(APP_ROUTES.settleUp)} tone="secondary" />
      <ActionButton tone="secondary" label="Home Dashboard" onPress={() => navigation.navigate(APP_ROUTES.homeDashboard)} />
    </AppShell>
  );
}

const styles = StyleSheet.create({
  successWrap: {
    alignItems: 'center',
    gap: 8,
  },
  successIcon: {
    width: 82,
    height: 82,
    borderRadius: 41,
    backgroundColor: colors.text.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successGlyph: {
    color: colors.text.onAccent,
    fontSize: 36,
    fontWeight: '700',
  },
  successTitle: {
    color: colors.text.primary,
    fontSize: 24,
    fontWeight: '700',
  },
  successSubtitle: {
    color: colors.text.muted,
    fontSize: 14,
  },
  summaryCard: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.background.panelSoft,
    gap: 6,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    color: colors.text.muted,
    fontSize: 13,
  },
  summaryValue: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  sectionLabel: {
    color: colors.text.muted,
    fontSize: 12,
    textTransform: 'uppercase',
    letterSpacing: 1,
    fontWeight: '700',
  },
  stack: {
    gap: 8,
  },
  paymentCard: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    backgroundColor: colors.background.panel,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  paymentText: {
    color: colors.text.primary,
    fontSize: 14,
  },
  paymentAmount: {
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '700',
  },
});
