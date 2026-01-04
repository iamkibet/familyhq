import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { Task } from '@/src/types';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { formatDate, isToday, isPast } from '@/src/utils';
import { useFamilyMembers } from '@/src/hooks/useFamilyMembers';

interface TasksCardProps {
  tasks: Task[];
}

export function TasksCard({ tasks }: TasksCardProps) {
  const router = useRouter();
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const { getUserName, getUserInitials } = useFamilyMembers();

  const allUpcomingTasks = tasks
    .filter((t) => !t.completed)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
  
  const upcomingTasks = allUpcomingTasks.slice(0, 3);
  const remainingTasksCount = allUpcomingTasks.length - 3;

  const overdueTasks = tasks.filter((t) => !t.completed && isPast(t.dueDate));

  const getTaskStatus = (task: Task) => {
    if (isPast(task.dueDate)) {
      return { text: 'Overdue', color: '#F44336', bgColor: '#FFEBEE' };
    }
    if (isToday(task.dueDate)) {
      return { text: 'Today', color: '#FF9800', bgColor: '#FFF3E0' };
    }
    return { text: formatDate(task.dueDate), color: '#666', bgColor: '#F5F5F5' };
  };

  return (
    <View style={[styles.card, isDark && styles.cardDark]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => router.push('/(tabs)/tasks')}
        activeOpacity={0.7}>
        <View style={styles.headerLeft}>
          <IconSymbol name="checkmark.square.fill" size={24} color={isDark ? '#66BB6A' : '#4CAF50'} />
          <Text style={[styles.title, isDark && styles.titleDark]}>Tasks</Text>
          {overdueTasks.length > 0 && (
            <View style={[styles.badge, { backgroundColor: '#F44336' }]}>
              <Text style={styles.badgeText}>{overdueTasks.length}</Text>
            </View>
          )}
        </View>
        <IconSymbol name="chevron.right" size={20} color={isDark ? '#938F99' : '#999'} />
      </TouchableOpacity>

      <View style={styles.content}>
        {upcomingTasks.length === 0 ? (
          <View style={styles.emptyState}>
            <IconSymbol name="checkmark.square" size={48} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>No tasks</Text>
            <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
              All caught up!
            </Text>
          </View>
        ) : (
          <View style={styles.tasksList}>
            {upcomingTasks.map((task) => {
              const status = getTaskStatus(task);
              return (
                <View 
                  key={task.id} 
                  style={[
                    styles.taskCard,
                    isDark && styles.taskCardDark
                  ]}>
                  <View style={styles.taskContent}>
                    <View style={styles.taskHeader}>
                      <Text style={[styles.taskTitle, isDark && styles.taskTitleDark]} numberOfLines={2}>
                        {task.title}
                      </Text>
                      <View style={styles.statusRow}>
                        <View
                          style={[
                            styles.statusBadge,
                            { backgroundColor: isDark ? '#3C3C3C' : status.bgColor },
                          ]}>
                          <Text style={[styles.statusText, { color: status.color }]}>
                            {status.text}
                          </Text>
                        </View>
                        <View style={[styles.avatar, { backgroundColor: status.color }]}>
                          <Text style={styles.avatarText}>{getUserInitials(task.assignedTo)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </View>
              );
            })}
            {remainingTasksCount > 0 && (
              <View style={styles.moreContainer}>
                <Text style={[styles.moreTasks, isDark && styles.moreTasksDark]}>
                  +{remainingTasksCount} more task{remainingTasksCount !== 1 ? 's' : ''}
                </Text>
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
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  content: {
    flex: 1,
  },
  tasksList: {
    gap: 0,
  },
  taskCard: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  taskCardDark: {
    borderBottomColor: '#2C2C2C',
  },
  taskContent: {
    gap: 0,
  },
  taskHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    flex: 1,
    lineHeight: 22,
    letterSpacing: -0.2,
  },
  taskTitleDark: {
    color: '#E6E1E5',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  avatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
  },
  moreContainer: {
    paddingTop: 16,
    paddingBottom: 4,
    alignItems: 'center',
  },
  moreTasks: {
    fontSize: 13,
    color: '#999',
    fontWeight: '500',
    fontStyle: 'italic',
  },
  moreTasksDark: {
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

