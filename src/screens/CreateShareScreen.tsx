import React, { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppShell } from '../ui/AppShell';
import { ActionButton } from '../ui/ActionButton';
import { LabeledField } from '../ui/LabeledField';
import { Text } from 'react-native';
import { colors } from '../theme/colors';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';
import { useLedgerSession } from '../state/ledgerSession';
import { screenAccents } from '../theme/colors';

export function CreateShareScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { createLedger } = useLedgerSession();
  const [title, setTitle] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [message, setMessage] = useState('');

  async function handleCreate() {
    try {
      setMessage('');
      await createLedger({
        title: title.trim(),
        organizerName: organizerName.trim(),
        settlementContext: 'per-currency',
      });
      navigation.navigate(APP_ROUTES.addParticipants);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create share.');
    }
  }

  return (
    <AppShell
      eyebrow="Onboarding"
      title="Create a Share"
      description="Set up a new expense sharing group."
      accent={screenAccents.setup}
      activeRoute={APP_ROUTES.homeDashboard}
      onNavigate={(routeName) => navigation.navigate(routeName)}
      enableShellNav
    >
      <LabeledField label="Share Name" value={title} onChangeText={setTitle} placeholder="Weekend Trip 2026" />
      <LabeledField label="Owner Name" value={organizerName} onChangeText={setOrganizerName} placeholder="Your name" />
      <ActionButton label="Create Share" onPress={() => void handleCreate()} disabled={!title.trim() || !organizerName.trim()} />
      <ActionButton tone="secondary" label="Back" onPress={() => navigation.navigate(APP_ROUTES.welcome)} />
      {message ? <Text style={{ color: colors.status.danger, fontSize: 13 }}>{message}</Text> : null}
    </AppShell>
  );
}
