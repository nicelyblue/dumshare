import { createLedgerAppService } from '../../src/mobile/services/ledgerAppService';
import { createSetupController } from '../../src/mobile/controllers/setupController';
import { ParticipantList } from '../../src/mobile/components/ParticipantList';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const controller = createSetupController(createLedgerAppService());

export function addParticipantDraft(displayName: string): string[] {
  controller.addParticipantDraft(displayName);
  return controller.getParticipantDrafts();
}

export default function ParticipantsScreen(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ ledgerId?: string }>();
  const [draftName, setDraftName] = useState('');
  const [participants, setParticipants] = useState<string[]>(controller.getParticipantDrafts());
  const [error, setError] = useState<string | null>(null);

  function onAddPress(): void {
    try {
      setError(null);
      setParticipants(addParticipantDraft(draftName));
      setDraftName('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to add participant');
    }
  }

  async function onContinuePress(): Promise<void> {
    try {
      setError(null);
      await controller.commitParticipantDrafts(params.ledgerId ?? '');
      router.replace('/(tabs)');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to continue');
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Add Participants</Text>
      <TextInput
        accessibilityLabel="Participant name"
        placeholder="Alex"
        value={draftName}
        onChangeText={setDraftName}
        style={styles.input}
      />
      <Pressable onPress={onAddPress} style={styles.secondaryButton} accessibilityRole="button">
        <Text style={styles.secondaryButtonText}>Add participant</Text>
      </Pressable>
      <ParticipantList participants={participants} />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={onContinuePress} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>Continue to app</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    gap: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#ffffff',
  },
  secondaryButton: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#0f172a',
    fontWeight: '600',
  },
  button: {
    marginTop: 8,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#f8fafc',
    fontWeight: '600',
  },
  error: {
    color: '#b91c1c',
  },
});
