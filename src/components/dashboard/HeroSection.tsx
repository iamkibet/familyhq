import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { colors } from '@/src/theme/colors';
import { radius } from '@/src/theme/radius';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';

const AnimatedView = Animated.createAnimatedComponent(View);

const VALUE_PROP = 'Plan meals, track expenses, and stay in sync.';

interface HeroSectionProps {
  familyName?: string | null;
  onNotificationPress?: () => void;
  notificationCount?: number;
}

export function HeroSection({
  familyName,
  onNotificationPress,
  notificationCount = 0,
}: HeroSectionProps) {
  const isDark = useThemeScheme() === 'dark';
  const palette = colors[isDark ? 'dark' : 'light'];
  const hasNotifications = notificationCount > 0;

  const headline = familyName?.trim()
    ? `${familyName.trim()}'s Family Hub`
    : 'Your Family Hub';

  const greeting = getGreeting();

  const borderColor = isDark
    ? `${palette.primary}12`
    : `${palette.primary}14`;

  return (
    <AnimatedView
      entering={FadeInDown.duration(600).delay(80)}
      style={[styles.container, { borderColor }]}
    >
      <LinearGradient
        colors={
          isDark
            ? [palette.surface, palette.surfaceSecondary]
            : [palette.surface, palette.surfaceSecondary]
        }
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <View style={styles.titleBlock}>
              <Text style={[styles.greeting, { color: palette.muted }]} numberOfLines={1}>
                {greeting}
              </Text>
              <Text
                style={[styles.headline, { color: palette.foreground }]}
                numberOfLines={1}
              >
                {headline}
              </Text>
            </View>
            {onNotificationPress && (
              <TouchableOpacity
                onPress={onNotificationPress}
                style={[styles.bellBtn, { backgroundColor: palette.surfaceSecondary }]}
                activeOpacity={0.7}
              >
                <IconSymbol name="bell.fill" size={22} color={palette.foreground} />
                {hasNotifications && (
                  <View style={[styles.badge, { backgroundColor: palette.error }]}>
                    <Text style={styles.badgeText}>
                      {notificationCount > 99 ? '99+' : notificationCount}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.valueRow}>
            <View style={[styles.iconPill, { backgroundColor: `${palette.primary}18` }]}>
              <IconSymbol name="house.fill" size={24} color={palette.primary} />
            </View>
            <Text
              style={[styles.valueProp, { color: palette.muted }]}
              numberOfLines={2}
            >
              {VALUE_PROP}
            </Text>
          </View>
        </View>
      </LinearGradient>
    </AnimatedView>
  );
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: radius.xl,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 12,
    elevation: 2,
  },
  gradient: {
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  content: {
    padding: spacing.lg,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  titleBlock: {
    flex: 1,
    minWidth: 0,
    marginRight: spacing.md,
  },
  greeting: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    letterSpacing: 0.4,
    marginBottom: 2,
    textTransform: 'capitalize',
  },
  headline: {
    ...typography.heading,
    fontSize: 24,
    lineHeight: 30,
    letterSpacing: -0.5,
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueProp: {
    flex: 1,
    minWidth: 0,
    fontSize: typography.fontSizes.sm,
    lineHeight: typography.lineHeights.sm + 2,
    fontWeight: typography.fontWeights.regular,
  },
});
