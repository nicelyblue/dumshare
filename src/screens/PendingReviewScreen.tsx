import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExpenseReviewItem } from '../data/ledger/expenseReview';
import { ReviewStatusPill } from '../ui/ReviewStatusPill';
import { SummaryCard } from '../ui/SummaryCard';

type PendingReviewScreenProps = {
  items: ExpenseReviewItem[];
  onOpenSubmission: (submissionId: string) => void;
};

export function PendingReviewScreen({ items, onOpenSubmission }: PendingReviewScreenProps) {
  const pendingItems = items.filter((item) => item.status === 'pending');

  if (pendingItems.length === 0) {
    return (
      <SummaryCard
        label="Pending review"
        value="No contributor submissions pending"
        detail="New contributor submissions will appear here for organizer approval."
      />
    );
  }

  return (
    <View style={styles.list}>
      {pendingItems.map((item) => (
        <Pressable key={item.submissionId} style={styles.card} onPress={() => onOpenSubmission(item.submissionId)}>
          <View style={styles.headerRow}>
            <Text style={styles.title}>{item.proposedExpense.description}</Text>
            <ReviewStatusPill status={item.status} label={item.statusLabel} />
          </View>
          <Text style={styles.meta}>
            {item.proposedExpense.currency} {(item.proposedExpense.totalAmountMinor / 100).toFixed(2)} · {item.proposedExpense.expenseDate}
          </Text>
          <Text style={styles.meta}>Submitted by {item.submittedByParticipantId}</Text>
          <Text style={styles.link}>Open submission</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#d9d0bf',
    backgroundColor: '#ffffff',
    padding: 12,
    gap: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    color: '#10203a',
    fontSize: 15,
    fontWeight: '700',
    flex: 1,
  },
  meta: {
    color: '#51617a',
    fontSize: 13,
  },
  link: {
    color: '#6e4a7e',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
