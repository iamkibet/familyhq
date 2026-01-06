import React from 'react';
import { Redirect } from 'expo-router';

// Native fallback for web-only marketing homepage.
// Keeps mobile routing anchored to (tabs) while allowing web to own `/`.
export default function IndexNative() {
  return <Redirect href="/(tabs)" />;
}


