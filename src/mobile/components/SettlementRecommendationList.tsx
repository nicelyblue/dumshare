import { StyleSheet, View } from 'react-native';
import { spacingTokens } from '../theme/tokens';
import { SettlementEmptyState, SettlementRow } from './SettlementBlocks';

const EMPTY_STATE_TITLE = 'No transfers needed';

export type SettlementRecommendationListModel = {
  recommendations: Array<{
    fromLabel: string;
    toLabel: string;
    amountLabel: string;
  }>;
};

export function SettlementRecommendationList({ model }: { model: SettlementRecommendationListModel }): JSX.Element {
  if (model.recommendations.length === 0) {
    return <SettlementEmptyState title={EMPTY_STATE_TITLE} />;
  }

  return (
    <View style={styles.list}>
      {model.recommendations.map((entry, index) => (
        <View key={`${entry.fromLabel}-${entry.toLabel}-${index}`}>
          <SettlementRow fromLabel={entry.fromLabel} toLabel={entry.toLabel} amount={entry.amountLabel} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: spacingTokens.sm },
});
