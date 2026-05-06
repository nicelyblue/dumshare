import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Slider from '@react-native-community/slider';
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

function formatPercentageBps(bps: number): string {
  return (bps / 100).toFixed(2).replace(/\.00$/, '');
}

function rebalanceExactSplit(
  participants: { participantId: string; owedAmountMinor: number }[],
  targetParticipantId: string,
  nextAmountMinor: number,
  totalAmountMinor: number,
): { participantId: string; owedAmountMinor: number }[] {
  if (participants.length === 0) {
    return participants;
  }

  const safeTotal = Math.max(0, totalAmountMinor);
  const clampedTarget = Math.max(0, Math.min(nextAmountMinor, safeTotal));
  const targetIndex = participants.findIndex((participant) => participant.participantId === targetParticipantId);

  if (targetIndex === -1) {
    return participants;
  }

  if (participants.length === 1) {
    return [{ ...participants[0], owedAmountMinor: safeTotal }];
  }

  const result = participants.map((participant) => ({ ...participant }));
  result[targetIndex].owedAmountMinor = clampedTarget;

  const remainder = safeTotal - clampedTarget;
  const otherIndexes = result.map((_, index) => index).filter((index) => index !== targetIndex);
  const splitBase = Math.floor(remainder / otherIndexes.length);
  let splitRemainder = remainder - splitBase * otherIndexes.length;

  otherIndexes.forEach((index) => {
    const bump = splitRemainder > 0 ? 1 : 0;
    splitRemainder -= bump;
    result[index].owedAmountMinor = splitBase + bump;
  });

  return result;
}

function rebalancePercentageSplit(
  participants: { participantId: string; percentageBps: number }[],
  targetParticipantId: string,
  nextBps: number,
): { participantId: string; percentageBps: number }[] {
  if (participants.length === 0) {
    return participants;
  }

  const safeTotal = 10000;
  const clampedTarget = Math.max(0, Math.min(nextBps, safeTotal));
  const targetIndex = participants.findIndex((participant) => participant.participantId === targetParticipantId);

  if (targetIndex === -1) {
    return participants;
  }

  if (participants.length === 1) {
    return [{ ...participants[0], percentageBps: safeTotal }];
  }

  const result = participants.map((participant) => ({ ...participant }));
  result[targetIndex].percentageBps = clampedTarget;

  const remainder = safeTotal - clampedTarget;
  const otherIndexes = result.map((_, index) => index).filter((index) => index !== targetIndex);
  const splitBase = Math.floor(remainder / otherIndexes.length);
  let splitRemainder = remainder - splitBase * otherIndexes.length;

  otherIndexes.forEach((index) => {
    const bump = splitRemainder > 0 ? 1 : 0;
    splitRemainder -= bump;
    result[index].percentageBps = splitBase + bump;
  });

  return result;
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
              <View key={participant.participantId} style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>{details?.displayName ?? participant.participantId} owed amount</Text>
                <Text style={styles.sliderValue}>{formatMinorToMajor(participant.owedAmountMinor)}</Text>
                <View style={styles.sliderControlRow}>
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      onChange({
                        mode: 'exact',
                        participants: rebalanceExactSplit(
                          split.participants,
                          participant.participantId,
                          participant.owedAmountMinor - 1,
                          totalAmountMinor,
                        ),
                      });
                    }}
                  >
                    <Text style={styles.adjustButtonLabel}>-</Text>
                  </Pressable>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={Math.max(0, totalAmountMinor)}
                    step={1}
                    value={participant.owedAmountMinor}
                    minimumTrackTintColor="#6e4a7e"
                    maximumTrackTintColor="#d9d0bf"
                    thumbTintColor="#6e4a7e"
                    onValueChange={(value) => {
                      onChange({
                        mode: 'exact',
                        participants: rebalanceExactSplit(
                          split.participants,
                          participant.participantId,
                          value,
                          totalAmountMinor,
                        ),
                      });
                    }}
                  />
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      onChange({
                        mode: 'exact',
                        participants: rebalanceExactSplit(
                          split.participants,
                          participant.participantId,
                          participant.owedAmountMinor + 1,
                          totalAmountMinor,
                        ),
                      });
                    }}
                  >
                    <Text style={styles.adjustButtonLabel}>+</Text>
                  </Pressable>
                </View>
                <LabeledField
                  label=""
                  value={formatMinorToMajor(participant.owedAmountMinor)}
                  onChangeText={(text) => {
                    const nextAmount = parseMajorToMinor(text);
                    onChange({
                      mode: 'exact',
                      participants: rebalanceExactSplit(
                        split.participants,
                        participant.participantId,
                        nextAmount,
                        totalAmountMinor,
                      ),
                    });
                  }}
                  placeholder="0.00"
                  keyboardType="decimal-pad"
                  helperText="Slider and +/- keep exact totals balanced."
                />
              </View>
            );
          })
        : null}

      {split.mode === 'percentage'
        ? split.participants.map((participant) => {
            const details = participants.find((candidate) => candidate.participantId === participant.participantId);
            return (
              <View key={participant.participantId} style={styles.sliderRow}>
                <Text style={styles.sliderLabel}>{details?.displayName ?? participant.participantId} percentage</Text>
                <Text style={styles.sliderValue}>{formatPercentageBps(participant.percentageBps)}%</Text>
                <View style={styles.sliderControlRow}>
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      onChange({
                        mode: 'percentage',
                        participants: rebalancePercentageSplit(
                          split.participants,
                          participant.participantId,
                          participant.percentageBps - 25,
                        ),
                      });
                    }}
                  >
                    <Text style={styles.adjustButtonLabel}>-</Text>
                  </Pressable>
                  <Slider
                    style={styles.slider}
                    minimumValue={0}
                    maximumValue={10000}
                    step={1}
                    value={participant.percentageBps}
                    minimumTrackTintColor="#6e4a7e"
                    maximumTrackTintColor="#d9d0bf"
                    thumbTintColor="#6e4a7e"
                    onValueChange={(value) => {
                      onChange({
                        mode: 'percentage',
                        participants: rebalancePercentageSplit(
                          split.participants,
                          participant.participantId,
                          value,
                        ),
                      });
                    }}
                  />
                  <Pressable
                    style={styles.adjustButton}
                    onPress={() => {
                      onChange({
                        mode: 'percentage',
                        participants: rebalancePercentageSplit(
                          split.participants,
                          participant.participantId,
                          participant.percentageBps + 25,
                        ),
                      });
                    }}
                  >
                    <Text style={styles.adjustButtonLabel}>+</Text>
                  </Pressable>
                </View>
                <LabeledField
                  label=""
                  value={formatPercentageBps(participant.percentageBps)}
                  onChangeText={(text) => {
                    const parsed = Number.parseFloat(text);
                    const nextBps = Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * 100) : 0;
                    onChange({
                      mode: 'percentage',
                      participants: rebalancePercentageSplit(
                        split.participants,
                        participant.participantId,
                        nextBps,
                      ),
                    });
                  }}
                  placeholder="0"
                  keyboardType="decimal-pad"
                  helperText="Slider and +/- keep total at 100%."
                />
              </View>
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
  sliderRow: {
    gap: 8,
    borderWidth: 1,
    borderColor: '#d9d0bf',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    padding: 10,
  },
  sliderLabel: {
    color: '#38485f',
    fontSize: 13,
    fontWeight: '700',
  },
  sliderValue: {
    color: '#5b2f73',
    fontSize: 14,
    fontWeight: '700',
  },
  sliderControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  slider: {
    flex: 1,
    height: 40,
  },
  adjustButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#6e4a7e',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#efe6f4',
  },
  adjustButtonLabel: {
    color: '#5b2f73',
    fontSize: 18,
    fontWeight: '800',
    lineHeight: 20,
  },
});
