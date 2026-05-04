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
    <Pressable onPress={onPress} accessibilityRole="button" style={[styles.card, selected && styles.cardSelected]}>
      <View style={[styles.dot, { backgroundColor: accent }]} />
      <View style={styles.content}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.description}>{description}</Text>
        {actionLabel ? <Text style={[styles.action, { color: accent }]}>{actionLabel}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#d9d0bf',
  },
  cardSelected: {
    borderColor: '#10203a',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 999,
    marginTop: 5,
  },
  content: {
    flex: 1,
    gap: 4,
  },
  label: {
    color: '#10203a',
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    color: '#51617a',
    fontSize: 14,
    lineHeight: 20,
  },
  action: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});