import { IconSymbol } from "@/components/ui/icon-symbol";
import { useThemeScheme } from "@/hooks/use-theme-scheme";
import { useThemeStore } from "@/src/stores/themeStore";
import { Link, usePathname } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
    Pressable,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { WebContainer } from "./WebLayout";
import { getWebTheme, WebThemeShape } from "./WebTheme";

function NavLink({
  href,
  label,
  onPress,
}: {
  href: string;
  label: string;
  onPress?: () => void;
}) {
  const pathname = usePathname();
  const active = pathname === href;
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const linkStyle = StyleSheet.flatten([
    styles.navLink,
    active && styles.navLinkActive,
  ]);
  const linkTextStyle = StyleSheet.flatten([
    styles.navLinkText,
    active && styles.navLinkTextActive,
  ]);
  return (
    <Link href={href} asChild>
      <Pressable style={linkStyle} onPress={onPress}>
        <Text style={linkTextStyle}>{label}</Text>
      </Pressable>
    </Link>
  );
}

export function WebNavBar() {
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const styles = useMemo(() => createStyles(theme), [theme]);
  const { setColorScheme } = useThemeStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 860;
  const [menuOpen, setMenuOpen] = useState(false);

  const isDark = colorScheme === "dark";
  const toggleTheme = async () => {
    await setColorScheme(isDark ? "light" : "dark");
  };

  // Close the menu when switching between breakpoints
  useEffect(() => {
    if (!isMobile) setMenuOpen(false);
  }, [isMobile]);

  return (
    <View style={styles.wrap}>
      <WebContainer>
        <View style={styles.row}>
          <Link href="/" asChild>
            <Pressable style={styles.brand}>
              <Text style={styles.brandText}>FamilyHQ</Text>
            </Pressable>
          </Link>

          {!isMobile ? (
            <>
              <View style={styles.links}>
                <NavLink href="/about" label="About" />
                <NavLink href="/features" label="Features" />
                <NavLink href="/pricing" label="Pricing" />
                <NavLink href="/contact" label="Contact" />
              </View>

              <View style={styles.actions}>
                <Pressable
                  onPress={toggleTheme}
                  style={StyleSheet.flatten([styles.btnIcon, styles.btnGhost])}
                  accessibilityRole="button"
                  accessibilityLabel="Toggle appearance"
                >
                  <IconSymbol
                    name={isDark ? "sun.max.fill" : "moon.fill"}
                    size={18}
                    color={theme.colors.text as any}
                  />
                </Pressable>
                <Link href="/auth/login" asChild>
                  <Pressable
                    style={StyleSheet.flatten([styles.btn, styles.btnGhost])}
                  >
                    <Text style={styles.btnGhostText}>Log in</Text>
                  </Pressable>
                </Link>
                <Link href="/auth/signup" asChild>
                  <Pressable
                    style={StyleSheet.flatten([styles.btn, styles.btnPrimary])}
                  >
                    <Text style={styles.btnPrimaryText}>Get started</Text>
                  </Pressable>
                </Link>
              </View>
            </>
          ) : (
            <View style={styles.mobileActions}>
              <Pressable
                onPress={toggleTheme}
                style={StyleSheet.flatten([styles.btnIcon, styles.btnGhost])}
                accessibilityRole="button"
                accessibilityLabel="Toggle appearance"
              >
                <IconSymbol
                  name={isDark ? "sun.max.fill" : "moon.fill"}
                  size={18}
                  color={theme.colors.text as any}
                />
              </Pressable>
              <Pressable
                onPress={() => setMenuOpen((v) => !v)}
                style={StyleSheet.flatten([styles.btnIcon, styles.btnGhost])}
                accessibilityRole="button"
                accessibilityLabel="Open menu"
              >
                <IconSymbol
                  name={menuOpen ? "xmark" : "ellipsis"}
                  size={18}
                  color={theme.colors.text as any}
                />
              </Pressable>
            </View>
          )}
        </View>

        {isMobile && menuOpen ? (
          <View style={styles.mobilePanel}>
            <View style={styles.mobileNav}>
              <NavLink
                href="/about"
                label="About"
                onPress={() => setMenuOpen(false)}
              />
              <NavLink
                href="/features"
                label="Features"
                onPress={() => setMenuOpen(false)}
              />
              <NavLink
                href="/pricing"
                label="Pricing"
                onPress={() => setMenuOpen(false)}
              />
              <NavLink
                href="/contact"
                label="Contact"
                onPress={() => setMenuOpen(false)}
              />
            </View>

            <View style={styles.mobileCtas}>
              <Link href="/auth/login" asChild>
                <Pressable
                  style={StyleSheet.flatten([styles.btn, styles.btnGhost])}
                  onPress={() => setMenuOpen(false)}
                >
                  <Text style={styles.btnGhostText}>Log in</Text>
                </Pressable>
              </Link>
              <Link href="/auth/signup" asChild>
                <Pressable
                  style={StyleSheet.flatten([styles.btn, styles.btnPrimary])}
                  onPress={() => setMenuOpen(false)}
                >
                  <Text style={styles.btnPrimaryText}>Get started</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        ) : null}
      </WebContainer>
    </View>
  );
}

function createStyles(theme: WebThemeShape) {
  return StyleSheet.create({
    wrap: {
      backgroundColor:
        theme.colors.bg === "#FFFFFF"
          ? "rgba(255,255,255,0.8)"
          : "rgba(11, 18, 32, 0.72)",
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      gap: 16,
      paddingVertical: 10,
    },
    brand: {
      flexDirection: "row",
      alignItems: "baseline",
      gap: 8,
      paddingVertical: 8,
      paddingHorizontal: 6,
    },
    brandText: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: "800",
      letterSpacing: 0.3,
    },
    links: {
      flexDirection: "row",
      alignItems: "center",
      gap: 4,
      flex: 1,
      justifyContent: "center",
    },
    navLink: {
      paddingHorizontal: 10,
      paddingVertical: 8,
      borderRadius: 10,
    },
    navLinkActive: {
      backgroundColor:
        theme.colors.primary === "#0a7ea4"
          ? "rgba(10, 126, 164, 0.10)"
          : "rgba(79, 195, 247, 0.12)",
      borderWidth: 1,
      borderColor:
        theme.colors.primary === "#0a7ea4"
          ? "rgba(10, 126, 164, 0.2)"
          : "rgba(79, 195, 247, 0.22)",
    },
    navLinkText: {
      color: theme.colors.textMuted,
      fontSize: 13,
      fontWeight: "600",
    },
    navLinkTextActive: {
      color: theme.colors.text,
    },
    actions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    mobileActions: {
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
    },
    mobilePanel: {
      marginTop: 8,
      marginBottom: 8,
      padding: 10,
      borderRadius: 16,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: theme.colors.surface,
    },
    mobileNav: {
      gap: 6,
      paddingBottom: 10,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    },
    mobileCtas: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: 10,
      paddingTop: 10,
      justifyContent: "flex-start",
    },
    btn: {
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 10,
    },
    btnIcon: {
      borderRadius: 12,
      paddingHorizontal: 10,
      paddingVertical: 10,
      alignItems: "center",
      justifyContent: "center",
      minWidth: 40,
    },
    btnGhost: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: "transparent",
    },
    btnGhostText: {
      color: theme.colors.text,
      fontWeight: "700",
      fontSize: 13,
    },
    btnPrimary: {
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor:
        theme.colors.bg === "#FFFFFF"
          ? "rgba(16, 24, 40, 0.10)"
          : "rgba(234, 240, 255, 0.10)",
      // Web-only polish (RN Web supports this). Avoids deprecated shadow* warnings on web.
      boxShadow:
        theme.colors.bg === "#FFFFFF"
          ? "0px 10px 22px rgba(10, 126, 164, 0.22)"
          : "0px 10px 22px rgba(79, 195, 247, 0.18)",
    },
    btnPrimaryText: {
      color: theme.colors.bg === "#FFFFFF" ? "#FFFFFF" : "#0B1220",
      fontWeight: "900",
      fontSize: 13,
    },
  });
}
