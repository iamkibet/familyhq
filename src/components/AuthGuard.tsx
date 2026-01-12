import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet, Text, Animated, Platform } from 'react-native';
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
  const fadeAnim = useState(new Animated.Value(0))[0];
  const scaleAnim = useState(new Animated.Value(0.8))[0];

  // Animate loading screen
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

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
          // Web goes to /dashboard, mobile goes to /(tabs)
          router.push(Platform.OS === 'web' ? '/dashboard' : '/(tabs)');
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
        <Animated.View 
          style={[
            styles.loadingContent,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}>
          <View style={styles.logoContainer}>
            <Animated.View 
              style={[
                styles.logoCircle,
                isDark && styles.logoCircleDark,
              ]}>
              <Text style={styles.logoText}>FH</Text>
            </Animated.View>
          </View>
          <Text style={[styles.appName, isDark && styles.appNameDark]}>FamilyHQ</Text>
          <Text style={[styles.tagline, isDark && styles.taglineDark]}>Your Family, Organized</Text>
          <ActivityIndicator 
            size="large" 
            color={isDark ? '#4FC3F7' : '#0a7ea4'} 
            style={styles.loader}
          />
        </Animated.View>
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
    gap: 16,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#0a7ea4',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 12,
  },
  logoCircleDark: {
    backgroundColor: '#4FC3F7',
    shadowColor: '#4FC3F7',
  },
  logoText: {
    fontSize: 40,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111',
    letterSpacing: 0.5,
    marginTop: 8,
  },
  appNameDark: {
    color: '#E6E1E5',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '400',
    color: '#666',
    letterSpacing: 0.3,
    marginTop: -8,
  },
  taglineDark: {
    color: '#938F99',
  },
  loader: {
    marginTop: 24,
  },
});

