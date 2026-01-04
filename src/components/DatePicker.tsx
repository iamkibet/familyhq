import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';

interface DatePickerProps {
  value: string; // YYYY-MM-DD format
  onChange: (date: string) => void;
  label?: string;
  minimumDate?: Date;
  maximumDate?: Date;
}

export function DatePicker({ value, onChange, label, minimumDate, maximumDate }: DatePickerProps) {
  const [show, setShow] = useState(false);
  const date = value ? new Date(value) : new Date();

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShow(Platform.OS === 'ios');
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      onChange(`${year}-${month}-${day}`);
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return 'Select date';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity style={styles.button} onPress={() => setShow(true)}>
        <Text style={styles.buttonText}>{formatDisplayDate(value)}</Text>
      </TouchableOpacity>
      {show && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={handleDateChange}
          minimumDate={minimumDate}
          maximumDate={maximumDate}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  button: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  buttonText: {
    fontSize: 16,
    color: '#111',
  },
});

