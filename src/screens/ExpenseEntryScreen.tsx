import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExpenseSplitPayload } from '../domain/events/types';
import { useLedgerSession } from '../state/ledgerSession';
import { AppShell } from '../ui/AppShell';
import { ExpenseSplitEditor } from '../ui/ExpenseSplitEditor';
import { FeatureCard } from '../ui/FeatureCard';
import { LabeledField } from '../ui/LabeledField';

type PayerRow = {
  rowId: string;
  participantId: string;
  paidAmountText: string;
};

function toMinorAmount(value: string): number {
  const sanitized = value.replace(/[^0-9.]/g, '').trim();

  if (!sanitized) {
    return 0;
  }

  const parsed = Number.parseFloat(sanitized);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed * 100);
}

function defaultSplit(participantIds: string[]): ExpenseSplitPayload {
  return {
    mode: 'equal',
    participants: participantIds.map((participantId) => ({ participantId })),
  };
}

function createPayerRow(participantId: string, paidAmountText: string): PayerRow {
  return {
    rowId: `payer-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`,
    participantId,
    paidAmountText,
  };
}

export function ExpenseEntryScreen() {
  const { snapshot, status, error, submitExpenseDraft } = useLedgerSession();
  const participants = snapshot.balanceSummary.participants.map((participant) => ({
    participantId: participant.participantId,
    displayName: participant.displayName,
  }));
  const primaryParticipantId = participants[0]?.participantId ?? '';

  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('EUR');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [totalAmountText, setTotalAmountText] = useState('0.00');
  const [creatorRole, setCreatorRole] = useState<'organizer' | 'contributor'>('organizer');
  const [payers, setPayers] = useState<PayerRow[]>(() =>
    primaryParticipantId ? [createPayerRow(primaryParticipantId, '0.00')] : [],
  );
  const [split, setSplit] = useState<ExpenseSplitPayload>(() => defaultSplit(participants.map((item) => item.participantId)));
  const [message, setMessage] = useState('');

  const totalAmountMinor = toMinorAmount(totalAmountText);

  const payerTotalMinor = useMemo(
    () => payers.reduce((sum, payer) => sum + toMinorAmount(payer.paidAmountText), 0),
    [payers],
  );

  function cycleParticipant(currentId: string): string {
    if (participants.length === 0) {
      return currentId;
    }

    const index = participants.findIndex((participant) => participant.participantId === currentId);
    const nextIndex = index < 0 ? 0 : (index + 1) % participants.length;
    return participants[nextIndex]?.participantId ?? currentId;
  }

  function handleAddPayer(): void {
    if (!primaryParticipantId) {
      return;
    }

    setPayers((current) => [...current, createPayerRow(primaryParticipantId, '0.00')]);
  }

  async function handleSubmitExpense(): Promise<void> {
    setMessage('');

    try {
      const expenseId = await submitExpenseDraft({
        description,
        currency,
        totalAmountMinor,
        expenseDate,
        creatorRole,
        payers: payers.map((payer) => ({
          participantId: payer.participantId,
          paidAmountMinor: toMinorAmount(payer.paidAmountText),
        })),
        split,
      });

      setMessage(`Saved expense ${expenseId}.`);
      setDescription('');
      setTotalAmountText('0.00');
    } catch (submitError) {
      setMessage(submitError instanceof Error ? submitError.message : 'Could not save expense');
    }
  }

  if (status === 'error') {
    return (
      <AppShell
        eyebrow="Expense capture"
        title="Expense Entry"
        description="Could not load the local ledger state."
        accent="#6e4a7e"
      >
        <FeatureCard label="Session error" description={error ?? 'Unknown error'} accent="#b14f2e" selected />
      </AppShell>
    );
  }

  if (!snapshot.hasLedger) {
    return (
      <AppShell
        eyebrow="Expense capture"
        title="Expense Entry"
        description="Create the ledger in Setup before recording expenses."
        accent="#6e4a7e"
      >
        <FeatureCard
          label="Ledger not ready"
          description="Open Setup and create the ledger plus participant roster first."
          accent="#6e4a7e"
          selected
        />
      </AppShell>
    );
  }

  if (participants.length === 0) {
    return (
      <AppShell
        eyebrow="Expense capture"
        title="Expense Entry"
        description="Add participants before creating expense rows."
        accent="#6e4a7e"
      >
        <FeatureCard
          label="No participants"
          description="Go to Setup and add participants so payer rows can reference real members."
          accent="#6e4a7e"
          selected
        />
      </AppShell>
    );
  }

  return (
    <AppShell
      eyebrow="Expense capture"
      title="Expense Entry"
      description="Capture organizer or contributor expenses with payer rows and split controls."
      accent="#6e4a7e"
    >
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Expense details</Text>
        <LabeledField label="Description" value={description} onChangeText={setDescription} placeholder="Dinner at El Born" helperText="Keep labels specific so review is easy." />
        <LabeledField label="Currency" value={currency} onChangeText={setCurrency} placeholder="EUR" helperText="Per-currency settlement is preserved in the ledger." autoCapitalize="characters" />
        <LabeledField label="Expense date" value={expenseDate} onChangeText={setExpenseDate} placeholder="2026-05-04" helperText="Use ISO style for deterministic event replay." />
        <LabeledField label="Total amount" value={totalAmountText} onChangeText={setTotalAmountText} placeholder="0.00" helperText="Major units are converted to minor units for storage." keyboardType="decimal-pad" />

        <View style={styles.roleRow}>
          <Pressable
            style={[styles.roleButton, creatorRole === 'organizer' ? styles.roleButtonActive : null]}
            onPress={() => setCreatorRole('organizer')}
          >
            <Text style={[styles.roleButtonText, creatorRole === 'organizer' ? styles.roleButtonTextActive : null]}>Organizer</Text>
          </Pressable>
          <Pressable
            style={[styles.roleButton, creatorRole === 'contributor' ? styles.roleButtonActive : null]}
            onPress={() => setCreatorRole('contributor')}
          >
            <Text style={[styles.roleButtonText, creatorRole === 'contributor' ? styles.roleButtonTextActive : null]}>Contributor</Text>
          </Pressable>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Payer rows</Text>
        {payers.map((payer, index) => {
          const payerDetails = participants.find((participant) => participant.participantId === payer.participantId);

          return (
            <View key={payer.rowId} style={styles.payerRow}>
              <Pressable
                style={styles.payerNameButton}
                onPress={() => {
                  setPayers((current) =>
                    current.map((candidate) =>
                      candidate.rowId === payer.rowId
                        ? { ...candidate, participantId: cycleParticipant(candidate.participantId) }
                        : candidate,
                    ),
                  );
                }}
              >
                <Text style={styles.payerNameText}>{payerDetails?.displayName ?? `Participant ${index + 1}`}</Text>
              </Pressable>
              <View style={styles.payerAmountField}>
                <LabeledField
                  label="Paid amount"
                  value={payer.paidAmountText}
                  onChangeText={(text) => {
                    setPayers((current) =>
                      current.map((candidate) =>
                        candidate.rowId === payer.rowId ? { ...candidate, paidAmountText: text } : candidate,
                      ),
                    );
                  }}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          );
        })}
        <Pressable style={styles.secondaryButton} onPress={handleAddPayer}>
          <Text style={styles.secondaryButtonLabel}>Add payer row</Text>
        </Pressable>
        <Text style={styles.helperText}>Payer total {payerTotalMinor / 100} versus expense total {totalAmountMinor / 100}</Text>
      </View>

      <ExpenseSplitEditor
        participants={participants}
        totalAmountMinor={totalAmountMinor}
        split={split}
        onChange={setSplit}
      />

      <Pressable style={styles.primaryButton} onPress={handleSubmitExpense}>
        <Text style={styles.primaryButtonLabel}>Submit expense</Text>
      </Pressable>

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
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d9d0bf',
    backgroundColor: '#ffffff',
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  roleButtonActive: {
    borderColor: '#6e4a7e',
    backgroundColor: '#efe6f4',
  },
  roleButtonText: {
    color: '#38485f',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  roleButtonTextActive: {
    color: '#5b2f73',
  },
  payerRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9d0bf',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 10,
  },
  payerNameButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: '#efe6f4',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  payerNameText: {
    color: '#5b2f73',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  payerAmountField: {
    gap: 8,
  },
  helperText: {
    color: '#51617a',
    fontSize: 13,
    lineHeight: 18,
  },
  primaryButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#5b2f73',
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
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#6e4a7e',
    backgroundColor: '#ffffff',
    alignSelf: 'flex-start',
  },
  secondaryButtonLabel: {
    color: '#6e4a7e',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  messageBox: {
    borderRadius: 16,
    backgroundColor: '#efe6f4',
    padding: 12,
  },
  messageText: {
    color: '#5b2f73',
    fontSize: 14,
    lineHeight: 20,
  },
});