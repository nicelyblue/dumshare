import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ExpenseReviewModel } from '../controllers/expenseReviewController';

type Props = {
  model: ExpenseReviewModel;
};

export function ExpenseReviewList({ model }: Props): JSX.Element {
  const [expandedIds, setExpandedIds] = useState<Record<number, boolean>>({});

  return (
    <View style={styles.container}>
      {model.items.map((item, index) => {
        const expanded = expandedIds[index] ?? false;
        return (
          <Pressable
            key={`${index}-${item.splitModeLabel}`}
            style={styles.card}
            onPress={() => {
              setExpandedIds((current) => ({ ...current, [index]: !expanded }));
            }}
          >
            <Text style={styles.title}>Split mode: {item.splitModeLabel}</Text>
            <Text style={styles.status}>Pending organizer approval</Text>
            {expanded ? item.impactLines.map((line) => <Text key={line} style={styles.line}>{line}</Text>) : null}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  card: {
    borderWidth: 1,
    borderColor: 'tan',
    borderRadius: 12,
    padding: 12,
    backgroundColor: 'oldlace',
  },
  title: {
    fontWeight: '700',
    color: 'black',
  },
  status: {
    marginTop: 4,
    color: 'dimgrey',
    fontSize: 13,
  },
  line: {
    marginTop: 8,
    color: 'saddlebrown',
  },
});
