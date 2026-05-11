import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { ExpenseSplitPayload } from '../domain/events/types';
import { AppShell } from '../ui/AppShell';
import { ActionButton } from '../ui/ActionButton';
import { APP_ROUTES } from '../navigation/routes';
import type { RootStackParamList } from '../navigation/types';
import { useLedgerSession } from '../state/ledgerSession';
import { clearExpenseFlowDraft, readExpenseFlowDraft } from '../state/expenseFlowDraft';
import { colors } from '../theme/colors';

function defaultSplit(participantIds: string[]): ExpenseSplitPayload {
  return {
    mode: 'equal',
    participants: participantIds.map((participantId) => ({ participantId })),
  };
}

export function SplitDetailsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { snapshot, submitExpenseDraft } = useLedgerSession();
  const participants = useMemo(
    () => snapshot.balanceSummary.participants.map((participant) => ({ participantId: participant.participantId, displayName: participant.displayName })),
    [snapshot.balanceSummary.participants],
  );
  const draft = readExpenseFlowDraft();

  const [split, setSplit] = useState<ExpenseSplitPayload>(
    draft?.split ?? defaultSplit(participants.map((participant) => participant.participantId)),
  );
  const [message, setMessage] = useState('');

  const rows = useMemo(() => {
    if (split.mode === 'equal') {
      const perPerson = participants.length > 0 ? (draft?.totalAmountMinor ?? 0) / participants.length : 0;
      return participants.map((participant) => ({
        participantId: participant.participantId,
        displayName: participant.displayName,
        amountMinor: Math.round(perPerson),
        shareLabel: `${participants.length > 0 ? (100 / participants.length).toFixed(0) : '0'}%`,
      }));
    }

    if (split.mode === 'exact') {
      return split.participants.map((row) => {
        const person = participants.find((p) => p.participantId === row.participantId);
        const totalMinor = draft?.totalAmountMinor ?? 0;
        const pct = totalMinor > 0 ? ((row.owedAmountMinor / totalMinor) * 100).toFixed(0) : '0';
        return {
          participantId: row.participantId,
          displayName: person?.displayName ?? row.participantId,
          amountMinor: row.owedAmountMinor,
          shareLabel: `${pct}%`,
        };
      });
    }

    return split.participants.map((row) => {
      const person = participants.find((p) => p.participantId === row.participantId);
      const totalMinor = draft?.totalAmountMinor ?? 0;
      const amountMinor = Math.round((totalMinor * row.percentageBps) / 10000);
      return {
        participantId: row.participantId,
        displayName: person?.displayName ?? row.participantId,
        amountMinor,
        shareLabel: `${(row.percentageBps / 100).toFixed(0)}%`,
      };
    });
  }, [draft?.totalAmountMinor, participants, split]);

  function setMode(nextMode: 'equal' | 'exact' | 'percentage'): void {
    if (nextMode === 'equal') {
      setSplit(defaultSplit(participants.map((p) => p.participantId)));
      return;
    }

    if (nextMode === 'exact') {
      const total = draft?.totalAmountMinor ?? 0;
      const count = participants.length || 1;
      const base = Math.floor(total / count);
      let rem = total - base * count;
      setSplit({
        mode: 'exact',
        participants: participants.map((participant) => {
          const bump = rem > 0 ? 1 : 0;
          rem -= bump;
          return { participantId: participant.participantId, owedAmountMinor: base + bump };
        }),
      });
      return;
    }

    const count = participants.length || 1;
    const base = Math.floor(10000 / count);
    let rem = 10000 - base * count;
    setSplit({
      mode: 'percentage',
      participants: participants.map((participant) => {
        const bump = rem > 0 ? 1 : 0;
        rem -= bump;
        return { participantId: participant.participantId, percentageBps: base + bump };
      }),
    });
  }

  function updateRowAmount(participantId: string, text: string): void {
    const numeric = Number.parseFloat(text.replace(/[^0-9.]/g, ''));
    const amountMinor = Number.isFinite(numeric) ? Math.max(0, Math.round(numeric * 100)) : 0;

    if (split.mode === 'exact') {
      setSplit({
        mode: 'exact',
        participants: split.participants.map((row) =>
          row.participantId === participantId ? { ...row, owedAmountMinor: amountMinor } : row,
        ),
      });
      return;
    }

    if (split.mode === 'percentage') {
      const total = draft?.totalAmountMinor ?? 0;
      const bps = total > 0 ? Math.round((amountMinor / total) * 10000) : 0;
      setSplit({
        mode: 'percentage',
        participants: split.participants.map((row) =>
          row.participantId === participantId ? { ...row, percentageBps: bps } : row,
        ),
      });
    }
  }

  async function handleSaveExpense() {
    if (!draft) {
      setMessage('Start from Add Expense first.');
      return;
    }

    try {
      const finalSplit: ExpenseSplitPayload =
        split.mode === 'exact'
          ? {
              mode: 'exact',
              participants: (() => {
                const total = draft.totalAmountMinor;
                const copy = split.participants.map((row) => ({ ...row }));
                const running = copy.reduce((sum, row) => sum + row.owedAmountMinor, 0);
                if (copy.length > 0 && running !== total) {
                  copy[copy.length - 1].owedAmountMinor += total - running;
                }
                return copy;
              })(),
            }
          : split.mode === 'percentage'
            ? {
                mode: 'percentage',
                participants: (() => {
                  const copy = split.participants.map((row) => ({ ...row }));
                  const running = copy.reduce((sum, row) => sum + row.percentageBps, 0);
                  if (copy.length > 0 && running !== 10000) {
                    copy[copy.length - 1].percentageBps += 10000 - running;
                  }
                  return copy;
                })(),
              }
            : split;

      await submitExpenseDraft({
        description: draft.description,
        currency: draft.currency,
        expenseDate: draft.expenseDate,
        totalAmountMinor: draft.totalAmountMinor,
        creatorRole: draft.creatorRole,
        payers: draft.payers,
        split: finalSplit,
      });
      clearExpenseFlowDraft();
      navigation.navigate(APP_ROUTES.homeDashboard);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to save expense.');
    }
  }

  return (
    <AppShell
      eyebrow="Expense"
      title="Configure Split"
      description="Adjust how the expense is divided"
      accent={colors.text.primary}
      activeRoute={APP_ROUTES.addExpense}
      onNavigate={(routeName) => navigation.navigate(routeName)}
      enableShellNav
    >
      <View style={styles.totalCard}>
        <Text style={styles.totalLabel}>Total Amount</Text>
        <Text style={styles.totalValue}>
          {draft ? `$${(draft.totalAmountMinor / 100).toFixed(2)}` : '$0.00'}
        </Text>
      </View>

      <Text style={styles.blockLabel}>Split Method</Text>
      <View style={styles.modeRow}>
        <Pressable style={[styles.modeButton, split.mode === 'equal' ? styles.modeButtonActive : null]} onPress={() => setMode('equal')}>
          <Text style={[styles.modeLabel, split.mode === 'equal' ? styles.modeLabelActive : null]}>Equal</Text>
        </Pressable>
        <Pressable style={[styles.modeButton, split.mode === 'exact' ? styles.modeButtonActive : null]} onPress={() => setMode('exact')}>
          <Text style={[styles.modeLabel, split.mode === 'exact' ? styles.modeLabelActive : null]}>Exact</Text>
        </Pressable>
        <Pressable style={[styles.modeButton, split.mode === 'percentage' ? styles.modeButtonActive : null]} onPress={() => setMode('percentage')}>
          <Text style={[styles.modeLabel, split.mode === 'percentage' ? styles.modeLabelActive : null]}>Percent</Text>
        </Pressable>
      </View>

      <View style={styles.participantsWrap}>
        <View style={styles.participantsHeader}>
          <Text style={styles.blockLabel}>Participants ({participants.length})</Text>
          <Text style={styles.selectAll}>Select All</Text>
        </View>

        {rows.map((row) => (
          <View key={row.participantId} style={styles.personCard}>
            <View style={styles.personTop}>
              <Text style={styles.personName}>{row.displayName}</Text>
              <View style={styles.shareWrap}>
                <Text style={styles.shareHint}>Share</Text>
                <Text style={styles.shareValue}>{row.shareLabel}</Text>
              </View>
            </View>
            <View style={styles.amountRow}>
              <TextInput
                value={(row.amountMinor / 100).toFixed(2)}
                onChangeText={(text) => updateRowAmount(row.participantId, text)}
                style={styles.amountInput}
                editable={split.mode !== 'equal'}
                keyboardType="decimal-pad"
              />
              <Text style={styles.currency}>{draft?.currency ?? 'USD'}</Text>
            </View>
          </View>
        ))}
      </View>

      <ActionButton label="Confirm Split" onPress={() => void handleSaveExpense()} fullWidth />
      <ActionButton tone="secondary" label="Cancel" onPress={() => navigation.navigate(APP_ROUTES.addExpense)} fullWidth />
      {message ? <Text style={styles.error}>{message}</Text> : null}
    </AppShell>
  );
}

const styles = StyleSheet.create({
  totalCard: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 12,
    backgroundColor: colors.background.panelSoft,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  totalLabel: {
    color: colors.text.secondary,
    fontSize: 14,
  },
  totalValue: {
    color: colors.text.primary,
    fontSize: 34,
    fontWeight: '700',
  },
  blockLabel: {
    color: colors.text.secondary,
    fontSize: 13,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  modeRow: {
    flexDirection: 'row',
    gap: 8,
  },
  modeButton: {
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    backgroundColor: colors.background.panel,
  },
  modeButtonActive: {
    backgroundColor: colors.text.primary,
    borderColor: colors.text.primary,
  },
  modeLabel: {
    color: colors.text.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  modeLabelActive: {
    color: colors.text.onAccent,
  },
  participantsWrap: {
    gap: 10,
  },
  participantsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectAll: {
    color: colors.text.primary,
    fontSize: 13,
    textDecorationLine: 'underline',
  },
  personCard: {
    borderWidth: 1,
    borderColor: colors.border.strong,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.background.panel,
    gap: 10,
  },
  personTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  personName: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  shareWrap: {
    alignItems: 'flex-end',
  },
  shareHint: {
    color: colors.text.muted,
    fontSize: 11,
  },
  shareValue: {
    color: colors.text.primary,
    fontSize: 16,
    fontWeight: '600',
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  amountInput: {
    minWidth: 110,
    borderWidth: 1,
    borderColor: colors.border.default,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text.primary,
    fontSize: 15,
    backgroundColor: colors.background.panel,
  },
  currency: {
    color: colors.text.muted,
    fontSize: 13,
  },
  error: {
    color: colors.status.danger,
    fontSize: 13,
  },
});
