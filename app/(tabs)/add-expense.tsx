import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
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
import { radiusTokens, spacingTokens, touchTarget } from '../../src/mobile/theme/tokens';
import { typographyTokens } from '../../src/mobile/theme/typography';
import { useTheme } from '../../src/mobile/theme/useTheme';
import { CURRENCY_OPTIONS, fuzzyCurrencySearch } from '../../src/domain/currency/catalog';
import { FormNumberInput, FormTextInput } from '../../src/mobile/components/FormFields';
import { Button } from '../../src/mobile/components/Button';
import { ScreenScroll } from '../../src/mobile/components/AppScaffold';
import { getResponsiveMaxWidth } from '../../src/mobile/theme/layout';
import { ScreenHeader } from '../../src/mobile/components/ScreenHeader';
import { SelectionRow } from '../../src/mobile/components/SelectionRow';
import { ChoiceChip } from '../../src/mobile/components/ChoiceChip';
import { modalSheetStyles } from '../../src/mobile/theme/styles';
import { ParticipantAvatar } from '../../src/mobile/components/ParticipantAvatar';
import { CurrencyPickerSheet } from '../../src/mobile/components/CurrencyPickerSheet';
import { ThemedAlertDialog, type ThemedAlertButton } from '../../src/mobile/components/ThemedAlertDialog';

type PickerMode = 'none' | 'currency' | 'paidBy' | 'splitBetween' | 'splitType';
type SplitMethod = 'exact' | 'percent';

export default function AddExpenseScreen(): JSX.Element {
   const router = useRouter();
   const insets = useSafeAreaInsets();
   const { width } = useWindowDimensions();
   const { colors } = useTheme();
   const maxWidth = getResponsiveMaxWidth(width);
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
   const [alertDialog, setAlertDialog] = useState<{ title: string; message: string; buttons: ThemedAlertButton[] } | null>(null);

   // Animation refs for modal
   const modalScaleAnim = useRef(new Animated.Value(0.95)).current;
   const modalOpacityAnim = useRef(new Animated.Value(0)).current;
   const participantCardAnimsRef = useRef<Record<string, Animated.Value>>({});

   // Generate dynamic styles based on current theme colors
   const dynamicStyles = useMemo(
     () =>
       StyleSheet.create({
         screen: {
           flex: 1,
           backgroundColor: colors.card,
         },
          content: {
            paddingHorizontal: spacingTokens.lg,
            gap: spacingTokens.md,
            maxWidth: '100%',
          },
         sectionLabel: {
           color: colors.textPrimary,
           fontSize: 24 / 2,
           fontWeight: '500',
         },
         inputLike: {
           borderWidth: 1,
           borderColor: colors.border,
           borderRadius: radiusTokens.md,
           paddingHorizontal: spacingTokens.md,
           paddingVertical: spacingTokens.md,
           minHeight: touchTarget.minimum,
           backgroundColor: colors.card,
         },
          row: {
            flexDirection: 'row',
            gap: spacingTokens.md,
            flexWrap: 'wrap',
          },
          halfField: {
            flex: 1,
            gap: spacingTokens.sm,
            minWidth: 160,
          },
         selectLike: {
           borderWidth: 1,
           borderColor: colors.border,
           borderRadius: radiusTokens.md,
           minHeight: touchTarget.minimum,
           backgroundColor: colors.card,
           paddingHorizontal: spacingTokens.md,
           flexDirection: 'row',
           alignItems: 'center',
           justifyContent: 'space-between',
         },
         selectValue: {
           color: colors.textPrimary,
           fontSize: 22 / 2,
         },
         avatarShift: {
           marginLeft: -8,
         },
         avatarStack: {
           flexDirection: 'row',
           alignItems: 'center',
           marginRight: spacingTokens.sm,
         },
         plusBadge: {
           marginLeft: 6,
           borderWidth: 1,
           borderColor: colors.border,
           borderRadius: radiusTokens.pill,
           paddingHorizontal: 6,
           paddingVertical: 2,
           backgroundColor: colors.card,
         },
         plusBadgeText: {
           fontSize: 10,
           color: colors.textMuted,
         },
         modalBackdrop: {
           flex: 1,
         },
         modalCard: {
           gap: spacingTokens.sm,
           maxHeight: '75%',
         },
         modalTitle: {
           ...typographyTokens.body,
           fontWeight: '700',
         },
         searchInput: {
           borderWidth: 1,
           borderColor: colors.border,
           borderRadius: radiusTokens.md,
           minHeight: touchTarget.minimum,
           paddingHorizontal: spacingTokens.md,
           backgroundColor: colors.card,
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
            borderBottomColor: colors.subtleBorder,
            paddingVertical: spacingTokens.md,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
          },
         modalParticipantLabel: {
           flexDirection: 'row',
           alignItems: 'center',
           gap: spacingTokens.sm,
         },
          modalRowTitle: {
            ...typographyTokens.body,
            fontSize: 15,
            color: colors.textPrimary,
          },
          modalRowSubtitle: {
            ...typographyTokens.label,
            color: colors.textMuted,
            flexShrink: 1,
            marginLeft: spacingTokens.sm,
          },
         splitOverlay: {
           flex: 1,
           backgroundColor: colors.appBackground,
         },
          splitPanel: {
            flex: 1,
            gap: 0,
            backgroundColor: colors.card,
            borderTopLeftRadius: 24,
            borderTopRightRadius: 24,
          },
          splitTitle: {
            ...typographyTokens.heading,
            fontSize: 28,
            marginTop: spacingTokens.lg,
            marginBottom: spacingTokens.md,
            marginHorizontal: 0,
          },
          splitSubtitle: {
            ...typographyTokens.body,
            color: colors.textMuted,
            marginBottom: spacingTokens.md,
            marginHorizontal: 0,
          },
          totalCard: {
            borderWidth: 0,
            borderRadius: radiusTokens.md,
            backgroundColor: colors.appBackground,
            paddingHorizontal: spacingTokens.md,
            paddingVertical: spacingTokens.md,
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            overflow: 'hidden',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.05,
            shadowRadius: 8,
            elevation: 3,
            marginBottom: spacingTokens.md,
          },
         totalCardContent: {
           flex: 1,
         },
         totalCardAccent: {
           width: 4,
           height: 60,
           backgroundColor: colors.inverse,
           borderRadius: 2,
           marginLeft: spacingTokens.md,
         },
         totalLabel: {
           ...typographyTokens.label,
           color: colors.textMuted,
           fontSize: 12,
         },
         totalValue: {
           ...typographyTokens.heading,
           fontSize: 28,
           fontWeight: '700',
           marginTop: spacingTokens.xs,
         },
         splitSectionTitle: {
           ...typographyTokens.label,
           color: colors.textPrimary,
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
         participantHeader: {
           flexDirection: 'row',
           justifyContent: 'space-between',
           alignItems: 'center',
         },
         selectAllText: {
           ...typographyTokens.label,
           textDecorationLine: 'underline',
           color: colors.inverse,
           opacity: 0.8,
         },
         selectAllPressed: {
           opacity: 0.6,
         },
         participantList: {
           flex: 1,
         },
         participantListContent: {
           gap: spacingTokens.sm,
         },
          participantCard: {
            borderWidth: 2,
            borderColor: colors.border,
            borderRadius: radiusTokens.md,
            backgroundColor: colors.card,
            minHeight: 88,
            paddingHorizontal: spacingTokens.md,
            paddingVertical: spacingTokens.md,
            flexDirection: 'row',
            alignItems: 'center',
            gap: spacingTokens.md,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.03,
            shadowRadius: 3,
            elevation: 1,
          },
         participantCardActive: {
           borderColor: colors.inverse,
           backgroundColor: colors.appBackground,
           shadowOpacity: 0.08,
           elevation: 2,
         },
          checkbox: {
            width: touchTarget.minimum,
            height: touchTarget.minimum,
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 6,
          },
         checkboxPressed: {
           opacity: 0.6,
         },
          participantBody: {
            flex: 1,
            gap: spacingTokens.sm,
          },
          participantName: {
            ...typographyTokens.body,
            fontSize: 16,
          },
         participantInput: {
           borderWidth: 1,
           borderColor: colors.border,
           borderRadius: radiusTokens.sm,
           backgroundColor: colors.card,
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
           marginTop: 6,
           height: 16,
           borderRadius: 999,
           backgroundColor: colors.subtleSurface,
           overflow: 'hidden',
           shadowColor: '#000',
           shadowOffset: { width: 0, height: 1 },
           shadowOpacity: 0.05,
           shadowRadius: 2,
           elevation: 1,
         },
         sliderTrackDisabled: {
           opacity: 0.5,
         },
         sliderFill: {
           height: '100%',
           backgroundColor: colors.inverse,
           borderRadius: 999,
         },
         balanceTitle: {
           ...typographyTokens.body,
           fontWeight: '600',
         },
         balanceMeta: {
           ...typographyTokens.label,
         },
         splitHeader: {
           flexDirection: 'row',
           justifyContent: 'flex-end',
           marginBottom: 0,
         },
         splitCloseButton: {
           width: 40,
           height: 40,
           borderRadius: radiusTokens.md,
           alignItems: 'center',
           justifyContent: 'center',
           backgroundColor: colors.appBackground,
         },
         splitCloseButtonPressed: {
           opacity: 0.6,
         },
          balanceCard: {
            borderRadius: radiusTokens.md,
            backgroundColor: colors.appBackground,
            paddingHorizontal: spacingTokens.md,
            paddingVertical: spacingTokens.md,
            flexDirection: 'row',
            alignItems: 'flex-start',
            gap: spacingTokens.md,
            marginTop: spacingTokens.md,
            marginBottom: spacingTokens.md,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.08,
            shadowRadius: 6,
            elevation: 2,
          },
         balanceCardSuccess: {
           borderWidth: 1,
           borderColor: '#BDE8CC',
         },
         balanceCardWarning: {
           borderWidth: 1,
           borderColor: '#F4C2C2',
         },
         balanceCheck: {
           width: 28,
           height: 28,
           borderRadius: 14,
           alignItems: 'center',
           justifyContent: 'center',
           marginTop: 2,
         },
         balanceCheckSuccess: {
           backgroundColor: colors.success,
         },
         balanceCheckWarning: {
           backgroundColor: colors.destructive,
         },
       }),
     [colors],
   );

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

  // Animate modal on open/close
  useEffect(() => {
    if (splitConfigVisible) {
      Animated.parallel([
        Animated.timing(modalScaleAnim, {
          toValue: 1,
          duration: 300,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 1,
          duration: 200,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();

      // Animate participant cards staggered
      participants.forEach((participant, index) => {
        if (!participantCardAnimsRef.current[participant.participantId]) {
          participantCardAnimsRef.current[participant.participantId] = new Animated.Value(0);
        }
        const anim = participantCardAnimsRef.current[participant.participantId];
        setTimeout(() => {
          Animated.timing(anim, {
            toValue: 1,
            duration: 250,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
        }, 100 + index * 30);
      });
    } else {
      Animated.parallel([
        Animated.timing(modalScaleAnim, {
          toValue: 0.95,
          duration: 200,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(modalOpacityAnim, {
          toValue: 0,
          duration: 150,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [splitConfigVisible, participants, modalScaleAnim, modalOpacityAnim]);

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
      setAlertDialog({
        title: 'Save expense',
        message: caught instanceof Error ? caught.message : 'Unable to save expense.',
        buttons: [{ label: 'OK' }],
      });
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
     <View style={dynamicStyles.screen}>
       <ScreenScroll topInsetOffset={spacingTokens.lg} bottomInsetOffset={spacingTokens.xl}>
         <View style={[dynamicStyles.content, { maxWidth, alignSelf: 'center', width: '100%' }]}>
         <ScreenHeader
           title="Add Expense"
           subtitle="Track a new expense for this share"
           badge={shareTitle || 'Untitled Share'}
           onBack={() => router.back()}
         />

         <FormTextInput
           label="Expense Name"
           value={description}
           onChangeText={setDescription}
           placeholder="e.g., Dinner, Gas, Hotel"
           autoCorrect={false}
         />

         <View style={dynamicStyles.row}>
           <View style={dynamicStyles.halfField}>
             <FormNumberInput
               label="Amount"
               value={amount}
               onChangeText={setAmount}
               placeholder="0.00"
             />
           </View>
           <View style={dynamicStyles.halfField}>
             <Text style={dynamicStyles.sectionLabel}>Currency</Text>
             <Pressable style={dynamicStyles.selectLike} accessibilityRole="button" onPress={() => openPicker('currency')}>
               <Text style={dynamicStyles.selectValue}>{currency}</Text>
               <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
             </Pressable>
           </View>
         </View>

         <SelectionRow
           label="Paid By"
           title={payerName}
           onPress={() => openPicker('paidBy')}
           leading={
             <ParticipantAvatar name={payerName} />
           }
         />

         <SelectionRow
           label="Split Between"
           title={splitLabel}
           onPress={() => openPicker('splitBetween')}
           leading={
             <View style={dynamicStyles.avatarStack}>
               {splitPreviewParticipants.map((participant, index) => (
                 <View key={participant.participantId} style={index > 0 ? dynamicStyles.avatarShift : null}>
                   <ParticipantAvatar name={participant.displayName} size="sm" />
                 </View>
               ))}
               {splitOverflowCount > 0 ? (
                 <View style={dynamicStyles.plusBadge}>
                   <Text style={dynamicStyles.plusBadgeText}>{`+${splitOverflowCount}`}</Text>
                 </View>
               ) : null}
             </View>
           }
         />

         <SelectionRow
           label="Split Type"
           title={splitMode === 'equal' ? 'Split Equally' : 'Split by Exact Amounts'}
           subtitle={perPersonLabel}
           onPress={openSplitConfig}
         />

         <Button fullWidth loading={isSaving} onPress={() => void onSaveExpensePress()}>
           Save Expense
         </Button>
         </View>
       </ScreenScroll>

        <CurrencyPickerSheet
          visible={pickerMode === 'currency'}
          query={searchQuery}
          options={filteredCurrencies}
          selectedCode={currency}
          maxWidth={maxWidth}
          onQueryChange={handleSearchQueryChange}
          onSelect={(code) => {
            setCurrency(code);
            closePicker();
          }}
          onClose={closePicker}
        />

        <Modal transparent visible={pickerMode !== 'none' && pickerMode !== 'currency'} animationType="fade" onRequestClose={closePicker}>
         <KeyboardAvoidingView
           style={modalSheetStyles.overlay}
           behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
           keyboardVerticalOffset={insets.bottom}
         >
           <Pressable style={dynamicStyles.modalBackdrop} onPress={closePicker} />
            <View
              style={[
                modalSheetStyles.sheetCard,
                dynamicStyles.modalCard,
                { paddingBottom: insets.bottom + spacingTokens.md, width: '100%', maxWidth, alignSelf: 'center', paddingHorizontal: spacingTokens.lg },
              ]}
            >
             <Text style={dynamicStyles.modalTitle}>
               {pickerMode === 'currency'
                 ? 'Select Currency'
                 : pickerMode === 'paidBy'
                   ? 'Select Payer'
                   : pickerMode === 'splitBetween'
                     ? 'Split Between'
                     : 'Split Type'}
             </Text>
             {(pickerMode === 'currency' || pickerMode === 'paidBy' || pickerMode === 'splitBetween') ? (
               <FormTextInput
                 value={searchQuery}
                 onChangeText={handleSearchQueryChange}
                 placeholder={pickerMode === 'currency' ? 'Search code or name' : 'Search participants'}
                 style={dynamicStyles.searchInput}
               />
             ) : null}
             <ScrollView
               style={dynamicStyles.modalList}
               contentContainerStyle={dynamicStyles.modalListContent}
               keyboardShouldPersistTaps="handled"
             >
                {pickerMode === 'paidBy'
                 ? filteredParticipants.map((participant) => (
                     <Pressable
                       key={participant.participantId}
                       style={dynamicStyles.modalRow}
                       accessibilityRole="button"
                       onPress={() => {
                         setPayerParticipantId(participant.participantId);
                         closePicker();
                       }}
                     >
                       <View style={dynamicStyles.modalParticipantLabel}>
                         <ParticipantAvatar name={participant.displayName} size="sm" />
                         <Text style={dynamicStyles.modalRowTitle}>{participant.displayName}</Text>
                       </View>
                     </Pressable>
                   ))
                 : null}
               {pickerMode === 'splitBetween'
                 ? filteredParticipants.map((participant) => {
                     const selected = splitParticipantIds.includes(participant.participantId);
                     return (
                       <Pressable
                         key={participant.participantId}
                         style={dynamicStyles.modalRow}
                         accessibilityRole="button"
                         onPress={() => toggleSplitParticipant(participant.participantId)}
                       >
                         <View style={dynamicStyles.modalParticipantLabel}>
                           <ParticipantAvatar name={participant.displayName} size="sm" />
                           <Text style={dynamicStyles.modalRowTitle}>{participant.displayName}</Text>
                         </View>
                         <Ionicons
                           name={selected ? 'checkbox' : 'square-outline'}
                           size={20}
                           color={selected ? colors.inverse : colors.textMuted}
                         />
                       </Pressable>
                     );
                   })
                 : null}
               {pickerMode === 'splitType' ? (
                 <>
                   <Pressable style={dynamicStyles.modalRow} accessibilityRole="button" onPress={() => { setSplitMode('exact'); closePicker(); }}>
                     <Text style={dynamicStyles.modalRowTitle}>Split by Exact Amounts</Text>
                   </Pressable>
                   <Pressable style={dynamicStyles.modalRow} accessibilityRole="button" onPress={closePicker}>
                     <Text style={dynamicStyles.modalRowTitle}>Split by Percentage</Text>
                   </Pressable>
                 </>
               ) : null}
             </ScrollView>
             {pickerMode === 'splitBetween' ? (
               <Button fullWidth onPress={closePicker}>
                 Done
               </Button>
             ) : null}
           </View>
         </KeyboardAvoidingView>
       </Modal>

       <Modal transparent visible={splitConfigVisible} animationType="none" onRequestClose={() => setSplitConfigVisible(false)}>
         <Animated.View style={[dynamicStyles.splitOverlay, { opacity: modalOpacityAnim }]}>
            <Animated.View
              style={[
                dynamicStyles.splitPanel,
                {
                  paddingTop: insets.top + spacingTokens.lg,
                  paddingBottom: insets.bottom + spacingTokens.md,
                  paddingHorizontal: spacingTokens.lg,
                  maxWidth,
                  alignSelf: 'center',
                  width: '100%',
                  transform: [{ scale: modalScaleAnim }],
                },
              ]}
            >
             <View style={dynamicStyles.splitHeader}>
               <Pressable
                 onPress={() => setSplitConfigVisible(false)}
                 style={({ pressed }) => [
                   dynamicStyles.splitCloseButton,
                   pressed && dynamicStyles.splitCloseButtonPressed,
                 ]}
               >
                 <Ionicons name="close" size={24} color={colors.textPrimary} />
               </Pressable>
             </View>

             <Text style={dynamicStyles.splitTitle}>Configure Split</Text>
             <Text style={dynamicStyles.splitSubtitle}>Adjust how the expense is divided</Text>

             <View style={dynamicStyles.totalCard}>
               <View style={dynamicStyles.totalCardContent}>
                 <Text style={dynamicStyles.totalLabel}>Total Amount</Text>
                 <Text style={dynamicStyles.totalValue}>{formatAmountWithCurrency((Number.parseFloat(amount || '0') || 0))}</Text>
               </View>
               <View style={dynamicStyles.totalCardAccent} />
             </View>

             <Text style={dynamicStyles.splitSectionTitle}>Split Method</Text>
             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={dynamicStyles.methodScroll} contentContainerStyle={dynamicStyles.methodRow}>
               {(['exact', 'percent'] as const).map((method) => (
                 <ChoiceChip
                   key={method}
                   active={configMethod === method}
                   onPress={() => setConfigMethod(method)}
                   label={method === 'exact' ? 'Exact Amount' : 'Percentage'}
                 />
               ))}
             </ScrollView>

             <View style={dynamicStyles.participantHeader}>
               <Text style={dynamicStyles.splitSectionTitle}>Participants ({participants.length})</Text>
               <Pressable
                 onPress={() =>
                   setConfigParticipantIds(
                     configParticipantIds.length === participants.length ? [] : participants.map((participant) => participant.participantId),
                   )
                 }
                 style={({ pressed }) => pressed && dynamicStyles.selectAllPressed}
               >
                 <Text style={dynamicStyles.selectAllText}>Select All</Text>
               </Pressable>
             </View>

             <ScrollView style={dynamicStyles.participantList} contentContainerStyle={dynamicStyles.participantListContent}>
               {participants.map((participant, index) => {
                 const selected = configParticipantIds.includes(participant.participantId);
                 const sharePercent =
                   configMethod === 'exact'
                       ? Number.parseFloat(amount || '0') > 0
                         ? (Number.parseFloat(configExactValues[participant.participantId] || '0') / Number.parseFloat(amount || '1')) * 100
                         : 0
                       : Number.parseFloat(configPercentValues[participant.participantId] || '0');
                 const equalAmount = configParticipantIds.length > 0 ? (Number.parseFloat(amount || '0') / configParticipantIds.length).toFixed(2) : '0.00';

                 if (!participantCardAnimsRef.current[participant.participantId]) {
                   participantCardAnimsRef.current[participant.participantId] = new Animated.Value(0);
                 }
                 const cardAnim = participantCardAnimsRef.current[participant.participantId];

                 return (
                   <Animated.View
                     key={participant.participantId}
                     style={[
                       dynamicStyles.participantCard,
                       selected ? dynamicStyles.participantCardActive : null,
                       {
                         opacity: cardAnim,
                         transform: [
                           {
                             translateX: cardAnim.interpolate({
                               inputRange: [0, 1],
                               outputRange: [40, 0],
                             }),
                           },
                         ],
                       },
                     ]}
                   >
                     <Pressable
                       style={({ pressed }) => [
                         dynamicStyles.checkbox,
                         pressed && dynamicStyles.checkboxPressed,
                       ]}
                       accessibilityRole="button"
                       onPress={() =>
                         setConfigParticipantIds((prev) =>
                           prev.includes(participant.participantId)
                             ? prev.filter((id) => id !== participant.participantId)
                             : [...prev, participant.participantId],
                         )
                       }
                     >
                       <Ionicons
                         name={selected ? 'checkbox' : 'square-outline'}
                         size={20}
                         color={selected ? colors.inverse : colors.textMuted}
                       />
                     </Pressable>
                     <ParticipantAvatar name={participant.displayName} size="sm" />
                     <View style={dynamicStyles.participantBody}>
                       <Text style={dynamicStyles.participantName}>{participant.displayName}</Text>
                       {configMethod === 'exact' ? (
                         <TextInput
                           editable={selected}
                           style={[dynamicStyles.participantInput, selected ? null : dynamicStyles.participantInputDisabled]}
                           value={configExactValues[participant.participantId] ?? equalAmount}
                           onChangeText={(value) => {
                             setConfigExactValues((prev) => ({ ...prev, [participant.participantId]: value }));
                           }}
                           keyboardType="decimal-pad"
                           placeholderTextColor={colors.textMuted}
                         />
                       ) : (
                         <View
                           style={[dynamicStyles.sliderTrack, selected ? null : dynamicStyles.sliderTrackDisabled]}
                           onLayout={(event) => {
                             const width = event.nativeEvent.layout.width;
                             sliderWidthByParticipantIdRef.current[participant.participantId] = width;
                           }}
                           onStartShouldSetResponder={() => selected}
                           onMoveShouldSetResponder={() => selected}
                           onResponderGrant={(event) => updatePercentFromGesture(participant.participantId, event)}
                           onResponderMove={(event) => updatePercentFromGesture(participant.participantId, event)}
                         >
                           <Animated.View
                             style={[
                               dynamicStyles.sliderFill,
                               {
                                 width: `${Math.max(0, Math.min(100, Number.parseFloat(configPercentValues[participant.participantId] || '0')))}%`,
                               },
                             ]}
                           />
                         </View>
                       )}
                     </View>
                     <View style={dynamicStyles.shareBlock}>
                       <Text style={dynamicStyles.shareLabel}>Share</Text>
                       <Text style={dynamicStyles.shareValue}>{Number.isFinite(sharePercent) ? `${sharePercent.toFixed(0)}%` : '0%'}</Text>
                     </View>
                   </Animated.View>
                 );
               })}
             </ScrollView>

             <View style={[dynamicStyles.balanceCard, Math.abs(calculateAssignedAmount() - Number.parseFloat(amount || '0')) < 0.01 ? dynamicStyles.balanceCardSuccess : dynamicStyles.balanceCardWarning]}>
               <View style={[dynamicStyles.balanceCheck, Math.abs(calculateAssignedAmount() - Number.parseFloat(amount || '0')) < 0.01 ? dynamicStyles.balanceCheckSuccess : dynamicStyles.balanceCheckWarning]}>
                 <Ionicons
                   name={Math.abs(calculateAssignedAmount() - Number.parseFloat(amount || '0')) < 0.01 ? 'checkmark' : 'alert-circle'}
                   size={14}
                   color={colors.card}
                 />
               </View>
               <View>
                 <Text style={dynamicStyles.balanceTitle}>
                   Split is {Math.abs(calculateAssignedAmount() - Number.parseFloat(amount || '0')) < 0.01 ? 'balanced' : 'not balanced'}
                 </Text>
                 <Text style={dynamicStyles.balanceMeta}>
                   Total assigned: {formatAmountWithCurrency(calculateAssignedAmount())} / {formatAmountWithCurrency((Number.parseFloat(amount || '0') || 0))}
                 </Text>
               </View>
             </View>

             <Button fullWidth onPress={confirmSplitConfig}>
               Confirm Split
             </Button>
             <Button variant="secondary" fullWidth onPress={() => setSplitConfigVisible(false)}>
               Cancel
             </Button>
           </Animated.View>
         </Animated.View>
        </Modal>
        <ThemedAlertDialog
          visible={alertDialog !== null}
          title={alertDialog?.title ?? ''}
          message={alertDialog?.message ?? ''}
          buttons={alertDialog?.buttons ?? [{ label: 'OK' }]}
          onClose={() => setAlertDialog(null)}
        />
      </View>
    );
  }

const styles = StyleSheet.create({});
