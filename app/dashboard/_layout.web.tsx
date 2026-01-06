import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ActivityIndicator, View, Text, StyleSheet } from 'react-native';
import { useAuthInit } from '@/src/hooks/useAuthInit';
import { useAuthStore } from '@/src/stores/authStore';
import { getWebTheme } from '@/src/components/web/WebTheme';
import { WebDashboardShell } from '@/src/components/web/WebDashboardShell.web';
import { useFamilyData } from '@/src/hooks/useFamilyData';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

export default function WebDashboardLayout() {
  useAuthInit();
  useFamilyData();

  const router = useRouter();
  const { currentUser, userData, family, loading, signOut } = useAuthStore();
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);

  useEffect(() => {
    if (loading) return;
    if (!currentUser) {
      router.replace('/auth/login');
      return;
    }
    // If user is logged in but not in a family, send to family setup
    if (currentUser && userData && !userData.familyId) {
      router.replace('/auth/family-setup');
      return;
    }
    // If userData exists and has familyId, but family hasn't loaded yet, keep loading state
  }, [currentUser, userData, loading, router]);

  if (loading || (currentUser && userData?.familyId && !family)) {
    return (
      <View style={[styles.loader, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={[styles.loaderText, { color: theme.colors.textMuted }]}>Loading your dashboard…</Text>
      </View>
    );
  }

  return (
    <WebDashboardShell
      title="FamilyHQ Dashboard"
      onSignOut={async () => {
        await signOut();
        router.replace('/');
      }}
    >
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="budget" />
        <Stack.Screen name="shopping" />
        <Stack.Screen name="tasks" />
        <Stack.Screen name="calendar" />
        <Stack.Screen name="notes" />
        <Stack.Screen name="settings" />
      </Stack>
    </WebDashboardShell>
  );
}

const styles = StyleSheet.create({
  loader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  loaderText: {
    fontWeight: '700',
  },
});


