import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
    borderColor: '#d9d0bf',
  },
  accent: {
    borderColor: '#2f6f9f',
  },
  warning: {
    borderColor: '#b14f2e',
  },
  muted: {
    borderColor: '#bfb7a7',
  },
});

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: 18,
    backgroundColor: '#ffffff',
    padding: 16,
    gap: 6,
  },
  label: {
    color: '#7a634b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  value: {
    color: '#10203a',
    fontSize: 20,
    fontWeight: '800',
  },
  detail: {
    color: '#51617a',
    fontSize: 13,
    lineHeight: 18,
  },
});