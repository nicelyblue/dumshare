import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useLedgerSession } from '../state/ledgerSession';
import { AppShell } from '../ui/AppShell';
import { ActionButton } from '../ui/ActionButton';
import { CurrencyBalanceCard } from '../ui/CurrencyBalanceCard';
import { SurfaceCard } from '../ui/SurfaceCard';
import { SummaryCard } from '../ui/SummaryCard';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';

export function BalancesScreen() {
  const { balanceDetailSnapshot } = useLedgerSession();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  return (
    <AppShell
      eyebrow="Settlement"
      title="Balances"
      description="Participant-first, per-currency settlement totals sourced from approved entries only."
      accent="#8a6b2d"
    >
      <ActionButton tone="secondary" compact label="Back to dashboard" onPress={() => navigation.navigate(APP_ROUTES.dashboard)} />

      {balanceDetailSnapshot.metadata.approvalScopeNote ? (
        <SummaryCard
          label="Scope"
          value="Approved entries only"
          detail={balanceDetailSnapshot.metadata.approvalScopeNote}
          tone="warning"
        />
      ) : null}

      {balanceDetailSnapshot.participants.length === 0 ? (
        <SummaryCard
          label="No balances yet"
          value="Add and approve expenses"
          detail="Per-currency settlement rows appear after approved entries exist."
        />
      ) : (
        balanceDetailSnapshot.participants.map((participant) => (
          <SurfaceCard key={participant.participantId} style={styles.participantSection}>
            <Text style={styles.participantName}>{participant.displayName}</Text>
            <View style={styles.currencyList}>
              {participant.balancesByCurrency.map((row) => (
                <CurrencyBalanceCard
                  key={`${participant.participantId}-${row.currency}`}
                  currency={row.currency}
                  paidTotalMinor={row.paidTotalMinor}
                  owedTotalMinor={row.owedTotalMinor}
                  netMinor={row.netMinor}
                />
              ))}
            </View>
          </SurfaceCard>
        ))
      )}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  participantSection: {
    gap: 8,
  },
  participantName: {
    color: '#10203a',
    fontSize: 16,
    fontWeight: '800',
  },
  currencyList: {
    gap: 8,
  },
});
