import { createLedgerAppService } from '../../src/mobile/services/ledgerAppService';
import { createSetupController } from '../../src/mobile/controllers/setupController';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colorTokens, radiusTokens, spacingTokens, touchTarget } from '../../src/mobile/theme/tokens';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { setActiveShareId } from '../../src/mobile/state/activeShareStore';

const controller = createSetupController(createLedgerAppService());

export async function submitCreateShare(title: string, organizerName: string, nextStep: 'add-now' | 'later') {
  return controller.handleCreateShare({ title, organizerName, nextStep });
}

export default function CreateShareScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [title, setTitle] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const nextStep: 'add-now' = 'add-now';
  const [error, setError] = useState<string | null>(null);

  async function onCreatePress(): Promise<void> {
    try {
      setError(null);
      const result = await submitCreateShare(title, organizerName, nextStep);
      setActiveShareId(result.ledgerId);
      if (result.nextStep === 'add-now') {
        router.push({
          pathname: '/(setup)/participants',
          params: { ledgerId: result.ledgerId, ownerName: organizerName.trim() },
        });
        return;
      }
      router.replace('/(tabs)');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to create share');
    }
  }

  return (
    <View style={styles.root}>
      <ScrollView
        style={[
          styles.screen,
          {
            paddingTop: insets.top + spacingTokens.lg,
          },
        ]}
        contentContainerStyle={[
          styles.content,
          {
            paddingBottom: insets.bottom + 112,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable onPress={() => router.back()} style={styles.backButton} accessibilityRole="button" accessibilityLabel="Go back">
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>

        <Text style={styles.title}>Create a Share</Text>
        <Text style={styles.subtitle}>Set up your expense sharing group</Text>

        <Text style={styles.sectionLabel}>Share Name</Text>
        <TextInput
          accessibilityLabel="Share title"
          placeholder="e.g., Weekend Trip, Office Lunch"
          placeholderTextColor="#9E9E9E"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
        />

        <Text style={styles.sectionLabel}>Your Name</Text>
        <TextInput
          accessibilityLabel="Organizer name"
          placeholder="Enter your name"
          placeholderTextColor="#9E9E9E"
          value={organizerName}
          onChangeText={setOrganizerName}
          style={styles.input}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + spacingTokens.md,
          },
        ]}
      >
        <Pressable onPress={onCreatePress} style={styles.button} accessibilityRole="button">
          <Text style={styles.buttonText}>✓  Create Share</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colorTokens.card,
  },
  screen: {
    flex: 1,
    backgroundColor: colorTokens.card,
  },
  backButton: {
    width: 40,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: radiusTokens.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorTokens.card,
  },
  backButtonText: {
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '600',
    color: colorTokens.textPrimary,
  },
  content: {
    paddingHorizontal: spacingTokens.lg,
    gap: spacingTokens.md,
  },
  title: {
    fontSize: 34,
    lineHeight: 38,
    color: colorTokens.textPrimary,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 17,
    lineHeight: 22,
    color: colorTokens.textPrimary,
    fontWeight: '500',
    marginTop: spacingTokens.sm,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: colorTokens.textMuted,
    marginBottom: spacingTokens.md,
  },
  input: {
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.md,
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.sm,
    backgroundColor: colorTokens.card,
    minHeight: touchTarget.minimum,
    fontSize: 16,
    color: colorTokens.textPrimary,
  },
  error: {
    color: colorTokens.destructive,
    fontSize: 14,
  },
  button: {
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
    fontSize: 17,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacingTokens.lg,
    paddingTop: spacingTokens.sm,
    backgroundColor: colorTokens.card,
  },
});
