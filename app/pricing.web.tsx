import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { WebPage, WebContainer, WebCard } from '@/src/components/web/WebLayout';
import { getWebTheme, WebThemeShape } from '@/src/components/web/WebTheme';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

export default function PricingWeb() {
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <WebPage>
      <WebContainer>
        <Text style={styles.h1}>Pricing</Text>
        <Text style={styles.lead}>
          Start free. Upgrade when you’re ready. (You can adjust these plans later before launch.)
        </Text>

        <View style={styles.grid}>
          <WebCard>
            <Text style={styles.plan}>Free</Text>
            <Text style={styles.price}>$0</Text>
            <Text style={styles.per}>per month</Text>
            <Text style={styles.feature}>- Core features</Text>
            <Text style={styles.feature}>- 1 family</Text>
            <Text style={styles.feature}>- Basic activity history</Text>
          </WebCard>

          <WebCard>
            <Text style={styles.plan}>Pro</Text>
            <Text style={styles.price}>$4.99</Text>
            <Text style={styles.per}>per month</Text>
            <Text style={styles.feature}>- Everything in Free</Text>
            <Text style={styles.feature}>- Advanced insights</Text>
            <Text style={styles.feature}>- Priority support</Text>
            <Link href="/auth/signup" asChild>
              <Pressable style={styles.btn}>
                <Text style={styles.btnText}>Start Pro</Text>
              </Pressable>
            </Link>
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
      gap: 16,
      flexWrap: 'wrap',
    },
    plan: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '900',
      letterSpacing: 1,
      textTransform: 'uppercase',
      marginBottom: 8,
    },
    price: {
      color: theme.colors.text,
      fontSize: 36,
      fontWeight: '900',
      letterSpacing: -0.6,
    },
    per: {
      color: theme.colors.textMuted,
      marginBottom: 12,
    },
    feature: {
      color: theme.colors.textMuted,
      fontSize: 13,
      lineHeight: 20,
      marginBottom: 6,
    },
    btn: {
      marginTop: 12,
      backgroundColor: theme.colors.primary,
      borderRadius: 12,
      paddingVertical: 12,
      alignItems: 'center',
    },
    btnText: {
      color: theme.colors.bg === '#FFFFFF' ? '#FFFFFF' : '#0B1220',
      fontWeight: '900',
    },
  });
}


