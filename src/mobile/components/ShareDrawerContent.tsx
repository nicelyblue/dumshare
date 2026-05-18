import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createShareMenuController } from '../controllers/shareMenuController';
import { createShareActionsController } from '../controllers/shareActionsController';
import { createLedgerAppService } from '../services/ledgerAppService';
import {
  getThemePreference,
  setThemePreference,
  subscribeThemePreference,
  type ThemePreference,
} from '../state/preferencesStore';
import { getActiveShareState, subscribeActiveShare } from '../state/activeShareStore';
import { LongPressActionSheet, type ActionSheetOption } from './LongPressActionSheet';
import { getDefaultParticipantIcon, getParticipantIconOptions } from '../utils/participantIcons';

const appService = createLedgerAppService();

const shareMenuController = createShareMenuController({
  listShares: async () => {
    const shares = await appService.listShares();
    return shares.map((share) => ({
      ledgerId: share.id,
      title: share.title,
      createdAt: share.organizerName,
    }));
  },
  deleteShare: (ledgerId: string) => appService.deleteShare(ledgerId),
  clearAllData: async () => {
    const shares = await appService.listShares();
    await Promise.all(shares.map((share) => appService.deleteShare(share.id)));
  },
});

const shareActionsController = createShareActionsController({
  deleteShare: (ledgerId: string) => shareMenuController.deleteShare(ledgerId),
  makeActive: (ledgerId: string) => shareMenuController.switchActiveShare(ledgerId),
  editShare: async () => undefined,
});

export type ShareDrawerContentModel = {
  shares: Array<{
    ledgerId: string;
    title: string;
    createdAt: string;
    active: boolean;
    participantCount: number;
    expenseCount: number;
  }>;
  theme: ThemePreference;
  participants: Array<{ participantId: string; displayName: string; isOwner: boolean }>;
};

type ShareDrawerContentProps = {
  onClose?: () => void;
};

export async function buildShareDrawerContent(activeShareId: string | null): Promise<ShareDrawerContentModel> {
  const [shares, homeSnapshot] = await Promise.all([
    shareMenuController.loadShares(activeShareId),
    appService.loadHomeSnapshot({ selectedLedgerId: activeShareId }),
  ]);

  const shareStats = await Promise.all(
    shares.map(async (share) => {
      const [shareSnapshot, shareHistory] = await Promise.all([
        appService.loadHomeSnapshot({ selectedLedgerId: share.ledgerId }),
        appService.loadLedgerHistory({ selectedLedgerId: share.ledgerId }),
      ]);

      return {
        ledgerId: share.ledgerId,
        participantCount: shareSnapshot.participantCount,
        expenseCount: shareHistory.entries.length,
      };
    }),
  );

  const statsByLedgerId = new Map(shareStats.map((entry) => [entry.ledgerId, entry]));

  return {
    shares: shares.map((share) => {
      const stats = statsByLedgerId.get(share.ledgerId);
      return {
        ...share,
        participantCount: stats?.participantCount ?? 0,
        expenseCount: stats?.expenseCount ?? 0,
      };
    }),
    theme: getThemePreference(),
    participants: homeSnapshot.balanceSummary.participants.map((participant) => ({
      participantId: participant.participantId,
      displayName: participant.displayName,
      isOwner: participant.displayName === homeSnapshot.organizerName,
    })),
  };
}

function getThemeLabel(theme: ThemePreference): string {
  if (theme === 'light') {
    return 'Light';
  }
  if (theme === 'dark') {
    return 'Dark';
  }
  return 'System';
}

export function getShareLongPressOptions(ledgerId: string, activeShareId: string | null): ActionSheetOption[] {
  return shareActionsController.getActions({ ledgerId, activeShareId }).map((action) => ({
    key: action,
    label:
      action === 'make-active'
        ? 'Make active'
        : action === 'edit'
          ? 'Edit share'
          : 'Delete share permanently',
    destructive: action === 'delete',
  }));
}

function getParticipantLongPressOptions(isOwner: boolean): ActionSheetOption[] {
  return [
    { key: 'pick-icon', label: 'Pick icon' },
    { key: 'rename', label: 'Rename participant' },
    ...(isOwner ? [] : [{ key: 'remove', label: 'Remove participant', destructive: true }]),
  ];
}

function buildParticipantIconOptions(displayName: string): ActionSheetOption[] {
  return getParticipantIconOptions(displayName).map((icon) => ({ key: icon, label: `${icon} ${displayName}` }));
}

export default function ShareDrawerContent({ onClose }: ShareDrawerContentProps): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [activeShareId, setActiveShareId] = useState<string | null>(getActiveShareState().activeShareId);
  const [theme, setTheme] = useState<ThemePreference>(getThemePreference());
  const [shares, setShares] = useState<
    Array<{
      ledgerId: string;
      title: string;
      createdAt: string;
      active: boolean;
      participantCount: number;
      expenseCount: number;
    }>
  >([]);
  const [participants, setParticipants] = useState<Array<{ participantId: string; displayName: string; isOwner: boolean }>>([]);
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editingParticipantName, setEditingParticipantName] = useState('');
  const [selectedShareId, setSelectedShareId] = useState<string | null>(null);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string | null>(null);
  const [iconPickerParticipantId, setIconPickerParticipantId] = useState<string | null>(null);
  const [themePickerOpen, setThemePickerOpen] = useState(false);
  const [participantIconById, setParticipantIconById] = useState<Record<string, string>>({});

  const longPressOptions = useMemo(
    () => (selectedShareId ? getShareLongPressOptions(selectedShareId, activeShareId) : []),
    [selectedShareId, activeShareId],
  );

  const participantLongPressOptions = useMemo(() => {
    if (!selectedParticipantId) {
      return [];
    }
    const participant = participants.find((entry) => entry.participantId === selectedParticipantId);
    if (!participant) {
      return [];
    }
    return getParticipantLongPressOptions(participant.isOwner);
  }, [selectedParticipantId, participants]);

  const participantIconOptions = useMemo(() => {
    if (!iconPickerParticipantId) {
      return [];
    }
    const participant = participants.find((entry) => entry.participantId === iconPickerParticipantId);
    if (!participant) {
      return [];
    }
    return buildParticipantIconOptions(participant.displayName);
  }, [iconPickerParticipantId, participants]);

  const themeOptions = useMemo<ActionSheetOption[]>(
    () => [
      { key: 'light', label: theme === 'light' ? 'Light (current)' : 'Light' },
      { key: 'dark', label: theme === 'dark' ? 'Dark (current)' : 'Dark' },
      { key: 'system', label: theme === 'system' ? 'System (current)' : 'System' },
    ],
    [theme],
  );

  useEffect(() => subscribeThemePreference(setTheme), []);
  useEffect(() => subscribeActiveShare((state) => setActiveShareId(state.activeShareId)), []);

  useEffect(() => {
    void buildShareDrawerContent(activeShareId).then((model) => {
      setShares(model.shares);
      setTheme(model.theme);
      setParticipants(model.participants);
    });
  }, [activeShareId]);

  useEffect(() => {
    setParticipantIconById((current) => {
      const next: Record<string, string> = {};
      for (const participant of participants) {
        next[participant.participantId] = current[participant.participantId] ?? getDefaultParticipantIcon(participant.displayName);
      }
      return next;
    });
  }, [participants]);

  async function reloadModel(): Promise<void> {
    const model = await buildShareDrawerContent(activeShareId);
    setShares(model.shares);
    setTheme(model.theme);
    setParticipants(model.participants);
  }

  function startParticipantEdit(participantId: string, currentName: string): void {
    setEditingParticipantId(participantId);
    setEditingParticipantName(currentName);
  }

  async function saveParticipantEdit(participantId: string): Promise<void> {
    const trimmed = editingParticipantName.trim();
    if (!trimmed) {
      Alert.alert('Rename participant', 'Participant name is required.');
      return;
    }

    try {
      await appService.renameParticipant({
        participantId,
        displayName: trimmed,
        selectedLedgerId: activeShareId,
      });
      setEditingParticipantId(null);
      setEditingParticipantName('');
      await reloadModel();
    } catch (caught) {
      Alert.alert('Rename participant', caught instanceof Error ? caught.message : 'Unable to rename participant.');
    }
  }

  function confirmRemoveParticipant(participantId: string, displayName: string): void {
    Alert.alert('Remove participant', `Remove ${displayName} from this share?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          void (async () => {
            try {
              await appService.removeParticipant({ participantId, selectedLedgerId: activeShareId });
              if (editingParticipantId === participantId) {
                setEditingParticipantId(null);
                setEditingParticipantName('');
              }
              await reloadModel();
            } catch (caught) {
              Alert.alert(
                'Remove participant',
                caught instanceof Error ? caught.message : 'Unable to remove participant.',
              );
            }
          })();
        },
      },
    ]);
  }

  function onParticipantLongPress(participantId: string): void {
    setSelectedParticipantId(participantId);
  }

  function runParticipantAction(action: string): void {
    if (!selectedParticipantId) {
      return;
    }

    const participant = participants.find((entry) => entry.participantId === selectedParticipantId);
    if (!participant) {
      return;
    }

    if (action === 'rename') {
      startParticipantEdit(participant.participantId, participant.displayName);
      setSelectedParticipantId(null);
      return;
    }

    if (action === 'pick-icon') {
      setIconPickerParticipantId(participant.participantId);
      setSelectedParticipantId(null);
      return;
    }

    confirmRemoveParticipant(participant.participantId, participant.displayName);
    setSelectedParticipantId(null);
  }

  function applyParticipantIcon(icon: string): void {
    if (!iconPickerParticipantId) {
      return;
    }
    setParticipantIconById((current) => ({ ...current, [iconPickerParticipantId]: icon }));
    setIconPickerParticipantId(null);
  }

  async function runShareAction(action: string): Promise<void> {
    if (!selectedShareId) {
      return;
    }

    if (action === 'edit') {
      Alert.alert('Edit share', 'Edit action wiring is ready; title input UI will be added in a follow-up step.');
      return;
    }

    if (action === 'make-active') {
      await shareActionsController.runAction('make-active', selectedShareId);
      return;
    }

    Alert.alert('Delete share', 'Delete this share permanently?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await shareActionsController.runAction('delete', selectedShareId);
          await reloadModel();
        },
      },
    ]);
  }

  function onResetPress(): void {
    Alert.alert('Delete all local app data?', 'This erases all shares and expenses on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete all',
        style: 'destructive',
        onPress: async () => {
          await shareMenuController.resetAllData('CONFIRM_DELETE_ALL');
          await reloadModel();
        },
      },
    ]);
  }

  const activeShare = shares.find((share) => share.active) ?? null;
  const inactiveShares = shares.filter((share) => !share.active);

  return (
    <>
      <View style={styles.drawerRoot}>
        <Pressable
          onPress={onClose}
          style={[
            styles.closeIconButton,
            {
              top: insets.top + 8,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Close menu"
        >
          <Text style={styles.closeIconText}>X</Text>
        </Pressable>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          {
            paddingTop: insets.top + 56,
            paddingBottom: insets.bottom + 16,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.menuHeader}>Menu</Text>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            Your Shares
          </Text>
          <Pressable
            style={styles.sectionAddButton}
            accessibilityRole="button"
            accessibilityLabel="Add share"
            onPress={() => {
              router.push('/(setup)/create-share');
              onClose?.();
            }}
          >
            <Text style={styles.sectionAddButtonText}>+</Text>
          </Pressable>
        </View>
        <View style={styles.list}>
        {activeShare ? (
          <Pressable
            key={activeShare.ledgerId}
            onPress={() => {
              void shareMenuController.switchActiveShare(activeShare.ledgerId);
            }}
            onLongPress={() => setSelectedShareId(activeShare.ledgerId)}
            style={[styles.shareRow, styles.shareRowActive]}
            accessibilityRole="button"
          >
            <Text style={styles.shareActiveLabel}>Active</Text>
            <Text style={[styles.shareTitle, styles.shareTitleOnDark]}>{activeShare.title}</Text>
            <View style={styles.shareCountsRow}>
              <Text style={styles.shareMetaOnDark}>👥 {activeShare.participantCount} people</Text>
              <Text style={styles.shareMetaOnDark}>🧾 {activeShare.expenseCount} expenses</Text>
            </View>
          </Pressable>
        ) : null}
        {inactiveShares.length > 0 ? (
          inactiveShares.map((share) => (
            <Pressable
              key={share.ledgerId}
              onPress={() => {
                void shareMenuController.switchActiveShare(share.ledgerId);
                onClose?.();
              }}
              onLongPress={() => setSelectedShareId(share.ledgerId)}
              style={[styles.shareRow, share.active ? styles.shareRowActive : null]}
              accessibilityRole="button"
            >
              <Text style={styles.shareTitle}>{share.title}</Text>
              <View style={styles.shareCountsRow}>
                <Text style={styles.shareMeta}>👥 {share.participantCount} people</Text>
                <Text style={styles.shareMeta}>🧾 {share.expenseCount} expenses</Text>
              </View>
            </Pressable>
          ))
        ) : !activeShare ? (
          <View style={styles.emptyStateBlock}>
            <Text style={styles.helper}>No shares yet.</Text>
            <Pressable
              style={styles.actionButton}
              accessibilityRole="button"
              onPress={() => {
                router.push('/(setup)/create-share');
                onClose?.();
              }}
            >
              <Text style={styles.actionButtonText}>Create your first share</Text>
            </Pressable>
          </View>
        ) : null}
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle} numberOfLines={1}>
            Participants
          </Text>
          <Pressable
            style={styles.sectionAddButton}
            accessibilityRole="button"
            accessibilityLabel="Add participant"
            onPress={() => {
              if (!activeShare) {
                Alert.alert('Add participant', 'Create or select a share first.');
                return;
              }
              router.push({
                pathname: '/(setup)/participants',
                params: {
                  ledgerId: activeShare.ledgerId,
                  ownerName: activeShare.createdAt,
                },
              });
              onClose?.();
            }}
          >
            <Text style={styles.sectionAddButtonText}>+</Text>
          </Pressable>
        </View>
        <View style={styles.list}>
        {participants.length > 0 ? (
          participants.map((participant) => (
            <View
              key={participant.participantId}
              style={[styles.participantRow, participant.isOwner ? styles.participantRowOwner : null]}
            >
              {editingParticipantId === participant.participantId ? (
                <View style={styles.participantEditBlock}>
                  <TextInput
                    value={editingParticipantName}
                    onChangeText={setEditingParticipantName}
                    style={styles.participantInput}
                    autoFocus
                    accessibilityLabel="Participant name"
                  />
                  <View style={styles.participantActionRow}>
                    <Pressable
                      onPress={() => {
                        void saveParticipantEdit(participant.participantId);
                      }}
                      style={[styles.participantActionButton, styles.participantActionPrimary]}
                      accessibilityRole="button"
                    >
                      <Text style={styles.participantActionPrimaryText}>Save</Text>
                    </Pressable>
                    <Pressable
                      onPress={() => {
                        setEditingParticipantId(null);
                        setEditingParticipantName('');
                      }}
                      style={styles.participantActionButton}
                      accessibilityRole="button"
                    >
                      <Text style={styles.participantActionText}>Cancel</Text>
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Pressable
                  onLongPress={() => onParticipantLongPress(participant.participantId)}
                  style={styles.participantPressable}
                  accessibilityRole="button"
                >
                  <View style={styles.participantHeaderRow}>
                    <View style={styles.participantIdentityRow}>
                      <View style={styles.participantAvatarBubble}>
                        <Text style={styles.participantAvatarText}>
                          {participantIconById[participant.participantId] ?? getDefaultParticipantIcon(participant.displayName)}
                        </Text>
                      </View>
                      <Text style={styles.shareTitle}>{participant.displayName}</Text>
                    </View>
                    {participant.isOwner ? <Text style={styles.shareMeta}>Owner</Text> : null}
                  </View>
                </Pressable>
              )}
            </View>
          ))
        ) : (
          <Text style={styles.helper}>No participants yet.</Text>
        )}
        </View>

        <View style={styles.sectionDivider} />

        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.list}>
          <Pressable
            style={[styles.actionButton, styles.quickActionButton]}
            accessibilityRole="button"
            onPress={() => setThemePickerOpen(true)}
          >
            <View style={styles.quickActionTextBlock}>
              <Text style={styles.quickActionTitle}>Pick Theme ({getThemeLabel(theme)})</Text>
            </View>
          </Pressable>

          <Pressable
            onPress={onResetPress}
            style={[styles.actionButton, styles.quickActionButton, styles.actionButtonDestructive]}
            accessibilityRole="button"
          >
            <Text style={[styles.actionButtonText, styles.actionButtonTextDestructive]}>Delete All Local Data</Text>
          </Pressable>
        </View>

      </ScrollView>
      </View>

      <LongPressActionSheet
        visible={selectedShareId !== null}
        title="Share actions"
        options={longPressOptions}
        onSelect={(key) => {
          void runShareAction(key);
        }}
        onClose={() => setSelectedShareId(null)}
      />
      <LongPressActionSheet
        visible={selectedParticipantId !== null}
        title="Participant actions"
        options={participantLongPressOptions}
        onSelect={(key) => {
          runParticipantAction(key);
        }}
        onClose={() => setSelectedParticipantId(null)}
      />
      <LongPressActionSheet
        visible={iconPickerParticipantId !== null}
        title="Pick participant icon"
        options={participantIconOptions}
        onSelect={(key) => {
          applyParticipantIcon(key);
        }}
        onClose={() => setIconPickerParticipantId(null)}
      />
      <LongPressActionSheet
        visible={themePickerOpen}
        title="Pick theme"
        options={themeOptions}
        onSelect={(key) => {
          if (key === 'light' || key === 'dark' || key === 'system') {
            setTheme(setThemePreference(key));
          }
          setThemePickerOpen(false);
        }}
        onClose={() => setThemePickerOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 14,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  drawerRoot: {
    flex: 1,
    position: 'relative',
  },
  closeIconButton: {
    position: 'absolute',
    right: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'lightgray',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  closeIconText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 18,
  },
  sectionTitle: {
    fontSize: 20,
    lineHeight: 26,
    fontWeight: '700',
    color: 'black',
    marginTop: 4,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionAddButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'lightgray',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
  },
  sectionAddButtonText: {
    color: 'black',
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '600',
  },
  menuHeader: {
    fontSize: 30,
    lineHeight: 34,
    fontWeight: '700',
    color: 'black',
    marginTop: 2,
    marginBottom: 2,
  },
  sectionDivider: {
    borderBottomWidth: 1,
    borderBottomColor: 'lightgray',
    marginTop: 2,
  },
  actionButton: {
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 12,
    backgroundColor: 'white',
    minHeight: 54,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  quickActionButton: {
    height: 54,
  },
  list: {
    gap: 8,
  },
  emptyStateBlock: {
    gap: 8,
  },
  actionButtonPrimary: {
    backgroundColor: 'black',
    borderColor: 'black',
  },
  actionButtonDestructive: {
    backgroundColor: 'snow',
    borderColor: 'mistyrose',
  },
  actionButtonText: {
    color: 'black',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
  actionButtonTextPrimary: {
    color: 'white',
    fontWeight: '700',
  },
  actionButtonTextDestructive: {
    color: 'firebrick',
    fontWeight: '700',
  },
  shareRow: {
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  shareRowActive: {
    borderColor: 'black',
    backgroundColor: 'black',
  },
  shareTitle: {
    color: 'black',
    fontWeight: '600',
    fontSize: 15,
  },
  shareTitleOnDark: {
    color: 'white',
  },
  shareActiveLabel: {
    color: 'white',
    fontWeight: '700',
    fontSize: 11,
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  shareMeta: {
    color: 'slategray',
    fontSize: 12,
    marginTop: 2,
  },
  shareMetaOnDark: {
    color: 'lightgray',
    fontSize: 12,
    marginTop: 2,
  },
  shareCountsRow: {
    marginTop: 4,
    flexDirection: 'row',
    gap: 12,
  },
  participantRow: {
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    backgroundColor: 'white',
  },
  participantRowOwner: {
    backgroundColor: 'whitesmoke',
  },
  participantHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  participantIdentityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  participantAvatarBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'whitesmoke',
    borderWidth: 1,
    borderColor: 'lightgray',
  },
  participantAvatarText: {
    fontSize: 18,
  },
  participantPressable: {
    minHeight: 40,
    justifyContent: 'center',
  },
  participantEditBlock: {
    gap: 8,
  },
  participantInput: {
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: 'black',
    backgroundColor: 'white',
  },
  participantActionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  participantActionButton: {
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: 'white',
  },
  participantActionText: {
    color: 'black',
    fontSize: 12,
    fontWeight: '600',
  },
  participantActionPrimary: {
    backgroundColor: 'black',
    borderColor: 'black',
  },
  participantActionPrimaryText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionTextBlock: {
    flex: 1,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingVertical: 2,
  },
  quickActionTitle: {
    color: 'black',
    fontSize: 15,
    fontWeight: '600',
  },
  helper: {
    marginTop: 4,
    color: 'dimgrey',
    fontSize: 12,
  },
});
