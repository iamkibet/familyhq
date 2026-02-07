import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { HapticTab } from '@/components/haptic-tab';
import { colors } from '@/src/theme/colors';
import { typography } from '@/src/theme/typography';

const TAB_ICON_SIZE = 24;
const TAB_BAR_PADDING_TOP = 10;
const TAB_BAR_CONTENT_HEIGHT = 52;

function TabIcon({
  name,
  nameFocused,
  color,
  focused,
}: {
  name: string;
  nameFocused: string;
  color: string;
  focused: boolean;
}) {
  return (
    <IconSymbol
      size={TAB_ICON_SIZE}
      name={focused ? nameFocused : name}
      color={color}
    />
  );
}

export default function TabLayout() {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();
  const palette = colors[isDark ? 'dark' : 'light'];

  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'ios' ? 20 : 12);
  const tabBarHeight = TAB_BAR_PADDING_TOP + TAB_BAR_CONTENT_HEIGHT + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: true,
        tabBarActiveTintColor: palette.primary,
        tabBarInactiveTintColor: palette.muted,
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          backgroundColor: palette.surface,
          borderTopWidth: 1,
          borderTopColor: palette.border,
          height: tabBarHeight,
          paddingTop: TAB_BAR_PADDING_TOP,
          paddingBottom: bottomPadding,
          elevation: 0,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.04,
          shadowRadius: 12,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
          paddingHorizontal: 4,
          minHeight: TAB_BAR_CONTENT_HEIGHT,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarIconStyle: {
          marginBottom: 4,
        },
        tabBarLabelStyle: {
          fontSize: typography.fontSizes.xs,
          fontWeight: typography.fontWeights.medium,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="house" nameFocused="house.fill" color={color} focused={focused} />
          ),
          tabBarButton: HapticTab,
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Shopping',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="cart" nameFocused="cart.fill" color={color} focused={focused} />
          ),
          tabBarButton: HapticTab,
        }}
      />
      <Tabs.Screen
        name="meal-planner"
        options={{
          title: 'Meals',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="fork.knife" nameFocused="fork.knife.circle" color={color} focused={focused} />
          ),
          tabBarButton: HapticTab,
        }}
      />
      <Tabs.Screen name="budget" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="note.text" nameFocused="note.text" color={color} focused={focused} />
          ),
          tabBarButton: HapticTab,
        }}
      />
      <Tabs.Screen name="tasks" options={{ href: null }} />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="gearshape" nameFocused="gearshape.fill" color={color} focused={focused} />
          ),
          tabBarButton: HapticTab,
        }}
      />
    </Tabs>
  );
}