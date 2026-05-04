import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppShell } from '../ui/AppShell';
import { FeatureCard } from '../ui/FeatureCard';
import { LabeledField } from '../ui/LabeledField';
import { useLedgerSession } from '../state/ledgerSession';

export function LedgerSetupScreen() {
  const { snapshot, status, error, refresh, saveLedgerSetup, addParticipant } = useLedgerSession();
  const [title, setTitle] = useState(snapshot.title);
  const [settlementContext, setSettlementContext] = useState(snapshot.settlementContext);
  const [participantName, setParticipantName] = useState('');
  const [savedMessage, setSavedMessage] = useState('');

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
    const nextLedgerId = await saveLedgerSetup({ title, settlementContext });
    setSavedMessage(nextLedgerId ? 'Ledger setup saved locally.' : 'Ledger setup saved.');
    await refresh();
  }

  async function handleAddParticipant(): Promise<void> {
    const trimmedName = participantName.trim();
    if (!trimmedName) {
      return;
    }

    await addParticipant({ displayName: trimmedName });
    setParticipantName('');
    setSavedMessage(`Added ${trimmedName} to the roster.`);
    await refresh();
  }

  return (
    <AppShell
      eyebrow="Trip setup"
      title="Ledger Setup"
      description="Create the trip ledger and keep the participant roster organized."
      accent="#2f5d62"
    >
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
        <Pressable onPress={handleAddParticipant} accessibilityRole="button" style={styles.secondaryButton}>
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
  secondaryButtonLabel: {
    color: '#2f5d62',
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