import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

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
          <Text style={styles.modeText}>Custom</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  modeButton: { borderWidth: 1, borderColor: 'lightgray', borderRadius: 8, padding: 8 },
  modeText: { color: 'black' },
  exactRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  label: { color: 'dimgrey' },
  input: { borderWidth: 1, borderColor: 'lightgray', borderRadius: 8, minWidth: 80, padding: 6 },
});
