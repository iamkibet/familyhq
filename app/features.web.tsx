import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { WebPage, WebContainer, WebCard } from '@/src/components/web/WebLayout';
import { getWebTheme, WebThemeShape } from '@/src/components/web/WebTheme';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

const FEATURES = [
  { title: 'Budgeting', desc: 'Track spending and categories with clear summaries and visuals.' },
  { title: 'Shopping', desc: 'Shared shopping lists with quick add/edit and completion status.' },
  { title: 'Tasks', desc: 'Assign tasks, track due dates, and stay accountable.' },
  { title: 'Calendar', desc: 'Family events and reminders in one timeline.' },
  { title: 'Notes', desc: 'Capture ideas and keep shared context.' },
  { title: 'Settings', desc: 'Theme, currency, and account preferences.' },
];

export default function FeaturesWeb() {
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <WebPage>
      <WebContainer>
        <Text style={styles.h1}>Features</Text>
        <Text style={styles.lead}>Everything you use on mobile is available in the web dashboard.</Text>

        <View style={styles.grid}>
          {FEATURES.map((f) => (
            <WebCard key={f.title}>
              <Text style={styles.title}>{f.title}</Text>
              <Text style={styles.text}>{f.desc}</Text>
            </WebCard>
          ))}
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
      marginBottom: 8,
    },
    lead: {
      color: theme.colors.textMuted,
      fontSize: 15,
      lineHeight: 24,
      marginBottom: 18,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 16,
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


