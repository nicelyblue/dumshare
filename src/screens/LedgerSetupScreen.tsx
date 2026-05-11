import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { AppShell } from '../ui/AppShell';
import { ActionButton } from '../ui/ActionButton';
import { FeatureCard } from '../ui/FeatureCard';
import { LabeledField } from '../ui/LabeledField';
import { SearchableSelect } from '../ui/SearchableSelect';
import { SurfaceCard } from '../ui/SurfaceCard';
import { CURRENCY_OPTIONS } from '../domain/currency/catalog';
import { isSupportedCurrencyCode } from '../domain/currency/catalog';
import { parseSettlementContext } from '../domain/currency/settlement';
import { useLedgerSession } from '../state/ledgerSession';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, screenAccents } from '../theme/colors';

export function LedgerSetupScreen() {
  const settlementModes = ['per-currency', 'by-ledger-currency'] as const;
  const { 
    snapshot, 
    status, 
    error, 
    refresh, 
    saveLedgerSetup, 
    addParticipant, 
    renameParticipant, 
    removeParticipant,
    setupState,
    startSetup,
    setStep1Data,
    progressToStep2,
    setStep2Data,
    completeSetup,
  } = useLedgerSession();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const parsedSettlement = parseSettlementContext(snapshot.settlementContext);
  const parsedSettlementMode = parsedSettlement?.mode ?? 'per-currency';
  const parsedLedgerCurrency = parsedSettlement?.ledgerCurrency ?? 'EUR';
  
  const [title, setTitle] = useState(snapshot.title);
  const [organizerName, setOrganizerName] = useState(snapshot.organizerName);
  const [settlementMode, setSettlementMode] = useState<(typeof settlementModes)[number]>(parsedSettlementMode);
  const [ledgerCurrency, setLedgerCurrency] = useState(parsedLedgerCurrency);
  const [participantName, setParticipantName] = useState('');
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editingParticipantName, setEditingParticipantName] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const participantInputRef = useRef<TextInput>(null);

  // Initialize setup state on mount
  useEffect(() => {
    if (!setupState.step1Data && !setupState.isComplete) {
      startSetup();
    }
  }, [startSetup, setupState.step1Data, setupState.isComplete]);

  useEffect(() => {
    if (setupState.activeStep === 'step2') {
      const timeout = setTimeout(() => {
        participantInputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [setupState.activeStep]);

  const rosterCards = useMemo(
    () =>
      snapshot.balanceSummary.participants.map((participant) => ({
        participantId: participant.participantId,
        displayName: participant.displayName,
      })),
    [snapshot.balanceSummary.participants],
  );

  async function handleStep1Submit(): Promise<void> {
    const titleTrimmed = title.trim();
    const organizerNameTrimmed = organizerName.trim();

    if (!titleTrimmed || !organizerNameTrimmed) {
      setErrorMessage('Enter ledger title and organizer name to continue.');
      return;
    }

    if (settlementMode === 'by-ledger-currency' && !isSupportedCurrencyCode(ledgerCurrency)) {
      setErrorMessage('Select a ledger currency to continue.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // Save Step 1 data to context
      setStep1Data({ title: titleTrimmed, organizerName: organizerNameTrimmed });
      
      // Create the ledger
      await saveLedgerSetup({ 
        title: titleTrimmed, 
        settlementContext:
          settlementMode === 'by-ledger-currency' ? `by-ledger-currency:${ledgerCurrency}` : 'per-currency',
      });
      
      await refresh();
      
      // Move to Step 2
      progressToStep2();
      setSavedMessage('');
      setIsLoading(false);
    } catch (setupError) {
      const errorMsg = setupError instanceof Error ? setupError.message : 'Unable to save ledger. Please try again.';
      setErrorMessage(errorMsg);
      setIsLoading(false);
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

  function handleStartEditParticipant(participantId: string, displayName: string): void {
    setEditingParticipantId(participantId);
    setEditingParticipantName(displayName);
    setSavedMessage('');
  }

  async function handleSaveParticipantEdit(): Promise<void> {
    if (!editingParticipantId) {
      return;
    }

    try {
      await renameParticipant({
        participantId: editingParticipantId,
        displayName: editingParticipantName,
      });
      setSavedMessage('Participant updated.');
      setEditingParticipantId(null);
      setEditingParticipantName('');
      await refresh();
    } catch (participantError) {
      setSavedMessage(participantError instanceof Error ? participantError.message : 'Unable to update participant.');
    }
  }

  async function handleDeleteParticipant(participantId: string): Promise<void> {
    try {
      await removeParticipant({ participantId });
      setSavedMessage('Participant removed from roster.');
      if (editingParticipantId === participantId) {
        setEditingParticipantId(null);
        setEditingParticipantName('');
      }
      await refresh();
    } catch (participantError) {
      setSavedMessage(participantError instanceof Error ? participantError.message : 'Unable to remove participant.');
    }
  }

  async function handleStep2Complete(): Promise<void> {
    if (rosterCards.length === 0) {
      setErrorMessage('Add at least one participant before completing setup.');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // Store Step 2 data
      setStep2Data(rosterCards.map((p) => p.participantId));
      
      // Mark setup as complete
      completeSetup();
      
      // Navigate to Dashboard
      navigation.navigate(APP_ROUTES.homeDashboard);
      
      setSavedMessage('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to complete setup.';
      setErrorMessage(errorMsg);
      setIsLoading(false);
    }
  }

  const isStep1Valid =
    title.trim().length > 0 &&
    organizerName.trim().length > 0 &&
    (settlementMode !== 'by-ledger-currency' || ledgerCurrency.trim().length > 0);

  return (
    <AppShell
      eyebrow="Trip setup"
      title="Ledger Setup"
      description="Create the trip ledger and keep the participant roster organized."
      accent={screenAccents.setup}
    >
      <ActionButton tone="secondary" compact label="Back to dashboard" onPress={() => navigation.navigate(APP_ROUTES.homeDashboard)} />

      <View className="gap-3">
        <Text className="text-xs font-extrabold uppercase tracking-[1px] text-accentA">
          Step {setupState.activeStep === 'step1' ? 1 : 2} of 2
        </Text>

        {setupState.activeStep === 'step1' ? (
          <SurfaceCard emphasis="soft" style={styles.stepCard}>
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-muted">Ledger details</Text>
            <LabeledField 
              label="Ledger title" 
              value={title} 
              onChangeText={setTitle} 
              placeholder="Barcelona weekend" 
              helperText="This is the main trip name shown in the dashboard." 
            />
            <LabeledField 
              label="Organizer name" 
              value={organizerName} 
              onChangeText={setOrganizerName} 
              placeholder="Your name" 
              helperText="Who is organizing this trip?" 
            />
            <View className="gap-2">
              <Text className="text-xs font-bold uppercase tracking-[1.2px] text-muted">Settlement mode</Text>
              <View className="flex-row flex-wrap gap-2">
                {settlementModes.map((mode) => {
                  const selected = settlementMode === mode;
                  return (
                    <Pressable
                      key={mode}
                       className={`rounded-full border px-3 py-2 ${selected ? 'border-accentA bg-shellSoft' : 'border-border bg-panel'}`}
                      onPress={() => setSettlementMode(mode)}
                    >
                       <Text className={`text-xs font-bold tracking-[0.8px] ${selected ? 'text-accentA' : 'text-ink'}`}>{mode}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>
            {settlementMode === 'by-ledger-currency' ? (
              <SearchableSelect
                label="Ledger currency"
                value={ledgerCurrency}
                options={CURRENCY_OPTIONS}
                onChange={setLedgerCurrency}
                helperText="Choose the single settlement currency for this ledger."
              />
            ) : null}
            <ActionButton
              label={isLoading ? 'Loading...' : 'Continue to Step 2'}
              disabled={!isStep1Valid || isLoading}
              onPress={() => {
                void handleStep1Submit();
              }}
            />
            {errorMessage ? (
               <View className="mt-2 gap-2.5 rounded-xl border p-3" style={styles.inlineErrorBlock}>
                 <Text className="text-sm leading-5 text-danger">{errorMessage}</Text>
                <ActionButton tone="danger" compact label="Retry" onPress={() => {
                  void handleStep1Submit();
                }} />
              </View>
            ) : null}
          </SurfaceCard>
        ) : null}

        {setupState.activeStep === 'step2' ? (
          <SurfaceCard emphasis="soft" style={styles.stepCard}>
            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-muted">Add participants</Text>
            <LabeledField 
              ref={participantInputRef}
              label="Participant name" 
              value={participantName} 
              onChangeText={setParticipantName} 
              placeholder="Alice" 
              helperText="Add names one at a time." 
            />
            <ActionButton tone="secondary" label="Add to roster" disabled={!snapshot.hasLedger} onPress={() => {
              void handleAddParticipant();
            }} />

            <Text className="text-xs font-bold uppercase tracking-[1.6px] text-muted">Roster ({rosterCards.length})</Text>
            <View style={styles.rosterList}>
              {rosterCards.length > 0 ? (
                rosterCards.map((participant) => (
                  <SurfaceCard key={participant.participantId} style={styles.rosterCard}>
                    <Text style={styles.rosterName}>{participant.displayName}</Text>
                    {snapshot.organizerParticipantId === participant.participantId ? (
                      <Text style={styles.organizerTag}>Organizer</Text>
                    ) : null}
                    <Text style={styles.rosterId}>{participant.participantId}</Text>

                    <View style={styles.rosterActionsRow}>
                      <ActionButton tone="secondary" compact label="Edit" onPress={() => {
                        handleStartEditParticipant(participant.participantId, participant.displayName);
                      }} />
                      <ActionButton tone="danger" compact label="Delete" onPress={() => {
                        void handleDeleteParticipant(participant.participantId);
                      }} />
                    </View>

                    {editingParticipantId === participant.participantId ? (
                      <View style={styles.editBlock}>
                        <LabeledField
                          label="Edit participant"
                          value={editingParticipantName}
                          onChangeText={setEditingParticipantName}
                          placeholder="Updated name"
                        />
                        <View style={styles.editActionsRow}>
                          <ActionButton tone="secondary" compact label="Save" onPress={() => {
                            void handleSaveParticipantEdit();
                          }} />
                          <ActionButton tone="secondary" compact label="Cancel" onPress={() => {
                            setEditingParticipantId(null);
                            setEditingParticipantName('');
                          }} />
                        </View>
                      </View>
                    ) : null}
                  </SurfaceCard>
                ))
              ) : (
                <FeatureCard
                  label="No participants yet"
                  description="Add people to the trip roster after creating the ledger."
                  accent={screenAccents.setup}
                  selected
                />
              )}
            </View>

            <ActionButton
              label={isLoading ? 'Completing...' : 'Complete Setup'}
              disabled={rosterCards.length === 0 || isLoading}
              onPress={() => {
                void handleStep2Complete();
              }}
            />
             {errorMessage ? (
               <View className="mt-2 gap-2.5 rounded-xl border p-3" style={styles.inlineErrorBlock}>
                 <Text className="text-sm leading-5 text-danger">{errorMessage}</Text>
                <ActionButton tone="danger" compact label="Retry" onPress={() => {
                  void handleStep2Complete();
                }} />
              </View>
            ) : null}
          </SurfaceCard>
        ) : null}

      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  stepLabel: {
    color: colors.status.success,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stepBlock: {
    gap: 12,
  },
  stepCard: {
    gap: 12,
  },
  backButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: colors.status.success,
    backgroundColor: colors.background.panelSoft,
  },
  backButtonLabel: {
    color: colors.status.success,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  sectionLabel: {
    color: colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  modeSection: {
    gap: 8,
  },
  modeLabel: {
    color: colors.text.muted,
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
    borderColor: colors.border.default,
    backgroundColor: colors.background.panel,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeButtonActive: {
    borderColor: colors.status.success,
    backgroundColor: colors.background.panelSoft,
  },
  modeButtonText: {
    color: colors.text.secondary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  modeButtonTextActive: {
    color: colors.status.success,
  },
  primaryButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.status.success,
    alignSelf: 'flex-start',
  },
  primaryButtonDisabled: {
    opacity: 0.5,
  },
  primaryButtonLabel: {
    color: colors.text.onAccent,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  secondaryButton: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: colors.background.panelSoft,
    borderWidth: 1,
    borderColor: colors.status.success,
    alignSelf: 'flex-start',
  },
  secondaryButtonDisabled: {
    opacity: 0.5,
  },
  secondaryButtonLabel: {
    color: colors.status.success,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  rosterList: {
    gap: 12,
  },
  rosterCard: {
    gap: 8,
  },
  rosterName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  organizerTag: {
    alignSelf: 'flex-start',
    color: colors.status.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    backgroundColor: colors.background.panelSoft,
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rosterId: {
    color: colors.text.muted,
    fontSize: 12,
  },
  rosterActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editBlock: {
    gap: 10,
    marginTop: 4,
  },
  editActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  errorMessage: {
    color: colors.text.danger,
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  errorBlock: {
    borderRadius: 12,
    backgroundColor: colors.background.dangerSoft,
    borderWidth: 1,
    borderColor: colors.border.danger,
    padding: 12,
    gap: 10,
    marginTop: 8,
  },
  retryButton: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border.danger,
    backgroundColor: colors.background.panel,
  },
  retryButtonLabel: {
    color: colors.text.danger,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  inlineErrorBlock: {
    borderColor: colors.border.danger,
    backgroundColor: colors.background.dangerSoft,
  },
});
