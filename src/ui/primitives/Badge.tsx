import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

type BadgeProps = {
  label: string;
  tone?: 'default' | 'warning' | 'danger' | 'success';
};

export function Badge({ label, tone = 'default' }: BadgeProps) {
  return (
    <View style={[styles.base, tone === 'warning' ? styles.warning : tone === 'danger' ? styles.danger : tone === 'success' ? styles.success : styles.default]}>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  default: {
    borderColor: colors.border.default,
    backgroundColor: colors.background.panelSoft,
  },
  warning: {
    borderColor: colors.border.warning,
    backgroundColor: colors.status.warningSoft,
  },
  danger: {
    borderColor: colors.status.danger,
    backgroundColor: colors.status.dangerSoft,
  },
  success: {
    borderColor: colors.border.success,
    backgroundColor: colors.background.panelSoft,
  },
  label: {
    ...typography.labelStrong,
    fontSize: 11,
    color: colors.text.strong,
  },
});
