import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FEATURE_REGISTRY, type FeatureRegistryItem } from '../navigation/featureRegistry';
import type { AppRouteName } from '../navigation/types';
import { AppShell } from '../ui/AppShell';
import { FeatureCard } from '../ui/FeatureCard';

type FeatureScreenProps = {
  feature: FeatureRegistryItem;
  onNavigate: (routeName: AppRouteName) => void;
};

export function FeatureScreen({ feature, onNavigate }: FeatureScreenProps) {
  const otherFeatures = FEATURE_REGISTRY.filter((item) => item.name !== feature.name);

  return (
    <AppShell eyebrow={feature.eyebrow} title={feature.label} description={feature.description} accent={feature.accent}>
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Current destination</Text>
        <FeatureCard
          label={feature.label}
          description={feature.description}
          accent={feature.accent}
          selected
          actionLabel={feature.primaryAction}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Move to another area</Text>
        <View style={styles.cardList}>
          {otherFeatures.map((item) => (
            <FeatureCard
              key={item.name}
              label={item.label}
              description={item.secondaryAction}
              accent={item.accent}
              onPress={() => onNavigate(item.name)}
              actionLabel={item.primaryAction}
            />
          ))}
        </View>
      </View>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  sectionLabel: {
    color: '#7a634b',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  cardList: {
    gap: 12,
  },
});