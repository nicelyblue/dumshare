import React from 'react';
import { Text, StyleSheet, type TextProps } from 'react-native';
import { colors, typography } from '../../theme';

export function SectionHeader(props: TextProps) {
  return <Text {...props} style={[styles.text, props.style]} />;
}

const styles = StyleSheet.create({
  text: {
    ...typography.label,
    letterSpacing: 1.6,
    color: colors.text.muted,
  },
});
