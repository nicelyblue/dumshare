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
  
  const [title, setTitle] = useState(snapshot.title);
  const [organizerName, setOrganizerName] = useState(snapshot.organizerName);
  const [participantName, setParticipantName] = useState('');
  const [editingParticipantId, setEditingParticipantId] = useState<string | null>(null);
  const [editingParticipantName, setEditingParticipantName] = useState('');
  const [savedMessage, setSavedMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initialize setup state on mount
  useEffect(() => {
    if (!setupState.step1Data && !setupState.isComplete) {
      startSetup();
    }
  }, [startSetup, setupState.step1Data, setupState.isComplete]);

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

    try {
      setIsLoading(true);
      setErrorMessage('');
      
      // Save Step 1 data to context
      setStep1Data({ title: titleTrimmed, organizerName: organizerNameTrimmed });
      
      // Create the ledger
      await saveLedgerSetup({ 
        title: titleTrimmed, 
        settlementContext: organizerNameTrimmed 
      });
      
      await refresh();
      
      // Move to Step 2
      progressToStep2();
      setSavedMessage('');
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
      navigation.navigate(APP_ROUTES.dashboard);
      
      setSavedMessage('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unable to complete setup.';
      setErrorMessage(errorMsg);
      setIsLoading(false);
    }
  }

  const isStep1Valid = title.trim().length > 0 && organizerName.trim().length > 0;

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
        <Text style={styles.stepLabel}>
          Step {setupState.activeStep === 'step1' ? 1 : 2} of 2
        </Text>

        {setupState.activeStep === 'step1' ? (
          <View style={styles.stepBlock}>
            <Text style={styles.sectionLabel}>Ledger details</Text>
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
            <Pressable 
              onPress={() => {
                void handleStep1Submit();
              }} 
              accessibilityRole="button" 
              disabled={!isStep1Valid || isLoading}
              style={[styles.primaryButton, (!isStep1Valid || isLoading) ? styles.primaryButtonDisabled : null]}
            >
              <Text style={styles.primaryButtonLabel}>{isLoading ? 'Loading...' : 'Continue to Step 2'}</Text>
            </Pressable>
            {errorMessage ? (
              <View style={styles.errorBlock}>
                <Text style={styles.errorMessage}>{errorMessage}</Text>
                <Pressable 
                  onPress={() => {
                    void handleStep1Submit();
                  }}
                  accessibilityRole="button"
                  style={styles.retryButton}
                >
                  <Text style={styles.retryButtonLabel}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
        ) : null}

        {setupState.activeStep === 'step2' ? (
          <View style={styles.stepBlock}>
            <Text style={styles.sectionLabel}>Add participants</Text>
            <LabeledField 
              label="Participant name" 
              value={participantName} 
              onChangeText={setParticipantName} 
              placeholder="Alice" 
              helperText="Add names one at a time." 
            />
            <Pressable
              onPress={() => {
                void handleAddParticipant();
              }}
              accessibilityRole="button"
              disabled={!snapshot.hasLedger}
              style={[styles.secondaryButton, !snapshot.hasLedger ? styles.secondaryButtonDisabled : null]}
            >
              <Text style={styles.secondaryButtonLabel}>Add to roster</Text>
            </Pressable>

            <Text style={styles.sectionLabel}>Roster ({rosterCards.length})</Text>
            <View style={styles.rosterList}>
              {rosterCards.length > 0 ? (
                rosterCards.map((participant) => (
                  <View key={participant.participantId} style={styles.rosterCard}>
                    <Text style={styles.rosterName}>{participant.displayName}</Text>
                    {snapshot.organizerParticipantId === participant.participantId ? (
                      <Text style={styles.organizerTag}>Organizer</Text>
                    ) : null}
                    <Text style={styles.rosterId}>{participant.participantId}</Text>

                    <View style={styles.rosterActionsRow}>
                      <Pressable
                        accessibilityRole="button"
                        style={styles.rowActionButton}
                        onPress={() => {
                          handleStartEditParticipant(participant.participantId, participant.displayName);
                        }}
                      >
                        <Text style={styles.rowActionLabel}>Edit</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        style={[styles.rowActionButton, styles.rowDangerActionButton]}
                        onPress={() => {
                          void handleDeleteParticipant(participant.participantId);
                        }}
                      >
                        <Text style={[styles.rowActionLabel, styles.rowDangerActionLabel]}>Delete</Text>
                      </Pressable>
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
                          <Pressable accessibilityRole="button" style={styles.rowActionButton} onPress={() => {
                            void handleSaveParticipantEdit();
                          }}>
                            <Text style={styles.rowActionLabel}>Save</Text>
                          </Pressable>
                          <Pressable
                            accessibilityRole="button"
                            style={styles.rowActionButton}
                            onPress={() => {
                              setEditingParticipantId(null);
                              setEditingParticipantName('');
                            }}
                          >
                            <Text style={styles.rowActionLabel}>Cancel</Text>
                          </Pressable>
                        </View>
                      </View>
                    ) : null}
                  </View>
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

            <Pressable 
              onPress={() => {
                void handleStep2Complete();
              }}
              accessibilityRole="button"
              disabled={rosterCards.length === 0 || isLoading}
              style={[styles.primaryButton, (rosterCards.length === 0 || isLoading) ? styles.primaryButtonDisabled : null]}
            >
              <Text style={styles.primaryButtonLabel}>{isLoading ? 'Completing...' : 'Complete Setup'}</Text>
            </Pressable>
            {errorMessage ? (
              <View style={styles.errorBlock}>
                <Text style={styles.errorMessage}>{errorMessage}</Text>
                <Pressable 
                  onPress={() => {
                    void handleStep2Complete();
                  }}
                  accessibilityRole="button"
                  style={styles.retryButton}
                >
                  <Text style={styles.retryButtonLabel}>Retry</Text>
                </Pressable>
              </View>
            ) : null}
          </View>
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
    color: '#2f5d62',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  stepBlock: {
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
  primaryButtonDisabled: {
    opacity: 0.5,
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
  rosterList: {
    gap: 12,
  },
  rosterCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9d0bf',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 8,
  },
  rosterName: {
    color: '#10203a',
    fontSize: 16,
    fontWeight: '700',
  },
  organizerTag: {
    alignSelf: 'flex-start',
    color: '#2f5d62',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
    backgroundColor: '#e9f2ef',
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  rosterId: {
    color: '#6b5e4c',
    fontSize: 12,
  },
  rosterActionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  rowActionButton: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#2f5d62',
    backgroundColor: '#f5efe4',
  },
  rowActionLabel: {
    color: '#2f5d62',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  rowDangerActionButton: {
    borderColor: '#b14f2e',
    backgroundColor: '#fff1ee',
  },
  rowDangerActionLabel: {
    color: '#b14f2e',
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
    color: '#b14f2e',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
  },
  errorBlock: {
    borderRadius: 12,
    backgroundColor: '#fff1ee',
    borderWidth: 1,
    borderColor: '#d9a8a0',
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
    borderColor: '#b14f2e',
    backgroundColor: '#ffffff',
  },
  retryButtonLabel: {
    color: '#b14f2e',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
