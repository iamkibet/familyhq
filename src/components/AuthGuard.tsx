import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { useAuthInit } from '@/src/hooks/useAuthInit';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

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

  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';

  if (loading || !isReady) {
    return (
      <View style={[styles.loadingContainer, isDark && styles.loadingContainerDark]}>
        <View style={styles.loadingContent}>
          <View style={styles.logoContainer}>
            <View style={[styles.logoCircle, isDark && styles.logoCircleDark]}>
              <Text style={styles.logoText}>FH</Text>
            </View>
          </View>
          <ActivityIndicator 
            size="large" 
            color={isDark ? '#4FC3F7' : '#0a7ea4'} 
            style={styles.loader}
          />
        </View>
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
    backgroundColor: '#FFFFFF',
  },
  loadingContainerDark: {
    backgroundColor: '#1C1B1F',
  },
  loadingContent: {
    alignItems: 'center',
    gap: 24,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  logoCircleDark: {
    backgroundColor: '#4FC3F7',
    shadowColor: '#4FC3F7',
  },
  logoText: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  loader: {
    marginTop: 8,
  },
});

