import type { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, Pressable, StyleSheet, View } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const {
    style,
    onPress,
    onLongPress,
    children,
    testID,
    accessibilityLabel,
    accessibilityState,
    accessibilityRole,
  } = props;

  const handlePress = (e: Parameters<NonNullable<typeof onPress>>[0]) => {
    if (Platform.OS === 'ios' || Platform.OS === 'android') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress?.(e);
  };

  // Expand hit area on iOS so taps register reliably in simulator and on device
  const hitSlop = Platform.OS === 'ios' ? { top: 12, bottom: 12, left: 16, right: 16 } : undefined;

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress ?? undefined}
      style={({ pressed }) => [styles.touchable, style, pressed && Platform.OS === 'ios' && styles.pressed]}
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      accessibilityRole={accessibilityRole ?? 'button'}
      hitSlop={hitSlop}
    >
      <View style={styles.content} pointerEvents="none">
        {children}
      </View>
    </Pressable>
  );
}

const MIN_TOUCH_TARGET = 48;

const styles = StyleSheet.create({
  touchable: {
    flex: 1,
    alignSelf: 'stretch',
    minHeight: MIN_TOUCH_TARGET,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});
