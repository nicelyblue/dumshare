import { createLedgerAppService } from '../../src/mobile/services/ledgerAppService';
import { createSetupController } from '../../src/mobile/controllers/setupController';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colorTokens, radiusTokens, spacingTokens, touchTarget } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';

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
      <Text style={styles.sectionLabel}>Share Name</Text>
      <TextInput
        accessibilityLabel="Share title"
        placeholder="Weekend trip"
        value={title}
        onChangeText={setTitle}
        style={styles.input}
      />
      <Text style={styles.sectionLabel}>Owner Name</Text>
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
        <Text style={styles.buttonText}>Create Share</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colorTokens.appBackground,
    padding: spacingTokens.lg,
    gap: spacingTokens.md,
  },
  title: {
    ...typographyTokens.heading,
  },
  sectionLabel: {
    ...typographyTokens.sectionLabel,
  },
  input: {
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.md,
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.md,
    backgroundColor: colorTokens.inputBackground,
    minHeight: touchTarget.minimum,
  },
  choiceRow: {
    gap: 6,
  },
  choice: {
    paddingVertical: 6,
  },
  choiceLabel: {
    color: colorTokens.textPrimary,
  },
  error: {
    color: colorTokens.destructive,
  },
  button: {
    marginTop: 6,
    backgroundColor: colorTokens.inverse,
    borderRadius: radiusTokens.md,
    minHeight: touchTarget.minimum,
    paddingVertical: spacingTokens.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: colorTokens.card,
    fontWeight: '600',
  },
});
