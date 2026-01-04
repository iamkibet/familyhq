import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatRelativeTime } from '@/src/utils';
import { Task, FamilyEvent, ShoppingList } from '@/src/types';

export interface Activity {
  id: string;
  type: 'task' | 'event' | 'shopping_list';
  title: string;
  userName: string;
  timestamp: any; // Timestamp or Date
  icon: string;
  color: string;
}

interface ActivityFeedProps {
  visible: boolean;
  onClose: () => void;
  activities: Activity[];
  loading?: boolean;
  onMarkAsRead?: (activityId: string) => void;
  readActivityIds?: Set<string>;
}

export function ActivityFeed({ 
  visible, 
  onClose, 
  activities, 
  loading = false,
  onMarkAsRead,
  readActivityIds = new Set(),
}: ActivityFeedProps) {
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';

  // Filter out read activities
  const unreadActivities = activities.filter(activity => !readActivityIds.has(activity.id));

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}>
        <TouchableOpacity
          activeOpacity={1}
          onPress={(e) => e.stopPropagation()}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={[styles.header, isDark && styles.headerDark]}>
              <Text style={[styles.title, isDark && styles.titleDark]}>Recent Activity</Text>
              <TouchableOpacity
                onPress={onClose}
                style={[styles.closeButton, isDark && styles.closeButtonDark]}
                activeOpacity={0.7}>
                <IconSymbol name="xmark" size={18} color={isDark ? '#938F99' : '#666'} />
              </TouchableOpacity>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={isDark ? '#4FC3F7' : '#0a7ea4'} />
              </View>
            ) : unreadActivities.length === 0 ? (
              <View style={styles.emptyContainer}>
                <IconSymbol name="bell.fill" size={48} color={isDark ? '#666' : '#999'} />
                <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                  No unread activity
                </Text>
                <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
                  All activities have been read
                </Text>
              </View>
            ) : (
              <ScrollView 
                style={styles.activitiesList} 
                showsVerticalScrollIndicator={false}>
                {unreadActivities.map((activity) => (
                  <TouchableOpacity
                    key={activity.id}
                    style={styles.activityItem}
                    onPress={() => onMarkAsRead?.(activity.id)}
                    activeOpacity={0.7}>
                    <View style={[styles.activityIconContainer, { backgroundColor: activity.color + '20' }]}>
                      <IconSymbol name={activity.icon} size={20} color={activity.color} />
                    </View>
                    <View style={styles.activityContent}>
                      <Text style={[styles.activityText, isDark && styles.activityTextDark]}>
                        <Text style={[styles.activityUserName, isDark && styles.activityUserNameDark]}>
                          {activity.userName}
                        </Text>
                        {' '}
                        {activity.title}
                      </Text>
                      <Text style={[styles.activityTime, isDark && styles.activityTimeDark]}>
                        {formatRelativeTime(activity.timestamp)}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    width: '100%',
    maxHeight: '85%',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
  },
  modalContentDark: {
    backgroundColor: '#2C2C2C',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerDark: {
    borderBottomColor: '#3C3C3C',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  titleDark: {
    color: '#E6E1E5',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  closeButtonDark: {
    backgroundColor: '#3C3C3C',
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyTextDark: {
    color: '#938F99',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  emptySubtextDark: {
    color: '#666',
  },
  activitiesList: {
    padding: 20,
    paddingTop: 8,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  activityIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
    paddingTop: 2,
  },
  activityText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
  },
  activityTextDark: {
    color: '#E6E1E5',
  },
  activityUserName: {
    fontWeight: '600',
    color: '#0a7ea4',
  },
  activityUserNameDark: {
    color: '#4FC3F7',
  },
  activityTime: {
    fontSize: 12,
    color: '#999',
  },
  activityTimeDark: {
    color: '#666',
  },
});

