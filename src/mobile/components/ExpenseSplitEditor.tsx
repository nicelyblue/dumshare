import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { radiusTokens, spacingTokens, touchTarget } from '../theme/tokens';
import { useTheme } from '../theme/useTheme';

export function ExpenseSplitEditor(props: {
  participantIds: string[];
  splitMode: 'equal' | 'exact';
  exactValues: Record<string, string>;
  onSplitModeChange: (mode: 'equal' | 'exact') => void;
  onExactValueChange: (participantId: string, value: string) => void;
}): JSX.Element {
  const { colors } = useTheme();
  const styles = useMemo(
    () =>
      StyleSheet.create({
        root: { gap: spacingTokens.sm },
        row: { flexDirection: 'row', gap: spacingTokens.xs, flexWrap: 'wrap' },
        modeButton: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radiusTokens.sm,
          paddingHorizontal: spacingTokens.sm,
          paddingVertical: spacingTokens.xs,
          minHeight: touchTarget.minimum,
          justifyContent: 'center',
          backgroundColor: colors.card,
        },
        modeText: { color: colors.textPrimary },
        exactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
        label: { color: colors.textMuted },
        input: {
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: radiusTokens.sm,
          minWidth: 80,
          padding: 6,
          backgroundColor: colors.inputBackground,
          color: colors.textPrimary,
        },
        balanceStatus: { color: colors.textMuted, fontSize: 12 },
        confirmButton: {
          backgroundColor: colors.inverse,
          borderRadius: radiusTokens.md,
          minHeight: touchTarget.minimum,
          alignItems: 'center',
          justifyContent: 'center',
        },
        confirmLabel: { color: colors.card, fontWeight: '600' },
      }),
    [colors],
  );

  return (
    <View style={styles.root}>
      <View style={styles.row}>
        <Pressable onPress={() => props.onSplitModeChange('equal')} style={styles.modeButton}>
          <Text style={styles.modeText}>Equal</Text>
        </Pressable>
        <Pressable onPress={() => props.onSplitModeChange('exact')} style={styles.modeButton}>
          <Text style={styles.modeText}>Exact</Text>
        </Pressable>
        <Pressable onPress={() => props.onSplitModeChange('exact')} style={styles.modeButton}>
          <Text style={styles.modeText}>Percent</Text>
        </Pressable>
        <Pressable onPress={() => props.onSplitModeChange('exact')} style={styles.modeButton}>
          <Text style={styles.modeText}>Shares</Text>
        </Pressable>
      </View>
      {props.splitMode === 'exact'
        ? props.participantIds.map((participantId) => (
            <View key={participantId} style={styles.exactRow}>
              <Text style={styles.label}>{participantId}</Text>
              <TextInput
                style={styles.input}
                value={props.exactValues[participantId] ?? ''}
                onChangeText={(value) => props.onExactValueChange(participantId, value)}
                keyboardType="numeric"
              />
            </View>
          ))
        : null}
      <Text style={styles.balanceStatus}>Balanced split status is required before saving.</Text>
      <Pressable style={styles.confirmButton} accessibilityRole="button">
        <Text style={styles.confirmLabel}>Confirm Split</Text>
      </Pressable>
    </View>
  );
}
