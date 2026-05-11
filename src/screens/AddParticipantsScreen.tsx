import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppShell } from '../ui/AppShell';
import { ActionButton } from '../ui/ActionButton';
import { LabeledField } from '../ui/LabeledField';
import { SurfaceCard } from '../ui/SurfaceCard';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';
import { useLedgerSession } from '../state/ledgerSession';
import { colors, screenAccents } from '../theme/colors';

export function AddParticipantsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { snapshot, addParticipant, completeSetup, clearSetupState } = useLedgerSession();
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');

  const participants = useMemo(
    () => snapshot.balanceSummary.participants.map((participant) => participant.displayName),
    [snapshot.balanceSummary.participants],
  );

  async function handleAdd() {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    try {
      await addParticipant({ displayName: trimmed });
      setName('');
      setMessage(`Added ${trimmed}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to add participant.');
    }
  }

  return (
    <AppShell
      eyebrow="Onboarding"
      title="Add Participants"
      description="Add people to your share before entering expenses."
      accent={screenAccents.setup}
      activeRoute={APP_ROUTES.homeDashboard}
      onNavigate={(routeName) => navigation.navigate(routeName)}
      enableShellNav
    >
      <LabeledField label="Participant name" value={name} onChangeText={setName} placeholder="Sarah Johnson" />
      <ActionButton tone="secondary" label="Add" onPress={() => void handleAdd()} />
      <View style={styles.list}>
        {participants.map((participant) => (
          <SurfaceCard key={participant}>
            <Text style={styles.name}>{participant}</Text>
          </SurfaceCard>
        ))}
      </View>
      <ActionButton
        label="Continue to Home"
        disabled={participants.length === 0}
        onPress={() => {
          completeSetup();
          clearSetupState();
          navigation.navigate(APP_ROUTES.homeDashboard);
        }}
      />
      <ActionButton tone="secondary" label="Back" onPress={() => navigation.navigate(APP_ROUTES.createShare)} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  name: {
    color: colors.text.strong,
    fontSize: 15,
    fontWeight: '700',
  },
  message: {
    color: colors.text.link,
    fontSize: 13,
  },
});
