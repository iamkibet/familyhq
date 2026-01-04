import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

export default function TabLayout() {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? '#4FC3F7' : '#0a7ea4',
        tabBarInactiveTintColor: isDark ? '#9BA1A6' : '#687076',
        tabBarHideOnKeyboard: true,
        tabBarAllowFontScaling: false,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          marginTop: 4,
          marginBottom: Platform.OS === 'ios' ? 0 : 4,
          letterSpacing: 0.3,
        },
        tabBarIconStyle: {
          marginTop: 0,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        tabBarStyle: {
          backgroundColor: isDark ? '#1E1E1E' : '#FFFFFF',
          borderTopWidth: 0,
          elevation: 20,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -3 },
          shadowOpacity: 0.12,
          shadowRadius: 20,
          height: Platform.OS === 'ios' ? 90 : 72,
          paddingBottom: Platform.OS === 'ios' ? 30 : 10,
          paddingTop: 10,
        },
      }}>
      {/* Left Tabs - First 2 */}
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={focused ? 32 : 28} 
              name={focused ? "house.fill" : "house"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="shopping"
        options={{
          title: 'Shopping',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={focused ? 32 : 28} 
              name={focused ? "cart.fill" : "cart"} 
              color={color} 
            />
          ),
        }}
      />
      {/* Budget - Hidden from tab bar */}
      <Tabs.Screen
        name="budget"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      {/* Calendar - Hidden from tab bar */}
      <Tabs.Screen
        name="calendar"
        options={{
          href: null, // Hide from tab bar
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={focused ? 32 : 28} 
              name={focused ? "list.bullet.rectangle.fill" : "list.bullet.rectangle"} 
              color={color} 
            />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <IconSymbol 
              size={focused ? 32 : 28} 
              name={focused ? "gearshape.fill" : "gearshape"} 
              color={color} 
            />
          ),
        }}
      />
    </Tabs>
  );
}
