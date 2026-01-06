import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { WebPage, WebContainer, WebCard } from '@/src/components/web/WebLayout';
import { getWebTheme, WebThemeShape } from '@/src/components/web/WebTheme';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

export default function WebHomePage() {
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <WebPage>
      <WebContainer>
        <View style={styles.hero}>
          <Text style={styles.kicker}>FamilyHQ</Text>
          <Text style={styles.h1}>Your family, organized — across budgets, tasks, notes, and shopping.</Text>
          <Text style={styles.lead}>
            A clean, modern dashboard that keeps everyone aligned. Works on web and mobile with the same login and data.
          </Text>

          <View style={styles.ctaRow}>
            <Link href="/auth/signup" asChild>
              <Pressable style={StyleSheet.flatten([styles.btn, styles.btnPrimary])}>
                <Text style={styles.btnPrimaryText}>Get started</Text>
              </Pressable>
            </Link>
            <Link href="/features" asChild>
              <Pressable style={StyleSheet.flatten([styles.btn, styles.btnGhost])}>
                <Text style={styles.btnGhostText}>See features</Text>
              </Pressable>
            </Link>
          </View>

          <View style={styles.storeRow}>
            <Link href="#" asChild>
              <Pressable style={StyleSheet.flatten([styles.storeBtn, styles.iosBtn])} accessibilityRole="button" accessibilityLabel="Download on the App Store">
                <Text style={styles.storeBtnTop}>Download on the</Text>
                <Text style={styles.storeBtnBottom}>App Store</Text>
              </Pressable>
            </Link>
            <Link href="#" asChild>
              <Pressable style={StyleSheet.flatten([styles.storeBtn, styles.androidBtn])} accessibilityRole="button" accessibilityLabel="Get it on Google Play">
                <Text style={styles.storeBtnTop}>Get it on</Text>
                <Text style={styles.storeBtnBottom}>Google Play</Text>
              </Pressable>
            </Link>
          </View>
        </View>

        <View style={styles.grid}>
          <WebCard>
            <Text style={styles.cardTitle}>Household Budget</Text>
            <Text style={styles.cardText}>Track spending, categories, and periods with clear visuals.</Text>
          </WebCard>
          <WebCard>
            <Text style={styles.cardTitle}>Shopping Lists</Text>
            <Text style={styles.cardText}>Shared lists that keep everyone in sync.</Text>
          </WebCard>
          <WebCard>
            <Text style={styles.cardTitle}>Tasks & Calendar</Text>
            <Text style={styles.cardText}>Assign tasks, stay on top of deadlines, and manage events.</Text>
          </WebCard>
        </View>
      </WebContainer>
    </WebPage>
  );
}

function createStyles(theme: WebThemeShape) {
  return StyleSheet.create({
    hero: {
      paddingVertical: 36,
      gap: 14,
    },
    kicker: {
      color: theme.colors.primary,
      fontWeight: '800',
      letterSpacing: 2,
      textTransform: 'uppercase',
      fontSize: 12,
    },
    h1: {
      color: theme.colors.text,
      fontSize: 44,
      fontWeight: '900',
      lineHeight: 52,
      letterSpacing: -0.6,
      maxWidth: 860,
    },
    lead: {
      color: theme.colors.textMuted,
      fontSize: 16,
      lineHeight: 26,
      maxWidth: 760,
    },
    ctaRow: {
      marginTop: 10,
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    btn: {
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
    },
    btnPrimary: {
      backgroundColor: theme.colors.primary,
    },
    btnPrimaryText: {
      color: '#0B1220',
      fontWeight: '900',
      fontSize: 14,
    },
    btnGhost: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: 'transparent',
    },
    btnGhostText: {
      color: theme.colors.text,
      fontWeight: '800',
      fontSize: 14,
    },
    storeRow: {
      marginTop: 12,
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    storeBtn: {
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    iosBtn: {},
    androidBtn: {},
    storeBtnTop: {
      color: theme.colors.textMuted,
      fontSize: 10,
      fontWeight: '700',
      textTransform: 'uppercase',
      letterSpacing: 1,
    },
    storeBtnBottom: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.2,
    },
    grid: {
      marginTop: 18,
      flexDirection: 'row',
      gap: 16,
      flexWrap: 'wrap',
    },
    cardTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '900',
      marginBottom: 6,
    },
    cardText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
    },
  });
}


