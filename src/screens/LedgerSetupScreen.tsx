import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppShell } from '../ui/AppShell';
import { FeatureCard } from '../ui/FeatureCard';
import { LabeledField } from '../ui/LabeledField';
import { useLedgerSession } from '../state/ledgerSession';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export function LedgerSetupScreen() {
  const { snapshot, status, error, refresh, saveLedgerSetup, addParticipant, resetAppData } = useLedgerSession();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [title, setTitle] = useState(snapshot.title);
  const [settlementContext, setSettlementContext] = useState(snapshot.settlementContext);
  const [participantName, setParticipantName] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    setTitle(snapshot.title);
    setSettlementContext(snapshot.settlementContext);
  }, [snapshot.settlementContext, snapshot.title]);

  const rosterCards = useMemo(
    () =>
      snapshot.balanceSummary.participants.map((participant) => ({
        participantId: participant.participantId,
        displayName: participant.displayName,
      })),
    [snapshot.balanceSummary.participants],
  );

  async function handleSaveLedger(): Promise<void> {
    try {
      const nextLedgerId = await saveLedgerSetup({ title, settlementContext });
      setSavedMessage(nextLedgerId ? 'Ledger setup saved locally.' : 'Ledger setup saved.');
      await refresh();
    } catch (setupError) {
      setSavedMessage(setupError instanceof Error ? setupError.message : 'Unable to save ledger setup.');
    }
  }

  async function handleAddParticipant(): Promise<void> {
    if (!snapshot.hasLedger) {
      setSavedMessage('Create the ledger before adding participants.');
      return;
    }

    const trimmedName = participantName.trim();
    if (!trimmedName) {
      return;
    }

    try {
      await addParticipant({ displayName: trimmedName });
      setParticipantName('');
      setSavedMessage(`Added ${trimmedName} to the roster.`);
      await refresh();
    } catch (setupError) {
      setSavedMessage(setupError instanceof Error ? setupError.message : 'Unable to add participant.');
    }
  }

  async function handleResetAppData(): Promise<void> {
    try {
      await resetAppData();
      setParticipantName('');
      setSavedMessage('Local app data deleted. Start by creating a new ledger.');
      setConfirmReset(false);
      navigation.reset({
        index: 0,
        routes: [{ name: APP_ROUTES.dashboard }],
      });
    } catch (resetError) {
      setSavedMessage(resetError instanceof Error ? resetError.message : 'Unable to delete local app data.');
    }
  }

  return (
    <AppShell
      eyebrow="Trip setup"
      title="Ledger Setup"
      description="Create the trip ledger and keep the participant roster organized."
      accent="#2f5d62"
    >
      <Pressable
        onPress={() => navigation.navigate(APP_ROUTES.dashboard)}
        accessibilityRole="button"
        style={styles.backButton}
      >
        <Text style={styles.backButtonLabel}>Back to dashboard</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Ledger details</Text>
        <LabeledField label="Ledger title" value={title} onChangeText={setTitle} placeholder="Barcelona weekend" helperText="This is the main trip name shown in the dashboard." />
        <LabeledField label="Settlement context" value={settlementContext} onChangeText={setSettlementContext} placeholder="per-currency balances" helperText="Describe how the group settles after the trip." multiline numberOfLines={3} textAlignVertical="top" />
        <Pressable onPress={handleSaveLedger} accessibilityRole="button" style={styles.primaryButton}>
          <Text style={styles.primaryButtonLabel}>{snapshot.ledgerId ? 'Save ledger changes' : 'Create ledger'}</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Participant roster</Text>
        <LabeledField label="Add participant" value={participantName} onChangeText={setParticipantName} placeholder="Alice" helperText="Add names one at a time to keep the roster clear." />
        <Pressable
          onPress={handleAddParticipant}
          accessibilityRole="button"
          disabled={!snapshot.hasLedger}
          style={[styles.secondaryButton, !snapshot.hasLedger ? styles.secondaryButtonDisabled : null]}
        >
          <Text style={styles.secondaryButtonLabel}>Add to roster</Text>
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Current roster</Text>
        <View style={styles.rosterList}>
          {rosterCards.length > 0 ? (
            rosterCards.map((participant) => (
              <FeatureCard
                key={participant.participantId}
                label={participant.displayName}
                description={participant.participantId}
                accent="#2f5d62"
                selected={false}
                actionLabel="Participant"
              />
            ))
          ) : (
            <FeatureCard
              label="No participants yet"
              description="Add people to the trip roster after creating the ledger."
              accent="#2f5d62"
              selected
            />
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Danger zone</Text>
        <Pressable
          onPress={() => setConfirmReset((current) => !current)}
          accessibilityRole="button"
          style={styles.dangerButton}
        >
          <Text style={styles.dangerButtonLabel}>Delete app data</Text>
        </Pressable>
        {confirmReset ? (
          <FeatureCard
            label="Confirm delete"
            description="This clears the local ledger database and setup/session state on this device. This action cannot be undone."
            accent="#b14f2e"
            selected
            actionLabel="Destructive action"
            onPress={() => {
              void handleResetAppData();
            }}
          />
        ) : null}
      </View>

      {status === 'error' ? (
        <FeatureCard label="Setup error" description={error ?? 'Could not load setup state.'} accent="#b14f2e" selected />
      ) : null}

      {savedMessage ? (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{savedMessage}</Text>
        </View>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#2f5d62',
    backgroundColor: '#f5efe4',
  },
  backButtonLabel: {
    color: '#2f5d62',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  sectionLabel: {
    color: '#7a634b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  primaryButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2f5d62',
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#f5efe4',
    borderWidth: 1,
    borderColor: '#2f5d62',
    alignSelf: 'flex-start',
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonLabel: {
    color: '#2f5d62',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  dangerButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#fff1ee',
    borderWidth: 1,
    borderColor: '#b14f2e',
    alignSelf: 'flex-start',
  },
  dangerButtonLabel: {
    color: '#b14f2e',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  rosterList: {
    gap: 12,
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
