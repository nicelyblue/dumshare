import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppShell } from '../ui/AppShell';
import { SummaryCard } from '../ui/SummaryCard';
import { useLedgerSession } from '../state/ledgerSession';

export function SyncScreen() {
  const { snapshot, buildSyncRequestQr, parseSyncRequestQr, runSyncTransfer } = useLedgerSession();
  const [requestPayload, setRequestPayload] = useState('');
  const [generatedPayload, setGeneratedPayload] = useState('');
  const [statusTimeline, setStatusTimeline] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

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
        <Pressable
          accessibilityRole="button"
          onPress={async () => {
            setError(null);
            try {
              setStatusTimeline(await runSyncTransfer(requestPayload));
            } catch (nextError) {
              setError(nextError instanceof Error ? nextError.message : 'Unable to run sync transfer');
            }
          }}
          style={styles.button}
        >
          <Text style={styles.buttonLabel}>Run transfer</Text>
        </Pressable>
      </View>

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
  button: {
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#10203a',
    alignSelf: 'flex-start',
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
});
