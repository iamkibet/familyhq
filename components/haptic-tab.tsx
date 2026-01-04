import { BottomTabBarButtonProps } from '@react-navigation/bottom-tabs';
import { PlatformPressable } from '@react-navigation/elements';
import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

export function HapticTab(props: BottomTabBarButtonProps) {
  const { style, ...restProps } = props;
  return (
    <PlatformPressable
      {...restProps}
      android_ripple={{
        color: Platform.OS === 'android' ? 'rgba(10, 126, 164, 0.1)' : undefined,
        borderless: false,
      }}
      onPressIn={(ev) => {
        // Haptic feedback for both iOS and Android
        if (Platform.OS === 'ios') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else if (Platform.OS === 'android') {
          // Android haptic feedback
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
        props.onPressIn?.(ev);
      }}
      style={
        (({ pressed }: { pressed: boolean }) => [
          style,
          pressed && Platform.OS === 'ios' && {
            opacity: 0.7,
          },
        ]) as any
      }
    />
  );
}
