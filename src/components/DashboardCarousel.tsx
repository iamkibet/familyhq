import React, { useRef, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SECTION_PADDING_H = 24; // Matches theme spacing.screenHorizontal so content aligns with section titles
const CARD_SPACING = 16;
const CONTENT_WIDTH = SCREEN_WIDTH - SECTION_PADDING_H * 2;
const CARD_WIDTH = CONTENT_WIDTH - CARD_SPACING;
const END_PADDING = SECTION_PADDING_H;

interface DashboardCarouselProps {
  children: React.ReactNode[];
  onPageChange?: (index: number) => void;
}

export function DashboardCarousel({ children, onPageChange }: DashboardCarouselProps) {
  const scrollViewRef = useRef<ScrollView>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';

  const validChildren = children.filter(Boolean);
  // Total width for snap calculation: card width + spacing (or padding for last card)
  const snapInterval = CARD_WIDTH + CARD_SPACING;

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / snapInterval);
    
    if (index !== currentIndex && index >= 0 && index < validChildren.length) {
      setCurrentIndex(index);
      onPageChange?.(index);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={snapInterval}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        bounces={false}
        pagingEnabled={false}>
        {validChildren.map((child, index) => (
          <View 
            key={index} 
            style={[
              styles.cardContainer,
              {
                width: CARD_WIDTH,
                marginLeft: index === 0 ? 0 : CARD_SPACING,
                marginRight: index === validChildren.length - 1 ? END_PADDING : 0,
              },
            ]}>
            {child}
          </View>
        ))}
      </ScrollView>
      
      {/* Page Indicators */}
      {validChildren.length > 1 && (
        <View style={styles.indicators}>
          {validChildren.map((_, index) => (
            <View
              key={index}
              style={[
                styles.indicator,
                index === currentIndex && styles.indicatorActive,
                isDark && styles.indicatorDark,
                index === currentIndex && isDark && styles.indicatorActiveDark,
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    marginBottom: 24,
  },
  scrollContent: {
    alignItems: 'flex-start',
    paddingVertical: 4,
  },
  cardContainer: {},
  indicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
    paddingHorizontal: 0,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E0E0E0',
  },
  indicatorDark: {
    backgroundColor: '#3C3C3C',
  },
  indicatorActive: {
    width: 24,
    backgroundColor: '#0a7ea4',
  },
  indicatorActiveDark: {
    backgroundColor: '#4FC3F7',
  },
});

