import React from 'react';
import { Redirect } from 'expo-router';

// Native fallback for web-only marketing route.
export default function AboutNative() {
  return <Redirect href="/(tabs)" />;
}


