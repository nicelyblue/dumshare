import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { LedgerExpenseDetailsModel } from '../controllers/ledgerHistoryController';
import { colorTokens, radiusTokens, spacingTokens, touchTarget } from '../theme/tokens';

type Props = {
  visible: boolean;
  model: LedgerExpenseDetailsModel | null;
  onClose: () => void;
};

export function LedgerEntryDetailModal({ visible, model, onClose }: Props): JSX.Element {
  if (!model) {
    return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} />;
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={onClose} hitSlop={touchTarget.md}>
            <Ionicons name="chevron-back" size={28} color={colorTokens.textPrimary} />
          </Pressable>
          <Text style={styles.headerTitle}>Expense Details</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          <View style={styles.titleSection}>
            <Text style={styles.expenseTitle}>{model.title}</Text>
            <Text style={styles.amountValue}>{model.totalAmountLabel}</Text>
          </View>

          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Date & Time</Text>
              <Text style={styles.value}>{model.timestampLabel}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Paid By</Text>
              <Text style={styles.value}>{model.paidByLabel}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardRow}>
              <Text style={styles.label}>Amount Paid</Text>
              <Text style={styles.value}>{model.paidAmountLabel}</Text>
            </View>
          </View>

          <View style={styles.card}>
            <View style={styles.cardRow}>
              <Text style={styles.label}>Split Method</Text>
              <Text style={styles.value}>{model.splitTitleLabel}</Text>
            </View>
            <View style={styles.cardDivider} />
            <View style={styles.cardRow}>
              <Text style={styles.label}>Per Person</Text>
              <Text style={styles.value}>{model.splitAmountLabel}</Text>
            </View>
          </View>

          <View style={styles.participantsCard}>
            <Text style={styles.label}>Participants ({model.participants.length})</Text>
            <View style={styles.participantsList}>
              {model.participants.map((participant, index) => (
                <View
                  key={participant.participantId}
                  style={[styles.participantRow, index < model.participants.length - 1 ? styles.participantRowBorder : null]}
                >
                  <View style={styles.participantLeft}>
                    <Text style={styles.participantName}>{participant.displayName}</Text>
                    <Text style={styles.participantStatus}>{participant.statusLabel}</Text>
                  </View>
                  <Text style={styles.participantAmount}>{participant.amountLabel}</Text>
                </View>
              ))}
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colorTokens.appBackground,
    paddingTop: 12,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacingTokens.lg,
    paddingVertical: spacingTokens.md,
    borderBottomWidth: 1,
    borderBottomColor: colorTokens.subtleBorder,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colorTokens.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacingTokens.lg,
    paddingVertical: spacingTokens.lg,
    gap: spacingTokens.lg,
    paddingBottom: spacingTokens.xl,
  },
  titleSection: {
    gap: spacingTokens.sm,
    marginBottom: spacingTokens.md,
  },
  expenseTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colorTokens.textPrimary,
  },
  amountValue: {
    fontSize: 32,
    fontWeight: '700',
    color: colorTokens.inverse,
  },
  card: {
    backgroundColor: colorTokens.card,
    borderRadius: radiusTokens.md,
    overflow: 'hidden',
  },
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.md,
  },
  cardDivider: {
    height: 1,
    backgroundColor: colorTokens.subtleBorder,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colorTokens.textMuted,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    color: colorTokens.textPrimary,
    textAlign: 'right',
    flex: 1,
    marginLeft: spacingTokens.md,
  },
  participantsCard: {
    backgroundColor: colorTokens.card,
    borderRadius: radiusTokens.md,
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.md,
    gap: spacingTokens.md,
  },
  participantsList: {
    borderRadius: radiusTokens.sm,
    overflow: 'hidden',
  },
  participantRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacingTokens.md,
  },
  participantRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: colorTokens.subtleBorder,
  },
  participantLeft: {
    flex: 1,
    gap: spacingTokens.xs,
  },
  participantName: {
    fontSize: 16,
    fontWeight: '500',
    color: colorTokens.textPrimary,
  },
  participantStatus: {
    fontSize: 12,
    color: colorTokens.textMuted,
  },
  participantAmount: {
    fontSize: 14,
    fontWeight: '600',
    color: colorTokens.textPrimary,
    marginLeft: spacingTokens.md,
  },
});
