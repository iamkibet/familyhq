import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { formatDateForInput } from '@/src/utils';

// Week is Monday–Sunday from getWeekRange; labels match Mon=0 … Sun=6
const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

interface DateStripProps {
  weekDates: string[];
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function DateStrip({ weekDates, selectedDate, onSelectDate }: DateStripProps) {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const todayStr = formatDateForInput(new Date());

  const primary = isDark ? '#4FC3F7' : '#0D47A1';
  const textColor = isDark ? '#E6E1E5' : '#1C1B1F';
  const muted = isDark ? '#9BA1A6' : '#64748B';

  if (weekDates.length === 0) return null;

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        {weekDates.map((dateStr, i) => {
          const d = new Date(dateStr + 'T12:00:00');
          const dayNum = d.getDate().toString();
          const letter = DAY_LETTERS[i];
          const isSelected = dateStr === selectedDate;
          const isToday = dateStr === todayStr;
          return (
            <Pressable
              key={dateStr}
              onPress={() => onSelectDate(dateStr)}
              style={({ pressed }) => [
                styles.cell,
                !isSelected && (isDark ? styles.cellInactiveDark : styles.cellInactiveLight),
                isSelected && [
                  styles.cellSelected,
                  { backgroundColor: primary, borderColor: primary },
                ],
                pressed && styles.cellPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={`${dateStr}${isToday ? ', Today' : ''}. ${isSelected ? 'Selected' : 'Select'}`}
            >
              <Text
                style={[
                  styles.dayLetter,
                  isSelected ? styles.dayLetterSelected : { color: muted },
                ]}
              >
                {letter}
              </Text>
              {isToday && !isSelected && <View style={[styles.todayDot, { backgroundColor: primary }]} />}
              <Text
                style={[
                  styles.dateNum,
                  isSelected ? styles.dateNumSelected : { color: textColor },
                  isToday && !isSelected && styles.dateNumToday,
                ]}
              >
                {dayNum}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  cellInactiveLight: {
    backgroundColor: 'transparent',
  },
  cellInactiveDark: {
    backgroundColor: 'transparent',
  },
  cellSelected: {},
  cellPressed: {
    opacity: 0.9,
  },
  dayLetter: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  dayLetterSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateNum: {
    fontSize: 15,
    fontWeight: '600',
  },
  dateNumSelected: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  dateNumToday: {
    fontWeight: '700',
  },
  todayDot: {
    position: 'absolute',
    bottom: 6,
    width: 3,
    height: 3,
    borderRadius: 1.5,
  },
});
