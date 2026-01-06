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

export default function RootLayout() {
  const colorScheme = useThemeScheme();

  useEffect(() => {
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

    // Hide splash screen after a minimum display time for better UX
    // The AuthGuard will handle the loading state after splash screen hides
    const hideSplash = async () => {
      try {
        // Wait a bit longer to ensure smooth transition
        await new Promise(resolve => setTimeout(resolve, 800));
        await SplashScreen.hideAsync();
        setNavigationBarStyle();
      } catch (e) {
        // Ignore errors
      }
    };

    hideSplash();
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
