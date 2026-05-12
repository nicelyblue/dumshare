import { getActiveShareState } from '../../src/mobile/state/activeShareStore';
import { StyleSheet, Text, View } from 'react-native';

export default function HomeScreen(): JSX.Element {
  const state = getActiveShareState();

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Share Overview</Text>
      <Text style={styles.body}>Active share: {state.activeShareId ?? 'None selected'}</Text>
      <Text style={styles.helper}>Use Menu in the header to switch or manage shares.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f8fafc',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  body: {
    fontSize: 16,
    color: '#1e293b',
  },
  helper: {
    color: '#475569',
  },
});
