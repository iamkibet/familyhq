import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Pressable,
  Platform,
} from 'react-native';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

interface ActionOption {
  label: string;
  icon: string;
  onPress: () => void;
  color?: string;
}

interface FloatingActionMenuProps {
  options: ActionOption[];
  isOpen: boolean;
  onClose: () => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const FAB_SIZE = 56;
const OPTION_SIZE = 56; // Bigger action buttons
const RADIUS = 80; // Distance from center button to options
const TAB_BAR_HEIGHT = Platform.OS === 'ios' ? 88 : 72;
// Center button is positioned at: X = SCREEN_WIDTH/2, Y = bottom - 28px (half outside tab bar)
const FAB_CENTER_X = SCREEN_WIDTH / 2;
const FAB_CENTER_Y = SCREEN_HEIGHT - 28; // Position from top (28px from bottom)

export function FloatingActionMenu({ options, isOpen, onClose }: FloatingActionMenuProps) {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const backdropOpacity = useRef(new Animated.Value(0)).current;
  const optionAnims = useRef(options.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    if (isOpen) {
      // Open animation
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        ...optionAnims.map((anim, index) =>
          Animated.spring(anim, {
            toValue: 1,
            useNativeDriver: true,
            delay: index * 60,
            tension: 50,
            friction: 8,
          })
        ),
      ]).start();
    } else {
      // Close animation
      Animated.parallel([
        Animated.timing(backdropOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        ...optionAnims.map((anim, index) =>
          Animated.spring(anim, {
            toValue: 0,
            useNativeDriver: true,
            delay: index * 25,
            tension: 60,
            friction: 8,
          })
        ),
      ]).start();
    }
  }, [isOpen]);

  const handleOptionPress = (onPress: () => void) => {
    onClose();
    setTimeout(() => {
      onPress();
    }, 150);
  };

  // Calculate positions for semi-circle (arc from 135° to 45°)
  const getOptionPosition = (index: number, total: number) => {
    // Start from 135° (left side) and spread to 45° (right side)
    // Forms a nice semi-circle above the button (top half)
    const startAngle = 135; // Left side (top)
    const endAngle = 45; // Right side (top)
    const angleRange = endAngle - startAngle;
    const angleStep = total > 1 ? angleRange / (total - 1) : 0;
    const angle = startAngle + angleStep * index;
    
    // Convert to radians
    const angleRad = (angle * Math.PI) / 180;
    
    // Calculate position using polar coordinates
    // In React Native, Y increases downward, so we negate Y to go upward
    const x = Math.cos(angleRad) * RADIUS;
    const y = -Math.sin(angleRad) * RADIUS; // Negate to go upward
    
    return { x, y };
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessible={false}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                opacity: backdropOpacity,
              },
            ]}
          />
        </Pressable>
      )}

      {/* Options in semi-circle */}
      {options.map((option, index) => {
        const position = getOptionPosition(index, options.length);
        const translateX = optionAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, position.x],
        });
        const translateY = optionAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, position.y],
        });
        const scale = optionAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0.3, 1],
        });
        const opacity = optionAnims[index];

        return (
          <Animated.View
            key={index}
            style={[
              styles.optionContainer,
              {
                left: FAB_CENTER_X - OPTION_SIZE / 2,
                top: FAB_CENTER_Y - OPTION_SIZE / 2,
                transform: [
                  { translateX },
                  { translateY },
                  { scale },
                ],
                opacity,
              },
            ]}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                isDark && styles.optionButtonDark,
                { backgroundColor: option.color || (isDark ? '#2C2C2C' : '#FFFFFF') },
              ]}
              onPress={() => handleOptionPress(option.onPress)}
              activeOpacity={0.7}>
              <IconSymbol
                name={option.icon}
                size={28}
                color={option.color ? '#FFFFFF' : (isDark ? '#4FC3F7' : '#0a7ea4')}
              />
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </>
  );
}

const styles = StyleSheet.create({
  optionContainer: {
    position: 'absolute',
    width: OPTION_SIZE,
    height: OPTION_SIZE,
    zIndex: 999,
  },
  optionButton: {
    width: OPTION_SIZE,
    height: OPTION_SIZE,
    borderRadius: OPTION_SIZE / 2,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    borderWidth: 0,
  },
  optionButtonDark: {
    backgroundColor: '#2C2C2C',
  },
});
