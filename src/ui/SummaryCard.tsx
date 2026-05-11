import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type SummaryCardProps = {
  label: string;
  value: string;
  detail?: string;
  tone?: 'default' | 'accent' | 'warning' | 'muted';
};

export function SummaryCard({ label, value, detail, tone = 'default' }: SummaryCardProps) {
  return (
    <View style={[styles.card, stylesByTone[tone]]}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
      {detail ? <Text style={styles.detail}>{detail}</Text> : null}
    </View>
  );
}

const stylesByTone = StyleSheet.create({
  default: {
    borderColor: colors.border.default,
  },
  accent: {
    borderColor: colors.border.accent,
  },
  warning: {
    borderColor: colors.border.danger,
  },
  muted: {
    borderColor: colors.border.muted,
  },
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: colors.background.panel,
    padding: 16,
    gap: 6,
  },
  label: {
    color: colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  value: {
    color: colors.text.primary,
    fontSize: 20,
    fontWeight: '800',
  },
  detail: {
    color: colors.text.subtle,
    fontSize: 13,
    lineHeight: 18,
  },
});
