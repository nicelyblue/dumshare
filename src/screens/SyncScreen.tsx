import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { AppShell } from '../ui/AppShell';
import { ActionButton } from '../ui/ActionButton';
import { SurfaceCard } from '../ui/SurfaceCard';
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
      <ActionButton tone="secondary" compact label="Back to dashboard" onPress={() => navigation.navigate(APP_ROUTES.dashboard)} />

      <SurfaceCard style={styles.section}>
        <Text style={styles.label}>Current ledger</Text>
        <Text style={styles.value}>{snapshot.ledgerId ?? 'No ledger selected'}</Text>
      </SurfaceCard>

      <SurfaceCard style={styles.section}>
        <Text style={styles.label}>Start sync request</Text>
        <ActionButton
          label="Generate request payload"
          onPress={async () => {
            setError(null);
            try {
              setGeneratedPayload(await buildSyncRequestQr());
            } catch (nextError) {
              setError(nextError instanceof Error ? nextError.message : 'Unable to generate request');
            }
          }}
        />
        {generatedPayload ? <SummaryCard label="Generated request" value="Share this payload as QR text" detail={generatedPayload} /> : null}
      </SurfaceCard>

      <SurfaceCard style={styles.section}>
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
      </SurfaceCard>

      <SurfaceCard style={styles.section}>
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
      </SurfaceCard>

      <SurfaceCard style={styles.section}>
        <ActionButton
          label="Run transfer"
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
        />
        {!recipientParticipantId ? (
          <Text style={styles.helperText}>Select a recipient participant to enable transfer.</Text>
        ) : null}
      </SurfaceCard>

      {statusTimeline.length > 0 ? <SummaryCard label="Transfer timeline" value="Sync progress" detail={statusTimeline.join(' → ')} /> : null}
      {error ? <SummaryCard label="Sync error" value="Action failed" detail={error} tone="warning" /> : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
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
