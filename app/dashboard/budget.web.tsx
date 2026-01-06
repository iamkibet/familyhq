import React from 'react';
import { View, StyleSheet } from 'react-native';
import BudgetScreen from '@/src/screens/budget/BudgetScreen';

export default function WebBudgetRoute() {
  return (
    <View style={styles.wrap}>
      <BudgetScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
});


