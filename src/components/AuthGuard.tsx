import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { useAuthInit } from '@/src/hooks/useAuthInit';

/**
 * Component to guard routes based on authentication state
 */
export function AuthGuard({ children }: { children: React.ReactNode }) {
  useAuthInit();
  const router = useRouter();
  const segments = useSegments();
  const { currentUser, userData, family, loading } = useAuthStore();
  const [isReady, setIsReady] = useState(false);

  // Wait for router to be ready before attempting navigation
  useEffect(() => {
    // Wait for segments to be available (indicates router is ready)
    if (segments.length > 0 || loading === false) {
      const timer = setTimeout(() => {
        setIsReady(true);
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [segments.length, loading]);

  useEffect(() => {
    if (!isReady || loading || segments.length === 0) return;

    const inAuthGroup = segments[0] === 'auth';
    const isAuthenticated = !!currentUser;
    const hasFamily = !!userData?.familyId && !!family;

    // Use setTimeout to ensure router is fully ready
    const navigationTimer = setTimeout(() => {
      try {
        if (!isAuthenticated && !inAuthGroup) {
          // Redirect to login if not authenticated
          router.push('/auth/login');
        } else if (isAuthenticated && !hasFamily && !inAuthGroup) {
          // Redirect to family setup if authenticated but no family
          router.push('/auth/family-setup');
        } else if (isAuthenticated && hasFamily && inAuthGroup) {
          // Redirect to home if authenticated and has family
          router.push('/(tabs)');
        }
      } catch (error) {
        // Silently handle navigation errors (router might not be ready)
        // This is expected during initial load
      }
    }, 100);

    return () => clearTimeout(navigationTimer);
  }, [currentUser, userData, family, loading, segments, isReady, router]);

  if (loading || !isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});

