import { createLedgerAppService } from '../../src/mobile/services/ledgerAppService';
import { createSetupController } from '../../src/mobile/controllers/setupController';
import { getDefaultParticipantIcon } from '../../src/mobile/utils/participantIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colorTokens, radiusTokens, spacingTokens } from '../../src/mobile/theme/tokens';
import { FormTextInput } from '../../src/mobile/components/FormFields';
import { Button } from '../../src/mobile/components/Button';
import { BottomActionBar, ScreenScroll } from '../../src/mobile/components/AppScaffold';
import { layoutTokens } from '../../src/mobile/theme/layout';
import { ScreenHeader } from '../../src/mobile/components/ScreenHeader';

const controller = createSetupController(createLedgerAppService());
const appService = createLedgerAppService();

export function addParticipantDraft(displayName: string): string[] {
  controller.addParticipantDraft(displayName);
  return controller.getParticipantDrafts();
}

function removeParticipantDraftAt(index: number): string[] {
  return controller.removeParticipantDraftAt(index);
}

export default function ParticipantsScreen(): JSX.Element {
  const router = useRouter();
  const params = useLocalSearchParams<{ ledgerId?: string; ownerName?: string }>();
  const ownerName = (params.ownerName ?? '').trim();
  const selectedLedgerId = (params.ledgerId ?? '').trim();
  const [draftName, setDraftName] = useState('');
  const [participantDrafts, setParticipantDrafts] = useState<string[]>(controller.getParticipantDrafts());
  const [existingParticipants, setExistingParticipants] = useState<
    Array<{ participantId: string; displayName: string; isOwner: boolean }>
  >([]);
  const [error, setError] = useState<string | null>(null);

  const totalParticipants = (existingParticipants.length > 0 ? existingParticipants.length : ownerName ? 1 : 0) + participantDrafts.length;

  useEffect(() => {
    if (!selectedLedgerId) {
      setExistingParticipants([]);
      return;
    }

    void (async () => {
      try {
        const snapshot = await appService.loadHomeSnapshot({ selectedLedgerId });
        const owner = snapshot.organizerName.trim().toLowerCase();
        setExistingParticipants(
          snapshot.balanceSummary.participants.map((participant) => ({
            participantId: participant.participantId,
            displayName: participant.displayName,
            isOwner: participant.displayName.trim().toLowerCase() === owner,
          })),
        );
      } catch {
        setExistingParticipants([]);
      }
    })();
  }, [selectedLedgerId]);

  function onAddPress(): void {
    try {
      setError(null);
      const updatedDrafts = addParticipantDraft(draftName);
      setParticipantDrafts(updatedDrafts);
      setDraftName('');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to add participant');
    }
  }

  function onRemoveDraftPress(index: number): void {
    setError(null);
    setParticipantDrafts(removeParticipantDraftAt(index));
  }

  async function onContinuePress(): Promise<void> {
    try {
      setError(null);
      await controller.commitParticipantDrafts(selectedLedgerId);
      router.replace('/(tabs)');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to continue');
    }
  }

  async function onRemoveExistingParticipantPress(participantId: string): Promise<void> {
    try {
      setError(null);
      await appService.removeParticipant({ participantId, selectedLedgerId });
      const snapshot = await appService.loadHomeSnapshot({ selectedLedgerId });
      const owner = snapshot.organizerName.trim().toLowerCase();
      setExistingParticipants(
        snapshot.balanceSummary.participants.map((participant) => ({
          participantId: participant.participantId,
          displayName: participant.displayName,
          isOwner: participant.displayName.trim().toLowerCase() === owner,
        })),
      );
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Unable to remove participant');
    }
  }

  return (
    <View style={styles.root}>
      <ScreenScroll topInsetOffset={spacingTokens.lg} bottomInsetOffset={layoutTokens.formBottomBarReserve}>
        <ScreenHeader title="Add Participants" subtitle="Add people to your share" onBack={() => router.back()} />
        <View style={styles.addRow}>
          <View style={styles.inputWrap}>
            <FormTextInput
              accessibilityLabel="Participant name"
              placeholder="Enter participant name"
              value={draftName}
              onChangeText={setDraftName}
              style={styles.input}
            />
          </View>
          <Button onPress={onAddPress} style={styles.addButton}>
            Add
          </Button>
        </View>

      {existingParticipants.length > 0
        ? existingParticipants.map((participant) => (
            <View key={participant.participantId} style={styles.participantCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getDefaultParticipantIcon(participant.displayName)}</Text>
              </View>
              <View style={styles.participantTextWrap}>
                <Text style={styles.participantName}>{participant.isOwner ? 'You (Owner)' : participant.displayName}</Text>
                {participant.isOwner ? <Text style={styles.participantHint}>Auto-added</Text> : null}
              </View>
              {participant.isOwner ? (
                <Text style={styles.ownerBadge}>♛</Text>
              ) : (
                <Pressable
                  onPress={() => {
                    void onRemoveExistingParticipantPress(participant.participantId);
                  }}
                  hitSlop={10}
                  accessibilityRole="button"
                >
                  <Text style={styles.removeIcon}>✕</Text>
                </Pressable>
              )}
            </View>
          ))
        : ownerName ? (
            <View style={styles.participantCard}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getDefaultParticipantIcon(ownerName)}</Text>
              </View>
              <View style={styles.participantTextWrap}>
                <Text style={styles.participantName}>You (Owner)</Text>
                <Text style={styles.participantHint}>Auto-added</Text>
              </View>
              <Text style={styles.ownerBadge}>♛</Text>
            </View>
          ) : null}

      {participantDrafts.map((participant, index) => (
        <View key={`${participant}-${index}`} style={styles.participantCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getDefaultParticipantIcon(participant)}</Text>
          </View>
          <View style={styles.participantTextWrap}>
            <Text style={styles.participantName}>{participant}</Text>
          </View>
          <Pressable onPress={() => onRemoveDraftPress(index)} hitSlop={10} accessibilityRole="button">
            <Text style={styles.removeIcon}>✕</Text>
          </Pressable>
        </View>
      ))}

        <Text style={styles.totalInline}>Total: {totalParticipants}</Text>
        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScreenScroll>

      <BottomActionBar>
        <Button fullWidth onPress={onContinuePress}>Done</Button>
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
  totalInline: {
    color: colorTokens.textMuted,
    fontSize: 14,
    marginTop: spacingTokens.xs,
  },
  addRow: {
    flexDirection: 'row',
    gap: spacingTokens.sm,
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1,
  },
  input: {
    marginBottom: 0,
  },
  addButton: {
    minWidth: 84,
  },
  participantCard: {
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.lg,
    backgroundColor: colorTokens.card,
    padding: spacingTokens.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingTokens.sm,
  },
  avatar: {
    height: 36,
    width: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorTokens.subtleSurface,
  },
  avatarText: {
    fontSize: 20,
  },
  participantTextWrap: {
    flex: 1,
    gap: 2,
  },
  participantName: {
    color: colorTokens.textPrimary,
    fontSize: 18,
  },
  participantHint: {
    color: colorTokens.textMuted,
  },
  ownerBadge: {
    color: colorTokens.textMuted,
    fontSize: 18,
  },
  removeIcon: {
    color: colorTokens.textMuted,
    fontSize: 20,
  },
  error: {
    color: colorTokens.destructive,
  },
});
