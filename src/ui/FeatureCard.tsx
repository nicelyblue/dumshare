import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

type FeatureCardProps = {
  label: string;
  description: string;
  accent: string;
  onPress?: () => void;
  selected?: boolean;
  actionLabel?: string;
};

export function FeatureCard({
  label,
  description,
  accent,
  onPress,
  selected = false,
  actionLabel,
}: FeatureCardProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={[styles.card, selected ? styles.cardSelected : styles.cardDefault]}
    >
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
        {actionLabel ? <Text style={[styles.actionLabel, { color: accent }]}>{actionLabel}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 24,
    borderWidth: 1,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  cardDefault: {
    borderColor: '#d8e3f6',
  },
  cardSelected: {
    borderColor: '#00a7a0',
    backgroundColor: '#eef4ff',
    shadowColor: '#284c91',
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 3,
  },
  dot: {
    marginTop: 5,
    height: 12,
    width: 12,
    borderRadius: 999,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: '#182743',
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    color: '#5a6883',
    fontSize: 14,
    lineHeight: 20,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
});
