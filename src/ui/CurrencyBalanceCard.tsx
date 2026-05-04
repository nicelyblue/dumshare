import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

type CurrencyBalanceCardProps = {
  currency: string;
  paidTotalMinor: number;
  owedTotalMinor: number;
  netMinor: number;
};

function formatMinor(amountMinor: number): string {
  const abs = Math.abs(amountMinor);
  const whole = Math.floor(abs / 100);
  const cents = String(abs % 100).padStart(2, '0');
  const prefix = amountMinor < 0 ? '-' : amountMinor > 0 ? '+' : '';
  return `${prefix}${whole}.${cents}`;
}

export function CurrencyBalanceCard({ currency, paidTotalMinor, owedTotalMinor, netMinor }: CurrencyBalanceCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.currency}>{currency}</Text>
        <Text style={styles.net}>Net {formatMinor(netMinor)}</Text>
      </View>
      <Text style={styles.detail}>Paid {formatMinor(paidTotalMinor)} · Owed {formatMinor(owedTotalMinor)}</Text>
      <Text style={styles.settlement}>{netMinor >= 0 ? 'Settlement-ready: should receive' : 'Settlement-ready: should pay'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#d9d0bf',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currency: {
    color: '#8a6b2d',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  net: {
    color: '#10203a',
    fontSize: 14,
    fontWeight: '700',
  },
  detail: {
    color: '#51617a',
    fontSize: 13,
  },
  settlement: {
    color: '#38485f',
    fontSize: 12,
    fontWeight: '600',
  },
});
