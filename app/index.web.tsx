import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { WebFooter } from '@/src/components/web/WebFooter.web';
import { WebContainer, WebPage } from '@/src/components/web/WebLayout';
import { getWebTheme, WebThemeShape } from '@/src/components/web/WebTheme';
import { Link } from 'expo-router';
import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, TextStyle, useWindowDimensions, View, ViewStyle } from 'react-native';

export default function WebHomePage() {
  const colorScheme = useThemeScheme();
  const theme = getWebTheme(colorScheme);
  const { width, height } = useWindowDimensions();
  const styles = useMemo(() => createStyles(theme, width, height), [theme, width, height]);
  const isMobile = width < 900;
  return (
    <WebPage>
      <WebContainer>
        <View style={styles.heroWrap}>
          <View style={styles.heroBg} />

          <View style={styles.hero}>
            <View style={styles.heroLeft}>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>FamilyHQ</Text>
                </View>
                <View style={styles.badgeGhost}>
                  <Text style={styles.badgeGhostText}>Web + Mobile</Text>
                </View>
              </View>

              <Text style={styles.h1}>Your family, organized — without the chaos.</Text>
              <Text style={styles.lead}>
                A modern home for budgets, tasks, notes, shopping, and events. Same login and data across web and mobile.
              </Text>

              <View style={styles.storeRow}>
                <Pressable
                  style={StyleSheet.flatten([styles.storeBtn, styles.storeBtnIos])}
                  accessibilityRole="button"
                  accessibilityLabel="Download on the App Store"
                >
                  <Text style={styles.storeBtnTop}>Download on the</Text>
                  <Text style={styles.storeBtnBottom}>App Store</Text>
                </Pressable>
                <Pressable
                  style={StyleSheet.flatten([styles.storeBtn, styles.storeBtnAndroid])}
                  accessibilityRole="button"
                  accessibilityLabel="Get it on Google Play"
                >
                  <Text style={styles.storeBtnTop}>Get it on</Text>
                  <Text style={styles.storeBtnBottom}>Google Play</Text>
                </Pressable>
              </View>

              <View style={styles.trustRow}>
                <Text style={styles.trustText}>Private by design</Text>
                <View style={styles.dot} />
                <Text style={styles.trustText}>Real‑time sync</Text>
                <View style={styles.dot} />
                <Text style={styles.trustText}>Built for families</Text>
              </View>
            </View>

            {!isMobile ? (
              <View style={styles.heroRight}>
                <View style={styles.heroVisualCard}>
                  <View style={styles.heroVisualGlowA} />
                  <View style={styles.heroVisualGlowB} />
                  <View style={styles.deviceFrame} accessibilityLabel="FamilyHQ preview">
                    <View style={styles.deviceTopBar}>
                      <View style={styles.deviceDot} />
                      <View style={styles.deviceDot} />
                      <View style={styles.deviceDot} />
                      <View style={styles.devicePill} />
                    </View>

                    <View style={styles.deviceScreen}>
                      <View style={styles.deviceHeaderRow}>
                        <View style={styles.deviceHeaderBlock} />
                        <View style={styles.deviceHeaderChip} />
                      </View>

                      <View style={styles.deviceGrid}>
                        <View style={styles.deviceTile} />
                        <View style={styles.deviceTile} />
                        <View style={styles.deviceTile} />
                        <View style={styles.deviceTile} />
                      </View>

                      <View style={styles.deviceList}>
                        <View style={styles.deviceListRow} />
                        <View style={styles.deviceListRow} />
                        <View style={styles.deviceListRow} />
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            ) : null}
          </View>
        </View>

        {/* Benefits Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionKicker}>Why FamilyHQ</Text>
            <Text style={styles.sectionTitle}>Everything your family needs, in one place</Text>
            <Text style={styles.sectionLead}>
              Stop juggling multiple apps and spreadsheets. FamilyHQ brings budgets, tasks, shopping, and events together.
            </Text>
          </View>

          <View style={styles.benefitsGrid}>
            <View style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: theme.colors.primary + '18' }]}>
                <IconSymbol name="dollarsign.circle.fill" size={28} color={theme.colors.primary as any} />
              </View>
              <Text style={styles.benefitTitle}>Smart budgeting</Text>
              <Text style={styles.benefitText}>
                Track spending by category and period. See where your money goes with clear visuals.
              </Text>
            </View>

            <View style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: theme.colors.success + '18' }]}>
                <IconSymbol name="checkmark.circle.fill" size={28} color={theme.colors.success as any} />
              </View>
              <Text style={styles.benefitTitle}>Shared tasks</Text>
              <Text style={styles.benefitText}>
                Assign tasks to family members, set due dates, and never miss a deadline.
              </Text>
            </View>

            <View style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: theme.colors.warning + '18' }]}>
                <IconSymbol name="cart.fill" size={28} color={theme.colors.warning as any} />
              </View>
              <Text style={styles.benefitTitle}>Shopping lists</Text>
              <Text style={styles.benefitText}>
                Collaborative lists that update in real-time. No more forgotten items.
              </Text>
            </View>

            <View style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: theme.colors.primary2 + '18' }]}>
                <IconSymbol name="calendar" size={28} color={theme.colors.primary2 as any} />
              </View>
              <Text style={styles.benefitTitle}>Family calendar</Text>
              <Text style={styles.benefitText}>
                Keep everyone&apos;s schedule in sync. See upcoming events at a glance.
              </Text>
            </View>

            <View style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: theme.colors.primary + '18' }]}>
                <IconSymbol name="note.text" size={28} color={theme.colors.primary as any} />
              </View>
              <Text style={styles.benefitTitle}>Shared notes</Text>
              <Text style={styles.benefitText}>
                Keep important information accessible. Recipes, passwords, reminders — all in one place.
              </Text>
            </View>

            <View style={styles.benefitCard}>
              <View style={[styles.benefitIcon, { backgroundColor: theme.colors.success + '18' }]}>
                <IconSymbol name="lock.fill" size={28} color={theme.colors.success as any} />
              </View>
              <Text style={styles.benefitTitle}>Private & secure</Text>
              <Text style={styles.benefitText}>
                Your family&apos;s data is encrypted and private. We never share or sell your information.
              </Text>
            </View>
          </View>
        </View>

        {/* Features Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionKicker}>Features</Text>
            <Text style={styles.sectionTitle}>Built for modern families</Text>
          </View>

          <View style={styles.featuresGrid}>
            <View style={styles.featureRow}>
              <View style={styles.featureContent}>
                <View style={styles.featureBadge}>
                  <Text style={styles.featureBadgeText}>Real-time sync</Text>
                </View>
                <Text style={styles.featureTitle}>Always up to date</Text>
                <Text style={styles.featureText}>
                  Changes sync instantly across all devices. Everyone sees the latest information, no refresh needed.
                </Text>
                <View style={styles.featureList}>
                  <View style={styles.featureListItem}>
                    <IconSymbol name="checkmark.circle.fill" size={18} color={theme.colors.success as any} />
                    <Text style={styles.featureListText}>Instant updates</Text>
                  </View>
                  <View style={styles.featureListItem}>
                    <IconSymbol name="checkmark.circle.fill" size={18} color={theme.colors.success as any} />
                    <Text style={styles.featureListText}>Works offline</Text>
                  </View>
                  <View style={styles.featureListItem}>
                    <IconSymbol name="checkmark.circle.fill" size={18} color={theme.colors.success as any} />
                    <Text style={styles.featureListText}>Cloud backup</Text>
                  </View>
                </View>
              </View>
              <View style={styles.featureVisual}>
                <View style={[styles.featureVisualCard, { backgroundColor: theme.colors.surface }]}>
                  <View style={styles.featureVisualDot} />
                  <View style={styles.featureVisualBar} />
                  <View style={[styles.featureVisualBar, { width: '70%' }]} />
                  <View style={[styles.featureVisualBar, { width: '85%' }]} />
                </View>
              </View>
            </View>

            <View style={[styles.featureRow, isMobile ? {} : { flexDirection: 'row-reverse' }]}>
              <View style={styles.featureContent}>
                <View style={styles.featureBadge}>
                  <Text style={styles.featureBadgeText}>Cross-platform</Text>
                </View>
                <Text style={styles.featureTitle}>Web, iOS, and Android</Text>
                <Text style={styles.featureText}>
                  Start on your phone, finish on your laptop. Same login, same data, everywhere.
                </Text>
                <View style={styles.featureList}>
                  <View style={styles.featureListItem}>
                    <IconSymbol name="checkmark.circle.fill" size={18} color={theme.colors.success as any} />
                    <Text style={styles.featureListText}>Native mobile apps</Text>
                  </View>
                  <View style={styles.featureListItem}>
                    <IconSymbol name="checkmark.circle.fill" size={18} color={theme.colors.success as any} />
                    <Text style={styles.featureListText}>Responsive web app</Text>
                  </View>
                  <View style={styles.featureListItem}>
                    <IconSymbol name="checkmark.circle.fill" size={18} color={theme.colors.success as any} />
                    <Text style={styles.featureListText}>One account</Text>
                  </View>
                </View>
              </View>
              <View style={styles.featureVisual}>
                <View style={[styles.featureVisualCard, { backgroundColor: theme.colors.surface }]}>
                  <View style={styles.featureVisualGrid}>
                    <View style={styles.featureVisualGridItem} />
                    <View style={styles.featureVisualGridItem} />
                    <View style={styles.featureVisualGridItem} />
                    <View style={styles.featureVisualGridItem} />
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* CTA Section */}
        <View style={styles.ctaSection}>
          <View style={styles.ctaSectionBg} />
          <View style={styles.ctaSectionContent}>
            <Text style={styles.ctaSectionTitle}>Ready to get organized?</Text>
            <Text style={styles.ctaSectionText}>
              Join families who&apos;ve simplified their lives with FamilyHQ.
            </Text>
            <View style={styles.ctaSectionButtons}>
              <Link href="/auth/signup" asChild>
                <Pressable style={StyleSheet.flatten([styles.btn, styles.btnPrimary])}>
                  <Text style={styles.btnPrimaryText}>Get started free</Text>
                </Pressable>
              </Link>
              <Link href="/features" asChild>
                <Pressable style={StyleSheet.flatten([styles.btn, styles.btnGhost])}>
                  <Text style={styles.btnGhostText}>Learn more</Text>
                </Pressable>
              </Link>
            </View>
          </View>
        </View>
      </WebContainer>

      <WebFooter />
    </WebPage>
  );
}

function createStyles(theme: WebThemeShape, width: number, height: number) {
  const isMobile = width < 900;
  const isTablet = width >= 900 && width < 1200;
  const isDark = theme.colors.bg !== '#FFFFFF';
  const pageMax = 1120;
  
  const styles = StyleSheet.create({
    heroWrap: {
      position: 'relative',
      paddingVertical: isMobile ? 32 : isTablet ? 40 : 48,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      marginBottom: 32,
    },
    // Web-only background glow. RN Web supports backgroundImage.
    heroBg: {
      ...StyleSheet.absoluteFillObject,
      opacity: isDark ? 1 : 0.9,
      backgroundImage: isDark
        ? 'radial-gradient(900px 520px at 18% 18%, rgba(79,195,247,0.20) 0%, rgba(0,0,0,0) 55%), radial-gradient(780px 440px at 84% 28%, rgba(10,126,164,0.18) 0%, rgba(0,0,0,0) 55%), linear-gradient(0deg, rgba(255,255,255,0.05) 1px, rgba(0,0,0,0) 1px), linear-gradient(90deg, rgba(255,255,255,0.05) 1px, rgba(0,0,0,0) 1px)'
        : 'radial-gradient(900px 520px at 18% 18%, rgba(10,126,164,0.14) 0%, rgba(255,255,255,0) 55%), radial-gradient(780px 440px at 84% 28%, rgba(79,195,247,0.20) 0%, rgba(255,255,255,0) 55%), linear-gradient(0deg, rgba(16,24,40,0.06) 1px, rgba(255,255,255,0) 1px), linear-gradient(90deg, rgba(16,24,40,0.06) 1px, rgba(255,255,255,0) 1px)',
      backgroundSize: 'auto, auto, 36px 36px, 36px 36px',
    },
    hero: {
      position: 'relative',
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? 24 : 32,
      paddingHorizontal: isMobile ? 20 : 32,
      alignItems: isMobile ? 'stretch' : 'center',
      maxWidth: pageMax,
      alignSelf: 'center',
      width: '100%',
    },
    heroLeft: {
      flex: isMobile ? 1 : 1.2,
      minWidth: 0,
      gap: 14,
    },
    heroRight: {
      flex: isMobile ? 1 : 0.8,
      minWidth: 0,
      alignItems: isMobile ? 'center' : 'flex-end',
      justifyContent: isMobile ? 'center' : 'flex-end',
      gap: 12,
    },
    badgeRow: {
      flexDirection: 'row',
      gap: 10,
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    badge: {
      backgroundColor: isDark ? 'rgba(79,195,247,0.16)' : 'rgba(10,126,164,0.12)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(79,195,247,0.22)' : 'rgba(10,126,164,0.18)',
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
    },
    badgeText: {
      color: theme.colors.text,
      fontWeight: '900',
      fontSize: 12,
      letterSpacing: 0.4,
    },
    badgeGhost: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 999,
      backgroundColor: 'transparent',
    },
    badgeGhostText: {
      color: theme.colors.textMuted,
      fontWeight: '800',
      fontSize: 12,
      letterSpacing: 0.6,
    },
    h1: {
      color: theme.colors.text,
      fontSize: isMobile ? 28 : isTablet ? 38 : 46,
      fontWeight: '900',
      lineHeight: isMobile ? 36 : isTablet ? 46 : 54,
      letterSpacing: -0.7,
      maxWidth: '100%',
    },
    lead: {
      color: theme.colors.textMuted,
      fontSize: isMobile ? 15 : 16,
      lineHeight: isMobile ? 24 : 26,
      maxWidth: '100%',
    },
    ctaRow: {
      marginTop: 10,
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap',
    },
    btn: {
      borderRadius: 14,
      paddingHorizontal: 18,
      paddingVertical: 12,
    },
    btnPrimary: {
      backgroundColor: theme.colors.primary,
      borderWidth: 1,
      borderColor: isDark ? 'rgba(234,240,255,0.10)' : 'rgba(16,24,40,0.10)',
      boxShadow: isDark ? '0px 14px 28px rgba(79,195,247,0.18)' : '0px 14px 28px rgba(10,126,164,0.22)',
    },
    btnPrimaryText: {
      color: theme.colors.bg === '#FFFFFF' ? '#FFFFFF' : '#0B1220',
      fontWeight: '900',
      fontSize: 14,
    },
    btnGhost: {
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: isDark ? 'rgba(15,27,51,0.35)' : 'rgba(244,247,251,0.8)',
    },
    btnGhostText: {
      color: theme.colors.text,
      fontWeight: '800',
      fontSize: 14,
    },
    textLink: {
      paddingVertical: 12,
      paddingHorizontal: 4,
    },
    textLinkText: {
      color: theme.colors.textMuted,
      fontWeight: '800',
      fontSize: 13,
    },
    storeRow: {
      marginTop: 8,
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
      boxShadow: isDark ? '0px 10px 22px rgba(0,0,0,0.25)' : '0px 10px 22px rgba(16,24,40,0.08)',
    },
    storeBtnIos: {
      backgroundColor: isDark ? 'rgba(15,27,51,0.55)' : theme.colors.surface,
    },
    storeBtnAndroid: {
      backgroundColor: isDark ? 'rgba(15,27,51,0.55)' : theme.colors.surface,
    },
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
    trustRow: {
      marginTop: 10,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
      flexWrap: 'wrap',
    },
    trustText: {
      color: theme.colors.textMuted,
      fontSize: 12,
      fontWeight: '800',
      letterSpacing: 0.3,
    },
    dot: {
      width: 4,
      height: 4,
      borderRadius: 999,
      backgroundColor: theme.colors.border,
    },
    heroVisualCard: {
      width: '100%',
      maxWidth: isMobile ? '100%' : isTablet ? 380 : 420,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: isDark ? 'rgba(11,18,32,0.55)' : 'rgba(255,255,255,0.75)',
      padding: isMobile ? 14 : 18,
      boxShadow: isDark ? '0px 18px 40px rgba(0,0,0,0.35)' : '0px 18px 40px rgba(16,24,40,0.10)',
      alignSelf: isMobile ? 'center' : 'flex-end',
      aspectRatio: isMobile ? 1.2 : 1,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    heroVisualGlowA: {
      position: 'absolute',
      width: '72%',
      height: '72%',
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
      opacity: isDark ? 0.22 : 0.14,
      filter: 'blur(24px)' as any,
      transform: [{ translateX: -40 }, { translateY: -50 }],
    },
    heroVisualGlowB: {
      position: 'absolute',
      width: '58%',
      height: '58%',
      borderRadius: 999,
      backgroundColor: theme.colors.primary2,
      opacity: isDark ? 0.18 : 0.16,
      filter: 'blur(28px)' as any,
      transform: [{ translateX: 60 }, { translateY: 70 }],
    },
    deviceFrame: {
      width: '100%',
      height: '100%',
      borderRadius: isMobile ? 16 : 20,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: isDark ? 'rgba(15,27,51,0.75)' : 'rgba(244,247,251,0.9)',
      boxShadow: isDark ? '0px 18px 40px rgba(0,0,0,0.35)' : '0px 18px 40px rgba(16,24,40,0.14)',
      overflow: 'hidden',
    },
    deviceTopBar: {
      height: 38,
      paddingHorizontal: 12,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
      backgroundColor: isDark ? 'rgba(11,18,32,0.65)' : 'rgba(255,255,255,0.65)',
    },
    deviceDot: {
      width: 8,
      height: 8,
      borderRadius: 999,
      backgroundColor: isDark ? 'rgba(234,240,255,0.25)' : 'rgba(16,24,40,0.18)',
    },
    devicePill: {
      marginLeft: 'auto',
      width: 86,
      height: 10,
      borderRadius: 999,
      backgroundColor: isDark ? 'rgba(79,195,247,0.18)' : 'rgba(10,126,164,0.14)',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    deviceScreen: {
      flex: 1,
      padding: isMobile ? 10 : 14,
      gap: isMobile ? 8 : 12,
    },
    deviceHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    deviceHeaderBlock: {
      height: 12,
      width: '46%',
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(234,240,255,0.18)' : 'rgba(16,24,40,0.12)',
    },
    deviceHeaderChip: {
      height: 24,
      width: 108,
      borderRadius: 999,
      backgroundColor: isDark ? 'rgba(79,195,247,0.14)' : 'rgba(10,126,164,0.12)',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    deviceGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 10,
    },
    deviceTile: {
      flexBasis: '48%',
      height: 76,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundImage: isDark
        ? 'linear-gradient(135deg, rgba(79,195,247,0.12), rgba(10,126,164,0.10))'
        : 'linear-gradient(135deg, rgba(10,126,164,0.10), rgba(79,195,247,0.12))',
      backgroundColor: isDark ? 'rgba(11,18,32,0.45)' : 'rgba(255,255,255,0.7)',
    },
    deviceList: {
      gap: 10,
      marginTop: 4,
    },
    deviceListRow: {
      height: 14,
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.colors.border,
      backgroundColor: isDark ? 'rgba(234,240,255,0.10)' : 'rgba(16,24,40,0.08)',
    },
    // Sections
    section: {
      marginTop: isMobile ? 48 : 72,
      gap: isMobile ? 28 : 40,
    },
    sectionHeader: {
      gap: 10,
      alignItems: 'center',
      maxWidth: 720,
      alignSelf: 'center',
      textAlign: 'center',
    },
    sectionKicker: {
      color: theme.colors.primary,
      fontWeight: '800',
      fontSize: 13,
      letterSpacing: 1.5,
      textTransform: 'uppercase',
    },
    sectionTitle: {
      color: theme.colors.text,
      fontSize: isMobile ? 28 : 38,
      fontWeight: '900',
      lineHeight: isMobile ? 36 : 46,
      letterSpacing: -0.6,
      textAlign: 'center',
    },
    sectionLead: {
      color: theme.colors.textMuted,
      fontSize: 16,
      lineHeight: 26,
      textAlign: 'center',
      maxWidth: 640,
    },

    // Benefits
    benefitsGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: isMobile ? 16 : 20,
      justifyContent: 'center',
    },
    benefitCard: {
      flexBasis: (isMobile ? '100%' : isTablet ? 'calc(50% - 10px)' : 'calc(33.333% - 14px)') as any,
      backgroundColor: theme.colors.surface,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: isMobile ? 20 : 24,
      gap: 12,
      boxShadow: isDark ? '0px 12px 28px rgba(0,0,0,0.20)' : '0px 12px 28px rgba(16,24,40,0.06)',
    },
    benefitIcon: {
      width: 56,
      height: 56,
      borderRadius: 16,
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    benefitTitle: {
      color: theme.colors.text,
      fontSize: 18,
      fontWeight: '900',
      letterSpacing: -0.3,
    },
    benefitText: {
      color: theme.colors.textMuted,
      fontSize: 14,
      lineHeight: 22,
    },

    // Features
    featuresGrid: {
      gap: isMobile ? 32 : 48,
    },
    featureRow: {
      flexDirection: isMobile ? 'column' : 'row',
      gap: isMobile ? 20 : 32,
      alignItems: 'center',
    },
    featureContent: {
      flex: 1,
      gap: 12,
    },
    featureBadge: {
      backgroundColor: isDark ? 'rgba(79,195,247,0.12)' : 'rgba(10,126,164,0.10)',
      borderWidth: 1,
      borderColor: isDark ? 'rgba(79,195,247,0.18)' : 'rgba(10,126,164,0.16)',
      paddingHorizontal: 12,
      paddingVertical: 6,
      borderRadius: 999,
      alignSelf: 'flex-start',
    },
    featureBadgeText: {
      color: theme.colors.text,
      fontWeight: '800',
      fontSize: 12,
      letterSpacing: 0.6,
    },
    featureTitle: {
      color: theme.colors.text,
      fontSize: isMobile ? 24 : 32,
      fontWeight: '900',
      lineHeight: isMobile ? 32 : 40,
      letterSpacing: -0.5,
    },
    featureText: {
      color: theme.colors.textMuted,
      fontSize: 15,
      lineHeight: 24,
    },
    featureList: {
      marginTop: 8,
      gap: 10,
    },
    featureListItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    featureListText: {
      color: theme.colors.text,
      fontSize: 14,
      fontWeight: '700',
    },
    featureVisual: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    featureVisualCard: {
      width: '100%',
      maxWidth: isMobile ? 320 : 380,
      aspectRatio: 1.4,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: theme.colors.border,
      padding: isMobile ? 16 : 20,
      boxShadow: isDark ? '0px 14px 32px rgba(0,0,0,0.28)' : '0px 14px 32px rgba(16,24,40,0.08)',
      gap: 12,
    },
    featureVisualDot: {
      width: 10,
      height: 10,
      borderRadius: 999,
      backgroundColor: theme.colors.primary,
    },
    featureVisualBar: {
      height: 18,
      width: '100%',
      borderRadius: 8,
      backgroundColor: isDark ? 'rgba(234,240,255,0.12)' : 'rgba(16,24,40,0.08)',
    },
    featureVisualGrid: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
    },
    featureVisualGridItem: {
      flexBasis: 'calc(50% - 6px)' as any,
      aspectRatio: 1.2,
      borderRadius: 12,
      backgroundColor: isDark ? 'rgba(234,240,255,0.12)' : 'rgba(16,24,40,0.08)',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },

    // CTA Section
    ctaSection: {
      position: 'relative',
      marginTop: isMobile ? 48 : 72,
      marginBottom: 32,
      borderRadius: 22,
      borderWidth: 1,
      borderColor: theme.colors.border,
      overflow: 'hidden',
      backgroundColor: theme.colors.surface,
      paddingVertical: isMobile ? 40 : 56,
      paddingHorizontal: isMobile ? 20 : 32,
    },
    ctaSectionBg: {
      ...StyleSheet.absoluteFillObject,
      opacity: isDark ? 0.8 : 0.6,
      backgroundImage: isDark
        ? 'radial-gradient(800px 600px at 50% 50%, rgba(79,195,247,0.16) 0%, rgba(0,0,0,0) 60%)'
        : 'radial-gradient(800px 600px at 50% 50%, rgba(10,126,164,0.12) 0%, rgba(255,255,255,0) 60%)',
    },
    ctaSectionContent: {
      position: 'relative',
      gap: 16,
      alignItems: 'center',
      maxWidth: 640,
      alignSelf: 'center',
    },
    ctaSectionTitle: {
      color: theme.colors.text,
      fontSize: isMobile ? 28 : 38,
      fontWeight: '900',
      lineHeight: isMobile ? 36 : 46,
      letterSpacing: -0.6,
      textAlign: 'center',
    },
    ctaSectionText: {
      color: theme.colors.textMuted,
      fontSize: 16,
      lineHeight: 26,
      textAlign: 'center',
    },
    ctaSectionButtons: {
      marginTop: 8,
      flexDirection: 'row',
      gap: 12,
      alignItems: 'center',
      flexWrap: 'wrap',
      justifyContent: 'center',
    },
  });
  
  // Return properly typed styles for web compatibility
  return {
    // View styles
    heroWrap: styles.heroWrap as ViewStyle,
    heroBg: styles.heroBg as ViewStyle,
    hero: styles.hero as ViewStyle,
    heroLeft: styles.heroLeft as ViewStyle,
    heroRight: styles.heroRight as ViewStyle,
    badgeRow: styles.badgeRow as ViewStyle,
    badge: styles.badge as ViewStyle,
    badgeGhost: styles.badgeGhost as ViewStyle,
    ctaRow: styles.ctaRow as ViewStyle,
    btn: styles.btn as ViewStyle,
    btnPrimary: styles.btnPrimary as ViewStyle,
    btnGhost: styles.btnGhost as ViewStyle,
    textLink: styles.textLink as ViewStyle,
    storeRow: styles.storeRow as ViewStyle,
    storeBtn: styles.storeBtn as ViewStyle,
    storeBtnIos: styles.storeBtnIos as ViewStyle,
    storeBtnAndroid: styles.storeBtnAndroid as ViewStyle,
    trustRow: styles.trustRow as ViewStyle,
    dot: styles.dot as ViewStyle,
    heroVisualCard: styles.heroVisualCard as ViewStyle,
    heroVisualGlowA: styles.heroVisualGlowA as ViewStyle,
    heroVisualGlowB: styles.heroVisualGlowB as ViewStyle,
    deviceFrame: styles.deviceFrame as ViewStyle,
    deviceTopBar: styles.deviceTopBar as ViewStyle,
    deviceDot: styles.deviceDot as ViewStyle,
    devicePill: styles.devicePill as ViewStyle,
    deviceScreen: styles.deviceScreen as ViewStyle,
    deviceHeaderRow: styles.deviceHeaderRow as ViewStyle,
    deviceHeaderBlock: styles.deviceHeaderBlock as ViewStyle,
    deviceHeaderChip: styles.deviceHeaderChip as ViewStyle,
    deviceGrid: styles.deviceGrid as ViewStyle,
    deviceTile: styles.deviceTile as ViewStyle,
    deviceList: styles.deviceList as ViewStyle,
    deviceListRow: styles.deviceListRow as ViewStyle,
    section: styles.section as ViewStyle,
    sectionHeader: styles.sectionHeader as ViewStyle,
    benefitsGrid: styles.benefitsGrid as ViewStyle,
    benefitCard: styles.benefitCard as ViewStyle,
    benefitIcon: styles.benefitIcon as ViewStyle,
    featuresGrid: styles.featuresGrid as ViewStyle,
    featureRow: styles.featureRow as ViewStyle,
    featureContent: styles.featureContent as ViewStyle,
    featureBadge: styles.featureBadge as ViewStyle,
    featureList: styles.featureList as ViewStyle,
    featureListItem: styles.featureListItem as ViewStyle,
    featureVisual: styles.featureVisual as ViewStyle,
    featureVisualCard: styles.featureVisualCard as ViewStyle,
    featureVisualDot: styles.featureVisualDot as ViewStyle,
    featureVisualBar: styles.featureVisualBar as ViewStyle,
    featureVisualGrid: styles.featureVisualGrid as ViewStyle,
    featureVisualGridItem: styles.featureVisualGridItem as ViewStyle,
    ctaSection: styles.ctaSection as ViewStyle,
    ctaSectionBg: styles.ctaSectionBg as ViewStyle,
    ctaSectionContent: styles.ctaSectionContent as ViewStyle,
    ctaSectionButtons: styles.ctaSectionButtons as ViewStyle,
    
    // Text styles
    badgeText: styles.badgeText as TextStyle,
    badgeGhostText: styles.badgeGhostText as TextStyle,
    h1: styles.h1 as TextStyle,
    lead: styles.lead as TextStyle,
    btnPrimaryText: styles.btnPrimaryText as TextStyle,
    btnGhostText: styles.btnGhostText as TextStyle,
    textLinkText: styles.textLinkText as TextStyle,
    storeBtnTop: styles.storeBtnTop as TextStyle,
    storeBtnBottom: styles.storeBtnBottom as TextStyle,
    trustText: styles.trustText as TextStyle,
    sectionKicker: styles.sectionKicker as TextStyle,
    sectionTitle: styles.sectionTitle as TextStyle,
    sectionLead: styles.sectionLead as TextStyle,
    benefitTitle: styles.benefitTitle as TextStyle,
    benefitText: styles.benefitText as TextStyle,
    featureBadgeText: styles.featureBadgeText as TextStyle,
    featureTitle: styles.featureTitle as TextStyle,
    featureText: styles.featureText as TextStyle,
    featureListText: styles.featureListText as TextStyle,
    ctaSectionTitle: styles.ctaSectionTitle as TextStyle,
    ctaSectionText: styles.ctaSectionText as TextStyle,
  };
}


