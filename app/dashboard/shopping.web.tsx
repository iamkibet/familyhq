import React from 'react';
import { View, StyleSheet } from 'react-native';
import ShoppingListScreen from '@/src/screens/shopping/ShoppingListScreen';

export default function WebShoppingRoute() {
  return (
    <View style={styles.wrap}>
      <ShoppingListScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
});


