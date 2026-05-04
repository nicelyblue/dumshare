import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

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
    borderColor: '#8a6b2d',
    backgroundColor: '#f9f1dd',
  },
  approved: {
    borderColor: '#2f6f46',
    backgroundColor: '#e1f2e8',
  },
  rejected: {
    borderColor: '#a33e2c',
    backgroundColor: '#f8e4df',
  },
  label: {
    color: '#203047',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
