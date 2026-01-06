import { useEffect } from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as NavigationBar from 'expo-navigation-bar';
import { Platform } from 'react-native';
import 'react-native-reanimated';

import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { AuthGuard } from '@/src/components/AuthGuard';

// Keep the splash screen visible while we fetch resources
SplashScreen.preventAutoHideAsync();

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  const colorScheme = useThemeScheme();

  useEffect(() => {
    // Hide splash screen once the app is ready
    const hideSplash = async () => {
      try {
        await SplashScreen.hideAsync();
      } catch (e) {
        // Ignore errors
      }
    };

    // Set navigation bar appearance for Android
    const setNavigationBarStyle = async () => {
      if (Platform.OS === 'android') {
        try {
          // Set navigation bar background color to match tab bar
          const navBarColor = colorScheme === 'dark' ? '#1E1E1E' : '#FFFFFF';
          
          // Set navigation bar background color and button style
          // 'light' = light buttons (for dark backgrounds), 'dark' = dark buttons (for light backgrounds)
          await NavigationBar.setBackgroundColorAsync(navBarColor);
          await NavigationBar.setButtonStyleAsync(colorScheme === 'dark' ? 'light' : 'dark');
        } catch (error) {
          // NavigationBar might not be available on all platforms/versions
          console.warn('Failed to set navigation bar style:', error);
        }
      }
    };

    // Small delay to ensure smooth transition
    const timer = setTimeout(() => {
      hideSplash();
      setNavigationBarStyle();
    }, 500);
    return () => clearTimeout(timer);
  }, [colorScheme]);

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <AuthGuard>
        <Stack>
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        </Stack>
        </AuthGuard>
        <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
