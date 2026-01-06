import React from 'react';
import { Redirect } from 'expo-router';

export default function TabLayout() {
  // Web/fallback should never render the native tab navigator.
  return <Redirect href="/" />;
}
