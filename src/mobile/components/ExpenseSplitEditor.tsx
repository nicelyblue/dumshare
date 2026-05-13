import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { colorTokens, radiusTokens, spacingTokens, touchTarget } from '../theme/tokens';

export function ExpenseSplitEditor(props: {
  participantIds: string[];
  splitMode: 'equal' | 'exact';
  exactValues: Record<string, string>;
  onSplitModeChange: (mode: 'equal' | 'exact') => void;
  onExactValueChange: (participantId: string, value: string) => void;
}): JSX.Element {
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

const styles = StyleSheet.create({
  root: { gap: spacingTokens.sm },
  row: { flexDirection: 'row', gap: spacingTokens.xs, flexWrap: 'wrap' },
  modeButton: {
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.sm,
    paddingHorizontal: spacingTokens.sm,
    paddingVertical: spacingTokens.xs,
    minHeight: touchTarget.minimum,
    justifyContent: 'center',
    backgroundColor: colorTokens.card,
  },
  modeText: { color: colorTokens.textPrimary },
  exactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: colorTokens.textMuted },
  input: { borderWidth: 1, borderColor: colorTokens.border, borderRadius: radiusTokens.sm, minWidth: 80, padding: 6, backgroundColor: colorTokens.inputBackground },
  balanceStatus: { color: colorTokens.textMuted, fontSize: 12 },
  confirmButton: {
    backgroundColor: colorTokens.inverse,
    borderRadius: radiusTokens.md,
    minHeight: touchTarget.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmLabel: { color: colorTokens.card, fontWeight: '600' },
});
