import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuthStore } from '@/src/stores/authStore';
import { useMealPlannerStore } from '@/src/stores/mealPlannerStore';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { formatDateForInput } from '@/src/utils';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { DateStrip } from './DateStrip';
import { DayPlannedMeals } from './DayPlannedMeals';
import { AddMealModal } from './AddMealModal';
import { PrintMealPlanButton } from './PrintMealPlanButton';
import { MealPlanEntry, MealType } from '@/src/types';

/**
 * Meal Planner — Daily Meal Plan view.
 * World-class UI: date strip + planned meals per day (Breakfast, Lunch, Dinner, Snack).
 */
export function MealPlannerScreen() {
  const { family, userData } = useAuthStore();
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const [weekAnchor, setWeekAnchor] = useState(() => new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => formatDateForInput(new Date()));
  const [modalVisible, setModalVisible] = useState(false);
  const [editingEntry, setEditingEntry] = useState<MealPlanEntry | null>(null);
  const [cellDate, setCellDate] = useState<string>('');
  const [cellMealType, setCellMealType] = useState<MealType>('lunch');

  const {
    entries,
    weekStart,
    weekEnd,
    loading,
    error,
    loadWeek,
    getEntriesByDate,
    addEntry,
    updateEntry,
    deleteEntry,
    clearEntries,
  } = useMealPlannerStore();

  useEffect(() => {
    if (family?.id) {
      loadWeek(family.id, weekAnchor);
    }
    return () => clearEntries();
  }, [family?.id, weekAnchor, loadWeek, clearEntries]);

  const weekDates = useMemo(() => {
    if (!weekStart || !weekEnd) return [];
    const dates: string[] = [];
    const start = new Date(weekStart + 'T12:00:00');
    const end = new Date(weekEnd + 'T12:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      dates.push(`${y}-${m}-${day}`);
    }
    return dates;
  }, [weekStart, weekEnd]);

  const entriesByDate = useMemo(() => {
    if (!weekStart || !weekEnd) return {};
    return getEntriesByDate(weekStart, weekEnd);
  }, [weekStart, weekEnd, entries, getEntriesByDate]);

  const todayStr = formatDateForInput(new Date());

  // Keep selectedDate in sync with current week (e.g. after week nav)
  useEffect(() => {
    if (weekDates.length === 0) return;
    const inRange = weekDates.includes(selectedDate);
    if (!inRange) {
      setSelectedDate(todayStr >= weekStart! && todayStr <= weekEnd! ? todayStr : weekDates[0]);
    }
  }, [weekDates, weekStart, weekEnd, todayStr, selectedDate]);

  const isViewingCurrentWeek =
    !!weekStart &&
    !!weekEnd &&
    todayStr >= weekStart &&
    todayStr <= weekEnd;

  const goPrevWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() - 7);
    setWeekAnchor(d);
  };

  const goNextWeek = () => {
    const d = new Date(weekAnchor);
    d.setDate(d.getDate() + 7);
    setWeekAnchor(d);
  };

  const goToToday = () => {
    setWeekAnchor(new Date());
  };

  const openAdd = (date: string, mealType: MealType) => {
    setEditingEntry(null);
    setCellDate(date);
    setCellMealType(mealType);
    setModalVisible(true);
  };

  const openEdit = (date: string, mealType: MealType, entryId: string | null) => {
    if (!entryId) {
      openAdd(date, mealType);
      return;
    }
    const entry = entries.find((e) => e && e.id === entryId);
    if (entry) {
      setEditingEntry(entry);
      setCellDate(date);
      setCellMealType(mealType);
      setModalVisible(true);
    }
  };

  const selectedDateLabel = useMemo(() => {
    if (!selectedDate) return '';
    const d = new Date(selectedDate + 'T12:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short', day: 'numeric', month: 'short' });
  }, [selectedDate]);

  const handleSave = async (data: {
    date?: string;
    mealType?: MealType;
    title: string;
    description?: string;
    ingredients?: string[];
  }) => {
    if (!family?.id || !userData?.id) {
      Alert.alert('Error', 'Family not found');
      return;
    }
    const resolvedDate = (data.date && data.date.trim()) || cellDate || (weekDates[0] ?? '');
    const resolvedMealType = data.mealType ?? cellMealType ?? 'lunch';
    const resolvedTitle = (data.title && data.title.trim()) || '';
    if (!resolvedTitle) {
      Alert.alert('Missing title', 'Please enter a meal title.');
      return;
    }
    if (!resolvedDate) {
      Alert.alert('Missing date', 'Please select a date for this meal.');
      return;
    }
    try {
      const payload = {
        date: resolvedDate,
        mealType: resolvedMealType,
        title: resolvedTitle,
        ...(data.description != null && data.description !== '' && { description: data.description }),
        ...(Array.isArray(data.ingredients) && data.ingredients.length > 0 && { ingredients: data.ingredients }),
      };
      if (editingEntry) {
        await updateEntry(editingEntry.id, payload);
      } else {
        await addEntry(family.id, {
          ...payload,
          createdBy: userData.id,
        });
      }
      setModalVisible(false);
      setEditingEntry(null);
    } catch (e) {
      Alert.alert('Error', e instanceof Error ? e.message : 'Failed to save meal');
      throw e;
    }
  };

  const handleModalDelete = (entryId: string) => {
    setModalVisible(false);
    setEditingEntry(null);
    deleteEntry(entryId).catch(() => Alert.alert('Error', 'Could not delete meal'));
  };

  const weekLabel = weekStart && weekEnd
    ? (() => {
        const start = new Date(weekStart + 'T12:00:00');
        const end = new Date(weekEnd + 'T12:00:00');
        const sameMonth = start.getMonth() === end.getMonth();
        const sameYear = start.getFullYear() === end.getFullYear();
        if (sameMonth && sameYear) {
          return start.toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) +
            ' – ' +
            end.toLocaleDateString('en-US', { day: 'numeric', year: 'numeric' });
        }
        return start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
          ' – ' +
          end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      })()
    : '';

  const textColor = isDark ? '#E6E1E5' : '#1C1B1F';
  const muted = isDark ? '#9BA1A6' : '#64748B';
  const primary = isDark ? '#4FC3F7' : '#0D47A1';
  const topPad = Math.max(insets.top, 12);

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Header: clean, professional */}
      <View style={[styles.header, isDark && styles.headerDark, { paddingTop: topPad + 12 }]}>
        <View style={styles.titleRow}>
          <Text style={[styles.screenTitle, { color: textColor }]}>Daily Meal Plan</Text>
          {family?.name && weekStart && weekEnd && weekDates.length > 0 && (
            <PrintMealPlanButton
              familyName={family.name}
              weekStart={weekStart}
              weekEnd={weekEnd}
              weekDates={weekDates}
              entriesByDate={entriesByDate}
              variant="secondary"
            />
          )}
        </View>

        {weekStart && weekEnd && (
          <View style={styles.weekRow}>
            {isViewingCurrentWeek ? (
              <View style={[styles.thisWeekPill, isDark ? styles.thisWeekPillDark : styles.thisWeekPillLight]}>
                <Text style={[styles.thisWeekText, isDark ? styles.thisWeekTextDark : styles.thisWeekTextLight]}>
                  This week
                </Text>
              </View>
            ) : (
              <TouchableOpacity onPress={goToToday} style={styles.goToTodayBtn} activeOpacity={0.7}>
                <IconSymbol name="calendar" size={16} color={primary} />
                <Text style={[styles.goToTodayText, { color: primary }]}>Go to today</Text>
              </TouchableOpacity>
            )}
            <Text style={[styles.weekRange, { color: muted }]}>{weekLabel}</Text>
          </View>
        )}
      </View>

      {error ? (
        <View style={[styles.errorWrap, isDark && styles.errorWrapDark]}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      {loading && entries.length === 0 ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color={primary} />
          <Text style={[styles.loadingText, { color: muted }]}>Loading your week…</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <DateStrip
            weekDates={weekDates}
            selectedDate={selectedDate}
            onSelectDate={setSelectedDate}
          />
          <DayPlannedMeals
            selectedDate={selectedDate}
            selectedDateLabel={selectedDateLabel}
            entriesByDate={entriesByDate}
            onAdd={(mealType) => openAdd(selectedDate, mealType)}
            onEdit={(_, entry) => {
              setEditingEntry(entry);
              setCellDate(entry.date);
              setCellMealType(entry.mealType);
              setModalVisible(true);
            }}
          />
        </ScrollView>
      )}

      <AddMealModal
        visible={modalVisible}
        editingEntry={editingEntry}
        defaultDate={cellDate}
        defaultMealType={cellMealType}
        onClose={() => {
          setModalVisible(false);
          setEditingEntry(null);
        }}
        onSave={handleSave}
        onDelete={editingEntry ? handleModalDelete : undefined}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  containerDark: {
    backgroundColor: '#0D1117',
  },
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.08)',
  },
  headerDark: {
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
    gap: 12,
  },
  screenTitle: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.35,
  },
  weekRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  thisWeekPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  thisWeekPillLight: {
    backgroundColor: 'rgba(13,71,161,0.12)',
  },
  thisWeekPillDark: {
    backgroundColor: 'rgba(79,195,247,0.18)',
  },
  thisWeekText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  thisWeekTextLight: {
    color: '#0D47A1',
  },
  thisWeekTextDark: {
    color: '#4FC3F7',
  },
  goToTodayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 2,
  },
  goToTodayText: {
    fontSize: 14,
    fontWeight: '600',
  },
  weekRange: {
    fontSize: 14,
    fontWeight: '500',
  },
  errorWrap: {
    padding: 14,
    backgroundColor: 'rgba(229,57,53,0.08)',
    marginHorizontal: 24,
    marginTop: 12,
    borderRadius: 12,
  },
  errorWrapDark: {
    backgroundColor: 'rgba(229,57,53,0.15)',
  },
  errorText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '500',
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 15,
    fontWeight: '500',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },
});
