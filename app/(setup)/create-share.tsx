import { createLedgerAppService } from '../../src/mobile/services/ledgerAppService';
import { createSetupController } from '../../src/mobile/controllers/setupController';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

const controller = createSetupController(createLedgerAppService());

export async function submitCreateShare(title: string, organizerName: string, nextStep: 'add-now' | 'later') {
  return controller.handleCreateShare({ title, organizerName, nextStep });
}

export default function CreateShareScreen(): JSX.Element {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [nextStep, setNextStep] = useState<'add-now' | 'later'>('add-now');
  const [error, setError] = useState<string | null>(null);

  async function onCreatePress(): Promise<void> {
    try {
      setError(null);
      const result = await submitCreateShare(title, organizerName, nextStep);
      if (result.nextStep === 'add-now') {
        router.push({ pathname: '/(setup)/participants', params: { ledgerId: result.ledgerId } });
        return;
      }
      router.replace('/(tabs)');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create share');
    }
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Create Share</Text>
      <TextInput
        accessibilityLabel="Share title"
        placeholder="Weekend trip"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <TextInput
        accessibilityLabel="Organizer name"
        placeholder="You"
        value={organizerName}
        onChangeText={setOrganizerName}
        style={styles.input}
      />
      <View style={styles.choiceRow}>
        <Pressable onPress={() => setNextStep('add-now')} style={styles.choice} accessibilityRole="button">
          <Text style={styles.choiceLabel}>{nextStep === 'add-now' ? '●' : '○'} Add participants now</Text>
        </Pressable>
        <Pressable onPress={() => setNextStep('later')} style={styles.choice} accessibilityRole="button">
          <Text style={styles.choiceLabel}>{nextStep === 'later' ? '●' : '○'} Add participants later</Text>
        </Pressable>
      </View>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable onPress={onCreatePress} style={styles.button} accessibilityRole="button">
        <Text style={styles.buttonText}>Create share</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
    gap: 12,
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
  choiceRow: {
    gap: 6,
  },
  choice: {
    paddingVertical: 6,
  },
  choiceLabel: {
    color: '#1e293b',
  },
  error: {
    color: '#b91c1c',
  },
  button: {
    marginTop: 6,
    backgroundColor: '#0f172a',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#f8fafc',
    fontWeight: '600',
  },
});
