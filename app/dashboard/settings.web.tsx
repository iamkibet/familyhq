import React from 'react';
import { View, StyleSheet } from 'react-native';
import SettingsScreen from '@/src/screens/settings/SettingsScreen';

export default function WebSettingsRoute() {
  return (
    <View style={styles.wrap}>
      <SettingsScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
});


