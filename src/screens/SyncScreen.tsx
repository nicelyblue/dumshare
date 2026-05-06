import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppShell } from '../ui/AppShell';
import { SummaryCard } from '../ui/SummaryCard';
import { useLedgerSession } from '../state/ledgerSession';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';

export function SyncScreen() {
  const { snapshot, buildSyncRequestQr, parseSyncRequestQr, runSyncTransfer } = useLedgerSession();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [requestPayload, setRequestPayload] = useState('');
  const [generatedPayload, setGeneratedPayload] = useState('');
  const [statusTimeline, setStatusTimeline] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [recipientParticipantId, setRecipientParticipantId] = useState<string | null>(null);

  const participants = snapshot.balanceSummary.participants;

  const selectedRecipient = participants.find((participant) => participant.participantId === recipientParticipantId);

  const parseResult = useMemo(() => {
    if (!requestPayload.trim()) {
      return null;
    }

    return parseSyncRequestQr(requestPayload);
  }, [parseSyncRequestQr, requestPayload]);

  return (
    <AppShell
      eyebrow="Sync status"
      title="In-person sync"
      description="Generate a request payload, validate pasted QR text, then run transfer with deterministic status updates."
      accent="#2f6f9f"
    >
      <Pressable
        onPress={() => navigation.navigate(APP_ROUTES.dashboard)}
        accessibilityRole="button"
        style={styles.backButton}
      >
        <Text style={styles.backButtonLabel}>Back to dashboard</Text>
      </Pressable>

      <View style={styles.section}>
        <Text style={styles.label}>Current ledger</Text>
        <Text style={styles.value}>{snapshot.ledgerId ?? 'No ledger selected'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Start sync request</Text>
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            setError(null);
            try {
              setGeneratedPayload(await buildSyncRequestQr());
            } catch (nextError) {
              setError(nextError instanceof Error ? nextError.message : 'Unable to generate request');
            }
          }}
          style={styles.button}
        >
          <Text style={styles.buttonLabel}>Generate request payload</Text>
        </Pressable>
        {generatedPayload ? <SummaryCard label="Generated request" value="Share this payload as QR text" detail={generatedPayload} /> : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Paste or scan request payload</Text>
        <TextInput
          multiline
          value={requestPayload}
          onChangeText={setRequestPayload}
          style={styles.input}
          placeholder="Paste QR payload JSON"
          placeholderTextColor="#7a746d"
        />
        {parseResult ? (
          parseResult.ok ? (
            <SummaryCard label="Payload status" value="Valid sync request" detail={`Ledger ${parseResult.payload.ledgerId} · Requester ${parseResult.payload.requesterDeviceId}`} tone="accent" />
          ) : (
            <SummaryCard label="Payload status" value="Invalid sync request" detail={parseResult.ok === false ? parseResult.error : 'Invalid payload'} tone="warning" />
          )
        ) : null}
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Recipient participant</Text>
        <Text style={styles.value}>
          {selectedRecipient ? `${selectedRecipient.displayName} (${selectedRecipient.participantId})` : 'No recipient selected'}
        </Text>
        <View style={styles.recipientRow}>
          {participants.length > 0 ? (
            participants.map((participant) => (
              <Pressable
                key={participant.participantId}
                style={[
                  styles.recipientButton,
                  recipientParticipantId === participant.participantId ? styles.recipientButtonActive : null,
                ]}
                onPress={() => setRecipientParticipantId(participant.participantId)}
              >
                <Text
                  style={[
                    styles.recipientButtonLabel,
                    recipientParticipantId === participant.participantId ? styles.recipientButtonLabelActive : null,
                  ]}
                >
                  {participant.displayName}
                </Text>
              </Pressable>
            ))
          ) : (
            <Text style={styles.helperText}>Add participants before assigning contributor recipient.</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <Pressable
          accessibilityRole="button"
          disabled={!recipientParticipantId}
          onPress={async () => {
            setError(null);
            if (!recipientParticipantId) {
              setError('Select a recipient participant before running transfer.');
              return;
            }
            try {
              setStatusTimeline(await runSyncTransfer(requestPayload, recipientParticipantId));
            } catch (nextError) {
              setError(nextError instanceof Error ? nextError.message : 'Unable to run sync transfer');
            }
          }}
          style={[styles.button, !recipientParticipantId ? styles.buttonDisabled : null]}
        >
          <Text style={styles.buttonLabel}>Run transfer</Text>
        </Pressable>
        {!recipientParticipantId ? (
          <Text style={styles.helperText}>Select a recipient participant to enable transfer.</Text>
        ) : null}
      </View>

      {statusTimeline.length > 0 ? <SummaryCard label="Transfer timeline" value="Sync progress" detail={statusTimeline.join(' → ')} /> : null}
      {error ? <SummaryCard label="Sync error" value="Action failed" detail={error} tone="warning" /> : null}
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
    borderColor: '#2f6f9f',
    backgroundColor: '#f5efe4',
  },
  backButtonLabel: {
    color: '#2f6f9f',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    textTransform: 'uppercase',
  },
  section: {
    gap: 10,
  },
  label: {
    color: '#7a634b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  value: {
    color: '#10203a',
    fontSize: 15,
    fontWeight: '600',
  },
  helperText: {
    color: '#51617a',
    fontSize: 13,
    lineHeight: 18,
  },
  button: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#10203a',
    alignSelf: 'flex-start',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    color: '#f5efe4',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 110,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9d0bf',
    backgroundColor: '#ffffff',
    padding: 12,
    color: '#10203a',
    textAlignVertical: 'top',
  },
  recipientRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  recipientButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#2f6f9f',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  recipientButtonActive: {
    backgroundColor: '#deebf5',
  },
  recipientButtonLabel: {
    color: '#2f6f9f',
    fontSize: 12,
    fontWeight: '700',
  },
  recipientButtonLabelActive: {
    color: '#10203a',
  },
});
