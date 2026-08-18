import { createLedgerAppService } from '../../src/mobile/services/ledgerAppService';
import { createSetupController } from '../../src/mobile/controllers/setupController';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacingTokens } from '../../src/mobile/theme/tokens';
import { setActiveShareId } from '../../src/mobile/state/activeShareStore';
import { FormTextInput } from '../../src/mobile/components/FormFields';
import { Button } from '../../src/mobile/components/Button';
import { BottomActionBar, ScreenScroll } from '../../src/mobile/components/AppScaffold';
import { layoutTokens } from '../../src/mobile/theme/layout';
import { ScreenHeader } from '../../src/mobile/components/ScreenHeader';
import { useTheme } from '../../src/mobile/theme/useTheme';

const controller = createSetupController(createLedgerAppService());

export async function submitCreateShare(title: string, organizerName: string, nextStep: 'add-now' | 'later') {
  return controller.handleCreateShare({ title, organizerName, nextStep });
}

export default function CreateShareScreen(): JSX.Element {
  const router = useRouter();
  const { colors } = useTheme();
  const [title, setTitle] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const nextStep: 'add-now' = 'add-now';
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const styles = useMemo(() => StyleSheet.create({
    root: {
      flex: 1,
      backgroundColor: colors.appBackground,
    },
    error: {
      color: colors.destructive,
      fontSize: 14,
    },
  }), [colors]);

  async function onCreatePress(): Promise<void> {
    if (isSubmitting) {
      return;
    }
    try {
      setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
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
        <Button fullWidth loading={isSubmitting} onPress={onCreatePress}>Create Share</Button>
      </BottomActionBar>
    </View>
  );
}
