import React from 'react';
import { Redirect } from 'expo-router';

// Native fallback for web-only dashboard.
export default function DashboardIndexNative() {
  return <Redirect href="/(tabs)" />;
}


