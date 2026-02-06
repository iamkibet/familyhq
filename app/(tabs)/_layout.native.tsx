import { Tabs } from 'expo-router';
import React from 'react';
import { Platform, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { HapticTab } from '@/components/haptic-tab';

// Material Design: 24dp icons in 48dp touch target on Android
const ANDROID_ICON_SIZE = 24;
const ANDROID_ICON_CONTAINER = 48;
const IOS_ICON_SIZE = 28;

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
  const size = Platform.OS === 'android' ? ANDROID_ICON_SIZE : IOS_ICON_SIZE;
  const icon = (
    <IconSymbol
      size={size}
      name={focused ? nameFocused : name}
      color={color}
    />
  );
  if (Platform.OS === 'android') {
    return (
      <View style={styles.androidIconContainer}>
        {icon}
      </View>
    );
  }
  return icon;
}

export default function TabLayout() {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  const bottomPadding =
    Platform.OS === 'android' ? Math.max(insets.bottom, 10) : Platform.OS === 'ios' ? 24 : 10;
  const tabBarHeight = Platform.OS === 'ios' ? 64 + bottomPadding : 56 + insets.bottom;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarActiveTintColor: isDark ? '#4FC3F7' : '#0a7ea4',
        tabBarInactiveTintColor: isDark ? '#9BA1A6' : '#687076',
        tabBarHideOnKeyboard: true,
        tabBarIconStyle: {
          marginBottom: 0,
        },
        tabBarItemStyle: {
          paddingVertical: Platform.OS === 'android' ? 8 : 10,
          paddingHorizontal: 4,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          borderTopWidth: 0,
          elevation: Platform.OS === 'android' ? 8 : 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: Platform.OS === 'android' ? -2 : -3 },
          shadowOpacity: Platform.OS === 'android' ? 0.08 : 0.12,
          shadowRadius: Platform.OS === 'android' ? 8 : 20,
          height: tabBarHeight,
          paddingBottom: bottomPadding,
          paddingTop: Platform.OS === 'android' ? 8 : 10,
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
          title: 'Meal Planner',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon name="fork.knife" nameFocused="fork.knife.circle" color={color} focused={focused} />
          ),
          tabBarButton: HapticTab,
        }}
      />

      {/* Hidden from tab bar */}
      <Tabs.Screen name="budget" options={{ href: null }} />
      <Tabs.Screen name="calendar" options={{ href: null }} />
      <Tabs.Screen name="notes" options={{ href: null }} />

      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <TabIcon
              name="list.bullet.rectangle"
              nameFocused="list.bullet.rectangle.fill"
              color={color}
              focused={focused}
            />
          ),
          tabBarButton: HapticTab,
        }}
      />
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

const styles = StyleSheet.create({
  androidIconContainer: {
    width: ANDROID_ICON_CONTAINER,
    height: ANDROID_ICON_CONTAINER,
    justifyContent: 'center',
    alignItems: 'center',
  },
});


