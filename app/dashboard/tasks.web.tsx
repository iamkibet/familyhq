import React from 'react';
import { View, StyleSheet } from 'react-native';
import TasksScreen from '@/src/screens/tasks/TasksScreen';

export default function WebTasksRoute() {
  return (
    <View style={styles.wrap}>
      <TasksScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
});


