import React from 'react';
import { Redirect } from 'expo-router';

// Native fallback for web-only marketing route.
export default function FeaturesNative() {
  return <Redirect href="/(tabs)" />;
}


