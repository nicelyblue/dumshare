import React from 'react';
import { View, StyleSheet, type ViewProps } from 'react-native';
import { colors, componentTokens, shadows } from '../../theme';

type CardProps = ViewProps & {
  tone?: 'default' | 'soft' | 'accent';
};

export function Card({ tone = 'default', style, ...props }: CardProps) {
  return <View style={[styles.base, tone === 'soft' ? styles.soft : tone === 'accent' ? styles.accent : styles.default, style]} {...props} />;
}

const styles = StyleSheet.create({
  base: {
    ...componentTokens.card.base,
    ...shadows.soft,
    padding: 14,
  },
  default: {
    borderColor: colors.border.default,
    backgroundColor: colors.background.panel,
  },
  soft: {
    borderColor: colors.border.default,
    backgroundColor: colors.background.panelSoft,
  },
  accent: {
    borderColor: colors.border.success,
    backgroundColor: colors.background.panelSoft,
  },
});
