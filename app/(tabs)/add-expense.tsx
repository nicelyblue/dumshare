import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type GestureResponderEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadExpenseFormModel, submitExpenseForm } from '../../src/mobile/controllers/expenseFormController';
import { consumePendingExpenseDraft } from '../../src/mobile/state/expenseDraftStore';
import { getActiveShareState } from '../../src/mobile/state/activeShareStore';
import { createLedgerAppService } from '../../src/mobile/services/ledgerAppService';
import { colorTokens, radiusTokens, spacingTokens, touchTarget } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';
import { CURRENCY_OPTIONS, fuzzyCurrencySearch } from '../../src/domain/currency/catalog';
import { getDefaultParticipantIcon } from '../../src/mobile/utils/participantIcons';

type PickerMode = 'none' | 'currency' | 'paidBy' | 'splitBetween' | 'splitType';
type SplitMethod = 'exact' | 'percent';

export default function AddExpenseScreen(): JSX.Element {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [expenseDate, setExpenseDate] = useState(new Date().toISOString().slice(0, 10));
  const [splitMode, setSplitMode] = useState<'equal' | 'exact'>('equal');
  const [exactValues, setExactValues] = useState<Record<string, string>>({});
  const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
  const [shareTitle, setShareTitle] = useState('');
  const [participants, setParticipants] = useState<Array<{ participantId: string; displayName: string }>>([]);
  const [payerParticipantId, setPayerParticipantId] = useState<string>('');
  const [splitParticipantIds, setSplitParticipantIds] = useState<string[]>([]);
  const [pickerMode, setPickerMode] = useState<PickerMode>('none');
  const [searchQuery, setSearchQuery] = useState('');
  const [splitConfigVisible, setSplitConfigVisible] = useState(false);
  const [configMethod, setConfigMethod] = useState<SplitMethod>('exact');
  const [configParticipantIds, setConfigParticipantIds] = useState<string[]>([]);
  const [configExactValues, setConfigExactValues] = useState<Record<string, string>>({});
  const [configPercentValues, setConfigPercentValues] = useState<Record<string, string>>({});
  const sliderWidthByParticipantIdRef = useRef<Record<string, number>>({});
  const pendingSliderUpdateRef = useRef<{ participantId: string; requestedPercent: number } | null>(null);
  const sliderFrameRef = useRef<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const pending = consumePendingExpenseDraft();

    void createLedgerAppService()
      .loadHomeSnapshot({ selectedLedgerId: pending?.selectedLedgerId ?? getActiveShareState().activeShareId })
      .then((snapshot) => {
        setShareTitle(snapshot.title);
        const nextParticipants = snapshot.balanceSummary.participants.map((participant) => ({
          participantId: participant.participantId,
          displayName: participant.displayName,
        }));
        setParticipants(nextParticipants);
        setSplitParticipantIds(nextParticipants.map((participant) => participant.participantId));
        if (nextParticipants[0]) {
          setPayerParticipantId(nextParticipants[0].participantId);
        }
      });

    if (!pending) {
      return;
    }
    setEditingExpenseId(pending.expenseId);
    void loadExpenseFormModel({ selectedLedgerId: pending.selectedLedgerId, editExpenseId: pending.expenseId }).then((model) => {
      setDescription(model.defaults.description);
      setAmount(model.defaults.totalAmountInput);
      setCurrency(model.defaults.currency);
      setExpenseDate(model.defaults.expenseDate);
      setSplitMode(model.defaults.splitMode);
      setPayerParticipantId(model.defaults.payerParticipantId);
      setSplitParticipantIds(model.defaults.splitParticipantIds);
      setExactValues(
        Object.fromEntries(
          Object.entries(model.defaults.splitExactAmountsMinor).map(([participantId, owedAmountMinor]) => [participantId, (owedAmountMinor / 100).toFixed(2)]),
        ),
      );
    });
  }, []);

  const filteredCurrencies = useMemo(() => fuzzyCurrencySearch(CURRENCY_OPTIONS, searchQuery), [searchQuery]);
  const filteredParticipants = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return participants;
    }
    return participants.filter((participant) => participant.displayName.toLowerCase().includes(query));
  }, [participants, searchQuery]);

  const payerName = participants.find((participant) => participant.participantId === payerParticipantId)?.displayName ?? 'You';
  const splitLabel =
    splitParticipantIds.length === 0 ? 'No participants selected' : `${splitParticipantIds.length} participant${splitParticipantIds.length === 1 ? '' : 's'}`;
  const splitParticipants = participants.filter((participant) => splitParticipantIds.includes(participant.participantId));
  const splitPreviewParticipants = splitParticipants.slice(0, 3);
  const splitOverflowCount = Math.max(0, splitParticipants.length - splitPreviewParticipants.length);
  const perPersonLabel =
    splitParticipantIds.length > 0 && Number.parseFloat(amount) > 0
      ? `${formatAmountWithCurrency(Number.parseFloat(amount) / splitParticipantIds.length)} per person`
      : 'Set amount to preview per-person share';

  function formatAmountWithCurrency(value: number): string {
    return `${value.toFixed(2)} ${currency}`;
  }

  const handleSearchQueryChange = useCallback((text: string): void => {
    setSearchQuery(text);
  }, []);

  function closePicker(): void {
    setPickerMode('none');
    setSearchQuery('');
  }

  function openPicker(mode: Exclude<PickerMode, 'none'>): void {
    // Dismiss keyboard without waiting - reduces jitter by avoiding simultaneous layout updates
    Keyboard.dismiss();
    // Use setTimeout to defer state update until after keyboard animation completes
    setTimeout(() => {
      setPickerMode(mode);
      setSearchQuery('');
    }, 100);
  }

  function toggleSplitParticipant(participantId: string): void {
    setSplitParticipantIds((prev) => {
      if (prev.includes(participantId)) {
        return prev.filter((id) => id !== participantId);
      }
      return [...prev, participantId];
    });
  }

  function buildExactSplitAmountsMinor(): Record<string, number> {
    const ids = splitParticipantIds.length > 0 ? splitParticipantIds : participants.map((participant) => participant.participantId);
    const totalMinor = Math.round(Number.parseFloat(amount || '0') * 100);
    if (ids.length === 0 || totalMinor <= 0) {
      return {};
    }
    const each = Math.floor(totalMinor / ids.length);
    const remainder = totalMinor - each * ids.length;
    const allocations: Record<string, number> = {};
    ids.forEach((id, index) => {
      allocations[id] = each + (index < remainder ? 1 : 0);
    });
    return allocations;
  }

  function openSplitConfig(): void {
    const ids = splitParticipantIds.length > 0 ? splitParticipantIds : participants.map((participant) => participant.participantId);
    const baseAmount = Number.parseFloat(amount || '0');
    const equalShare = ids.length > 0 && baseAmount > 0 ? (baseAmount / ids.length).toFixed(2) : '0.00';
    const nextExact: Record<string, string> = {};
    const nextPercent: Record<string, string> = {};
    ids.forEach((id) => {
      nextExact[id] = exactValues[id] ?? equalShare;
      nextPercent[id] = ids.length > 0 ? (100 / ids.length).toFixed(0) : '0';
    });
    setConfigMethod(splitMode === 'exact' ? 'exact' : 'percent');
    setConfigParticipantIds(ids);
    setConfigExactValues(nextExact);
    setConfigPercentValues(nextPercent);
    setSplitConfigVisible(true);
  }

  function calculateAssignedAmount(): number {
    const total = Number.parseFloat(amount || '0');
    if (configParticipantIds.length === 0 || total <= 0) {
      return 0;
    }
    if (configMethod === 'exact') {
      return configParticipantIds.reduce((sum, id) => sum + Number.parseFloat(configExactValues[id] || '0'), 0);
    }
    return configParticipantIds.reduce((sum, id) => sum + (total * Number.parseFloat(configPercentValues[id] || '0')) / 100, 0);
  }

  function confirmSplitConfig(): void {
    const ids = configParticipantIds;
    setSplitParticipantIds(ids);
    if (configMethod === 'exact') {
      setSplitMode('exact');
      setExactValues(configExactValues);
    } else {
      const total = Number.parseFloat(amount || '0');
      const derivedExact: Record<string, string> = {};
      ids.forEach((id) => {
        const percent = Number.parseFloat(configPercentValues[id] || '0');
        derivedExact[id] = ((total * percent) / 100).toFixed(2);
      });
      setSplitMode('exact');
      setExactValues(derivedExact);
    }
    setSplitConfigVisible(false);
  }

  function applyPercentRebalance(participantId: string, requestedPercent: number): void {
    setConfigPercentValues((prev) => {
      const selectedIds = [...configParticipantIds];
      if (!selectedIds.includes(participantId)) {
        return prev;
      }

      const otherIds = selectedIds.filter((id) => id !== participantId);
      if (otherIds.length === 0) {
        if (prev[participantId] === '100') {
          return prev;
        }
        return { ...prev, [participantId]: '100' };
      }

      const clampedTarget = Math.max(0, Math.min(100, requestedPercent));
      const remaining = 100 - clampedTarget;
      const currentOthers = otherIds.map((id) => Math.max(0, Number.parseFloat(prev[id] || '0')));
      const currentOthersTotal = currentOthers.reduce((sum, value) => sum + value, 0);

      let nextOtherPercents: number[];
      if (currentOthersTotal <= 0) {
        const base = Math.floor(remaining / otherIds.length);
        let leftover = remaining - base * otherIds.length;
        nextOtherPercents = otherIds.map(() => {
          const plus = leftover > 0 ? 1 : 0;
          leftover -= plus;
          return base + plus;
        });
      } else {
        const raw = currentOthers.map((value) => (value / currentOthersTotal) * remaining);
        const floored = raw.map((value) => Math.floor(value));
        let leftover = remaining - floored.reduce((sum, value) => sum + value, 0);
        const byRemainder = raw
          .map((value, index) => ({ index, remainder: value - floored[index] }))
          .sort((a, b) => b.remainder - a.remainder);
        for (let index = 0; index < byRemainder.length && leftover > 0; index += 1) {
          floored[byRemainder[index].index] += 1;
          leftover -= 1;
        }
        nextOtherPercents = floored;
      }

      const next = { ...prev, [participantId]: `${clampedTarget}` };
      otherIds.forEach((id, index) => {
        next[id] = `${nextOtherPercents[index] ?? 0}`;
      });

      const unchanged = selectedIds.every((id) => (prev[id] ?? '0') === (next[id] ?? '0'));
      return unchanged ? prev : next;
    });
  }

  function updatePercentFromGesture(participantId: string, event: GestureResponderEvent): void {
    const width = sliderWidthByParticipantIdRef.current[participantId] ?? 1;
    const ratio = Math.max(0, Math.min(1, event.nativeEvent.locationX / width));
    const requestedPercent = Math.round(ratio * 100);
    pendingSliderUpdateRef.current = { participantId, requestedPercent };
    if (sliderFrameRef.current !== null) {
      return;
    }
    sliderFrameRef.current = requestAnimationFrame(() => {
      sliderFrameRef.current = null;
      const pending = pendingSliderUpdateRef.current;
      if (!pending) {
        return;
      }
      applyPercentRebalance(pending.participantId, pending.requestedPercent);
    });
  }

  function resetExpenseForm(): void {
    setDescription('');
    setAmount('');
    setCurrency('USD');
    setExpenseDate(new Date().toISOString().slice(0, 10));
    setSplitMode('equal');
    setExactValues({});
    setEditingExpenseId(null);
    setPickerMode('none');
    setSearchQuery('');
    setSplitConfigVisible(false);
    setConfigMethod('exact');
    setConfigExactValues({});
    setConfigPercentValues({});
    setSplitParticipantIds(participants.map((participant) => participant.participantId));
    setPayerParticipantId(participants[0]?.participantId ?? '');
  }

  async function onSaveExpensePress(): Promise<void> {
    if (isSaving) {
      return;
    }
    try {
      setIsSaving(true);
      await submitExpenseForm({
        selectedLedgerId: getActiveShareState().activeShareId,
        editExpenseId: editingExpenseId,
        description,
        totalAmountInput: amount,
        currency,
        expenseDate,
        payerParticipantId: payerParticipantId || participants[0]?.participantId || '',
        splitMode,
        splitParticipantIds:
          splitParticipantIds.length > 0
            ? splitParticipantIds
            : participants.length > 0
              ? participants.map((participant) => participant.participantId)
              : [payerParticipantId || 'participant-1'],
        splitExactAmountsMinor: splitMode === 'exact' ? buildExactSplitAmountsMinor() : {},
      });
      resetExpenseForm();
      router.replace({
        pathname: '/(tabs)',
        params: { refreshToken: `${Date.now()}` },
      });
    } catch (caught) {
      Alert.alert('Save expense', caught instanceof Error ? caught.message : 'Unable to save expense.');
    } finally {
      setIsSaving(false);
    }
  }

  useEffect(
    () => () => {
      if (sliderFrameRef.current !== null) {
        cancelAnimationFrame(sliderFrameRef.current);
      }
    },
    [],
  );

  return (
    <View style={styles.screen}>
      <View style={[styles.content, { paddingTop: insets.top + spacingTokens.lg }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Go back" onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </Pressable>
        <Text style={styles.title}>Add Expense</Text>
        <Text style={styles.subtitle}>Track a new expense for this share</Text>
        <Text style={styles.tripLabel}>{shareTitle || 'Untitled Share'}</Text>

        <Text style={styles.sectionLabel}>Expense Name</Text>
        <TextInput
          style={styles.inputLike}
          value={description}
          onChangeText={setDescription}
          placeholder="e.g., Dinner, Gas, Hotel"
          placeholderTextColor={colorTokens.textMuted}
        />

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.sectionLabel}>Amount</Text>
            <TextInput
              style={styles.inputLike}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
              placeholder="0.00"
              placeholderTextColor={colorTokens.textMuted}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.sectionLabel}>Currency</Text>
            <Pressable style={styles.selectLike} accessibilityRole="button" onPress={() => openPicker('currency')}>
              <Text style={styles.selectValue}>{currency}</Text>
              <Ionicons name="chevron-down" size={18} color={colorTokens.textMuted} />
            </Pressable>
          </View>
        </View>

        <Text style={styles.sectionLabel}>Paid By</Text>
        <Pressable style={styles.selectorRow} accessibilityRole="button" onPress={() => openPicker('paidBy')}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{getDefaultParticipantIcon(payerName)}</Text>
          </View>
          <Text style={styles.selectorPrimary}>{payerName}</Text>
          <Ionicons name="chevron-forward" size={18} color={colorTokens.textMuted} style={styles.trailingIcon} />
        </Pressable>

        <Text style={styles.sectionLabel}>Split Between</Text>
        <Pressable style={styles.selectorRow} accessibilityRole="button" onPress={() => openPicker('splitBetween')}>
          <View style={styles.avatarStack}>
            {splitPreviewParticipants.map((participant, index) => (
              <View key={participant.participantId} style={[styles.avatar, styles.avatarTiny, index > 0 ? styles.avatarShift : null]}>
                <Text style={styles.avatarText}>{getDefaultParticipantIcon(participant.displayName)}</Text>
              </View>
            ))}
            {splitOverflowCount > 0 ? (
              <View style={styles.plusBadge}>
                <Text style={styles.plusBadgeText}>{`+${splitOverflowCount}`}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.selectorPrimary}>{splitLabel}</Text>
          <Ionicons name="chevron-forward" size={18} color={colorTokens.textMuted} style={styles.trailingIcon} />
        </Pressable>

        <Text style={styles.sectionLabel}>Split Type</Text>
        <Pressable style={styles.selectorRow} accessibilityRole="button" onPress={openSplitConfig}>
          <View>
            <Text style={styles.selectorPrimary}>{splitMode === 'equal' ? 'Split Equally' : 'Split by Exact Amounts'}</Text>
            <Text style={styles.selectorSecondary}>{perPersonLabel}</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colorTokens.textMuted} style={styles.trailingIcon} />
        </Pressable>

        <Pressable
          style={styles.primaryButton}
          accessibilityRole="button"
          onPress={() => void onSaveExpensePress()}
          disabled={isSaving}
        >
          <Text style={styles.primaryButtonText}>{isSaving ? 'Saving...' : 'Save Expense'}</Text>
        </Pressable>
      </View>

      <Modal transparent visible={pickerMode !== 'none'} animationType="fade" onRequestClose={closePicker}>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={insets.bottom}
        >
          <Pressable style={styles.modalBackdrop} onPress={closePicker} />
          <View style={[styles.modalCard, { paddingBottom: insets.bottom + spacingTokens.md }]}>
            <Text style={styles.modalTitle}>
              {pickerMode === 'currency'
                ? 'Select Currency'
                : pickerMode === 'paidBy'
                  ? 'Select Payer'
                  : pickerMode === 'splitBetween'
                    ? 'Split Between'
                    : 'Split Type'}
            </Text>
            {(pickerMode === 'currency' || pickerMode === 'paidBy' || pickerMode === 'splitBetween') ? (
              <TextInput
                value={searchQuery}
                onChangeText={handleSearchQueryChange}
                placeholder={pickerMode === 'currency' ? 'Search code or name' : 'Search participants'}
                placeholderTextColor={colorTokens.textMuted}
                style={styles.searchInput}
              />
            ) : null}
            <ScrollView
              style={styles.modalList}
              contentContainerStyle={styles.modalListContent}
              keyboardShouldPersistTaps="handled"
            >
              {pickerMode === 'currency'
                ? filteredCurrencies.map((option) => (
                    <Pressable
                      key={option.code}
                      style={styles.modalRow}
                      accessibilityRole="button"
                      onPress={() => {
                        setCurrency(option.code);
                        closePicker();
                      }}
                    >
                      <Text style={styles.modalRowTitle}>{option.code}</Text>
                      <Text style={styles.modalRowSubtitle}>{option.label}</Text>
                    </Pressable>
                  ))
                : null}
              {pickerMode === 'paidBy'
                ? filteredParticipants.map((participant) => (
                    <Pressable
                      key={participant.participantId}
                      style={styles.modalRow}
                      accessibilityRole="button"
                      onPress={() => {
                        setPayerParticipantId(participant.participantId);
                        closePicker();
                      }}
                    >
                      <Text style={styles.modalRowTitle}>{participant.displayName}</Text>
                    </Pressable>
                  ))
                : null}
              {pickerMode === 'splitBetween'
                ? filteredParticipants.map((participant) => {
                    const selected = splitParticipantIds.includes(participant.participantId);
                    return (
                      <Pressable
                        key={participant.participantId}
                        style={styles.modalRow}
                        accessibilityRole="button"
                        onPress={() => toggleSplitParticipant(participant.participantId)}
                      >
                        <Text style={styles.modalRowTitle}>{participant.displayName}</Text>
                        <Ionicons
                          name={selected ? 'checkbox' : 'square-outline'}
                          size={20}
                          color={selected ? colorTokens.inverse : colorTokens.textMuted}
                        />
                      </Pressable>
                    );
                  })
                : null}
              {pickerMode === 'splitType' ? (
                <>
                  <Pressable style={styles.modalRow} accessibilityRole="button" onPress={() => { setSplitMode('exact'); closePicker(); }}>
                    <Text style={styles.modalRowTitle}>Split by Exact Amounts</Text>
                  </Pressable>
                  <Pressable style={styles.modalRow} accessibilityRole="button" onPress={closePicker}>
                    <Text style={styles.modalRowTitle}>Split by Percentage</Text>
                  </Pressable>
                </>
              ) : null}
            </ScrollView>
            {pickerMode === 'splitBetween' ? (
              <Pressable style={styles.doneButton} accessibilityRole="button" onPress={closePicker}>
                <Text style={styles.doneButtonText}>Done</Text>
              </Pressable>
            ) : null}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      <Modal transparent visible={splitConfigVisible} animationType="slide" onRequestClose={() => setSplitConfigVisible(false)}>
        <View style={styles.splitOverlay}>
          <View style={[styles.splitPanel, { paddingTop: insets.top + spacingTokens.md, paddingBottom: insets.bottom + spacingTokens.md }]}>
            <Text style={styles.splitTitle}>Configure Split</Text>
            <Text style={styles.splitSubtitle}>Adjust how the expense is divided</Text>

            <View style={styles.totalCard}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>{formatAmountWithCurrency((Number.parseFloat(amount || '0') || 0))}</Text>
            </View>

            <Text style={styles.splitSectionTitle}>Split Method</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.methodScroll} contentContainerStyle={styles.methodRow}>
              {(['exact', 'percent'] as const).map((method) => (
                <Pressable
                  key={method}
                  style={[styles.methodChip, configMethod === method ? styles.methodChipActive : null]}
                  onPress={() => setConfigMethod(method)}
                >
                  <Text style={[styles.methodChipText, configMethod === method ? styles.methodChipTextActive : null]}>
                    {method === 'exact' ? 'Exact' : 'Percent'}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.participantHeader}>
              <Text style={styles.splitSectionTitle}>Participants ({participants.length})</Text>
              <Pressable
                onPress={() =>
                  setConfigParticipantIds(
                    configParticipantIds.length === participants.length ? [] : participants.map((participant) => participant.participantId),
                  )
                }
              >
                <Text style={styles.selectAllText}>Select All</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.participantList} contentContainerStyle={styles.participantListContent}>
              {participants.map((participant) => {
                const selected = configParticipantIds.includes(participant.participantId);
                const sharePercent =
                  configMethod === 'exact'
                      ? Number.parseFloat(amount || '0') > 0
                        ? (Number.parseFloat(configExactValues[participant.participantId] || '0') / Number.parseFloat(amount || '1')) * 100
                        : 0
                      : Number.parseFloat(configPercentValues[participant.participantId] || '0');
                const equalAmount = configParticipantIds.length > 0 ? (Number.parseFloat(amount || '0') / configParticipantIds.length).toFixed(2) : '0.00';
                return (
                  <View key={participant.participantId} style={[styles.participantCard, selected ? styles.participantCardActive : null]}>
                    <Pressable
                      style={styles.checkbox}
                      accessibilityRole="button"
                      onPress={() =>
                        setConfigParticipantIds((prev) =>
                          prev.includes(participant.participantId)
                            ? prev.filter((id) => id !== participant.participantId)
                            : [...prev, participant.participantId],
                        )
                      }
                    >
                      <Ionicons name={selected ? 'checkbox' : 'square-outline'} size={20} color={selected ? colorTokens.inverse : colorTokens.textMuted} />
                    </Pressable>
                    <View style={[styles.avatar, styles.avatarTiny]}>
                      <Text style={styles.avatarText}>{getDefaultParticipantIcon(participant.displayName)}</Text>
                    </View>
                    <View style={styles.participantBody}>
                      <Text style={styles.participantName}>{participant.displayName}</Text>
                      {configMethod === 'exact' ? (
                        <TextInput
                          editable={selected}
                          style={[styles.participantInput, selected ? null : styles.participantInputDisabled]}
                          value={configExactValues[participant.participantId] ?? equalAmount}
                          onChangeText={(value) => {
                            setConfigExactValues((prev) => ({ ...prev, [participant.participantId]: value }));
                          }}
                          keyboardType="decimal-pad"
                        />
                      ) : (
                        <View
                          style={[styles.sliderTrack, selected ? null : styles.sliderTrackDisabled]}
                          onLayout={(event) => {
                            const width = event.nativeEvent.layout.width;
                            sliderWidthByParticipantIdRef.current[participant.participantId] = width;
                          }}
                          onStartShouldSetResponder={() => selected}
                          onMoveShouldSetResponder={() => selected}
                          onResponderGrant={(event) => updatePercentFromGesture(participant.participantId, event)}
                          onResponderMove={(event) => updatePercentFromGesture(participant.participantId, event)}
                        >
                          <View
                            style={[
                              styles.sliderFill,
                              {
                                width: `${Math.max(0, Math.min(100, Number.parseFloat(configPercentValues[participant.participantId] || '0')))}%`,
                              },
                            ]}
                          />
                        </View>
                      )}
                    </View>
                    <View style={styles.shareBlock}>
                      <Text style={styles.shareLabel}>Share</Text>
                      <Text style={styles.shareValue}>{Number.isFinite(sharePercent) ? `${sharePercent.toFixed(0)}%` : '0%'}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>

            <View style={styles.balanceCard}>
              <View style={styles.balanceCheck}><Ionicons name="checkmark" size={14} color={colorTokens.card} /></View>
              <View>
                <Text style={styles.balanceTitle}>Split is {Math.abs(calculateAssignedAmount() - Number.parseFloat(amount || '0')) < 0.01 ? 'balanced' : 'not balanced'}</Text>
                <Text style={styles.balanceMeta}>
                  Total assigned: {formatAmountWithCurrency(calculateAssignedAmount())} / {formatAmountWithCurrency((Number.parseFloat(amount || '0') || 0))}
                </Text>
              </View>
            </View>

            <Pressable style={styles.primaryButton} onPress={confirmSplitConfig}>
              <Text style={styles.primaryButtonText}>Confirm Split</Text>
            </Pressable>
            <Pressable style={styles.cancelButton} onPress={() => setSplitConfigVisible(false)}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colorTokens.card,
  },
  backButton: {
    width: 40,
    minHeight: 40,
    borderWidth: 1,
    borderColor: '#D9D9D9',
    borderRadius: radiusTokens.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorTokens.card,
  },
  backButtonText: {
    color: colorTokens.textPrimary,
    fontSize: 20,
    lineHeight: 20,
    fontWeight: '600',
  },
  title: {
    ...typographyTokens.heading,
  },
  subtitle: {
    ...typographyTokens.label,
    color: colorTokens.textPrimary,
  },
  content: {
    paddingHorizontal: spacingTokens.lg,
    gap: spacingTokens.md,
  },
  tripLabel: {
    ...typographyTokens.label,
    color: colorTokens.textMuted,
    fontSize: 22 / 2,
    marginBottom: spacingTokens.xs,
  },
  sectionLabel: {
    color: '#1F1F20',
    fontSize: 24 / 2,
    fontWeight: '500',
  },
  inputLike: {
    borderWidth: 1,
    borderColor: '#D6D7DA',
    borderRadius: radiusTokens.md,
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.md,
    minHeight: touchTarget.minimum,
    backgroundColor: colorTokens.card,
  },
  row: {
    flexDirection: 'row',
    gap: spacingTokens.sm,
  },
  halfField: {
    flex: 1,
    gap: spacingTokens.sm,
  },
  selectLike: {
    borderWidth: 1,
    borderColor: '#D6D7DA',
    borderRadius: radiusTokens.md,
    minHeight: touchTarget.minimum,
    backgroundColor: colorTokens.card,
    paddingHorizontal: spacingTokens.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  selectValue: {
    color: colorTokens.textPrimary,
    fontSize: 22 / 2,
  },
  selectorRow: {
    borderWidth: 1,
    borderColor: '#D6D7DA',
    borderRadius: radiusTokens.md,
    backgroundColor: colorTokens.card,
    minHeight: 58,
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.sm,
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectorPrimary: {
    ...typographyTokens.body,
    fontSize: 27 / 2,
  },
  selectorSecondary: {
    ...typographyTokens.label,
    color: colorTokens.textMuted,
    fontSize: 20 / 2,
  },
  trailingIcon: {
    marginLeft: 'auto',
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E5E5E7',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacingTokens.sm,
    borderWidth: 1,
    borderColor: '#D0D1D4',
  },
  avatarTiny: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 0,
  },
  avatarShift: {
    marginLeft: -8,
  },
  avatarText: {
    fontSize: 11,
    fontWeight: '600',
    color: colorTokens.textPrimary,
  },
  avatarStack: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacingTokens.sm,
  },
  plusBadge: {
    marginLeft: 6,
    borderWidth: 1,
    borderColor: '#D6D7DA',
    borderRadius: radiusTokens.pill,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: colorTokens.card,
  },
  plusBadgeText: {
    fontSize: 10,
    color: colorTokens.textMuted,
  },
  primaryButton: {
    marginTop: spacingTokens.md,
    backgroundColor: colorTokens.inverse,
    borderRadius: radiusTokens.md,
    minHeight: touchTarget.minimum,
    paddingVertical: spacingTokens.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: colorTokens.card,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(61, 60, 79, 0.3)',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalCard: {
    backgroundColor: colorTokens.card,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: spacingTokens.lg,
    paddingTop: spacingTokens.md,
    gap: spacingTokens.sm,
    maxHeight: '75%',
  },
  modalTitle: {
    ...typographyTokens.body,
    fontWeight: '700',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D6D7DA',
    borderRadius: radiusTokens.md,
    minHeight: touchTarget.minimum,
    paddingHorizontal: spacingTokens.md,
    backgroundColor: colorTokens.card,
  },
  modalList: {
    height: 320,
    flexShrink: 1,
  },
  modalListContent: {
    paddingBottom: spacingTokens.sm,
  },
  modalRow: {
    minHeight: touchTarget.minimum,
    borderBottomWidth: 1,
    borderBottomColor: '#ECECEF',
    paddingVertical: spacingTokens.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalRowTitle: {
    ...typographyTokens.body,
    fontSize: 15,
  },
  modalRowSubtitle: {
    ...typographyTokens.label,
    flexShrink: 1,
    marginLeft: spacingTokens.sm,
  },
  doneButton: {
    backgroundColor: colorTokens.inverse,
    borderRadius: radiusTokens.md,
    minHeight: touchTarget.minimum,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonText: {
    color: colorTokens.card,
    fontWeight: '600',
  },
  splitOverlay: {
    flex: 1,
    backgroundColor: colorTokens.appBackground,
  },
  splitPanel: {
    flex: 1,
    paddingHorizontal: spacingTokens.lg,
    gap: spacingTokens.xs,
  },
  splitTitle: {
    ...typographyTokens.heading,
    fontSize: 32 / 2,
  },
  splitSubtitle: {
    ...typographyTokens.body,
    color: colorTokens.textMuted,
    marginBottom: spacingTokens.xs,
  },
  totalCard: {
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.md,
    backgroundColor: colorTokens.card,
    paddingHorizontal: spacingTokens.md,
    paddingVertical: spacingTokens.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    ...typographyTokens.body,
    color: colorTokens.textMuted,
  },
  totalValue: {
    ...typographyTokens.heading,
  },
  splitSectionTitle: {
    ...typographyTokens.label,
    color: colorTokens.textPrimary,
    marginTop: spacingTokens.xs,
  },
  methodRow: {
    gap: spacingTokens.xs,
    paddingVertical: 2,
    alignItems: 'center',
  },
  methodScroll: {
    maxHeight: 44,
  },
  methodChip: {
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.sm,
    backgroundColor: colorTokens.card,
    paddingHorizontal: spacingTokens.md,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  methodChipActive: {
    backgroundColor: colorTokens.inverse,
    borderColor: colorTokens.inverse,
  },
  methodChipText: {
    color: colorTokens.textPrimary,
    fontWeight: '500',
  },
  methodChipTextActive: {
    color: colorTokens.card,
  },
  participantHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectAllText: {
    ...typographyTokens.label,
    textDecorationLine: 'underline',
  },
  participantList: {
    flex: 1,
  },
  participantListContent: {
    gap: spacingTokens.sm,
  },
  participantCard: {
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.md,
    backgroundColor: colorTokens.card,
    minHeight: 78,
    paddingHorizontal: spacingTokens.sm,
    paddingVertical: spacingTokens.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacingTokens.sm,
  },
  participantCardActive: {
    borderColor: colorTokens.inverse,
  },
  checkbox: {
    width: 24,
    alignItems: 'center',
  },
  participantBody: {
    flex: 1,
    gap: 4,
  },
  participantName: {
    ...typographyTokens.body,
    fontSize: 15,
  },
  participantInput: {
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.sm,
    backgroundColor: colorTokens.card,
    paddingHorizontal: spacingTokens.sm,
    minHeight: 34,
    maxWidth: 84,
  },
  participantInputDisabled: {
    opacity: 0.7,
  },
  shareBlock: {
    alignItems: 'flex-end',
  },
  shareLabel: {
    ...typographyTokens.label,
    fontSize: 10,
  },
  shareValue: {
    ...typographyTokens.body,
    fontWeight: '600',
  },
  sliderTrack: {
    marginTop: 4,
    height: 14,
    borderRadius: 999,
    backgroundColor: '#E6E6E7',
    overflow: 'hidden',
  },
  sliderTrackDisabled: {
    opacity: 0.5,
  },
  sliderFill: {
    height: '100%',
    backgroundColor: colorTokens.inverse,
  },
  balanceCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colorTokens.inverse,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceTitle: {
    ...typographyTokens.body,
    fontWeight: '600',
  },
  balanceMeta: {
    ...typographyTokens.label,
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: colorTokens.border,
    borderRadius: radiusTokens.md,
    minHeight: touchTarget.minimum,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colorTokens.card,
  },
  cancelButtonText: {
    color: colorTokens.textPrimary,
    fontWeight: '500',
  },
});
