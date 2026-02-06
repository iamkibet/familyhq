import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { MealPlanEntry, MealType } from '@/src/types';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

export const MEAL_TYPE_LABELS: Record<MealType, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  dinner: 'Dinner',
  snack: 'Snack',
};

interface MealCellProps {
  date: string;
  mealType: MealType;
  entry: MealPlanEntry | null;
  isToday: boolean;
  onPress: () => void;
  onLongPress: () => void;
}

export function MealCell({ mealType, entry, isToday, onPress, onLongPress }: MealCellProps) {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';

  const cellContent = entry ? (
    <Text style={[styles.title, isDark && styles.titleDark]} numberOfLines={2}>
      {entry.title}
    </Text>
  ) : (
    <View style={styles.emptyWrap}>
      <View style={[styles.emptyIconRing, isDark && styles.emptyIconRingDark]}>
        <IconSymbol name="plus" size={16} color={isDark ? '#9BA1A6' : '#687076'} />
      </View>
      <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>Add</Text>
    </View>
  );

  const isFilled = !!entry;
  const primary = isDark ? '#4FC3F7' : '#0a7ea4';

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [
        styles.cell,
        isFilled && [styles.cellFilled, isDark ? styles.cellFilledDark : styles.cellFilledLight],
        !isFilled && (isDark ? styles.cellEmptyDark : styles.cellEmptyLight),
        isToday && !isFilled && (isDark ? styles.cellTodayDark : styles.cellTodayLight),
        isToday && isFilled && styles.cellTodayFilled,
        pressed && styles.cellPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={entry ? `Edit ${entry.title}` : `Add meal for ${MEAL_TYPE_LABELS[mealType]}`}
    >
      {isToday && <View style={[styles.todayBar, { backgroundColor: primary }]} />}
      <View style={styles.content}>{cellContent}</View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  cell: {
    minHeight: 64,
    padding: 12,
    borderRadius: 12,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        shadowOpacity: 0.06,
      },
      android: {
        elevation: 1,
      },
    }),
  },
  cellPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.99 }],
  },
  cellFilled: {
    borderWidth: 0,
  },
  cellFilledLight: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
  },
  cellFilledDark: {
    backgroundColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
  },
  cellEmptyLight: {
    backgroundColor: 'rgba(10,126,164,0.04)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(10,126,164,0.2)',
  },
  cellEmptyDark: {
    backgroundColor: 'rgba(79,195,247,0.06)',
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: 'rgba(79,195,247,0.25)',
  },
  cellTodayLight: {
    backgroundColor: 'rgba(10,126,164,0.07)',
  },
  cellTodayDark: {
    backgroundColor: 'rgba(79,195,247,0.08)',
  },
  cellTodayFilled: {
    borderLeftWidth: 3,
    borderLeftColor: 'transparent', // overridden by todayBar
  },
  todayBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  content: {
    minHeight: 40,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1C1B1F',
    letterSpacing: -0.2,
  },
  titleDark: {
    color: '#E6E1E5',
  },
  emptyWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  emptyIconRing: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconRingDark: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  emptyText: {
    fontSize: 13,
    color: '#687076',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  emptyTextDark: {
    color: '#9BA1A6',
  },
});
