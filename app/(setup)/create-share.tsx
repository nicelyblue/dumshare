import { createLedgerAppService } from '../../src/mobile/services/ledgerAppService';
import { createSetupController } from '../../src/mobile/controllers/setupController';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colorTokens, spacingTokens } from '../../src/mobile/theme/tokens';
import { setActiveShareId } from '../../src/mobile/state/activeShareStore';
import { FormTextInput } from '../../src/mobile/components/FormFields';
import { Button } from '../../src/mobile/components/Button';
import { BottomActionBar, ScreenScroll } from '../../src/mobile/components/AppScaffold';
import { layoutTokens } from '../../src/mobile/theme/layout';
import { ScreenHeader } from '../../src/mobile/components/ScreenHeader';

const controller = createSetupController(createLedgerAppService());

export async function submitCreateShare(title: string, organizerName: string, nextStep: 'add-now' | 'later') {
  return controller.handleCreateShare({ title, organizerName, nextStep });
}

export default function CreateShareScreen(): JSX.Element {
  const router = useRouter();
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
      <ScreenScroll topInsetOffset={spacingTokens.lg} bottomInsetOffset={layoutTokens.formBottomBarReserve}>
        <ScreenHeader title="Create a Share" subtitle="Set up your expense sharing group" onBack={() => router.back()} />

        <FormTextInput
          label="Share Name"
          accessibilityLabel="Share title"
          placeholder="e.g., Weekend Trip, Office Lunch"
          value={title}
          onChangeText={setTitle}
        />

        <FormTextInput
          label="Your Name"
          accessibilityLabel="Organizer name"
          placeholder="Enter your name"
          value={organizerName}
          onChangeText={setOrganizerName}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScreenScroll>

      <BottomActionBar>
        <Button fullWidth onPress={onCreatePress}>Create Share</Button>
      </BottomActionBar>
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
  content: {
    gap: spacingTokens.md,
  },
  error: {
    color: colorTokens.destructive,
    fontSize: 14,
  },
});
