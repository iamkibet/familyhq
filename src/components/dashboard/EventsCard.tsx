import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { FamilyEvent } from '@/src/types';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatDate, isToday, isPast } from '@/src/utils';

interface EventsCardProps {
  events: FamilyEvent[];
}

export function EventsCard({ events }: EventsCardProps) {
  const router = useRouter();
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';

  const allUpcomingEvents = events
    .filter((e) => {
      const eventDate = new Date(e.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Show up to 5 events (more can fit in the 400px card)
  const maxVisibleEvents = 5;
  const upcomingEvents = allUpcomingEvents.slice(0, maxVisibleEvents);
  const remainingEventsCount = allUpcomingEvents.length > maxVisibleEvents 
    ? allUpcomingEvents.length - maxVisibleEvents 
    : 0;

  const getEventStatus = (date: string) => {
    if (isToday(date)) {
      return { text: 'Today', color: '#0a7ea4', bgColor: '#E3F2FD' };
    }
    if (isPast(date)) {
      return { text: formatDate(date), color: '#999', bgColor: '#F5F5F5' };
    }
    return { text: formatDate(date), color: '#666', bgColor: '#F5F5F5' };
  };

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push('/(tabs)/calendar')}
        activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <IconSymbol name="calendar" size={24} color={isDark ? '#AB47BC' : '#9C27B0'} />
          <Text style={[styles.title, isDark && styles.titleDark]}>Events</Text>
        </View>
        <IconSymbol name="chevron.right" size={20} color={isDark ? '#938F99' : '#999'} />
      </TouchableOpacity>

      <View style={styles.content}>
        {upcomingEvents.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="calendar" size={48} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>No events</Text>
            <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
              Add events to your calendar
            </Text>
          </View>
        ) : (
          <View style={styles.eventsList}>
            {upcomingEvents.map((event, index) => {
              const status = getEventStatus(event.date);
              const isLast = index === upcomingEvents.length - 1;
              return (
                <View 
                  key={event.id} 
                  style={[
                    styles.timelineItem,
                    isDark && styles.timelineItemDark
                  ]}>
                  <View style={styles.timelineLeft}>
                    <View style={[styles.timelineDot, { backgroundColor: status.color }]} />
                  </View>
                  <View style={styles.timelineContent}>
                    <View style={styles.eventHeader}>
                      <Text style={[styles.eventTitle, isDark && styles.eventTitleDark]} numberOfLines={2}>
                        {event.title}
                      </Text>
                      <View
                        style={[
                          styles.dateBadge,
                          { backgroundColor: isDark ? '#3C3C3C' : status.bgColor },
                        ]}>
                        <Text style={[styles.dateText, { color: status.color }]}>
                          {status.text}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
            {remainingEventsCount > 0 && (
              <View style={[styles.moreContainer, styles.timelineItem]}>
                <View style={styles.timelineLeft} />
                <View style={styles.timelineContent}>
                  <Text style={[styles.moreEvents, isDark && styles.moreEventsDark]}>
                    +{remainingEventsCount} more event{remainingEventsCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    height: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardDark: {
    backgroundColor: '#2C2C2C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
  },
  titleDark: {
    color: '#E6E1E5',
  },
  content: {
    flex: 1,
  },
  eventsList: {
    gap: 0,
    paddingLeft: 8,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  timelineItemDark: {
    borderBottomColor: '#2C2C2C',
  },
  timelineLeft: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  timelineDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  timelineContent: {
    flex: 1,
    justifyContent: 'center',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center', // Align items vertically centered
    gap: 8,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    lineHeight: 22,
    letterSpacing: -0.2,
    flex: 1, // Allow title to take available space
  },
  eventTitleDark: {
    color: '#E6E1E5',
  },
  dateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    alignSelf: 'center', // Center align the badge vertically
    minWidth: 70, // Slightly wider for alignment
    alignItems: 'center', // Center text inside badge
    justifyContent: 'center',
    marginLeft: 8,
  },
  dateText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  moreContainer: {
    paddingTop: 8,
    alignItems: 'center',
  },
  moreEvents: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  moreEventsDark: {
    color: '#666',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    marginTop: 16,
    marginBottom: 4,
  },
  emptyTextDark: {
    color: '#666',
  },
  emptySubtext: {
    fontSize: 13,
    color: '#999',
  },
  emptySubtextDark: {
    color: '#666',
  },
});

