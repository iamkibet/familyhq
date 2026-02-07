// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>['name']>;
type IconSymbolName = keyof typeof MAPPING | string;

/**
 * Add your SF Symbols to Material Icons mappings here.
 * - see Material Icons in the [Icons Directory](https://icons.expo.fyi).
 * - see SF Symbols in the [SF Symbols](https://developer.apple.com/sf-symbols/) app.
 */
const MAPPING: IconMapping = {
  // Navigation
  'house.fill': 'home',
  'house': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.left': 'chevron-left',
  'chevron.right': 'chevron-right',
  'chevron.down': 'keyboard-arrow-down',
  'chevron.up': 'keyboard-arrow-up',
  // Shopping
  'cart.fill': 'shopping-cart',
  'cart': 'shopping-cart',
  // Budget
  'dollarsign.circle.fill': 'attach-money',
  'dollarsign.circle': 'attach-money',
  // Tasks
  'checkmark.circle.fill': 'check-circle',
  'checkmark.circle': 'check-circle-outline',
  'checkmark.square.fill': 'check-box',
  'checkmark.square': 'check-box-outline-blank',
  'circle': 'radio-button-unchecked',
  'circle.fill': 'radio-button-checked',
  'list.bullet.rectangle.fill': 'assignment',
  'list.bullet.rectangle': 'assignment',
  // Calendar
  'calendar': 'calendar-today',
  'calendar.badge.plus': 'event-available',
  // Shopping
  'cart.badge.plus': 'add-shopping-cart',
  // Settings/Profile
  'person.circle.fill': 'account-circle',
  'person.circle': 'account-circle-outline',
  'person.fill': 'person',
  'person.2.fill': 'people',
  'person.2.badge.plus.fill': 'person-add',
  // Actions
  'plus.circle.fill': 'add-circle',
  'plus.circle': 'add-circle-outline',
  // Theme
  'sun.max.fill': 'wb-sunny',
  'moon.fill': 'dark-mode',
  'gearshape.fill': 'settings',
  'gearshape': 'settings',
  // Notifications
  'bell.fill': 'notifications',
  'bell.badge.fill': 'notifications-active',
  // Privacy/Security
  'lock.fill': 'lock',
  'key.fill': 'vpn-key',
  // Camera
  'camera.fill': 'camera-alt',
  'camera': 'camera-alt',
  // Info
  'info.circle.fill': 'info',
  // Documents
  'doc.text.fill': 'description',
  'text.alignleft': 'format-align-left',
  'hand.raised.fill': 'privacy-tip',
  // Notes
  'note.text': 'note',
  // Actions
  'arrow.right.square.fill': 'logout',
  'xmark.circle.fill': 'cancel',
  'xmark': 'close',
  'trash.fill': 'delete',
  'trash': 'delete-outline',
  'pencil': 'edit',
  'pencil.fill': 'edit',
  'ellipsis': 'more-horiz',
  'ellipsis.circle': 'more-vert',
  'ellipsis.circle.fill': 'more-vert',
  'checklist': 'checklist-rtl',
  'checklist.checked': 'checklist-rtl',
  'plus': 'add',
  'doc.on.doc.fill': 'content-copy',
  // Charts/Analytics
  'chart.bar.fill': 'bar-chart',
  // Alerts
  'exclamationmark.triangle.fill': 'warning',
  // Meal planner
  'fork.knife': 'restaurant',
  'fork.knife.circle': 'restaurant',
  'cup.and.saucer': 'free-breakfast',
  'cup.and.saucer.fill': 'free-breakfast',
  'bowl.fill': 'lunch-dining',
  'takeoutbag.and.cup.and.straw': 'lunch-dining',
  'fork.knife.circle.fill': 'dinner-dining',
  'birthday.cake.fill': 'cake',
  // Filter
  'line.3.horizontal.decrease.circle': 'filter-list',
  'line.3.horizontal.decrease.circle.fill': 'filter-list',
  'slider.horizontal.3': 'tune',
  // Quote
  'quote.opening': 'format-quote',
  'quote.closing': 'format-quote',
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 * This ensures a consistent look across platforms, and optimal resource usage.
 * Icon `name`s are based on SF Symbols and require manual mapping to Material Icons.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name];
  if (!iconName) {
    console.warn(`Icon "${name}" not found in mapping. Using "help" as fallback.`);
    return <MaterialIcons color={color} size={size} name="help" style={style} />;
  }
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}
