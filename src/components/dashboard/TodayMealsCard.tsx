import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { spacing } from '@/src/theme/spacing';
import type { MealType } from '@/src/types';
import type { EntriesByDate } from '@/src/stores/mealPlannerStore';
import { MealCard, MEAL_CARD_WIDTH } from './MealCard';

const MEAL_ORDER: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
const CARD_GAP = 12;

interface TodayMealsCardProps {
  todayStr: string;
  entriesByDate: EntriesByDate;
}

export function TodayMealsCard({ todayStr, entriesByDate }: TodayMealsCardProps) {
  const router = useRouter();

  const dayEntries = entriesByDate[todayStr] ?? {
    breakfast: null,
    lunch: null,
    dinner: null,
    snack: null,
  };

  const goToMealPlan = () => router.push('/(tabs)/meal-planner');

  return (
    <View style={styles.section}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scroll}
      >
        {MEAL_ORDER.map((mealType) => {
          const entry = dayEntries[mealType];
          return (
            <View key={mealType} style={styles.cardWrap}>
              <MealCard
                mealType={mealType}
                title={entry?.title ?? ''}
                description={entry?.description ?? undefined}
                onPress={goToMealPlan}
              />
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {},
  scroll: {
    marginHorizontal: -spacing.screenHorizontal,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenHorizontal,
    flexDirection: 'row',
    paddingRight: spacing.screenHorizontal,
  },
  cardWrap: {
    width: MEAL_CARD_WIDTH,
    marginRight: CARD_GAP,
  },
});
