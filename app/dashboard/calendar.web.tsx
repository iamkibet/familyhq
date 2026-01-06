import React from 'react';
import { View, StyleSheet } from 'react-native';
import CalendarScreen from '@/src/screens/calendar/CalendarScreen';

export default function WebCalendarRoute() {
  return (
    <View style={styles.wrap}>
      <CalendarScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
});


