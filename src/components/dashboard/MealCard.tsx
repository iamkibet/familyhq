import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';
import { spacing } from '@/src/theme/spacing';
import type { MealType } from '@/src/types';

const MEAL_ICONS: Record<MealType, string> = {
  breakfast: 'cup.and.saucer.fill',
  lunch: 'takeoutbag.and.cup.and.straw',
  dinner: 'fork.knife.circle.fill',
  snack: 'birthday.cake.fill',
};

/** Compact card for horizontal scroll: small icon + title + optional description, no large image block */
const CARD_WIDTH = 156;

interface MealCardProps {
  mealType: MealType;
  title: string;
  description?: string | null;
  onPress?: () => void;
}

export function MealCard({ mealType, title, description, onPress }: MealCardProps) {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const palette = colors[isDark ? 'dark' : 'light'];
  const iconName = MEAL_ICONS[mealType];

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        { backgroundColor: palette.surface, borderColor: palette.border },
        pressed && styles.pressed,
      ]}
    >
      <View style={[styles.iconWrap, { backgroundColor: palette.surfaceSecondary }]}>
        <IconSymbol name={iconName as any} size={20} color={palette.primary} />
      </View>
      <Text
        style={[styles.title, { color: palette.neutral[900] }]}
        numberOfLines={2}
      >
        {title || '—'}
      </Text>
      {description ? (
        <Text
          style={[styles.description, { color: palette.neutral[700] }]}
          numberOfLines={1}
        >
          {description}
        </Text>
      ) : (
        <Text style={[styles.mealTypeLabel, { color: palette.neutral[500] }]}>
          {mealType}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    borderRadius: 12,
    padding: spacing.md,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowOffset: { width: 0, height: 1 },
        shadowRadius: 3,
        shadowOpacity: 0.05,
      },
      android: { elevation: 1 },
    }),
  },
  pressed: {
    opacity: 0.96,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.subheading,
    fontSize: 15,
    marginBottom: 2,
  },
  description: {
    ...typography.caption,
    fontSize: 12,
  },
  mealTypeLabel: {
    ...typography.captionSmall,
    textTransform: 'capitalize',
  },
});

export const MEAL_CARD_WIDTH = CARD_WIDTH;
