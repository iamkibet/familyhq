import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { MealPlanEntry, MealType } from '@/src/types';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { MEAL_TYPE_LABELS } from './MealCell';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: 'cup.and.saucer.fill',
  lunch: 'takeoutbag.and.cup.and.straw',
  dinner: 'fork.knife.circle.fill',
  snack: 'birthday.cake.fill',
};

interface DayPlannedMealsProps {
  selectedDate: string;
  selectedDateLabel: string;
  entriesByDate: Record<string, Record<MealType, MealPlanEntry | null>>;
  onAdd: (mealType: MealType) => void;
  onEdit: (mealType: MealType, entry: MealPlanEntry) => void;
}

export function DayPlannedMeals({
  selectedDate,
  selectedDateLabel,
  entriesByDate,
  onAdd,
  onEdit,
}: DayPlannedMealsProps) {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const primary = isDark ? '#4FC3F7' : '#0D47A1';
  const textColor = isDark ? '#E6E1E5' : '#1C1B1F';
  const muted = isDark ? '#9BA1A6' : '#64748B';
  const cardBg = isDark ? 'rgba(255,255,255,0.07)' : '#F8FAFC';
  const sectionBg = isDark ? 'rgba(255,255,255,0.04)' : '#FFFFFF';

  const dayEntries = entriesByDate[selectedDate] ?? {
    breakfast: null,
    lunch: null,
    dinner: null,
    snack: null,
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: textColor }]}>Planned Meals</Text>
        <Text style={[styles.sectionSubtitle, { color: muted }]}>{selectedDateLabel}</Text>
      </View>

      {MEAL_ORDER.map((mealType) => {
        const entry = dayEntries[mealType];
        const iconName = MEAL_ICONS[mealType];
        const label = MEAL_TYPE_LABELS[mealType];

        return (
          <View key={mealType} style={[styles.mealSection, { backgroundColor: sectionBg }]}>
            <View style={styles.mealSectionHeader}>
              <View style={[styles.mealIconWrap, { backgroundColor: isDark ? 'rgba(79,195,247,0.15)' : 'rgba(13,71,161,0.1)' }]}>
                <IconSymbol name={iconName as any} size={22} color={primary} />
              </View>
              <Text style={[styles.mealLabel, { color: textColor }]}>{label}</Text>
              {!entry && (
                <Pressable
                  onPress={() => onAdd(mealType)}
                  style={({ pressed }) => [
                    styles.addCircle,
                    { backgroundColor: primary },
                    pressed && styles.addCirclePressed,
                  ]}
                  accessibilityLabel={`Add ${label}`}
                >
                  <IconSymbol name="plus" size={20} color="#FFFFFF" />
                </Pressable>
              )}
            </View>
            {entry ? (
              <Pressable
                onPress={() => onEdit(mealType, entry)}
                style={({ pressed }) => [
                  styles.entryCard,
                  { backgroundColor: cardBg, borderColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' },
                  pressed && styles.entryCardPressed,
                ]}
                accessibilityRole="button"
                accessibilityLabel={`${entry.title}. Tap to edit or delete`}
              >
                <View style={styles.entryTextWrap}>
                  <Text style={[styles.entryTitle, { color: textColor }]} numberOfLines={2}>
                    {entry.title}
                  </Text>
                  {entry.description && entry.description.trim() ? (
                    <Text style={[styles.entryDescription, { color: muted }]} numberOfLines={2}>
                      {entry.description.trim()}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ) : (
              <Pressable
                onPress={() => onAdd(mealType)}
                style={({ pressed }) => [
                  styles.emptyCard,
                  isDark ? styles.emptyCardDark : styles.emptyCardLight,
                  pressed && styles.emptyCardPressed,
                ]}
              >
                <View style={[styles.emptyAddRing, { borderColor: primary }]}>
                  <IconSymbol name="plus" size={20} color={primary} />
                </View>
                <Text style={[styles.emptyText, { color: muted }]}>Add meal</Text>
              </Pressable>
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 20,
  },
  sectionHeader: {
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.35,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    letterSpacing: 0.1,
  },
  mealSection: {
    borderRadius: 14,
    padding: 16,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        shadowOpacity: 0.05,
      },
      android: { elevation: 1 },
    }),
  },
  mealSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
    gap: 12,
  },
  mealIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  addCircle: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCirclePressed: {
    opacity: 0.9,
  },
  entryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 16,
    paddingLeft: 18,
    paddingRight: 18,
  },
  entryCardPressed: {
    opacity: 0.96,
  },
  entryTextWrap: {
    flex: 1,
    minWidth: 0,
  },
  entryTitle: {
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: -0.25,
    lineHeight: 22,
  },
  entryDescription: {
    fontSize: 14,
    marginTop: 4,
    lineHeight: 20,
  },
  emptyCard: {
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderStyle: 'dashed',
  },
  emptyCardLight: {
    borderColor: 'rgba(0,0,0,0.08)',
    backgroundColor: 'rgba(0,0,0,0.02)',
  },
  emptyCardDark: {
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  emptyCardPressed: {
    opacity: 0.92,
  },
  emptyAddRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
