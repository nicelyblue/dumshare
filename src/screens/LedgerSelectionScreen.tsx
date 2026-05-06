import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppShell } from '../ui/AppShell';
import { FeatureCard } from '../ui/FeatureCard';
import { LabeledField } from '../ui/LabeledField';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';
import { useLedgerSession } from '../state/ledgerSession';

export function LedgerSelectionScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const {
    ledgers,
    activeLedgerId,
    setActiveLedger,
    createLedger,
    deleteLedger,
    resetAppData,
  } = useLedgerSession();

  const [title, setTitle] = useState('');
  const [settlementContext, setSettlementContext] = useState('');
  const [organizerName, setOrganizerName] = useState('');
  const [message, setMessage] = useState('');
  const [confirmDeleteLedgerId, setConfirmDeleteLedgerId] = useState<string | null>(null);
  const [confirmDeleteAllData, setConfirmDeleteAllData] = useState(false);

  async function handleCreateLedger(): Promise<void> {
    try {
      const ledgerId = await createLedger({ title, settlementContext, organizerName });
      setTitle('');
      setSettlementContext('');
      setOrganizerName('');
      setMessage(`Created ledger ${ledgerId}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create ledger.');
    }
  }

  async function handleDeleteLedger(ledgerId: string): Promise<void> {
    try {
      await deleteLedger(ledgerId);
      setConfirmDeleteLedgerId(null);
      setMessage('Ledger deleted.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete ledger.');
    }
  }

  async function handleDeleteAppData(): Promise<void> {
    try {
      await resetAppData();
      setConfirmDeleteAllData(false);
      setMessage('All local app data deleted.');
      navigation.navigate(APP_ROUTES.dashboard);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to delete app data.');
    }
  }

  return (
    <AppShell
      eyebrow="Ledger management"
      title="Ledgers"
      description="Switch the active ledger, create a new trip ledger, and remove old local ledgers."
      accent="#3f5f7f"
    >
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Active ledger</Text>
        {ledgers.length === 0 ? (
          <FeatureCard
            label="No ledgers yet"
            description="Create your first ledger below to start tracking expenses."
            accent="#3f5f7f"
            selected
          />
        ) : (
          ledgers.map((ledger) => (
            <View key={ledger.ledgerId} style={styles.ledgerCard}>
              <Pressable
                style={styles.ledgerMeta}
                onPress={async () => {
                  await setActiveLedger(ledger.ledgerId);
                  setMessage(`Selected ${ledger.title}.`);
                }}
              >
                <Text style={styles.ledgerTitle}>{ledger.title}</Text>
                <Text style={styles.ledgerContext}>{ledger.settlementContext}</Text>
                <Text style={styles.ledgerId}>{ledger.ledgerId}</Text>
                {activeLedgerId === ledger.ledgerId ? <Text style={styles.activeTag}>Active</Text> : null}
              </Pressable>

              <View style={styles.rowActions}>
                <Pressable
                  style={styles.secondaryButton}
                  onPress={() => {
                    void setActiveLedger(ledger.ledgerId);
                    navigation.navigate(APP_ROUTES.setup);
                  }}
                >
                  <Text style={styles.secondaryButtonLabel}>Edit setup</Text>
                </Pressable>
                <Pressable
                  style={styles.dangerButton}
                  onPress={() => setConfirmDeleteLedgerId((current) => (current === ledger.ledgerId ? null : ledger.ledgerId))}
                >
                  <Text style={styles.dangerButtonLabel}>Delete ledger</Text>
                </Pressable>
              </View>

              {confirmDeleteLedgerId === ledger.ledgerId ? (
                <FeatureCard
                  label="Confirm ledger delete"
                  description="This removes all events for this ledger from local storage."
                  accent="#b14f2e"
                  selected
                  actionLabel="Tap to confirm"
                  onPress={() => {
                    void handleDeleteLedger(ledger.ledgerId);
                  }}
                />
              ) : null}
            </View>
          ))
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Create ledger</Text>
        <LabeledField label="Ledger title" value={title} onChangeText={setTitle} placeholder="Lisbon sprint" />
        <LabeledField
          label="Organizer name"
          value={organizerName}
          onChangeText={setOrganizerName}
          placeholder="Marko"
          helperText="Organizer is inferred from this name and added to roster automatically."
        />
        <LabeledField
          label="Settlement context"
          value={settlementContext}
          onChangeText={setSettlementContext}
          placeholder="per-currency balances"
          multiline
          numberOfLines={3}
          textAlignVertical="top"
        />
        <Pressable style={styles.primaryButton} onPress={() => void handleCreateLedger()}>
          <Text style={styles.primaryButtonLabel}>Create and select ledger</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Danger zone</Text>
        <Pressable style={styles.dangerButton} onPress={() => setConfirmDeleteAllData((current) => !current)}>
          <Text style={styles.dangerButtonLabel}>Delete app data</Text>
        </Pressable>
        {confirmDeleteAllData ? (
          <FeatureCard
            label="Confirm app data delete"
            description="This removes all ledgers and local state from this device."
            accent="#b14f2e"
            selected
            actionLabel="Tap to confirm"
            onPress={() => {
              void handleDeleteAppData();
            }}
          />
        ) : null}
      </View>

      {message ? (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionLabel: {
    color: '#7a634b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  ledgerCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9d0bf',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 10,
  },
  ledgerMeta: {
    gap: 4,
  },
  ledgerTitle: {
    color: '#10203a',
    fontSize: 16,
    fontWeight: '800',
  },
  ledgerContext: {
    color: '#4d5a6b',
    fontSize: 13,
  },
  ledgerId: {
    color: '#6f7a89',
    fontSize: 11,
  },
  activeTag: {
    alignSelf: 'flex-start',
    color: '#3f5f7f',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  primaryButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#3f5f7f',
    alignSelf: 'flex-start',
  },
  primaryButtonLabel: {
    color: '#f5efe4',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#3f5f7f',
    backgroundColor: '#f5efe4',
  },
  secondaryButtonLabel: {
    color: '#3f5f7f',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  dangerButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#b14f2e',
    backgroundColor: '#fff1ee',
    alignSelf: 'flex-start',
  },
  dangerButtonLabel: {
    color: '#b14f2e',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  messageBox: {
    borderRadius: 18,
    backgroundColor: '#eef3ef',
    padding: 14,
  },
  messageText: {
    color: '#2f5d62',
    fontSize: 14,
    lineHeight: 20,
  },
});
