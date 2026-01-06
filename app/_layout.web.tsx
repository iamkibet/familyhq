import React from 'react';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useSegments } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, StyleSheet } from 'react-native';
import { WebNavBar } from '@/src/components/web/WebNavBar.web';
import { WebFooter } from '@/src/components/web/WebFooter.web';
import { getWebTheme } from '@/src/components/web/WebTheme';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

export default function RootLayoutWeb() {
  const colorScheme = useThemeScheme();
  const segments = useSegments();
  const theme = getWebTheme(colorScheme);

  const topSegment = segments[0];
  const showMarketingChrome = topSegment !== 'dashboard';

  return (
    <SafeAreaProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={[styles.page, { backgroundColor: theme.colors.bg }]}>
          {showMarketingChrome && <WebNavBar />}

          <View style={styles.content}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Screen name="index" />
              <Stack.Screen name="about" />
              <Stack.Screen name="features" />
              <Stack.Screen name="pricing" />
              <Stack.Screen name="contact" />
              <Stack.Screen name="dashboard" />
              <Stack.Screen name="auth" />
            </Stack>
          </View>

          {showMarketingChrome && <WebFooter />}
        </View>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
});


