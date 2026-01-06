import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { getWebTheme, WebThemeShape } from './WebTheme';
import { WebContainer } from './WebLayout';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

export function WebFooter() {
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.wrap}>
      <WebContainer>
        <View style={styles.row}>
          <Text style={styles.muted}>© {new Date().getFullYear()} FamilyHQ</Text>
          <View style={styles.links}>
            <Link href="/privacy" asChild>
              <Text style={styles.link}>Privacy</Text>
            </Link>
            <Link href="/terms" asChild>
              <Text style={styles.link}>Terms</Text>
            </Link>
          </View>
        </View>
      </WebContainer>
    </View>
  );
}

function createStyles(theme: WebThemeShape) {
  return StyleSheet.create({
    wrap: {
      borderTopWidth: 1,
      borderTopColor: theme.colors.border,
      backgroundColor: theme.colors.bg === '#FFFFFF' ? 'rgba(255,255,255,0.8)' : 'rgba(11, 18, 32, 0.72)',
    },
    row: {
      paddingVertical: 18,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      gap: 12,
    },
    muted: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '600',
    },
    links: {
      flexDirection: 'row',
      gap: 16,
      alignItems: 'center',
    },
    link: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
    },
  });
}


