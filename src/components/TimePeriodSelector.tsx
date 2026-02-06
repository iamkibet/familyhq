import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { TimePeriod, getTimePeriodLabel } from '@/src/utils';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';
import { IconSymbol } from '@/components/ui/icon-symbol';

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

const PERIODS: TimePeriod[] = ['thisWeek', 'thisMonth', 'lastMonth', 'allTime'];

export function TimePeriodSelector({ selectedPeriod, onPeriodChange }: TimePeriodSelectorProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const palette = colors[isDark ? 'dark' : 'light'];

  const handleSelect = (period: TimePeriod) => {
    onPeriodChange(period);
    setModalVisible(false);
  };

  return (
    <>
      <TouchableOpacity
        style={[styles.trigger, { backgroundColor: palette.surfaceSecondary }]}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <IconSymbol
          name="line.3.horizontal.decrease.circle"
          size={24}
          color={palette.primary}
        />
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setModalVisible(false)}
      >
        <Pressable
          style={styles.overlay}
          onPress={() => setModalVisible(false)}
        >
          <Pressable
            style={[styles.menu, { backgroundColor: palette.surface }]}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={[styles.menuHeader, { borderBottomColor: palette.border }]}>
              <Text style={[styles.menuTitle, { color: palette.foreground }]}>Time period</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={12}
                style={styles.menuClose}
              >
                <IconSymbol name="xmark.circle.fill" size={24} color={palette.muted} />
              </TouchableOpacity>
            </View>
            {PERIODS.map((period) => {
              const isSelected = period === selectedPeriod;
              return (
                <TouchableOpacity
                  key={period}
                  style={[
                    styles.option,
                    isSelected && { backgroundColor: palette.surfaceSecondary },
                  ]}
                  onPress={() => handleSelect(period)}
                  activeOpacity={0.6}
                >
                  <Text
                    style={[
                      styles.optionText,
                      { color: palette.foreground },
                      isSelected && { fontWeight: typography.fontWeights.semibold, color: palette.primary },
                    ]}
                  >
                    {getTimePeriodLabel(period)}
                  </Text>
                  {isSelected && (
                    <IconSymbol name="checkmark.circle.fill" size={22} color={palette.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    padding: spacing.sm,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  menu: {
    width: '100%',
    maxWidth: 320,
    borderRadius: radius.xl,
    overflow: 'hidden',
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.lg,
    borderBottomWidth: 1,
  },
  menuTitle: {
    fontSize: typography.fontSizes.lg,
    fontWeight: typography.fontWeights.bold,
  },
  menuClose: {
    padding: spacing.xs,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  optionText: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
  },
});
