import React from 'react';
import { View, Text, StyleSheet, ImageBackground, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { Family } from '@/src/types';
import * as storageService from '@/src/services/storageService';

const { width } = Dimensions.get('window');

interface HeroSectionProps {
  family: Family | null;
}

export function HeroSection({ family }: HeroSectionProps) {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';

  const heroImageData = family?.heroImageUrl;
  const familyName = family?.name || 'Your';
  const heroImageUri = heroImageData ? storageService.getImageUri(heroImageData) : null;

  return (
    <View style={styles.container}>
      {heroImageUri ? (
        <ImageBackground
          source={{ uri: heroImageUri }}
          style={styles.imageBackground}
          imageStyle={styles.imageStyle}
          resizeMode="cover">
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
            style={styles.gradient}>
            <View style={styles.content}>
              <Text style={styles.welcomeText}>Welcome to</Text>
              <View style={styles.familyNameContainer}>
                <Text style={styles.familyName}>{familyName}'s</Text>
                <Text style={styles.familyLabel}>Family</Text>
              </View>
            </View>
          </LinearGradient>
        </ImageBackground>
      ) : (
        <View style={[styles.placeholder, isDark && styles.placeholderDark]}>
          <View style={styles.content}>
            <Text style={[styles.welcomeText, styles.welcomeTextPlaceholder, isDark && styles.welcomeTextPlaceholderDark]}>
              Welcome to
            </Text>
            <View style={styles.familyNameContainer}>
              <Text style={[styles.familyName, styles.familyNamePlaceholder, isDark && styles.familyNamePlaceholderDark]}>
                {familyName}'s
              </Text>
              <Text style={[styles.familyLabel, styles.familyLabelPlaceholder, isDark && styles.familyLabelPlaceholderDark]}>
                Family
              </Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: 280,
    marginBottom: 20,
  },
  imageBackground: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
  },
  imageStyle: {
    borderRadius: 0,
  },
  gradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 32,
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#0a7ea4',
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 32,
  },
  placeholderDark: {
    backgroundColor: '#1C3A4A',
  },
  content: {
    width: '100%',
  },
  welcomeText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    letterSpacing: 0.5,
    opacity: 0.95,
  },
  welcomeTextPlaceholder: {
    opacity: 0.9,
  },
  welcomeTextPlaceholderDark: {
    color: '#E6E1E5',
  },
  familyNameContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
  },
  familyName: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginRight: 8,
  },
  familyNamePlaceholder: {
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
  },
  familyNamePlaceholderDark: {
    color: '#E6E1E5',
  },
  familyLabel: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -0.3,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  familyLabelPlaceholder: {
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
  },
  familyLabelPlaceholderDark: {
    color: '#E6E1E5',
  },
});

