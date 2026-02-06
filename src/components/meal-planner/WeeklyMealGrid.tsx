import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { MealType } from '@/src/types';
import type { EntriesByDate } from '@/src/stores/mealPlannerStore';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { MealCell, MEAL_TYPE_LABELS } from './MealCell';
import { formatDateForInput } from '@/src/utils';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function formatDayHeader(dateStr: string): { dayName: string; dayNum: string; month: string } {
  const d = new Date(dateStr + 'T12:00:00');
  const dayIndex = d.getDay() === 0 ? 6 : d.getDay() - 1;
  return {
    dayName: DAY_NAMES[dayIndex],
    dayNum: d.getDate().toString(),
    month: d.toLocaleDateString('en-US', { month: 'short' }),
  };
}

interface WeeklyMealGridProps {
  weekDates: string[];
  entriesByDate: EntriesByDate;
  onCellPress: (date: string, mealType: MealType, entryId: string | null) => void;
  onCellLongPress: (date: string, mealType: MealType, entryId: string | null) => void;
}

export function WeeklyMealGrid({
  weekDates,
  entriesByDate,
  onCellPress,
  onCellLongPress,
}: WeeklyMealGridProps) {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const todayStr = formatDateForInput(new Date());

  return (
    <ScrollView
      horizontal={Platform.OS !== 'web'}
      showsHorizontalScrollIndicator={Platform.OS !== 'web'}
      contentContainerStyle={styles.scrollContent}
      style={styles.scroll}
    >
      <View style={styles.grid}>
        {/* Header row: empty corner + day columns with date sync */}
        <View style={[styles.headerRow, isDark && styles.headerRowDark]}>
          <View style={[styles.cornerCell, isDark && styles.cornerCellDark]} />
          {weekDates.map((dateStr) => {
            const { dayName, dayNum, month } = formatDayHeader(dateStr);
            const isToday = dateStr === todayStr;
            return (
              <View
                key={dateStr}
                style={[
                  styles.headerCell,
                  isDark && styles.headerCellDark,
                  isToday && (isDark ? styles.headerCellTodayDark : styles.headerCellTodayLight),
                ]}
              >
                {isToday && (
                  <View style={[styles.todayBadge, isDark ? styles.todayBadgeDark : styles.todayBadgeLight]}>
                    <Text style={[styles.todayBadgeText, isDark ? styles.todayBadgeTextDark : styles.todayBadgeTextLight]}>
                      Today
                    </Text>
                  </View>
                )}
                <Text style={[styles.headerDay, isDark && styles.headerDayDark]}>
                  {dayName}
                </Text>
                <Text style={[styles.headerDate, isDark && styles.headerDateDark]}>
                  {dayNum} {month}
                </Text>
              </View>
            );
          })}
        </View>
        {/* Data rows: meal type label + cells */}
        {MEAL_ORDER.map((mealType) => (
          <View key={mealType} style={styles.dataRow}>
            <View style={[styles.rowHeader, isDark && styles.rowHeaderDark]}>
              <Text style={[styles.rowHeaderText, isDark && styles.rowHeaderTextDark]} numberOfLines={1}>
                {MEAL_TYPE_LABELS[mealType]}
              </Text>
            </View>
            {weekDates.map((dateStr) => {
              const slot = entriesByDate[dateStr]?.[mealType] ?? null;
              const isToday = dateStr === todayStr;
              return (
                <View key={`${dateStr}-${mealType}`} style={styles.cellWrapper}>
                  <MealCell
                    date={dateStr}
                    mealType={mealType}
                    entry={slot}
                    isToday={isToday}
                    onPress={() => onCellPress(dateStr, mealType, slot?.id ?? null)}
                    onLongPress={() => onCellLongPress(dateStr, mealType, slot?.id ?? null)}
                  />
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 32,
    paddingHorizontal: 4,
    minWidth: '100%',
  },
  grid: {
    minWidth: 640,
  },
  headerRow: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  headerRowDark: {},
  cornerCell: {
    width: 80,
    marginRight: 10,
    backgroundColor: 'transparent',
  },
  cornerCellDark: {},
  headerCell: {
    flex: 1,
    minWidth: 88,
    marginRight: 10,
    paddingVertical: 12,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.02)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.04)',
  },
  headerCellDark: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.06)',
  },
  headerCellTodayLight: {
    backgroundColor: 'rgba(10,126,164,0.08)',
    borderColor: 'rgba(10,126,164,0.2)',
  },
  headerCellTodayDark: {
    backgroundColor: 'rgba(79,195,247,0.12)',
    borderColor: 'rgba(79,195,247,0.25)',
  },
  todayBadge: {
    position: 'absolute',
    top: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  todayBadgeLight: {
    backgroundColor: '#0a7ea4',
  },
  todayBadgeDark: {
    backgroundColor: '#4FC3F7',
  },
  todayBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  todayBadgeTextLight: {
    color: '#FFFFFF',
  },
  todayBadgeTextDark: {
    color: '#0B1220',
  },
  headerDay: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1C1B1F',
    letterSpacing: -0.2,
  },
  headerDayDark: {
    color: '#E6E1E5',
  },
  headerDate: {
    fontSize: 11,
    color: '#687076',
    marginTop: 2,
    fontWeight: '500',
  },
  headerDateDark: {
    color: '#9BA1A6',
  },
  dataRow: {
    flexDirection: 'row',
    alignItems: 'stretch',
    marginBottom: 10,
  },
  rowHeader: {
    width: 80,
    marginRight: 10,
    justifyContent: 'center',
    paddingVertical: 4,
  },
  rowHeaderDark: {},
  rowHeaderText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#687076',
    letterSpacing: -0.1,
  },
  rowHeaderTextDark: {
    color: '#9BA1A6',
  },
  cellWrapper: {
    flex: 1,
    minWidth: 88,
    marginRight: 10,
  },
});
