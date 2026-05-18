import { createLedgerAppService } from '../../src/mobile/services/ledgerAppService';
import { createSetupController } from '../../src/mobile/controllers/setupController';
import { getDefaultParticipantIcon } from '../../src/mobile/utils/participantIcons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { colorTokens, radiusTokens, spacingTokens, touchTarget } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();
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

        <Text style={styles.title}>Add Participants</Text>
        <Text style={styles.subtitle}>Add people to your share</Text>
        <View style={styles.addRow}>
          <View style={styles.inputWrap}>
            <TextInput
              accessibilityLabel="Participant name"
              placeholder="Enter participant name"
              value={draftName}
              onChangeText={setDraftName}
              style={styles.input}
            />
          </View>
          <Pressable onPress={onAddPress} style={styles.addButton} accessibilityRole="button">
            <Text style={styles.addButtonText}>＋</Text>
          </Pressable>
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
      </ScrollView>

      <View
        style={[
          styles.bottomBar,
          {
            paddingBottom: insets.bottom + spacingTokens.md,
          },
        ]}
      >
        <Pressable onPress={onContinuePress} style={styles.button} accessibilityRole="button">
          <Text style={styles.buttonText}>Done</Text>
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
    paddingHorizontal: spacingTokens.lg,
  },
  content: {
    gap: spacingTokens.md,
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
    color: colorTokens.textPrimary,
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '600',
  },
  title: {
    ...typographyTokens.heading,
  },
  subtitle: {
    ...typographyTokens.label,
    color: colorTokens.textPrimary,
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
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: radiusTokens.md,
    backgroundColor: colorTokens.card,
    minHeight: touchTarget.minimum,
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacingTokens.md,
    paddingLeft: spacingTokens.md,
  },
  input: {
    flex: 1,
    paddingVertical: spacingTokens.md,
    color: colorTokens.textPrimary,
  },
  addButton: {
    minHeight: touchTarget.minimum,
    width: touchTarget.minimum,
    borderRadius: radiusTokens.md,
    backgroundColor: colorTokens.inverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: colorTokens.card,
    fontSize: 24,
    lineHeight: 24,
  },
  participantCard: {
    borderWidth: 1,
    borderColor: '#D9D9D9',
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
    backgroundColor: '#F2F2F2',
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
  error: {
    color: colorTokens.destructive,
  },
});
