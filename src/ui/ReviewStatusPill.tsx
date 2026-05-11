import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

type ReviewStatusPillProps = {
  status: 'pending' | 'approved' | 'rejected';
  label?: string;
};

export function ReviewStatusPill({ status, label }: ReviewStatusPillProps) {
  return (
    <View style={[styles.pill, status === 'approved' ? styles.approved : status === 'rejected' ? styles.rejected : styles.pending]}>
      <Text style={styles.label}>{label ?? status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    alignSelf: 'flex-start',
  },
  pending: {
    borderColor: colors.border.warning,
    backgroundColor: colors.status.warningSoft,
  },
  approved: {
    borderColor: colors.border.success,
    backgroundColor: colors.background.panelSoft,
  },
  rejected: {
    borderColor: colors.status.danger,
    backgroundColor: colors.status.dangerSoft,
  },
  label: {
    color: colors.text.strong,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
