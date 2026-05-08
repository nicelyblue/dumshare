import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';

type SurfaceCardProps = ViewProps & {
  emphasis?: 'default' | 'soft' | 'accent';
};

export function SurfaceCard({ emphasis = 'default', style, ...props }: SurfaceCardProps) {
  return <View style={[styles.base, emphasis === 'soft' ? styles.soft : emphasis === 'accent' ? styles.accent : styles.default, style]} {...props} />;
}

const styles = StyleSheet.create({
  base: {
    borderRadius: 24,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    shadowColor: '#284c91',
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  default: {
    borderColor: '#d8e3f6',
    backgroundColor: '#ffffff',
  },
  soft: {
    borderColor: '#d8e3f6',
    backgroundColor: '#eef4ff',
  },
  accent: {
    borderColor: '#00a7a0',
    backgroundColor: '#eafcf8',
  },
});
