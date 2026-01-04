import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { CenterTabButton } from './CenterTabButton';

interface CustomTabBarProps extends BottomTabBarProps {
  onCenterPress: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const FAB_SIZE = 56;
const FAB_RADIUS = 28;

export function CustomTabBar({ onCenterPress, ...props }: CustomTabBarProps) {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const { state, navigation, descriptors } = props;

  // Get all routes except center and budget (budget is hidden)
  const allRoutes = state.routes.filter((route) => route.name !== 'center' && route.name !== 'budget');
  
  // Split into left (first 2) and right (last 2)
  const leftTabs = allRoutes.slice(0, 2);
  const rightTabs = allRoutes.slice(2, 4);

  const handleTabPress = (route: any, isFocused: boolean) => {
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!isFocused && !event.defaultPrevented) {
      navigation.navigate(route.name);
    }
  };

  const renderTab = (route: any, index: number) => {
    const routeIndex = state.routes.findIndex((r) => r.name === route.name);
    const isFocused = state.index === routeIndex;
    const options = descriptors[route.key]?.options || {};
    const activeColor = isDark ? '#4FC3F7' : '#0a7ea4';
    const inactiveColor = isDark ? '#9BA1A6' : '#687076';

    return (
      <TouchableOpacity
        key={route.key}
        onPress={() => {
          if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          }
          handleTabPress(route, isFocused);
        }}
        style={styles.tabItem}
        activeOpacity={0.6}
        accessibilityRole="button"
        accessibilityState={isFocused ? { selected: true } : {}}
        accessibilityLabel={options.tabBarAccessibilityLabel || options.title || route.name}>
        <View style={styles.tabContent}>
          <View style={styles.iconContainer}>
            {options.tabBarIcon?.({ 
              color: isFocused ? activeColor : inactiveColor, 
              focused: isFocused,
              size: isFocused ? 32 : 28,
            })}
          </View>
          {options.title && (
            <Text 
              style={[
                styles.labelText, 
                { 
                  color: isFocused ? activeColor : inactiveColor,
                  fontWeight: isFocused ? '700' : '500',
                }
              ]}
              numberOfLines={1}>
              {options.title}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {/* Left Tabs */}
      <View style={styles.leftSection}>
        {leftTabs.map((route, index) => renderTab(route, index))}
      </View>

      {/* Center Button - Always Visible */}
      <View style={styles.centerSection}>
        <CenterTabButton
          onPress={() => {
            if (Platform.OS === 'ios') {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            onCenterPress();
          }}
        />
      </View>

      {/* Right Tabs */}
      <View style={styles.rightSection}>
        {rightTabs.map((route, index) => renderTab(route, index + 2))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0,
    elevation: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    height: Platform.OS === 'ios' ? 88 : 72,
    paddingBottom: Platform.OS === 'ios' ? 28 : 12,
    paddingTop: Platform.OS === 'ios' ? 8 : 8,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 0,
    overflow: 'visible',
  },
  containerDark: {
    backgroundColor: '#1E1E1E',
  },
  leftSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingLeft: Platform.OS === 'ios' ? 20 : 16,
    paddingRight: 60, // More space for center button
    gap: 4,
  },
  rightSection: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: Platform.OS === 'ios' ? 20 : 16,
    paddingLeft: 60, // More space for center button
    gap: 4,
  },
  centerSection: {
    position: 'absolute',
    left: '50%',
    marginLeft: -28, // Half of button width (56/2)
    top: -28, // Half outside the tab bar
    zIndex: 1000,
    width: 56,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabItem: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 6,
    paddingHorizontal: 12,
    minWidth: 68,
    maxWidth: 76,
    position: 'relative',
  },
  tabContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
  },
  iconContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
  },
  labelText: {
    fontSize: 10,
    letterSpacing: 0.2,
    marginTop: 0,
  },
});
