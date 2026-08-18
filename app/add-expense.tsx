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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { loadExpenseFormModel, submitExpenseForm } from '../src/mobile/controllers/expenseFormController';
import { consumePendingExpenseDraft } from '../src/mobile/state/expenseDraftStore';
import { getActiveShareState } from '../src/mobile/state/activeShareStore';
import { createLedgerAppService } from '../src/mobile/services/ledgerAppService';
import { radiusTokens, spacingTokens, touchTarget } from '../src/mobile/theme/tokens';
import { typographyTokens } from '../src/mobile/theme/typography';
import { useTheme } from '../src/mobile/theme/useTheme';
import { CURRENCY_OPTIONS, fuzzyCurrencySearch } from '../src/domain/currency/catalog';
import { FormNumberInput, FormTextInput } from '../src/mobile/components/FormFields';
import { Button } from '../src/mobile/components/Button';
import { ScreenScroll } from '../src/mobile/components/AppScaffold';
import { getResponsiveMaxWidth } from '../src/mobile/theme/layout';
import { ScreenHeader } from '../src/mobile/components/ScreenHeader';
import { SelectionRow } from '../src/mobile/components/SelectionRow';
import { ChoiceChip } from '../src/mobile/components/ChoiceChip';
import { modalSheetStyles } from '../src/mobile/theme/styles';
import { ParticipantAvatar } from '../src/mobile/components/ParticipantAvatar';
import { CurrencyPickerSheet } from '../src/mobile/components/CurrencyPickerSheet';
import { ThemedAlertDialog, type ThemedAlertButton } from '../src/mobile/components/ThemedAlertDialog';

type PickerMode = 'none' | 'currency' | 'paidBy' | 'splitBetween' | 'splitType';
type SplitMethod = 'exact' | 'percent';
type SplitMode = 'equal' | SplitMethod;

export function formatLocalExpenseDate(date = new Date()): string {
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  const day = `${date.getDate()}`.padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isValidExpenseDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return false;
  }
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const date = new Date(year, month - 1, day);
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day;
}

export function allocatePercentageSplitMinor(
  totalMinor: number,
  participantIds: string[],
  percentValues: Record<string, string>,
): Record<string, number> {
  const rows = participantIds.map((participantId, order) => {
    const percentageBps = Math.max(0, Math.round(Number.parseFloat(percentValues[participantId] || '0') * 100));
    const numerator = totalMinor * percentageBps;
    return {
      participantId,
      order,
      owedAmountMinor: Math.floor(numerator / 10000),
      remainder: numerator % 10000,
    };
  });
  let remainderMinor = totalMinor - rows.reduce((sum, row) => sum + row.owedAmountMinor, 0);
  const rankedRows = rows.slice().sort((left, right) => right.remainder - left.remainder || left.order - right.order);
  for (let index = 0; remainderMinor > 0 && rankedRows.length > 0; index += 1) {
    rankedRows[index % rankedRows.length].owedAmountMinor += 1;
    remainderMinor -= 1;
  }
  return Object.fromEntries(rows.map((row) => [row.participantId, row.owedAmountMinor]));
}

function derivePercentValues(
  totalMinor: number,
  participantIds: string[],
  exactAmountsMinor: Record<string, number>,
): Record<string, string> {
  if (totalMinor <= 0) {
    return {};
  }
  const rows = participantIds.map((participantId, order) => {
    const rawBps = ((exactAmountsMinor[participantId] ?? 0) * 10000) / totalMinor;
    return { participantId, order, bps: Math.floor(rawBps), remainder: rawBps - Math.floor(rawBps) };
  });
  let remainderBps = 10000 - rows.reduce((sum, row) => sum + row.bps, 0);
  const rankedRows = rows.slice().sort((left, right) => right.remainder - left.remainder || left.order - right.order);
  for (let index = 0; remainderBps > 0 && rankedRows.length > 0; index += 1) {
    rankedRows[index % rankedRows.length].bps += 1;
    remainderBps -= 1;
  }
  return Object.fromEntries(rows.map((row) => [row.participantId, `${row.bps / 100}`]));
}

export default function AddExpenseScreen(): JSX.Element {
   const router = useRouter();
   const insets = useSafeAreaInsets();
   const { width } = useWindowDimensions();
   const { colors } = useTheme();
   const maxWidth = getResponsiveMaxWidth(width);
   const [description, setDescription] = useState('');
   const [amount, setAmount] = useState('');
   const [currency, setCurrency] = useState('USD');
    const [expenseDate, setExpenseDate] = useState(formatLocalExpenseDate());
    const [splitMode, setSplitMode] = useState<SplitMode>('equal');
    const [exactValues, setExactValues] = useState<Record<string, string>>({});
    const [percentValues, setPercentValues] = useState<Record<string, string>>({});
    const [editingExpenseId, setEditingExpenseId] = useState<string | null>(null);
    const [editingLedgerId, setEditingLedgerId] = useState<string | null>(null);
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
             fontSize: 20,
             marginTop: spacingTokens.md,
             marginBottom: spacingTokens.xs,
             marginHorizontal: 0,
           },
           splitSubtitle: {
             ...typographyTokens.label,
             color: colors.textMuted,
             fontSize: 12,
             marginBottom: spacingTokens.md,
             marginHorizontal: 0,
           },
           totalCard: {
             borderWidth: 0,
             borderRadius: radiusTokens.sm,
             backgroundColor: colors.card,
             paddingHorizontal: spacingTokens.md,
             paddingVertical: spacingTokens.sm,
             flexDirection: 'row',
             justifyContent: 'space-between',
             alignItems: 'center',
             overflow: 'hidden',
             marginBottom: spacingTokens.md,
           },
          totalCardContent: {
            flex: 1,
          },
          totalCardAccent: {
            width: 3,
            height: 44,
            backgroundColor: colors.inverse,
            borderRadius: 1,
            marginLeft: spacingTokens.sm,
          },
          totalLabel: {
            ...typographyTokens.label,
            color: colors.textMuted,
            fontSize: 11,
          },
          totalValue: {
            ...typographyTokens.body,
            fontSize: 18,
            fontWeight: '600',
            marginTop: 2,
          },
          splitSectionTitle: {
            ...typographyTokens.label,
            color: colors.textPrimary,
            fontSize: 12,
            fontWeight: '500',
            marginTop: spacingTokens.sm,
            marginBottom: spacingTokens.sm,
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
             borderWidth: 1,
             borderColor: colors.border,
             borderRadius: radiusTokens.sm,
             backgroundColor: colors.card,
             minHeight: 56,
             paddingHorizontal: spacingTokens.md,
             paddingVertical: spacingTokens.sm,
             flexDirection: 'row',
             alignItems: 'center',
             gap: spacingTokens.sm,
           },
          participantCardActive: {
            borderColor: colors.inverse,
            backgroundColor: colors.appBackground,
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
             gap: 0,
           },
           participantName: {
             ...typographyTokens.label,
             fontWeight: '500',
             fontSize: 14,
           },
          participantInput: {
            borderWidth: 1,
            borderColor: colors.border,
            borderRadius: radiusTokens.xs,
            backgroundColor: colors.appBackground,
            paddingHorizontal: spacingTokens.xs,
            minHeight: 28,
            maxWidth: 70,
            fontSize: 13,
          },
         participantInputDisabled: {
           opacity: 0.7,
         },
          shareBlock: {
            alignItems: 'flex-end',
            minWidth: 50,
          },
          shareLabel: {
            ...typographyTokens.label,
            fontSize: 9,
            color: colors.textMuted,
          },
          shareValue: {
            ...typographyTokens.label,
            fontWeight: '600',
            fontSize: 13,
          },
          balanceTitle: {
            ...typographyTokens.label,
            fontWeight: '600',
            fontSize: 13,
          },
          balanceMeta: {
            ...typographyTokens.label,
            fontSize: 11,
            color: colors.textMuted,
            marginTop: 2,
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
             borderRadius: radiusTokens.sm,
             backgroundColor: colors.card,
             paddingHorizontal: spacingTokens.md,
             paddingVertical: spacingTokens.sm,
             flexDirection: 'row',
             alignItems: 'center',
             gap: spacingTokens.sm,
             marginTop: spacingTokens.md,
             marginBottom: spacingTokens.md,
           },
          balanceCardSuccess: {
            borderWidth: 1,
            borderColor: colors.success,
          },
          balanceCardWarning: {
            borderWidth: 1,
            borderColor: colors.destructive,
          },
          balanceCheck: {
            width: 24,
            height: 24,
            borderRadius: 12,
            alignItems: 'center',
            justifyContent: 'center',
            marginTop: 0,
            flexShrink: 0,
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
    const selectedLedgerId = pending?.selectedLedgerId ?? getActiveShareState().activeShareId;
    const service = createLedgerAppService();
    let cancelled = false;

    void Promise.all([
      service.loadHomeSnapshot({ selectedLedgerId }),
      pending ? loadExpenseFormModel({ selectedLedgerId, editExpenseId: pending.expenseId }) : Promise.resolve(null),
      pending ? service.loadLedgerExpenseDetails({ selectedLedgerId, expenseId: pending.expenseId }) : Promise.resolve(null),
    ])
      .then(([snapshot, model, details]) => {
        if (cancelled) {
          return;
        }
        setShareTitle(snapshot.title);
        const nextParticipants = snapshot.balanceSummary.participants.map((participant) => ({
          participantId: participant.participantId,
          displayName: participant.displayName,
        }));
        setParticipants(nextParticipants);
        if (!pending || !model) {
          setSplitParticipantIds(nextParticipants.map((participant) => participant.participantId));
          setPayerParticipantId(nextParticipants[0]?.participantId ?? '');
          return;
        }
        setEditingExpenseId(pending.expenseId);
        setEditingLedgerId(selectedLedgerId ?? null);
        setDescription(model.defaults.description);
        setAmount(model.defaults.totalAmountInput);
        setCurrency(model.defaults.currency);
        setExpenseDate(model.defaults.expenseDate);
        setSplitMode(details?.splitMode === 'percentage' ? 'percent' : model.defaults.splitMode);
        setPayerParticipantId(model.defaults.payerParticipantId);
        setSplitParticipantIds(model.defaults.splitParticipantIds);
        setExactValues(
          Object.fromEntries(
            Object.entries(model.defaults.splitExactAmountsMinor).map(([participantId, owedAmountMinor]) => [participantId, (owedAmountMinor / 100).toFixed(2)]),
          ),
        );
        if (details?.splitMode === 'percentage') {
          setPercentValues(
            derivePercentValues(details.totalAmountMinor, model.defaults.splitParticipantIds, model.defaults.splitExactAmountsMinor),
          );
        }
      })
      .catch((caught) => {
        if (!cancelled) {
          setAlertDialog({
            title: 'Load expense',
            message: caught instanceof Error ? caught.message : 'Unable to load expense.',
            buttons: [{ label: 'OK' }],
          });
        }
      });
    return () => {
      cancelled = true;
    };
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
  const expenseDateError = expenseDate.length > 0 && !isValidExpenseDate(expenseDate) ? 'Use a valid date in YYYY-MM-DD format.' : undefined;

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

  function buildSubmittedSplitAmountsMinor(): Record<string, number> {
    const ids = splitParticipantIds;
    const totalMinor = Math.round(Number.parseFloat(amount || '0') * 100);
    if (ids.length === 0 || totalMinor <= 0) {
      return {};
    }
    if (splitMode === 'percent') {
      return allocatePercentageSplitMinor(totalMinor, ids, percentValues);
    }
    const allocations = Object.fromEntries(
      ids.map((id) => [id, Math.round(Number.parseFloat(exactValues[id] || '0') * 100)]),
    );
    const differenceMinor = totalMinor - Object.values(allocations).reduce((sum, value) => sum + value, 0);
    if (Math.abs(differenceMinor) <= 1) {
      allocations[ids[0]] += differenceMinor;
    }
    return allocations;
  }

  function openSplitConfig(): void {
    const ids = splitParticipantIds;
    const totalMinor = Math.round(Number.parseFloat(amount || '0') * 100);
    const equalMinor = ids.length > 0 ? Math.floor(totalMinor / ids.length) : 0;
    const equalRemainder = ids.length > 0 ? totalMinor - equalMinor * ids.length : 0;
    const equalPercentBps = ids.length > 0 ? Math.floor(10000 / ids.length) : 0;
    const percentRemainderBps = ids.length > 0 ? 10000 - equalPercentBps * ids.length : 0;
    const nextExact: Record<string, string> = {};
    const nextPercent: Record<string, string> = {};
    ids.forEach((id, index) => {
      nextExact[id] = exactValues[id] ?? ((equalMinor + (index < equalRemainder ? 1 : 0)) / 100).toFixed(2);
      nextPercent[id] = percentValues[id] ?? `${(equalPercentBps + (index < percentRemainderBps ? 1 : 0)) / 100}`;
    });
    setConfigMethod(splitMode === 'percent' ? 'percent' : 'exact');
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
      setSplitMode('percent');
      setPercentValues(configPercentValues);
    }
    setSplitConfigVisible(false);
  }

  function resetExpenseForm(): void {
    setDescription('');
    setAmount('');
    setCurrency('USD');
    setExpenseDate(formatLocalExpenseDate());
    setSplitMode('equal');
    setExactValues({});
    setPercentValues({});
    setEditingExpenseId(null);
    setEditingLedgerId(null);
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
    if (splitParticipantIds.length === 0) {
      setAlertDialog({ title: 'Save expense', message: 'Select at least one split participant.', buttons: [{ label: 'OK' }] });
      return;
    }
    if (!isValidExpenseDate(expenseDate)) {
      setAlertDialog({ title: 'Save expense', message: 'Enter a valid expense date in YYYY-MM-DD format.', buttons: [{ label: 'OK' }] });
      return;
    }
    const splitExactAmountsMinor = splitMode === 'equal' ? {} : buildSubmittedSplitAmountsMinor();
    const totalAmountMinor = Math.round(Number.parseFloat(amount || '0') * 100);
    if (
      splitMode !== 'equal' &&
      Object.values(splitExactAmountsMinor).reduce((sum, value) => sum + value, 0) !== totalAmountMinor
    ) {
      setAlertDialog({ title: 'Save expense', message: 'The assigned split must match the expense total.', buttons: [{ label: 'OK' }] });
      return;
    }
    try {
      setIsSaving(true);
      const result = await submitExpenseForm({
        selectedLedgerId: editingLedgerId ?? getActiveShareState().activeShareId,
        editExpenseId: editingExpenseId,
        description,
        totalAmountInput: amount,
        currency,
        expenseDate,
        payerParticipantId: payerParticipantId || participants[0]?.participantId || '',
        splitMode: splitMode === 'equal' ? 'equal' : 'exact',
        splitParticipantIds,
        splitExactAmountsMinor,
      });
      const wasEditing = editingExpenseId !== null;
      resetExpenseForm();
      router.replace(
        wasEditing
          ? { pathname: '/(tabs)/ledger', params: { expenseId: result.expenseId } }
          : { pathname: '/(tabs)', params: { refreshToken: `${Date.now()}` } },
      );
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

  const configuredAssignedAmount = calculateAssignedAmount();
  const configuredTotalMinor = Math.round(Number.parseFloat(amount || '0') * 100);
  const canConfirmSplit =
    configParticipantIds.length > 0 &&
    configuredTotalMinor > 0 &&
    Math.abs(Math.round(configuredAssignedAmount * 100) - configuredTotalMinor) <= 1;

   return (
     <View style={dynamicStyles.screen}>
       <ScreenScroll topInsetOffset={spacingTokens.lg} bottomInsetOffset={spacingTokens.xl}>
         <View style={[dynamicStyles.content, { maxWidth, alignSelf: 'center', width: '100%' }]}>
          <ScreenHeader
            title={editingExpenseId ? 'Edit Expense' : 'Add Expense'}
            subtitle={editingExpenseId ? 'Update this expense for the share' : 'Track a new expense for this share'}
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

          <FormTextInput
            label="Expense Date"
            value={expenseDate}
            onChangeText={setExpenseDate}
            placeholder="YYYY-MM-DD"
            autoCapitalize="none"
            autoCorrect={false}
            error={expenseDateError}
          />

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
            title={splitMode === 'equal' ? 'Split Equally' : splitMode === 'exact' ? 'Split by Exact Amounts' : 'Split by Percentage'}
           subtitle={perPersonLabel}
           onPress={openSplitConfig}
         />

          <Button fullWidth loading={isSaving} onPress={() => void onSaveExpensePress()}>
            {editingExpenseId ? 'Update Expense' : 'Save Expense'}
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
                          accessibilityState={{ checked: selected }}
                          accessibilityLabel={`${selected ? 'Remove' : 'Add'} ${participant.displayName} ${selected ? 'from' : 'to'} split`}
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
                  accessibilityRole="button"
                  accessibilityLabel="Close split editor"
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
                  accessibilityRole="button"
                  accessibilityLabel={configParticipantIds.length === participants.length ? 'Clear all participants' : 'Select all participants'}
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
                        accessibilityLabel={`${selected ? 'Remove' : 'Add'} ${participant.displayName} ${selected ? 'from' : 'to'} split`}
                        accessibilityState={{ checked: selected }}
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
                            accessibilityLabel={`${participant.displayName} exact amount`}
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
                          <TextInput
                            accessibilityLabel={`${participant.displayName} percentage`}
                            editable={selected}
                            style={[dynamicStyles.participantInput, selected ? null : dynamicStyles.participantInputDisabled]}
                            value={configPercentValues[participant.participantId] ?? '0'}
                            onChangeText={(value) => {
                              setConfigPercentValues((prev) => ({ ...prev, [participant.participantId]: value }));
                            }}
                            keyboardType="decimal-pad"
                            placeholderTextColor={colors.textMuted}
                          />
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

              <View style={[dynamicStyles.balanceCard, canConfirmSplit ? dynamicStyles.balanceCardSuccess : dynamicStyles.balanceCardWarning]}>
                <View style={[dynamicStyles.balanceCheck, canConfirmSplit ? dynamicStyles.balanceCheckSuccess : dynamicStyles.balanceCheckWarning]}>
                  <Ionicons
                    name={canConfirmSplit ? 'checkmark' : 'alert-circle'}
                   size={14}
                   color={colors.card}
                 />
               </View>
               <View>
                  <Text style={dynamicStyles.balanceTitle}>
                    Split is {canConfirmSplit ? 'balanced' : 'not balanced'}
                  </Text>
                  <Text style={dynamicStyles.balanceMeta}>
                    Total assigned: {formatAmountWithCurrency(configuredAssignedAmount)} / {formatAmountWithCurrency((Number.parseFloat(amount || '0') || 0))}
                 </Text>
               </View>
             </View>

              <Button fullWidth disabled={!canConfirmSplit} onPress={confirmSplitConfig}>
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
