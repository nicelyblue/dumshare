import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useLedgerSession } from '../state/ledgerSession';
import { AppShell } from '../ui/AppShell';
import { CurrencyBalanceCard } from '../ui/CurrencyBalanceCard';
import { SummaryCard } from '../ui/SummaryCard';

export function BalancesScreen() {
  const { balanceDetailSnapshot } = useLedgerSession();

  return (
    <AppShell
      eyebrow="Settlement"
      title="Balances"
      description="Participant-first, per-currency settlement totals sourced from approved entries only."
      accent="#8a6b2d"
    >
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
          <View key={participant.participantId} style={styles.participantSection}>
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
          </View>
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
