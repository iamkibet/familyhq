import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { getWebTheme, WebThemeShape } from '@/src/components/web/WebTheme';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

function QuickCard({ title, desc, href }: { title: string; desc: string; href: string }) {
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <Link href={href} asChild>
      <Pressable style={styles.card}>
        <Text style={styles.cardTitle}>{title}</Text>
        <Text style={styles.cardDesc}>{desc}</Text>
        <Text style={styles.cardCta}>Open →</Text>
      </Pressable>
    </Link>
  );
}

export default function WebDashboardHome() {
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.page}>
      <Text style={styles.h1}>Overview</Text>
      <Text style={styles.lead}>Jump into a module. Everything here matches your mobile app functionality.</Text>

      <View style={styles.grid}>
        <QuickCard title="Budget" desc="Track spend, limits and insights." href="/dashboard/budget" />
        <QuickCard title="Shopping" desc="Shared shopping list with updates." href="/dashboard/shopping" />
        <QuickCard title="Tasks" desc="Assignments, due dates, and status." href="/dashboard/tasks" />
        <QuickCard title="Calendar" desc="Upcoming events and schedule." href="/dashboard/calendar" />
        <QuickCard title="Notes" desc="Quick notes synced to your family." href="/dashboard/notes" />
        <QuickCard title="Settings" desc="Theme, currency, and preferences." href="/dashboard/settings" />
      </View>
    </View>
  );
}

function createStyles(theme: WebThemeShape) {
  return StyleSheet.create({
    page: {
      flex: 1,
    },
    h1: {
      color: theme.colors.text,
      fontSize: 26,
      fontWeight: '900',
      letterSpacing: -0.3,
      marginBottom: 6,
    },
    lead: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 14,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 14,
    },
    card: {
      width: 320,
      padding: 16,
      borderRadius: 16,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    cardTitle: {
      color: theme.colors.text,
      fontWeight: '900',
      fontSize: 15,
      marginBottom: 6,
    },
    cardDesc: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
    },
    cardCta: {
      marginTop: 12,
      color: theme.colors.primary,
      fontWeight: '900',
      fontSize: 13,
    },
  });
}


