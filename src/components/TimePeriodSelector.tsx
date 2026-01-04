import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { TimePeriod, getTimePeriodLabel } from '@/src/utils';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

interface TimePeriodSelectorProps {
  selectedPeriod: TimePeriod;
  onPeriodChange: (period: TimePeriod) => void;
}

const PERIODS: TimePeriod[] = ['thisWeek', 'thisMonth', 'lastMonth', 'allTime'];

export function TimePeriodSelector({ selectedPeriod, onPeriodChange }: TimePeriodSelectorProps) {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      {PERIODS.map((period) => {
        const isSelected = period === selectedPeriod;
        return (
          <TouchableOpacity
            key={period}
            style={[
              styles.periodButton,
              isSelected && styles.periodButtonSelected,
              isDark && styles.periodButtonDark,
              isSelected && isDark && styles.periodButtonSelectedDark,
            ]}
            onPress={() => onPeriodChange(period)}
            activeOpacity={0.6}>
            <Text
              style={[
                styles.periodText,
                isSelected && styles.periodTextSelected,
                isDark && styles.periodTextDark,
                isSelected && isDark && styles.periodTextSelectedDark,
              ]}>
              {getTimePeriodLabel(period)}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#F8F8F8',
    borderRadius: 12,
    padding: 4,
    gap: 4,
  },
  containerDark: {
    backgroundColor: '#1E1E1E',
  },
  periodButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  periodButtonDark: {
    // No special styling needed
  },
  periodButtonSelected: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  periodButtonSelectedDark: {
    backgroundColor: '#2C2C2C',
  },
  periodText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
    letterSpacing: 0.2,
  },
  periodTextDark: {
    color: '#666',
  },
  periodTextSelected: {
    color: '#0a7ea4',
    fontWeight: '700',
  },
  periodTextSelectedDark: {
    color: '#4FC3F7',
  },
});

