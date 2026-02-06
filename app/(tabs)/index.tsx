import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  FadeIn,
  FadeInDown,
  withTiming,
  useSharedValue,
} from 'react-native-reanimated';

// Stores and Hooks
import { useAuthStore } from '@/src/stores/authStore';
import { useShoppingStore } from '@/src/stores/shoppingStore';
import { useTaskStore } from '@/src/stores/taskStore';
import { useCalendarStore } from '@/src/stores/calendarStore';
import { useBudgetStore } from '@/src/stores/budgetStore';
import { useDirectExpenseStore } from '@/src/stores/directExpenseStore';
import { useNotesStore } from '@/src/stores/notesStore';
import { useFamilyData } from '@/src/hooks/useFamilyData';
import { useFamilyMembers } from '@/src/hooks/useFamilyMembers';
import { useReadActivitiesStore } from '@/src/stores/readActivitiesStore';
import { useMealPlannerStore } from '@/src/stores/mealPlannerStore';
import {
  formatDateForInput,
  TimePeriod,
  isDateInRange,
} from '@/src/utils';
import { FamilyEvent, BudgetCategory } from '@/src/types';
import { useThemeScheme } from '@/hooks/use-theme-scheme';

// Components
import { IconSymbol } from '@/components/ui/icon-symbol';
import { TimePeriodSelector } from '@/src/components/TimePeriodSelector';
import { DashboardCarousel } from '@/src/components/DashboardCarousel';
import { BudgetCard } from '@/src/components/dashboard/BudgetCard';
import { ShoppingCard } from '@/src/components/dashboard/ShoppingCard';
import { TasksCard } from '@/src/components/dashboard/TasksCard';
import { EventsCard } from '@/src/components/dashboard/EventsCard';
import { NotesCard } from '@/src/components/dashboard/NotesCard';
import { HeroSection } from '@/src/components/dashboard/HeroSection';
import { TodayMealsCard } from '@/src/components/dashboard/TodayMealsCard';
import { ActivityFeed, Activity } from '@/src/components/dashboard/ActivityFeed';

// Theme
import { colors } from '@/src/theme/colors';
import { spacing } from '@/src/theme/spacing';
import { typography } from '@/src/theme/typography';
import { radius } from '@/src/theme/radius';

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const QUICK_ACTION_GAP = 12;
const QUICK_ACTION_CARD_WIDTH = (SCREEN_WIDTH - spacing.screenHorizontal * 2 - QUICK_ACTION_GAP) / 2;

export default function HomeScreen() {
  useFamilyData();
  const router = useRouter();
  const colorScheme = useThemeScheme();
  const insets = useSafeAreaInsets();
  const isDark = colorScheme === 'dark';
  const { userData, family } = useAuthStore();
  const { members: familyMembers, getUserName } = useFamilyMembers();
  const { lists: shoppingLists, items: allShoppingItems, subscribeToLists, subscribeToAllItems } = useShoppingStore();
  const { expenses: directExpenses, subscribeToExpenses, clearExpenses } = useDirectExpenseStore();

  useEffect(() => {
    if (family?.id) {
      subscribeToExpenses(family.id);
      subscribeToLists(family.id);
    }
    return () => {
      clearExpenses();
    };
  }, [family?.id, subscribeToExpenses, subscribeToLists, clearExpenses]);

  useEffect(() => {
    if (family?.id && shoppingLists.length > 0) {
      subscribeToAllItems(family.id);
    }
  }, [family?.id, shoppingLists.length, subscribeToAllItems]);

  const { readActivityIds, loadReadActivities, markAsRead } = useReadActivitiesStore();
  useEffect(() => {
    if (userData?.id) {
      loadReadActivities(userData.id);
    }
  }, [userData?.id, loadReadActivities]);

  const { tasks, addTask } = useTaskStore();
  const { events, addEvent, updateEvent } = useCalendarStore();
  const { categories: budgetCategories, activePeriod } = useBudgetStore();
  const { notes, subscribeToNotes, clearNotes } = useNotesStore();
  const { loadWeek, getEntriesByDate, weekStart, weekEnd, entries: mealPlannerEntries } = useMealPlannerStore();

  const todayStr = formatDateForInput(new Date());

  useEffect(() => {
    if (family?.id) {
      loadWeek(family.id, new Date());
    }
  }, [family?.id, loadWeek]);

  const mealPlannerEntriesByDate = useMemo(
    () => {
      if (!weekStart || !weekEnd) return {};
      return getEntriesByDate(weekStart, weekEnd);
    },
    [weekStart, weekEnd, getEntriesByDate, mealPlannerEntries]
  );

  useEffect(() => {
    if (userData?.id) {
      const unsubscribe = subscribeToNotes(userData.id);
      return () => {
        unsubscribe();
        clearNotes();
      };
    }
  }, [userData?.id, subscribeToNotes, clearNotes]);

  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null);
  const [eventFormData, setEventFormData] = useState({
    title: '',
    date: formatDateForInput(new Date()),
    description: '',
  });

  const [taskFormData, setTaskFormData] = useState({
    title: '',
    assignedTo: userData?.id || '',
    dueDate: formatDateForInput(new Date()),
  });

  const [selectedTimePeriod, setSelectedTimePeriod] = useState<TimePeriod>('thisMonth');
  const [activityFeedVisible, setActivityFeedVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const headerOpacity = useSharedValue(1);

  const getExpenseDate = (timestamp: { toMillis: () => number } | Date | string | null | undefined): string | null => {
    if (!timestamp) return null;
    try {
      let date: Date;
      if (typeof timestamp === 'string') {
        date = new Date(timestamp);
      } else if (timestamp instanceof Date) {
        date = timestamp;
      } else if (timestamp && typeof timestamp.toMillis === 'function') {
        date = new Date(timestamp.toMillis());
      } else {
        return null;
      }
      if (isNaN(date.getTime())) return null;
      return formatDateForInput(date);
    } catch {
      return null;
    }
  };

  const activeBudgets = useMemo(() => {
    if (!activePeriod) return [];
    return budgetCategories.filter((cat) => cat.budgetPeriodId === activePeriod.id);
  }, [activePeriod, budgetCategories]);

  const calculateCategorySpent = useCallback(
    (category: BudgetCategory): number => {
      if (!activePeriod) return 0;

      const categoryDirectExpenses = directExpenses.filter((exp) => {
        if (exp.budgetCategoryName !== category.name) return false;
        const expenseDate = getExpenseDate(exp.createdAt);
        if (!expenseDate) return false;
        return isDateInRange(expenseDate, activePeriod.startDate, activePeriod.endDate);
      });

      const categoryShoppingItems = allShoppingItems.filter((item) => {
        if (!item.isBought || item.budgetCategoryName !== category.name) return false;
        const itemDate = getExpenseDate(item.createdAt);
        if (!itemDate) return false;
        return isDateInRange(itemDate, activePeriod.startDate, activePeriod.endDate);
      });

      const directExpenseTotal = categoryDirectExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
      const shoppingItemTotal = categoryShoppingItems.reduce(
        (sum, item) => sum + (item.estimatedPrice || 0) * (item.quantity || 0),
        0
      );

      return directExpenseTotal + shoppingItemTotal;
    },
    [activePeriod, directExpenses, allShoppingItems]
  );

  const budgetStats = useMemo(() => {
    if (!activePeriod || activeBudgets.length === 0) {
      return {
        totalLimit: 0,
        totalSpent: 0,
        totalRemaining: 0,
        percentageUsed: 0,
        pieChartData: [] as { name: string; value: number; color: string }[],
      };
    }

    const totalLimit = activeBudgets.reduce((sum, cat) => sum + cat.limit, 0);
    const totalSpent = activeBudgets.reduce((sum, cat) => sum + calculateCategorySpent(cat), 0);
    const totalRemaining = totalLimit - totalSpent;
    const percentageUsed = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

    const pieChartColors = isDark
      ? ['#4FC3F7', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC', '#26C6DA', '#FFCA28']
      : ['#0a7ea4', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#FFC107'];

    const pieChartData = activeBudgets
      .map((cat) => {
        const spent = calculateCategorySpent(cat);
        return { category: cat, spent };
      })
      .filter(({ spent }) => spent > 0)
      .map(({ category, spent }, index) => ({
        name: category.name,
        value: spent,
        color: pieChartColors[index % pieChartColors.length],
      }));

    return {
      totalLimit,
      totalSpent,
      totalRemaining,
      percentageUsed,
      pieChartData,
    };
  }, [activePeriod, activeBudgets, calculateCategorySpent, isDark]);

  const {
    totalLimit: totalBudgetLimit = 0,
    totalSpent: totalBudgetSpent = 0,
    totalRemaining: totalBudgetRemaining = 0,
    percentageUsed: budgetPercentageUsed = 0,
    pieChartData = [],
  } = budgetStats;

  const getBudgetStatusColor = (percentage: number) => {
    if (percentage >= 100) return '#F44336';
    if (percentage >= 80) return '#FF9800';
    return isDark ? '#4FC3F7' : '#0a7ea4';
  };

  const activeShoppingLists = shoppingLists.filter((list) => !list.completed);

  const activities = useMemo(() => {
    const activityList: Activity[] = [];

    tasks.forEach((task) => {
      if (task.createdAt) {
        activityList.push({
          id: `task-${task.id}`,
          type: 'task',
          title: `added a task: "${task.title}"`,
          userName: getUserName(task.createdBy),
          timestamp: task.createdAt,
          icon: 'checkmark.square.fill',
          color: isDark ? '#66BB6A' : '#4CAF50',
        });
      }
    });

    events.forEach((event) => {
      if (event.createdAt) {
        activityList.push({
          id: `event-${event.id}`,
          type: 'event',
          title: `added an event: "${event.title}"`,
          userName: getUserName(event.createdBy),
          timestamp: event.createdAt,
          icon: 'calendar',
          color: isDark ? '#AB47BC' : '#9C27B0',
        });
      }
    });

    shoppingLists.forEach((list) => {
      if (list.createdAt) {
        activityList.push({
          id: `shopping-${list.id}`,
          type: 'shopping_list',
          title: `created a shopping list: "${list.name}"`,
          userName: getUserName(list.createdBy),
          timestamp: list.createdAt,
          icon: 'cart.fill',
          color: isDark ? '#4FC3F7' : '#0a7ea4',
        });
      }
    });

    return activityList
      .sort((a, b) => {
        const timeA = a.timestamp?.toMillis ? a.timestamp.toMillis() : new Date(a.timestamp).getTime();
        const timeB = b.timestamp?.toMillis ? b.timestamp.toMillis() : new Date(b.timestamp).getTime();
        return timeB - timeA;
      })
      .slice(0, 10);
  }, [tasks, events, shoppingLists, getUserName, isDark]);

  const unreadActivities = useMemo(
    () => activities.filter((activity) => !readActivityIds.has(activity.id)),
    [activities, readActivityIds]
  );
  const notificationCount = unreadActivities.length;

  const openAddEventModal = () => {
    setEditingEvent(null);
    setEventFormData({
      title: '',
      date: formatDateForInput(new Date()),
      description: '',
    });
    setEventModalVisible(true);
  };

  const handleSaveEvent = async () => {
    if (!eventFormData.title.trim()) {
      Alert.alert('Error', 'Please enter an event title');
      return;
    }
    if (!family?.id || !userData) {
      Alert.alert('Error', 'Family not found');
      return;
    }
    try {
      const eventData = {
        title: eventFormData.title.trim(),
        date: eventFormData.date,
        description: eventFormData.description.trim() || undefined,
        createdBy: userData.id,
      };
      if (editingEvent) {
        await updateEvent(editingEvent.id, eventData);
      } else {
        await addEvent(family.id, eventData);
      }
      setEventModalVisible(false);
      setEditingEvent(null);
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to save event');
    }
  };

  const openAddTaskModal = () => {
    setTaskFormData({
      title: '',
      assignedTo: userData?.id || '',
      dueDate: formatDateForInput(new Date()),
    });
    setTaskModalVisible(true);
  };

  const handleSaveTask = async () => {
    if (!taskFormData.title.trim()) {
      Alert.alert('Error', 'Please enter a task title');
      return;
    }
    if (!family?.id || !userData) {
      Alert.alert('Error', 'Family not found');
      return;
    }
    try {
      await addTask(family.id, {
        title: taskFormData.title.trim(),
        assignedTo: taskFormData.assignedTo,
        dueDate: taskFormData.dueDate,
        completed: false,
        createdBy: userData.id,
      });
      setTaskModalVisible(false);
    } catch (error: unknown) {
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to add task');
    }
  };

  const onRefresh = useCallback(async () => {
    if (!family?.id) return;
    setRefreshing(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 800));
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setRefreshing(false);
    }
  }, [family?.id]);

  const palette = colors[isDark ? 'dark' : 'light'];

  const quickActions = [
    {
      id: 'shopping',
      label: 'Shopping',
      icon: 'cart.fill' as const,
      color: palette.primary,
      onPress: () => router.push('/(tabs)/shopping'),
    },
    {
      id: 'task',
      label: 'Task',
      icon: 'checkmark.square.fill' as const,
      color: palette.success,
      onPress: openAddTaskModal,
    },
    {
      id: 'event',
      label: 'Event',
      icon: 'calendar' as const,
      color: palette.secondary,
      onPress: openAddEventModal,
    },
    {
      id: 'budget',
      label: 'Budget',
      icon: 'dollarsign.circle.fill' as const,
      color: palette.warning,
      onPress: () => router.push('/(tabs)/budget'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: palette.background }]}>
      <Animated.ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.scrollContent,
          Platform.OS === 'android' && { paddingTop: 48 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={palette.primary}
            colors={[palette.primary]}
            progressBackgroundColor={palette.surfaceSecondary}
          />
        }
        scrollEventThrottle={16}
        onScroll={(e) => {
          const offsetY = e.nativeEvent.contentOffset.y;
          headerOpacity.value = withTiming(offsetY > 100 ? 0.95 : 1);
        }}
      >
        <Animated.View entering={FadeIn.duration(800)}>
          <LinearGradient
            colors={
              isDark
                ? [palette.surfaceTertiary, palette.background]
                : ['rgba(10, 126, 164, 0.03)', 'rgba(10, 126, 164, 0.01)']
            }
            style={[
              styles.heroContainer,
              {
                paddingTop:
                  Platform.OS === 'android'
                    ? spacing.lg
                    : Math.max(insets.top, spacing.md),
              },
            ]}
          >
            <HeroSection
              familyName={family?.name}
              onNotificationPress={() => setActivityFeedVisible(true)}
              notificationCount={notificationCount}
            />
          </LinearGradient>
        </Animated.View>

        <Animated.View style={styles.section} entering={FadeInDown.delay(100).duration(600)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: palette.foreground }]}>{`Today's Menu`}</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/meal-planner')} activeOpacity={0.8}>
              <Text style={[styles.viewAllText, { color: palette.primary }]}>See all</Text>
            </TouchableOpacity>
          </View>
          <TodayMealsCard todayStr={todayStr} entriesByDate={mealPlannerEntriesByDate} />
        </Animated.View>

        <Animated.View style={styles.section} entering={FadeInDown.delay(200).duration(600)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: palette.foreground }]}>Family Dashboard</Text>
            <TimePeriodSelector selectedPeriod={selectedTimePeriod} onPeriodChange={setSelectedTimePeriod} />
          </View>
          <DashboardCarousel>
            <BudgetCard
              categories={activeBudgets}
              totalLimit={totalBudgetLimit}
              totalSpent={totalBudgetSpent}
              totalRemaining={totalBudgetRemaining}
              percentageUsed={budgetPercentageUsed}
              pieChartData={pieChartData}
              activePeriod={activePeriod}
              calculateCategorySpent={(categoryName: string) => {
                const category = activeBudgets.find((c) => c.name === categoryName);
                return category ? calculateCategorySpent(category) : 0;
              }}
              getBudgetStatusColor={getBudgetStatusColor}
            />
            <ShoppingCard activeLists={activeShoppingLists} allItems={allShoppingItems} />
            <TasksCard tasks={tasks} />
            <EventsCard events={events} />
          </DashboardCarousel>
        </Animated.View>

        <Animated.View style={styles.section} entering={FadeInDown.delay(300).duration(600)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: palette.foreground }]}>Quick Actions</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickActionsScrollContent}
            snapToInterval={QUICK_ACTION_CARD_WIDTH + QUICK_ACTION_GAP}
            snapToAlignment="start"
            decelerationRate="fast"
            scrollEventThrottle={16}
          >
            {quickActions.map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.quickActionCard,
                  {
                    backgroundColor: palette.surface,
                    borderColor: palette.border,
                    marginLeft: index === 0 ? 0 : QUICK_ACTION_GAP,
                    width: QUICK_ACTION_CARD_WIDTH,
                  },
                  isDark && styles.quickActionCardShadowDark,
                ]}
                onPress={action.onPress}
                activeOpacity={0.8}
              >
                <View style={[styles.quickActionIconWrap, { backgroundColor: `${action.color}18` }]}>
                  <IconSymbol name={action.icon} size={26} color={action.color} />
                </View>
                <Text style={[styles.quickActionLabel, { color: palette.foreground }]} numberOfLines={1}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </Animated.View>

        <Animated.View style={styles.section} entering={FadeInDown.delay(400).duration(600)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: palette.foreground }]}>Recent Notes</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/notes')}>
              <Text style={[styles.viewAllText, { color: palette.primary }]}>View All</Text>
            </TouchableOpacity>
          </View>
          <NotesCard notes={notes.slice(0, 3)} />
        </Animated.View>

        <Animated.View style={styles.section} entering={FadeInDown.delay(500).duration(600)}>
          <View style={[styles.quoteCard, { backgroundColor: palette.surfaceTertiary }]}>
            <IconSymbol name="quote.opening" size={24} color={palette.muted} />
            <Text style={[styles.quoteText, { color: palette.foreground }]}>
              Together, we can achieve anything. Family is where life begins and love never ends.
            </Text>
            <Text style={[styles.quoteAuthor, { color: palette.muted }]}>— Family First</Text>
          </View>
        </Animated.View>
      </Animated.ScrollView>

      {family && (
        <AnimatedTouchableOpacity
          style={[styles.fab, { backgroundColor: palette.primary }]}
          onPress={() => {
            Alert.alert('Add New', 'What would you like to add?', [
              { text: 'Shopping List', onPress: () => router.push('/(tabs)/shopping') },
              { text: 'Task', onPress: openAddTaskModal },
              { text: 'Event', onPress: openAddEventModal },
              { text: 'Cancel', style: 'cancel' },
            ]);
          }}
          activeOpacity={0.8}
          entering={FadeIn.delay(800).duration(600)}
        >
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </AnimatedTouchableOpacity>
      )}

      <ActivityFeed
        visible={activityFeedVisible}
        onClose={() => setActivityFeedVisible(false)}
        activities={activities}
        readActivityIds={readActivityIds}
        onMarkAsRead={async (activityId: string) => {
          if (userData?.id) {
            try {
              await markAsRead(userData.id, activityId);
            } catch (error) {
              console.error('Failed to mark activity as read:', error);
            }
          }
        }}
      />

      <Modal
        visible={eventModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setEventModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: palette.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                <Text style={[styles.modalTitle, { color: palette.foreground }]}>
                  {editingEvent ? 'Edit Event' : 'New Event'}
                </Text>
                <TouchableOpacity onPress={() => setEventModalVisible(false)} style={styles.modalClose}>
                  <IconSymbol name="xmark.circle.fill" size={24} color={palette.muted} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.modalLabel, { color: palette.foreground }]}>Event Title</Text>
                <TextInput
                  style={[styles.modalInput, { color: palette.foreground, borderColor: palette.border }]}
                  placeholder="Family dinner..."
                  placeholderTextColor={palette.muted}
                  value={eventFormData.title}
                  onChangeText={(text) => setEventFormData({ ...eventFormData, title: text })}
                  autoFocus
                />

                <Text style={[styles.modalLabel, { color: palette.foreground }]}>Date</Text>
                <TextInput
                  style={[styles.modalInput, { color: palette.foreground, borderColor: palette.border }]}
                  value={eventFormData.date}
                  onChangeText={(text) => setEventFormData({ ...eventFormData, date: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={palette.muted}
                />

                <Text style={[styles.modalLabel, { color: palette.foreground }]}>Description</Text>
                <TextInput
                  style={[styles.modalInput, styles.modalTextArea, { color: palette.foreground, borderColor: palette.border }]}
                  placeholder="Add details..."
                  placeholderTextColor={palette.muted}
                  value={eventFormData.description}
                  onChangeText={(text) => setEventFormData({ ...eventFormData, description: text })}
                  multiline
                  numberOfLines={3}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel, { borderColor: palette.border }]}
                    onPress={() => setEventModalVisible(false)}
                  >
                    <Text style={[styles.modalButtonTextCancel, { color: palette.foreground }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: palette.primary }]}
                    onPress={handleSaveEvent}
                  >
                    <Text style={styles.modalButtonTextPrimary}>{editingEvent ? 'Update' : 'Create'}</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      <Modal
        visible={taskModalVisible}
        animationType="slide"
        transparent
        statusBarTranslucent
        onRequestClose={() => setTaskModalVisible(false)}
      >
        <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.5)' }]}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}
          >
            <View style={[styles.modalContent, { backgroundColor: palette.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: palette.border }]}>
                <Text style={[styles.modalTitle, { color: palette.foreground }]}>New Task</Text>
                <TouchableOpacity onPress={() => setTaskModalVisible(false)} style={styles.modalClose}>
                  <IconSymbol name="xmark.circle.fill" size={24} color={palette.muted} />
                </TouchableOpacity>
              </View>

              <View style={styles.modalBody}>
                <Text style={[styles.modalLabel, { color: palette.foreground }]}>Task Title</Text>
                <TextInput
                  style={[styles.modalInput, { color: palette.foreground, borderColor: palette.border }]}
                  placeholder="Clean the garage..."
                  placeholderTextColor={palette.muted}
                  value={taskFormData.title}
                  onChangeText={(text) => setTaskFormData({ ...taskFormData, title: text })}
                  autoFocus
                />

                <Text style={[styles.modalLabel, { color: palette.foreground }]}>Assign To</Text>
                <View style={styles.memberPicker}>
                  {familyMembers.map((member) => (
                    <TouchableOpacity
                      key={member.id}
                      style={[
                        styles.memberOption,
                        { borderColor: palette.border },
                        taskFormData.assignedTo === member.id && { backgroundColor: palette.primary + '20', borderColor: palette.primary },
                      ]}
                      onPress={() => setTaskFormData({ ...taskFormData, assignedTo: member.id })}
                    >
                      <Text
                        style={[
                          styles.memberOptionText,
                          { color: palette.foreground },
                          taskFormData.assignedTo === member.id && { color: palette.primary, fontWeight: '600' },
                        ]}
                      >
                        {member.name}
                      </Text>
                      {taskFormData.assignedTo === member.id && (
                        <IconSymbol name="checkmark.circle.fill" size={20} color={palette.primary} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>

                <Text style={[styles.modalLabel, { color: palette.foreground }]}>Due Date</Text>
                <TextInput
                  style={[styles.modalInput, { color: palette.foreground, borderColor: palette.border }]}
                  value={taskFormData.dueDate}
                  onChangeText={(text) => setTaskFormData({ ...taskFormData, dueDate: text })}
                  placeholder="YYYY-MM-DD"
                  placeholderTextColor={palette.muted}
                />

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonCancel, { borderColor: palette.border }]}
                    onPress={() => setTaskModalVisible(false)}
                  >
                    <Text style={[styles.modalButtonTextCancel, { color: palette.foreground }]}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.modalButton, styles.modalButtonPrimary, { backgroundColor: palette.primary }]}
                    onPress={handleSaveTask}
                  >
                    <Text style={styles.modalButtonTextPrimary}>Add Task</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  heroContainer: {
    paddingHorizontal: spacing.screenHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderBottomLeftRadius: radius.xxl,
    borderBottomRightRadius: radius.xxl,
    overflow: 'hidden',
  },
  section: {
    paddingHorizontal: spacing.screenHorizontal,
    marginTop: spacing.sectionGap,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.itemGap,
  },
  sectionTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
    letterSpacing: -0.3,
  },
  viewAllText: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.semibold,
  },
  quickActionsScrollContent: {
    paddingVertical: spacing.sm,
    paddingRight: spacing.screenHorizontal,
  },
  quickActionCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 100,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  quickActionCardShadowDark: {
    shadowOpacity: 0.15,
    elevation: 4,
  },
  quickActionIconWrap: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  quickActionLabel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.semibold,
    textAlign: 'center',
  },
  quoteCard: {
    padding: spacing.xl,
    borderRadius: radius.lg,
    alignItems: 'center',
  },
  quoteText: {
    fontSize: typography.fontSizes.lg,
    fontStyle: 'italic',
    textAlign: 'center',
    lineHeight: typography.lineHeights.lg,
    marginVertical: spacing.md,
  },
  quoteAuthor: {
    fontSize: typography.fontSizes.sm,
    fontStyle: 'italic',
    marginTop: spacing.md,
    alignSelf: 'flex-end',
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xxl,
    right: spacing.lg,
    width: 56,
    height: 56,
    borderRadius: radius.xxl,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    overflow: 'hidden',
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.xl,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: typography.fontSizes.xl,
    fontWeight: typography.fontWeights.bold,
  },
  modalClose: {
    padding: spacing.xs,
  },
  modalBody: {
    padding: spacing.xl,
    gap: spacing.lg,
  },
  modalLabel: {
    fontSize: typography.fontSizes.sm,
    fontWeight: typography.fontWeights.medium,
    marginBottom: spacing.xs,
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.fontSizes.md,
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.xl,
  },
  modalButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalButtonCancel: {
    borderWidth: 1,
  },
  modalButtonPrimary: {},
  modalButtonTextCancel: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
  },
  modalButtonTextPrimary: {
    fontSize: typography.fontSizes.md,
    fontWeight: typography.fontWeights.medium,
    color: '#FFFFFF',
  },
  memberPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
  },
  memberOptionText: {
    fontSize: typography.fontSizes.sm,
  },
});
