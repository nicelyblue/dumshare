import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppShell } from '../ui/AppShell';
import { ActionButton } from '../ui/ActionButton';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';
import { useLedgerSession } from '../state/ledgerSession';
import { colors } from '../theme/colors';

export function WelcomeScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { snapshot } = useLedgerSession();

  return (
    <AppShell
      eyebrow="Welcome"
      title="Dumshare"
      description="Welcome to Dumshare!"
      accent={colors.text.primary}
      activeRoute={APP_ROUTES.homeDashboard}
      onNavigate={(routeName) => navigation.navigate(routeName)}
      enableShellNav
    >
      <View style={styles.centerWrap}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconGlyph}>⟲</Text>
        </View>
        <Text style={styles.textBody}>You haven't created your first Share yet. Get started by creating a Share to track expenses with friends.</Text>
      </View>
      <ActionButton label="Create Share" onPress={() => navigation.navigate(APP_ROUTES.createShare)} fullWidth />
      {snapshot.hasLedger ? (
        <ActionButton tone="secondary" label="Go to Dashboard" onPress={() => navigation.navigate(APP_ROUTES.homeDashboard)} fullWidth />
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  centerWrap: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 10,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.background.panelSoft,
    borderWidth: 1,
    borderColor: colors.border.default,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    color: colors.text.muted,
    fontSize: 34,
    fontWeight: '700',
  },
  textBody: {
    textAlign: 'center',
    color: colors.text.muted,
    fontSize: 15,
    lineHeight: 22,
  },
});
