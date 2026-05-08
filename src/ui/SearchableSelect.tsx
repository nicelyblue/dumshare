import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import type { CurrencyOption } from '../domain/currency/catalog';
import { fuzzyCurrencySearch } from '../domain/currency/catalog';

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
    <View className="gap-2">
      <Text className="text-xs font-bold uppercase tracking-[1.2px] text-muted">{label}</Text>
      <Pressable className={`rounded-field border px-3.5 py-3 ${open ? 'border-accentA bg-shellSoft' : 'border-border bg-panel'}`} onPress={() => setOpen((current) => !current)}>
        <Text className="text-base text-ink">{selected ? `${selected.code} - ${selected.label}` : placeholder ?? 'Select'}</Text>
      </Pressable>
      {open ? (
        <View className="gap-2 rounded-field border border-accentA bg-panel p-2" style={{ shadowColor: '#284c91', shadowOpacity: 0.1, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 }}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search currency"
            placeholderTextColor="#8090ad"
            className="rounded-[10px] border border-border bg-shell px-2.5 py-2 text-ink"
          />
          <ScrollView
            className="max-h-60"
            contentContainerStyle={{ gap: 4, paddingBottom: 2 }}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {filtered.map((option) => (
              <Pressable
                key={option.code}
                className={`rounded-lg px-2 py-2 ${value === option.code ? 'bg-shellSoft' : 'bg-panel'}`}
                onPress={() => {
                  onChange(option.code);
                  setQuery('');
                  setOpen(false);
                }}
              >
                <Text className="text-sm text-ink">{option.code} - {option.label}</Text>
              </Pressable>
            ))}
            {filtered.length === 0 ? <Text className="px-2 py-2 text-sm text-muted">No currencies match your search yet.</Text> : null}
          </ScrollView>
        </View>
      ) : null}
      {helperText ? <Text className="text-[13px] leading-[18px] text-muted">{helperText}</Text> : null}
    </View>
  );
}
