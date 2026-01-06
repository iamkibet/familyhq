import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Link, usePathname } from 'expo-router';
import { getWebTheme, WebThemeShape } from './WebTheme';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

function SideLink({ href, label }: { href: string; label: string }) {
  const pathname = usePathname();
  const active = pathname === href;
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const linkStyle = StyleSheet.flatten([styles.sideLink, active && styles.sideLinkActive]);
  const linkTextStyle = StyleSheet.flatten([styles.sideLinkText, active && styles.sideLinkTextActive]);
  return (
    <Link href={href} asChild>
      <Pressable style={linkStyle}>
        <Text style={linkTextStyle}>{label}</Text>
      </Pressable>
    </Link>
  );
}

export function WebDashboardShell({
  title,
  children,
  onSignOut,
}: {
  title: string;
  children: React.ReactNode;
  onSignOut: () => void;
}) {
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const styles = useMemo(() => createStyles(theme), [theme]);
  return (
    <View style={styles.page}>
      <View style={styles.sidebar}>
        <View style={styles.brand}>
          <Text style={styles.brandTitle}>FamilyHQ</Text>
          <Text style={styles.brandSub}>Dashboard</Text>
        </View>

        <View style={styles.nav}>
          <SideLink href="/dashboard" label="Overview" />
          <SideLink href="/dashboard/budget" label="Budget" />
          <SideLink href="/dashboard/shopping" label="Shopping" />
          <SideLink href="/dashboard/tasks" label="Tasks" />
          <SideLink href="/dashboard/calendar" label="Calendar" />
          <SideLink href="/dashboard/notes" label="Notes" />
          <SideLink href="/dashboard/settings" label="Settings" />
        </View>

        <Pressable style={styles.signOut} onPress={onSignOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </Pressable>
      </View>

      <View style={styles.main}>
        <View style={styles.topbar}>
          <Text style={styles.topbarTitle}>{title}</Text>
        </View>
        <View style={styles.content}>{children}</View>
      </View>
    </View>
  );
}

function createStyles(theme: WebThemeShape) {
  return StyleSheet.create({
    page: {
      flex: 1,
      flexDirection: 'row',
      backgroundColor: theme.colors.bg,
    },
    sidebar: {
      width: 260,
      padding: 16,
      borderRightWidth: 1,
      borderRightColor: theme.colors.border,
      backgroundColor: theme.colors.bg === '#FFFFFF' ? 'rgba(244,247,251,0.8)' : 'rgba(15, 27, 51, 0.6)',
    },
    brand: {
      paddingVertical: 12,
      paddingHorizontal: 10,
      borderRadius: 14,
      backgroundColor: theme.colors.surface,
      borderWidth: 1,
      borderColor: theme.colors.border,
      marginBottom: 14,
    },
    brandTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 0.3,
    },
    brandSub: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '700',
      marginTop: 2,
    },
    nav: {
      gap: 6,
      flex: 1,
    },
    sideLink: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
    },
    sideLinkActive: {
      backgroundColor: theme.colors.primary === '#0a7ea4' ? 'rgba(10, 126, 164, 0.10)' : 'rgba(79, 195, 247, 0.12)',
      borderWidth: 1,
      borderColor: theme.colors.primary === '#0a7ea4' ? 'rgba(10, 126, 164, 0.2)' : 'rgba(79, 195, 247, 0.22)',
    },
    sideLinkText: {
      color: theme.colors.textMuted,
      fontWeight: '800',
      fontSize: 13,
    },
    sideLinkTextActive: {
      color: theme.colors.text,
    },
    signOut: {
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: 'transparent',
      alignItems: 'center',
    },
    signOutText: {
      color: theme.colors.text,
      fontWeight: '900',
      fontSize: 13,
    },
    main: {
      flex: 1,
    },
    topbar: {
      height: 60,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      justifyContent: 'center',
      paddingHorizontal: 18,
      backgroundColor: theme.colors.bg === '#FFFFFF' ? 'rgba(255,255,255,0.8)' : 'rgba(11, 18, 32, 0.72)',
    },
    topbarTitle: {
      color: theme.colors.text,
      fontSize: 16,
      fontWeight: '900',
      letterSpacing: 0.2,
    },
    content: {
      flex: 1,
      padding: 18,
    },
  });
}


