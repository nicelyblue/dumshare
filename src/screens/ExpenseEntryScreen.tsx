import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExpenseSplitPayload } from '../domain/events/types';
import { useLedgerSession } from '../state/ledgerSession';
import { AppShell } from '../ui/AppShell';
import { ActionButton } from '../ui/ActionButton';
import { ExpenseSplitEditor } from '../ui/ExpenseSplitEditor';
import { FeatureCard } from '../ui/FeatureCard';
import { LabeledField } from '../ui/LabeledField';
import { SearchableSelect } from '../ui/SearchableSelect';
import { SurfaceCard } from '../ui/SurfaceCard';
import { CURRENCY_OPTIONS } from '../domain/currency/catalog';
import { isSupportedCurrencyCode } from '../domain/currency/catalog';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';
import { PendingReviewScreen } from './PendingReviewScreen';
import { SubmissionDetailScreen } from './SubmissionDetailScreen';
import { colors, screenAccents } from '../theme/colors';

type PayerRow = {
  rowId: string;
  participantId: string;
  paidAmountText: string;
};

type EntryStep = 'details' | 'payers' | 'split';

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
  const { snapshot, reviewSnapshot, status, error, submitExpenseDraft, submitExpenseReview } = useLedgerSession();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
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
  const [panel, setPanel] = useState<'entry' | 'pending' | 'detail'>('entry');
  const [activeSubmissionId, setActiveSubmissionId] = useState<string | null>(null);
  const [entryStep, setEntryStep] = useState<EntryStep>('details');

  const totalAmountMinor = toMinorAmount(totalAmountText);

  const payerTotalMinor = useMemo(
    () => payers.reduce((sum, payer) => sum + toMinorAmount(payer.paidAmountText), 0),
    [payers],
  );

  const stepOrder: EntryStep[] = ['details', 'payers', 'split'];
  const stepIndex = stepOrder.indexOf(entryStep);
  const detailsValid = description.trim().length > 0 && totalAmountMinor > 0 && isSupportedCurrencyCode(currency);
  const payersValid = payers.length > 0 && payerTotalMinor === totalAmountMinor && totalAmountMinor > 0;

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
        accent={screenAccents.expense}
      >
        <Pressable onPress={() => navigation.navigate(APP_ROUTES.dashboard)} accessibilityRole="button" style={styles.backButton}>
          <Text style={styles.backButtonLabel}>Back to dashboard</Text>
        </Pressable>
        <FeatureCard label="Session error" description={error ?? 'Unknown error'} accent={screenAccents.danger} selected />
      </AppShell>
    );
  }

  function goNextStep(): void {
    if (entryStep === 'details' && !detailsValid) {
      setMessage('Enter expense name, total amount, and a supported currency before continuing.');
      return;
    }

    if (entryStep === 'payers' && !payersValid) {
      setMessage('Payer amounts must add up exactly to the total amount.');
      return;
    }

    setMessage('');
    const next = stepOrder[stepIndex + 1];
    if (next) {
      setEntryStep(next);
    }
  }

  function goBackStep(): void {
    const prev = stepOrder[stepIndex - 1];
    if (prev) {
      setMessage('');
      setEntryStep(prev);
    }
  }

  if (!snapshot.hasLedger) {
    return (
      <AppShell
        eyebrow="Expense capture"
        title="Expense Entry"
        description="Create the ledger in Setup before recording expenses."
        accent={screenAccents.expense}
      >
        <Pressable onPress={() => navigation.navigate(APP_ROUTES.dashboard)} accessibilityRole="button" style={styles.backButton}>
          <Text style={styles.backButtonLabel}>Back to dashboard</Text>
        </Pressable>
        <FeatureCard
          label="Ledger not ready"
          description="Open Setup and create the ledger plus participant roster first."
          accent={screenAccents.expense}
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
        accent={screenAccents.expense}
      >
        <Pressable onPress={() => navigation.navigate(APP_ROUTES.dashboard)} accessibilityRole="button" style={styles.backButton}>
          <Text style={styles.backButtonLabel}>Back to dashboard</Text>
        </Pressable>
        <FeatureCard
          label="No participants"
          description="Go to Setup and add participants so payer rows can reference real members."
          accent={screenAccents.expense}
          selected
        />
      </AppShell>
    );
  }

  const activeSubmission = reviewSnapshot.items.find((item) => item.submissionId === activeSubmissionId);

  return (
    <AppShell
      eyebrow="Expense capture"
      title="Expense Entry"
      description="Capture organizer or contributor expenses with payer rows and split controls."
      accent={screenAccents.expense}
    >
      <ActionButton tone="secondary" compact label="Back to dashboard" onPress={() => navigation.navigate(APP_ROUTES.dashboard)} />

      <View className="gap-3">
        <Text className="text-xs font-bold uppercase tracking-[1.6px] text-muted">Expense details</Text>
        {reviewSnapshot.pendingCount > 0 ? (
          <ActionButton tone="secondary" label={`Review pending submissions (${reviewSnapshot.pendingCount})`} onPress={() => setPanel('pending')} />
        ) : null}
        <Text className="text-xs font-extrabold uppercase tracking-[1px] text-accentB">Step {stepIndex + 1} of 3</Text>

        {entryStep === 'details' ? (
          <View className="gap-3">
            <LabeledField label="Description" value={description} onChangeText={setDescription} placeholder="Dinner at El Born" helperText="Keep labels specific so review is easy." />
            <SearchableSelect
              label="Currency"
              value={currency}
              options={CURRENCY_OPTIONS}
              onChange={setCurrency}
              helperText="Select a supported currency using fuzzy search."
            />
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
        ) : null}

        {entryStep === 'payers' ? (
          <View className="gap-3">
            <Text className="text-[13px] leading-[18px] text-muted">Step 2: select who paid and how much. Paid total must equal expense total.</Text>
            {payers.map((payer, index) => {
              const payerDetails = participants.find((participant) => participant.participantId === payer.participantId);

              return (
                <SurfaceCard key={payer.rowId} style={styles.payerRow}>
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
                </SurfaceCard>
              );
            })}
            <ActionButton tone="secondary" label="Add payer row" onPress={handleAddPayer} />
            <Text className="text-[13px] leading-[18px] text-muted">Payer total {payerTotalMinor / 100} versus expense total {totalAmountMinor / 100}</Text>
          </View>
        ) : null}

        {entryStep === 'split' ? (
          <View className="gap-3">
            <Text className="text-[13px] leading-[18px] text-muted">Step 3: choose how the expense is split. Non-equal modes stay balanced automatically.</Text>
            <ExpenseSplitEditor
              participants={participants}
              totalAmountMinor={totalAmountMinor}
              split={split}
              onChange={setSplit}
            />
          </View>
        ) : null}
      </View>

      <View className="flex-row gap-2">
        <ActionButton tone="secondary" label="Back" onPress={goBackStep} disabled={entryStep === 'details'} />
        {entryStep !== 'split' ? (
          <ActionButton label="Next" onPress={goNextStep} />
        ) : (
          <ActionButton label="Submit expense" onPress={handleSubmitExpense} />
        )}
      </View>

      {message ? (
        <View style={styles.messageBox}>
          <Text style={styles.messageText}>{message}</Text>
        </View>
      ) : null}

      {panel === 'pending' ? (
        <View style={styles.section}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.sectionLabel}>Pending review</Text>
            <ActionButton tone="secondary" label="Back to entry" onPress={() => setPanel('entry')} />
          </View>
          <PendingReviewScreen
            items={reviewSnapshot.items}
            onOpenSubmission={(submissionId) => {
              setActiveSubmissionId(submissionId);
              setPanel('detail');
            }}
          />
        </View>
      ) : null}

      {panel === 'detail' && activeSubmission ? (
        <View style={styles.section}>
          <View style={styles.panelHeaderRow}>
            <Text style={styles.sectionLabel}>Submission detail</Text>
            <ActionButton tone="secondary" label="Back to list" onPress={() => setPanel('pending')} />
          </View>
          <SubmissionDetailScreen
            item={activeSubmission}
            onSubmitDecision={async (input) => {
              await submitExpenseReview(input);
              setPanel('pending');
              setActiveSubmissionId(null);
            }}
          />
        </View>
      ) : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.accent.secondary,
    backgroundColor: colors.background.panelSoft,
  },
  backButtonLabel: {
    color: colors.text.link,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  section: {
    gap: 12,
  },
  stepLabel: {
    color: colors.text.link,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stepBlock: {
    gap: 12,
  },
  sectionLabel: {
    color: colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  roleRow: {
    flexDirection: 'row',
    gap: 8,
  },
  roleButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.panel,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  roleButtonActive: {
    borderColor: colors.accent.secondary,
    backgroundColor: colors.background.panelSoft,
  },
  roleButtonText: {
    color: colors.text.strong,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  roleButtonTextActive: {
    color: colors.text.link,
  },
  payerRow: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.panel,
    padding: 12,
    gap: 10,
  },
  payerNameButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: colors.background.panelSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  payerNameText: {
    color: colors.text.link,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  payerAmountField: {
    gap: 8,
  },
  helperText: {
    color: colors.text.subtle,
    fontSize: 13,
    lineHeight: 18,
  },
  flowActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  messageBox: {
    borderRadius: 16,
    backgroundColor: colors.background.panelSoft,
    padding: 12,
  },
  messageText: {
    color: colors.text.link,
    fontSize: 14,
    lineHeight: 20,
  },
});
