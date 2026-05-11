import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';
import { useLedgerSession } from '../state/ledgerSession';
import { MockScaffold } from '../ui/MockScaffold';
import { colors } from '../theme/colors';

export function SettleUpScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { snapshot, balanceDetailSnapshot } = useLedgerSession();

  return (
    <MockScaffold activeTab="settle" onNavigate={(route) => navigation.navigate(route)}>
      <Text style={styles.eyebrow}>Settlement</Text>
      <Text style={styles.activeShare}>Active share: {snapshot.title || 'Weekend Trip 2025'}</Text>
      <Text style={styles.title}>Settle Up</Text>
      <Text style={styles.subtitle}>Review balances and calculate settlement summary.</Text>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Current Balances</Text>
        <Text style={styles.cardValue}>{balanceDetailSnapshot.participants.length} participants</Text>
        <Text style={styles.cardBody}>Settlement uses the approved-entry balance snapshot.</Text>
      </View>

      <Pressable style={styles.primaryButton} onPress={() => navigation.navigate(APP_ROUTES.settlementResult)}>
        <Text style={styles.primaryLabel}>Calculate Settlement</Text>
      </Pressable>

      <Pressable style={styles.secondaryButton} onPress={() => navigation.navigate(APP_ROUTES.homeDashboard)}>
        <Text style={styles.secondaryLabel}>Back to Home</Text>
      </Pressable>
    </MockScaffold>
  );
}

const styles = StyleSheet.create({
  eyebrow: { color: colors.status.warning, fontSize: 32 / 2.6, textTransform: 'uppercase', letterSpacing: 1.5, fontWeight: '700' },
  activeShare: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: colors.neutral.slate300,
    backgroundColor: colors.neutral.indigo50,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
    color: colors.neutral.slate600,
    fontSize: 16 / 1.2,
    fontWeight: '700',
  },
  title: { color: colors.neutral.slate950, fontSize: 58 / 1.6, fontWeight: '700' },
  subtitle: { color: colors.neutral.slate600, fontSize: 17 },
  card: {
    borderWidth: 1,
    borderColor: colors.neutral.slate300,
    borderRadius: 16,
    backgroundColor: colors.neutral.white,
    padding: 18,
    gap: 8,
  },
  cardLabel: { color: colors.neutral.slate600, fontSize: 16 / 1.1, letterSpacing: 1.6, textTransform: 'uppercase', fontWeight: '700' },
  cardValue: { color: colors.neutral.slate950, fontSize: 48 / 1.6, fontWeight: '700' },
  cardBody: { color: colors.neutral.slate600, fontSize: 18 / 1.2 },
  primaryButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.accent.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryLabel: { color: colors.neutral.white, fontSize: 32 / 2.2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
  secondaryButton: {
    alignSelf: 'flex-start',
    minWidth: 230,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.accent.secondary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  secondaryLabel: { color: colors.accent.secondary, fontSize: 32 / 2.2, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1.2 },
});
