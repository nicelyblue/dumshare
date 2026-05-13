import { createLedgerAppService } from '../../src/mobile/services/ledgerAppService';
import { createSetupController } from '../../src/mobile/controllers/setupController';
import { ParticipantList } from '../../src/mobile/components/ParticipantList';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colorTokens, radiusTokens, spacingTokens, touchTarget } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';

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
      <Text style={styles.ownerHint}>Owner is highlighted automatically in participant rows.</Text>
      <TextInput
        accessibilityLabel="Participant name"
        placeholder="Alex"
        value={draftName}
        onChangeText={setDraftName}
        style={styles.input}
      />
      <Pressable onPress={onAddPress} style={styles.secondaryButton} accessibilityRole="button">
        <Text style={styles.secondaryButtonText}>+ Add participant</Text>
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
    backgroundColor: colorTokens.appBackground,
    padding: spacingTokens.lg,
    gap: spacingTokens.md,
  },
  title: {
    ...typographyTokens.heading,
  },
  ownerHint: {
    ...typographyTokens.label,
    color: colorTokens.accent,
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
  secondaryButton: {
    borderWidth: 1,
    borderColor: colorTokens.border,
    backgroundColor: colorTokens.card,
    borderRadius: radiusTokens.md,
    minHeight: touchTarget.minimum,
    paddingVertical: spacingTokens.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: colorTokens.textPrimary,
    fontWeight: '600',
  },
  button: {
    marginTop: 8,
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
  error: {
    color: colorTokens.destructive,
  },
});
