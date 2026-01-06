import React from 'react';
import { Redirect } from 'expo-router';

// Native fallback for web-only dashboard route group.
export default function DashboardLayoutNative() {
  return <Redirect href="/(tabs)" />;
}


