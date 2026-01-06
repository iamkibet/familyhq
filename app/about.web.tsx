import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebPage, WebContainer, WebCard } from '@/src/components/web/WebLayout';
import { getWebTheme, WebThemeShape } from '@/src/components/web/WebTheme';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

export default function AboutWeb() {
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <WebPage>
      <WebContainer>
        <Text style={styles.h1}>About</Text>
        <Text style={styles.lead}>
          FamilyHQ is built to simplify family coordination: budgets, tasks, calendar events, shopping lists and notes —
          all in one place, with real-time sync.
        </Text>

        <View style={styles.grid}>
          <WebCard>
            <Text style={styles.title}>Designed for clarity</Text>
            <Text style={styles.text}>A dashboard that surfaces what matters: what’s due, what’s upcoming, and what’s spent.</Text>
          </WebCard>
          <WebCard>
            <Text style={styles.title}>Built for collaboration</Text>
            <Text style={styles.text}>Shared context across devices — same login, same data, everywhere.</Text>
          </WebCard>
        </View>
      </WebContainer>
    </WebPage>
  );
}

function createStyles(theme: WebThemeShape) {
  return StyleSheet.create({
    h1: {
      color: theme.colors.text,
      fontSize: 36,
      fontWeight: '900',
      letterSpacing: -0.4,
      marginBottom: 10,
    },
    lead: {
      color: theme.colors.textMuted,
      fontSize: 15,
      lineHeight: 24,
      maxWidth: 820,
      marginBottom: 18,
    },
    grid: {
      flexDirection: 'row',
      gap: 16,
      flexWrap: 'wrap',
    },
    title: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '900',
      marginBottom: 6,
    },
    text: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
    },
  });
}


