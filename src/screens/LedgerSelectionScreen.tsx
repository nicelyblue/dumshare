import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppShell } from '../ui/AppShell';
import { ActionButton } from '../ui/ActionButton';
import { FeatureCard } from '../ui/FeatureCard';
import { LabeledField } from '../ui/LabeledField';
import { SurfaceCard } from '../ui/SurfaceCard';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';
import { useLedgerSession } from '../state/ledgerSession';
import { CURRENCY_OPTIONS } from '../domain/currency/catalog';
import { isSupportedCurrencyCode } from '../domain/currency/catalog';
import { SearchableSelect } from '../ui/SearchableSelect';

export function LedgerSelectionScreen() {
  const settlementModes = ['per-currency', 'by-ledger-currency'] as const;
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
  const [settlementContext, setSettlementContext] = useState<(typeof settlementModes)[number]>('per-currency');
  const [ledgerCurrency, setLedgerCurrency] = useState('EUR');
  const [organizerName, setOrganizerName] = useState('');
  const [message, setMessage] = useState('');
  const [confirmDeleteLedgerId, setConfirmDeleteLedgerId] = useState<string | null>(null);
  const [confirmDeleteAllData, setConfirmDeleteAllData] = useState(false);

  async function handleCreateLedger(): Promise<void> {
    try {
      if (settlementContext === 'by-ledger-currency' && !isSupportedCurrencyCode(ledgerCurrency)) {
        setMessage('Select a supported ledger currency.');
        return;
      }

      const normalizedSettlement =
        settlementContext === 'by-ledger-currency'
          ? `by-ledger-currency:${ledgerCurrency.trim().toUpperCase()}`
          : 'per-currency';
      const ledgerId = await createLedger({ title, settlementContext: normalizedSettlement, organizerName });
      setTitle('');
      setSettlementContext('per-currency');
      setLedgerCurrency('EUR');
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
            <SurfaceCard key={ledger.ledgerId}>
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
                <ActionButton
                  tone="secondary"
                  compact
                  label="Edit setup"
                  onPress={() => {
                    void setActiveLedger(ledger.ledgerId);
                    navigation.navigate(APP_ROUTES.setup);
                  }}
                />
                <ActionButton
                  tone="danger"
                  compact
                  label="Delete ledger"
                  onPress={() => setConfirmDeleteLedgerId((current) => (current === ledger.ledgerId ? null : ledger.ledgerId))}
                />
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
            </SurfaceCard>
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
        <View style={styles.modeSection}>
          <Text style={styles.modeLabel}>Settlement mode</Text>
          <View style={styles.modeRow}>
            {settlementModes.map((mode) => {
              const selected = settlementContext === mode;
              return (
                <Pressable
                  key={mode}
                  style={[styles.modeButton, selected ? styles.modeButtonActive : null]}
                  onPress={() => setSettlementContext(mode)}
                >
                  <Text style={[styles.modeButtonText, selected ? styles.modeButtonTextActive : null]}>{mode}</Text>
                </Pressable>
              );
            })}
          </View>
        </View>
        {settlementContext === 'by-ledger-currency' ? (
          <SearchableSelect
            label="Ledger currency"
            value={ledgerCurrency}
            options={CURRENCY_OPTIONS}
            onChange={setLedgerCurrency}
            helperText="Pick the single ledger currency for settlement."
          />
        ) : null}
        <ActionButton label="Create and select ledger" onPress={() => void handleCreateLedger()} />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Danger zone</Text>
        <ActionButton tone="danger" compact label="Delete app data" onPress={() => setConfirmDeleteAllData((current) => !current)} />
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
    color: '#5a6883',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  modeSection: {
    gap: 8,
  },
  modeLabel: {
    color: '#5a6883',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  modeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d8e3f6',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeButtonActive: {
    borderColor: '#5f6fff',
    backgroundColor: '#eef4ff',
  },
  modeButtonText: {
    color: '#182743',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  modeButtonTextActive: {
    color: '#4f57d8',
  },
  ledgerMeta: {
    gap: 4,
  },
  ledgerTitle: {
    color: '#182743',
    fontSize: 16,
    fontWeight: '800',
  },
  ledgerContext: {
    color: '#5a6883',
    fontSize: 13,
  },
  ledgerId: {
    color: '#5a6883',
    fontSize: 11,
  },
  activeTag: {
    alignSelf: 'flex-start',
    color: '#4f57d8',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1,
    backgroundColor: '#eef4ff',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rowActions: {
    flexDirection: 'row',
    gap: 8,
  },
  messageBox: {
    borderRadius: 18,
    backgroundColor: '#eafcf8',
    borderWidth: 1,
    borderColor: '#00a7a0',
    padding: 14,
  },
  messageText: {
    color: '#007f7a',
    fontSize: 14,
    lineHeight: 20,
  },
});
