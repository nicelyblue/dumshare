import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { createShareMenuController } from '../controllers/shareMenuController';
import { createShareActionsController } from '../controllers/shareActionsController';
import { createLedgerAppService } from '../services/ledgerAppService';
import { getThemePreference, subscribeThemePreference, toggleThemePreference } from '../state/preferencesStore';
import { getActiveShareState, subscribeActiveShare } from '../state/activeShareStore';
import { LongPressActionSheet, type ActionSheetOption } from './LongPressActionSheet';

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
  shares: Array<{ ledgerId: string; title: string; createdAt: string; active: boolean }>;
  theme: 'light' | 'dark';
};

export async function buildShareDrawerContent(activeShareId: string | null): Promise<ShareDrawerContentModel> {
  const shares = await shareMenuController.loadShares(activeShareId);
  return {
    shares,
    theme: getThemePreference(),
  };
}

export function onThemeToggle(): 'light' | 'dark' {
  return toggleThemePreference();
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

export default function ShareDrawerContent(): JSX.Element {
  const [activeShareId, setActiveShareId] = useState<string | null>(getActiveShareState().activeShareId);
  const [theme, setTheme] = useState<'light' | 'dark'>(getThemePreference());
  const [shares, setShares] = useState<Array<{ ledgerId: string; title: string; createdAt: string; active: boolean }>>([]);
  const [selectedShareId, setSelectedShareId] = useState<string | null>(null);

  const longPressOptions = useMemo(
    () => (selectedShareId ? getShareLongPressOptions(selectedShareId, activeShareId) : []),
    [selectedShareId, activeShareId],
  );

  useEffect(() => subscribeThemePreference(setTheme), []);
  useEffect(() => subscribeActiveShare((state) => setActiveShareId(state.activeShareId)), []);

  useEffect(() => {
    void buildShareDrawerContent(activeShareId).then((model) => {
      setShares(model.shares);
      setTheme(model.theme);
    });
  }, [activeShareId]);

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
        onPress: () => {
          void shareActionsController.runAction('delete', selectedShareId);
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
        onPress: () => {
          void shareMenuController.resetAllData('CONFIRM_DELETE_ALL');
        },
      },
    ]);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Share Menu</Text>
      <Text style={styles.sectionTitle}>Your shares</Text>
      <View style={styles.list}>
        {shares.length > 0 ? (
          shares.map((share) => (
            <Pressable
              key={share.ledgerId}
              onPress={() => {
                void shareMenuController.switchActiveShare(share.ledgerId);
              }}
              onLongPress={() => setSelectedShareId(share.ledgerId)}
              style={[styles.shareRow, share.active ? styles.shareRowActive : null]}
              accessibilityRole="button"
            >
              <Text style={styles.shareTitle}>{share.title}</Text>
              <Text style={styles.shareMeta}>{share.active ? 'Active' : 'Tap to activate'}</Text>
            </Pressable>
          ))
        ) : (
          <Text style={styles.helper}>No shares yet. Create one from setup.</Text>
        )}
      </View>

      <View style={styles.preferenceRow}>
        <Text style={styles.preferenceLabel}>Dark theme</Text>
        <Switch value={theme === 'dark'} onValueChange={() => setTheme(onThemeToggle())} />
      </View>

      <Pressable onPress={onResetPress} style={styles.destructiveButton} accessibilityRole="button">
        <Text style={styles.destructiveButtonText}>Delete all local data</Text>
      </Pressable>

      <LongPressActionSheet
        visible={selectedShareId !== null}
        title="Share actions"
        options={longPressOptions}
        onSelect={(key) => {
          void runShareAction(key);
        }}
        onClose={() => setSelectedShareId(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'black',
  },
  sectionTitle: {
    fontWeight: '600',
    color: 'dimgrey',
  },
  list: {
    gap: 8,
  },
  shareRow: {
    borderWidth: 1,
    borderColor: 'lightgray',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  shareRowActive: {
    borderColor: 'black',
    backgroundColor: 'aliceblue',
  },
  shareTitle: {
    color: 'black',
    fontWeight: '600',
  },
  shareMeta: {
    color: 'slategray',
    fontSize: 12,
    marginTop: 2,
  },
  preferenceRow: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'lightgray',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  preferenceLabel: {
    color: 'black',
    fontWeight: '600',
  },
  destructiveButton: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: 'mistyrose',
    backgroundColor: 'seashell',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  destructiveButtonText: {
    color: 'firebrick',
    fontWeight: '700',
    textAlign: 'center',
  },
  helper: {
    marginTop: 8,
    color: 'dimgray',
    fontSize: 13,
  },
});
