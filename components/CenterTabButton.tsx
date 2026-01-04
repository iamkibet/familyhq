import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import * as Haptics from 'expo-haptics';
import React from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';

interface CenterTabButtonProps {
  onPress?: () => void;
}

export function CenterTabButton({ onPress }: CenterTabButtonProps) {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';

  const handlePress = () => {
    if (Platform.OS === 'ios') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    onPress?.();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[styles.button, isDark && styles.buttonDark]}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel="Add"
      testID="center-tab-button">
      <IconSymbol name="plus" size={28} color="#FFFFFF" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    elevation: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    zIndex: 10,
  },
  buttonDark: {
    backgroundColor: '#4FC3F7',
    borderColor: '#1E1E1E',
  },
});

