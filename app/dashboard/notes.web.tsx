import React from 'react';
import { View, StyleSheet } from 'react-native';
import NotesScreen from '@/src/screens/notes/NotesScreen';

export default function WebNotesRoute() {
  return (
    <View style={styles.wrap}>
      <NotesScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
});


