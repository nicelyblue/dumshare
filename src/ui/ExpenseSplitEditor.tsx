import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExpenseSplitPayload } from '../domain/events/types';
import { LabeledField } from './LabeledField';

type ParticipantOption = {
  participantId: string;
  displayName: string;
};

type ExpenseSplitEditorProps = {
  participants: ParticipantOption[];
  totalAmountMinor: number;
  split: ExpenseSplitPayload;
  onChange: (next: ExpenseSplitPayload) => void;
};

function createEqualSplit(participants: ParticipantOption[]): ExpenseSplitPayload {
  return {
    mode: 'equal',
    participants: participants.map((participant) => ({ participantId: participant.participantId })),
  };
}

function createExactSplit(participants: ParticipantOption[], totalAmountMinor: number): ExpenseSplitPayload {
  const safeTotal = Number.isInteger(totalAmountMinor) && totalAmountMinor > 0 ? totalAmountMinor : 0;
  const baseShare = participants.length > 0 ? Math.floor(safeTotal / participants.length) : 0;
  let remainder = safeTotal - baseShare * participants.length;

  return {
    mode: 'exact',
    participants: participants.map((participant) => {
      const bonus = remainder > 0 ? 1 : 0;
      remainder -= bonus;
      return {
        participantId: participant.participantId,
        owedAmountMinor: baseShare + bonus,
      };
    }),
  };
}

function createPercentageSplit(participants: ParticipantOption[]): ExpenseSplitPayload {
  const participantCount = participants.length;
  const baseShare = participantCount > 0 ? Math.floor(10000 / participantCount) : 0;
  let remainder = 10000 - baseShare * participantCount;

  return {
    mode: 'percentage',
    participants: participants.map((participant) => {
      const bonus = remainder > 0 ? 1 : 0;
      remainder -= bonus;
      return {
        participantId: participant.participantId,
        percentageBps: baseShare + bonus,
      };
    }),
  };
}

function formatMinorToMajor(value: number): string {
  return `${Math.floor(value / 100)}.${String(value % 100).padStart(2, '0')}`;
}

function parseMajorToMinor(input: string): number {
  const sanitized = input.replace(/[^0-9.]/g, '').trim();

  if (!sanitized) {
    return 0;
  }

  const parsed = Number.parseFloat(sanitized);

  if (!Number.isFinite(parsed) || parsed < 0) {
    return 0;
  }

  return Math.round(parsed * 100);
}

export function ExpenseSplitEditor({ participants, totalAmountMinor, split, onChange }: ExpenseSplitEditorProps) {
  const totalShareLabel =
    split.mode === 'exact'
      ? `Exact total: ${formatMinorToMajor(
          split.participants.reduce((sum, participant) => sum + participant.owedAmountMinor, 0),
        )}`
      : split.mode === 'percentage'
        ? `Percentage total: ${split.participants.reduce((sum, participant) => sum + participant.percentageBps, 0) / 100}%`
        : `Equal split across ${split.participants.length} participant(s)`;

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>Split controls</Text>

      <View style={styles.modeRow}>
        <Pressable
          onPress={() => onChange(createEqualSplit(participants))}
          style={[styles.modeButton, split.mode === 'equal' ? styles.modeButtonActive : null]}
        >
          <Text style={[styles.modeButtonLabel, split.mode === 'equal' ? styles.modeButtonLabelActive : null]}>Equal</Text>
        </Pressable>
        <Pressable
          onPress={() => onChange(createExactSplit(participants, totalAmountMinor))}
          style={[styles.modeButton, split.mode === 'exact' ? styles.modeButtonActive : null]}
        >
          <Text style={[styles.modeButtonLabel, split.mode === 'exact' ? styles.modeButtonLabelActive : null]}>Exact</Text>
        </Pressable>
        <Pressable
          onPress={() => onChange(createPercentageSplit(participants))}
          style={[styles.modeButton, split.mode === 'percentage' ? styles.modeButtonActive : null]}
        >
          <Text style={[styles.modeButtonLabel, split.mode === 'percentage' ? styles.modeButtonLabelActive : null]}>Percentage</Text>
        </Pressable>
      </View>

      <Text style={styles.helperText}>{totalShareLabel}</Text>

      {split.mode === 'exact'
        ? split.participants.map((participant) => {
            const details = participants.find((candidate) => candidate.participantId === participant.participantId);
            return (
              <LabeledField
                key={participant.participantId}
                label={`${details?.displayName ?? participant.participantId} owed amount`}
                value={formatMinorToMajor(participant.owedAmountMinor)}
                onChangeText={(text) => {
                  const nextAmount = parseMajorToMinor(text);
                  onChange({
                    mode: 'exact',
                    participants: split.participants.map((candidate) =>
                      candidate.participantId === participant.participantId
                        ? { ...candidate, owedAmountMinor: nextAmount }
                        : candidate,
                    ),
                  });
                }}
                placeholder="0.00"
                keyboardType="decimal-pad"
                helperText="Use major units (example 12.40)."
              />
            );
          })
        : null}

      {split.mode === 'percentage'
        ? split.participants.map((participant) => {
            const details = participants.find((candidate) => candidate.participantId === participant.participantId);
            return (
              <LabeledField
                key={participant.participantId}
                label={`${details?.displayName ?? participant.participantId} percentage`}
                value={(participant.percentageBps / 100).toString()}
                onChangeText={(text) => {
                  const parsed = Number.parseFloat(text);
                  const nextBps = Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : 0;

                  onChange({
                    mode: 'percentage',
                    participants: split.participants.map((candidate) =>
                      candidate.participantId === participant.participantId
                        ? { ...candidate, percentageBps: nextBps }
                        : candidate,
                    ),
                  });
                }}
                placeholder="0"
                keyboardType="decimal-pad"
                helperText="Percent as major value (example 33.33)."
              />
            );
          })
        : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  label: {
    color: '#7a634b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#d9d0bf',
    backgroundColor: '#ffffff',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modeButtonActive: {
    borderColor: '#6e4a7e',
    backgroundColor: '#efe6f4',
  },
  modeButtonLabel: {
    color: '#38485f',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  modeButtonLabelActive: {
    color: '#5b2f73',
  },
  helperText: {
    color: '#51617a',
    fontSize: 13,
    lineHeight: 18,
  },
});