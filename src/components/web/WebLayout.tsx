import React from 'react';
import { View, StyleSheet } from 'react-native';
import { getWebTheme, WebThemeShape } from './WebTheme';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

export function WebPage({ children }: { children: React.ReactNode }) {
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const styles = createStyles(theme);
  return <View style={styles.page}>{children}</View>;
}

export function WebContainer({ children }: { children: React.ReactNode }) {
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const styles = createStyles(theme);
  return <View style={styles.container}>{children}</View>;
}

export function WebCard({ children }: { children: React.ReactNode }) {
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const styles = createStyles(theme);
  return <View style={styles.card}>{children}</View>;
}

function createStyles(theme: WebThemeShape) {
  return StyleSheet.create({
    page: {
      flex: 1,
      backgroundColor: theme.colors.bg,
    },
    container: {
      width: '100%',
      maxWidth: 1120,
      alignSelf: 'center',
      paddingHorizontal: 20,
      paddingVertical: 28,
    },
    card: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.radius.lg,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: 18,
      ...theme.shadow.card,
    },
  });
}


