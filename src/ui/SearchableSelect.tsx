import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { CurrencyOption } from '../domain/currency/catalog';
import { fuzzyCurrencySearch } from '../domain/currency/catalog';
import { colors } from '../theme/colors';

type SearchableSelectProps = {
  label: string;
  value: string;
  options: CurrencyOption[];
  placeholder?: string;
  helperText?: string;
  onChange: (nextValue: string) => void;
};

export function SearchableSelect({ label, value, options, placeholder, helperText, onChange }: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const selected = options.find((option) => option.code === value);
  const filtered = useMemo(() => fuzzyCurrencySearch(options, query), [options, query]);

  return (
    <View style={styles.container} className="gap-2">
      <Text style={styles.label}>{label}</Text>
      <Pressable style={[styles.trigger, open ? styles.triggerOpen : null]} onPress={() => setOpen((current) => !current)}>
        <Text style={styles.triggerValue}>{selected ? `${selected.code} - ${selected.label}` : placeholder ?? 'Select'}</Text>
      </Pressable>
      {open ? (
        <View style={styles.dropdown}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search currency"
            placeholderTextColor={colors.placeholder}
            style={styles.searchInput}
          />
          <ScrollView
            style={styles.list}
            contentContainerStyle={{ gap: 4, paddingBottom: 2 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {filtered.map((option) => (
              <Pressable
                key={option.code}
                style={[styles.option, value === option.code ? styles.optionSelected : null]}
                onPress={() => {
                  onChange(option.code);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <Text style={styles.optionText}>{option.code} - {option.label}</Text>
              </Pressable>
            ))}
            {filtered.length === 0 ? <Text style={styles.emptyText}>No currencies match your search yet.</Text> : null}
          </ScrollView>
        </View>
      ) : null}
      {helperText ? <Text style={styles.helper}>{helperText}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: {
    color: colors.text.muted,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  trigger: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.panel,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  triggerOpen: {
    borderColor: colors.border.success,
    backgroundColor: colors.background.panelSoft,
  },
  triggerValue: {
    color: colors.text.strong,
    fontSize: 16,
  },
  dropdown: {
    gap: 8,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border.success,
    backgroundColor: colors.background.panel,
    padding: 8,
    shadowColor: colors.shadow.blue,
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  searchInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border.default,
    backgroundColor: colors.background.app,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: colors.text.strong,
    fontSize: 16,
  },
  list: { maxHeight: 240 },
  option: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 8 },
  optionSelected: { backgroundColor: colors.background.panelSoft },
  optionText: { color: colors.text.strong, fontSize: 15 },
  emptyText: { paddingHorizontal: 8, paddingVertical: 8, color: colors.text.muted, fontSize: 14 },
  helper: { color: colors.text.muted, fontSize: 13, lineHeight: 18 },
});
