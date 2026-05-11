import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExpenseReviewItem } from '../data/ledger/expenseReview';
import { LabeledField } from '../ui/LabeledField';
import { ReviewStatusPill } from '../ui/ReviewStatusPill';
import { colors } from '../theme/colors';

type SubmissionDetailScreenProps = {
  item: ExpenseReviewItem;
  onSubmitDecision: (input: { submissionId: string; decision: 'approved' | 'rejected'; reviewReason: string }) => Promise<void>;
};

export function SubmissionDetailScreen({ item, onSubmitDecision }: SubmissionDetailScreenProps) {
  const [reviewReason, setReviewReason] = useState('Reviewed by organizer');
  const [message, setMessage] = useState('');

  async function handleDecision(decision: 'approved' | 'rejected') {
    setMessage('');
    try {
      await onSubmitDecision({ submissionId: item.submissionId, decision, reviewReason });
      setMessage(`Submission ${decision}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to submit review decision');
    }
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>{item.proposedExpense.description}</Text>
        <ReviewStatusPill status={item.status} label={item.statusLabel} />
      </View>

      <Text style={styles.detail}>Amount: {item.proposedExpense.currency} {(item.proposedExpense.totalAmountMinor / 100).toFixed(2)}</Text>
      <Text style={styles.detail}>Date: {item.proposedExpense.expenseDate}</Text>
      <Text style={styles.detail}>Split: {item.proposedExpense.splitSummary}</Text>
      <Text style={styles.detail}>Submitted by: {item.submittedByParticipantId}</Text>

      <LabeledField
        label="Review reason"
        value={reviewReason}
        onChangeText={setReviewReason}
        placeholder="Reason for approval or rejection"
        helperText="Review reason is saved with the approval event."
      />

      <View style={styles.actionsRow}>
        <Pressable style={[styles.actionButton, styles.approve]} onPress={() => void handleDecision('approved')}>
          <Text style={styles.actionLabel}>Approve</Text>
        </Pressable>
        <Pressable style={[styles.actionButton, styles.reject]} onPress={() => void handleDecision('rejected')}>
          <Text style={styles.actionLabel}>Reject</Text>
        </Pressable>
      </View>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 10,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  detail: {
    color: colors.text.subtle,
    fontSize: 13,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  approve: {
    backgroundColor: colors.status.success,
  },
  reject: {
    backgroundColor: colors.status.danger,
  },
  actionLabel: {
    color: colors.text.onAccent,
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
  },
  message: {
    color: colors.text.link,
    fontSize: 13,
  },
});
