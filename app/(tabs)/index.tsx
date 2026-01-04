import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/stores/authStore';
import { useShoppingStore } from '@/src/stores/shoppingStore';
import { useTaskStore } from '@/src/stores/taskStore';
import { useCalendarStore } from '@/src/stores/calendarStore';
import { useBudgetStore } from '@/src/stores/budgetStore';
import { useDirectExpenseStore } from '@/src/stores/directExpenseStore';
import { useFamilyData } from '@/src/hooks/useFamilyData';
import { useFamilyMembers } from '@/src/hooks/useFamilyMembers';
import { formatDate, formatDateForInput, formatRelativeTime, isToday, isPast, TimePeriod, isWithinTimePeriod, isBudgetActive, isDateInRange } from '@/src/utils';
import { useFormatCurrency } from '@/src/hooks/use-format-currency';
import { FamilyEvent, ShoppingItem, Task, User, BudgetCategory, DirectExpense } from '@/src/types';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { PieChart } from '@/src/components/PieChart';
import { TimePeriodSelector } from '@/src/components/TimePeriodSelector';
import { DashboardCarousel } from '@/src/components/DashboardCarousel';
import { BudgetCard } from '@/src/components/dashboard/BudgetCard';
import { ShoppingCard } from '@/src/components/dashboard/ShoppingCard';
import { TasksCard } from '@/src/components/dashboard/TasksCard';
import { EventsCard } from '@/src/components/dashboard/EventsCard';
import { HeroSection } from '@/src/components/dashboard/HeroSection';

export default function HomeScreen() {
  useFamilyData(); // Initialize all family data stores
  const router = useRouter();
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const { userData, family } = useAuthStore();
  const formatCurrency = useFormatCurrency();
  const { members: familyMembers, getUserName, getUserInitials } = useFamilyMembers();

  // Subscribe to direct expenses
  useEffect(() => {
    if (family?.id) {
      subscribeToExpenses(family.id);
    }
    return () => {
      clearExpenses();
    };
  }, [family?.id]);
  const { lists: shoppingLists, items: allShoppingItems, subscribeToLists, subscribeToAllItems } = useShoppingStore();
  
  // Subscribe to shopping lists and all items for budget calculations
  useEffect(() => {
    if (family?.id) {
      subscribeToLists(family.id);
    }
  }, [family?.id, subscribeToLists]);
  
  useEffect(() => {
    if (family?.id && shoppingLists.length > 0) {
      subscribeToAllItems(family.id);
    }
  }, [family?.id, shoppingLists.length, subscribeToAllItems]);
  const { tasks, addTask } = useTaskStore();
  const { events, addEvent, updateEvent, deleteEvent } = useCalendarStore();
  const { categories: budgetCategories, activePeriod } = useBudgetStore();
  const { expenses: directExpenses, subscribeToExpenses, clearExpenses } = useDirectExpenseStore();
  const [eventModalVisible, setEventModalVisible] = useState(false);
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [budgetDetailModalVisible, setBudgetDetailModalVisible] = useState(false);
  const [selectedBudgetCategory, setSelectedBudgetCategory] = useState<BudgetCategory | null>(null);
  const [editingEvent, setEditingEvent] = useState<FamilyEvent | null>(null);
  const [familyModalVisible, setFamilyModalVisible] = useState(false);
  const [familyModalMode, setFamilyModalMode] = useState<'create' | 'join' | null>(null);
  const [familyName, setFamilyName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const { createFamily, joinFamily, loading: authLoading } = useAuthStore();
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

  const activeTasks = tasks.filter((t) => !t.completed).length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const upcomingEvents = events
    .filter((e) => {
      const eventDate = new Date(e.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 5);

  // Helper to get expense date as string (YYYY-MM-DD)
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

  // Memoize active budgets - only show categories if there's an active period
  const activeBudgets = useMemo(() => {
    if (!activePeriod) return [];
    // Ensure categories belong to the active period
    return budgetCategories.filter(cat => cat.budgetPeriodId === activePeriod.id);
  }, [activePeriod, budgetCategories]);

  // Memoize category spent calculation to prevent recalculation issues
  const calculateCategorySpent = useCallback((category: BudgetCategory): number => {
    if (!activePeriod) return 0;
    
    // Get expenses that match this category name and fall within the budget period
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
      (sum, item) => sum + ((item.estimatedPrice || 0) * (item.quantity || 0)),
      0
    );

    const total = directExpenseTotal + shoppingItemTotal;
    
    // Debug logging for troubleshooting
    if (activeBudgets.length > 0 && category === activeBudgets[0]) {
      console.log('Budget Calculation Debug:', {
        categoryName: category.name,
        periodDates: `${activePeriod.startDate} - ${activePeriod.endDate}`,
        allDirectExpenses: directExpenses.length,
        allShoppingItems: allShoppingItems.length,
        boughtItems: allShoppingItems.filter(i => i.isBought).length,
        categoryDirectExpensesCount: categoryDirectExpenses.length,
        categoryShoppingItemsCount: categoryShoppingItems.length,
        directExpenseTotal,
        shoppingItemTotal,
        total,
        sampleExpense: directExpenses[0] ? {
          name: directExpenses[0].budgetCategoryName,
          amount: directExpenses[0].amount,
          date: getExpenseDate(directExpenses[0].createdAt),
        } : null,
        sampleItem: allShoppingItems.find(i => i.isBought && i.budgetCategoryName) ? {
          name: allShoppingItems.find(i => i.isBought && i.budgetCategoryName)?.budgetCategoryName,
          price: allShoppingItems.find(i => i.isBought && i.budgetCategoryName)?.estimatedPrice,
          date: getExpenseDate(allShoppingItems.find(i => i.isBought && i.budgetCategoryName)?.createdAt),
        } : null,
      });
    }

    return total;
  }, [activePeriod, directExpenses, allShoppingItems, activeBudgets]);

  // Memoize budget statistics to prevent recalculation on every render
  const budgetStats = useMemo(() => {
    if (!activePeriod || activeBudgets.length === 0) {
      return {
        totalLimit: 0,
        totalSpent: 0,
        totalRemaining: 0,
        percentageUsed: 0,
        pieChartData: [],
      };
    }

    const totalLimit = activeBudgets.reduce((sum, cat) => sum + cat.limit, 0);
    const totalSpent = activeBudgets.reduce(
      (sum, cat) => sum + calculateCategorySpent(cat),
      0
    );
    const totalRemaining = totalLimit - totalSpent;
    const percentageUsed = totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0;

    // Prepare pie chart data
    const pieChartData = activeBudgets
      .map((cat) => {
        const spent = calculateCategorySpent(cat);
        return { category: cat, spent };
      })
      .filter(({ spent }) => spent > 0)
      .map(({ category, spent }, index) => {
        const colors = isDark
          ? ['#4FC3F7', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC', '#26C6DA', '#FFCA28']
          : ['#0a7ea4', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#FFC107'];
        return {
          name: category.name,
          value: spent,
          color: colors[index % colors.length],
        };
      });

    return {
      totalLimit,
      totalSpent,
      totalRemaining,
      percentageUsed,
      pieChartData,
    };
  }, [activePeriod, activeBudgets, calculateCategorySpent, isDark]);

  // Safely destructure with defaults - budgetStats uses totalLimit, totalSpent, etc.
  const { 
    totalLimit: totalBudgetLimit = 0, 
    totalSpent: totalBudgetSpent = 0, 
    totalRemaining: totalBudgetRemaining = 0, 
    percentageUsed: budgetPercentageUsed = 0, 
    pieChartData = [] 
  } = budgetStats || {};

  const getBudgetStatusColor = (percentage: number) => {
    if (percentage >= 100) return '#F44336'; // Red
    if (percentage >= 80) return '#FF9800'; // Orange
    return isDark ? '#4FC3F7' : '#0a7ea4'; // Blue/Teal
  };

  const budgetStatusColor = getBudgetStatusColor(budgetPercentageUsed);

  // Get active shopping lists (not completed)
  const activeShoppingLists = shoppingLists.filter((list) => !list.completed);

  const openAddEventModal = () => {
    setEditingEvent(null);
    setEventFormData({
      title: '',
      date: formatDateForInput(new Date()),
      description: '',
    });
    setEventModalVisible(true);
  };

  const openEditEventModal = (event: FamilyEvent) => {
    setEditingEvent(event);
    setEventFormData({
      title: event.title,
      date: event.date,
      description: event.description || '',
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
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save event');
    }
  };

  const handleDeleteEvent = (event: FamilyEvent) => {
    Alert.alert('Delete Event', `Are you sure you want to delete "${event.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteEvent(event.id);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete event');
          }
        },
      },
    ]);
  };


  // Set default assignedTo when family members are loaded
  useEffect(() => {
    if (userData && familyMembers.length > 0 && !taskFormData.assignedTo) {
      setTaskFormData((prev) => ({ ...prev, assignedTo: userData.id }));
    }
  }, [familyMembers, userData]);

  const openAddShoppingModal = () => {
    router.push('/(tabs)/shopping');
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
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to add task');
    }
  };

  const getEventDateStatus = (date: string) => {
    if (isToday(date)) return { text: 'Today', color: '#0a7ea4' };
    if (isPast(date)) return { text: formatDate(date), color: '#999' };
    return { text: formatDate(date), color: '#666' };
  };

  const handleCreateFamily = async () => {
    if (!familyName.trim()) {
      Alert.alert('Error', 'Please enter a family name');
      return;
    }
    try {
      await createFamily(familyName.trim());
      setFamilyModalVisible(false);
      setFamilyName('');
      setFamilyModalMode(null);
      Alert.alert('Success', 'Family created successfully!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create family');
    }
  };

  const handleJoinFamily = async () => {
    if (!inviteCode.trim()) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }
    try {
      await joinFamily(inviteCode.trim().toUpperCase());
      setFamilyModalVisible(false);
      setInviteCode('');
      setFamilyModalMode(null);
      Alert.alert('Success', 'Successfully joined family!');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to join family');
    }
  };


  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Hero Section */}
        <HeroSection family={family} />

        {/* Dashboard Carousel */}
        <DashboardCarousel>
          <BudgetCard
            categories={activeBudgets || []}
            totalLimit={totalBudgetLimit || 0}
            totalSpent={totalBudgetSpent || 0}
            totalRemaining={totalBudgetRemaining || 0}
            percentageUsed={budgetPercentageUsed || 0}
            pieChartData={pieChartData || []}
            activePeriod={activePeriod}
            calculateCategorySpent={(categoryName: string) => {
              const category = activeBudgets?.find((cat) => cat.name === categoryName);
              return category ? calculateCategorySpent(category) : 0;
            }}
            getBudgetStatusColor={getBudgetStatusColor}
          />
          <ShoppingCard activeLists={activeShoppingLists} allItems={allShoppingItems} />
          <TasksCard tasks={tasks} />
          <EventsCard events={events} />
        </DashboardCarousel>

        {/* Quick Action Buttons */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.actionButton, isDark && styles.actionButtonDark]}
            onPress={openAddShoppingModal}
            activeOpacity={0.7}>
            <View style={[styles.actionIconContainer, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
              <IconSymbol name="cart.fill" size={24} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
            </View>
            <Text style={[styles.actionLabel, isDark && styles.actionLabelDark]}>Add Shopping</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, isDark && styles.actionButtonDark]}
            onPress={openAddTaskModal}
            activeOpacity={0.7}>
            <View style={[styles.actionIconContainer, { backgroundColor: isDark ? '#1B5E20' : '#E8F5E9' }]}>
              <IconSymbol name="checkmark.square.fill" size={24} color={isDark ? '#66BB6A' : '#4CAF50'} />
            </View>
            <Text style={[styles.actionLabel, isDark && styles.actionLabelDark]}>Add Task</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, isDark && styles.actionButtonDark]}
            onPress={openAddEventModal}
            activeOpacity={0.7}>
            <View style={[styles.actionIconContainer, { backgroundColor: isDark ? '#4A148C' : '#F3E5F5' }]}>
              <IconSymbol name="calendar" size={24} color={isDark ? '#AB47BC' : '#9C27B0'} />
            </View>
            <Text style={[styles.actionLabel, isDark && styles.actionLabelDark]}>Add Event</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Event Modal */}
      <Modal
        visible={eventModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setEventModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                {editingEvent ? 'Edit Event' : 'Add Event'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setEventModalVisible(false);
                  setEditingEvent(null);
                }}
                style={styles.modalCloseButton}>
                <IconSymbol name="xmark.circle.fill" size={24} color={isDark ? '#938F99' : '#79747E'} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Event Title</Text>
              <TextInput
                style={[styles.modalInput, isDark && styles.modalInputDark]}
                placeholder="e.g., Family Dinner"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={eventFormData.title}
                onChangeText={(text) => setEventFormData({ ...eventFormData, title: text })}
                autoFocus
              />

              <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Date</Text>
              <TextInput
                style={[styles.modalInput, isDark && styles.modalInputDark]}
                value={eventFormData.date}
                onChangeText={(text) => setEventFormData({ ...eventFormData, date: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>
                Description (Optional)
              </Text>
              <TextInput
                style={[styles.modalInput, styles.modalTextArea, isDark && styles.modalInputDark]}
                placeholder="Add details..."
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={eventFormData.description}
                onChangeText={(text) => setEventFormData({ ...eventFormData, description: text })}
                multiline
                numberOfLines={3}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel, isDark && styles.modalButtonCancelDark]}
                  onPress={() => {
                    setEventModalVisible(false);
                    setEditingEvent(null);
                  }}>
                  <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave, isDark && styles.modalButtonSaveDark]}
                  onPress={handleSaveEvent}>
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Task Modal */}
      <Modal
        visible={taskModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setTaskModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Add Task</Text>
              <TouchableOpacity
                onPress={() => setTaskModalVisible(false)}
                style={styles.modalCloseButton}>
                <IconSymbol name="xmark.circle.fill" size={24} color={isDark ? '#938F99' : '#79747E'} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Task Title</Text>
              <TextInput
                style={[styles.modalInput, isDark && styles.modalInputDark]}
                placeholder="e.g., Clean the garage"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={taskFormData.title}
                onChangeText={(text) => setTaskFormData({ ...taskFormData, title: text })}
                autoFocus
              />

              <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Assign To</Text>
              <View style={styles.pickerContainer}>
                {familyMembers.map((member) => (
                  <TouchableOpacity
                    key={member.id}
                    style={[
                      styles.memberOption,
                      isDark && styles.memberOptionDark,
                      taskFormData.assignedTo === member.id && styles.memberOptionSelected,
                      taskFormData.assignedTo === member.id && isDark && styles.memberOptionSelectedDark,
                    ]}
                    onPress={() => setTaskFormData({ ...taskFormData, assignedTo: member.id })}>
                    <Text
                      style={[
                        styles.memberOptionText,
                        isDark && styles.memberOptionTextDark,
                        taskFormData.assignedTo === member.id && styles.memberOptionTextSelected,
                      ]}>
                      {member.name}
                    </Text>
                    {taskFormData.assignedTo === member.id && (
                      <IconSymbol name="checkmark.circle.fill" size={20} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
                    )}
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Due Date</Text>
              <TextInput
                style={[styles.modalInput, isDark && styles.modalInputDark]}
                value={taskFormData.dueDate}
                onChangeText={(text) => setTaskFormData({ ...taskFormData, dueDate: text })}
                placeholder="YYYY-MM-DD"
                placeholderTextColor={isDark ? '#666' : '#999'}
              />

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel, isDark && styles.modalButtonCancelDark]}
                  onPress={() => setTaskModalVisible(false)}>
                  <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave, isDark && styles.modalButtonSaveDark]}
                  onPress={handleSaveTask}>
                  <Text style={styles.modalButtonText}>Add</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Budget Detail Modal */}
      <Modal
        visible={budgetDetailModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setBudgetDetailModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            {selectedBudgetCategory && (
              <>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                    {selectedBudgetCategory.name}
                  </Text>
                  <TouchableOpacity
                    onPress={() => setBudgetDetailModalVisible(false)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                    <IconSymbol name="xmark.circle.fill" size={24} color={isDark ? '#938F99' : '#999'} />
                  </TouchableOpacity>
                </View>

                <View style={styles.budgetDetailSummary}>
                  <View style={styles.budgetDetailAmount}>
                    <Text style={[styles.budgetDetailLabel, isDark && styles.budgetDetailLabelDark]}>
                      Spent
                    </Text>
                    <Text style={[styles.budgetDetailValue, isDark && styles.budgetDetailValueDark]}>
                      {formatCurrency(selectedBudgetCategory.spent)} / {formatCurrency(selectedBudgetCategory.limit)}
                    </Text>
                  </View>
                  <View style={styles.budgetDetailProgress}>
                    <View
                      style={[
                        styles.budgetDetailBar,
                        {
                          width: `${Math.min((selectedBudgetCategory.spent / selectedBudgetCategory.limit) * 100, 100)}%`,
                          backgroundColor:
                            (selectedBudgetCategory.spent / selectedBudgetCategory.limit) * 100 >= 100
                              ? '#F44336'
                              : (selectedBudgetCategory.spent / selectedBudgetCategory.limit) * 100 >= 80
                              ? '#FF9800'
                              : isDark
                              ? '#4FC3F7'
                              : '#0a7ea4',
                        },
                      ]}
                    />
                  </View>
                </View>

                <ScrollView style={styles.budgetDetailScroll} showsVerticalScrollIndicator={false}>
                  {/* Direct Expenses Section */}
                  <View style={styles.budgetDetailSection}>
                    <Text style={[styles.budgetDetailSectionTitle, isDark && styles.budgetDetailSectionTitleDark]}>
                      Direct Expenses
                    </Text>
                    {directExpenses
                      .filter((exp) => exp.budgetCategoryName === selectedBudgetCategory.name)
                      .length === 0 ? (
                      <Text style={[styles.budgetDetailEmpty, isDark && styles.budgetDetailEmptyDark]}>
                        No direct expenses
                      </Text>
                    ) : (
                      directExpenses
                        .filter((exp) => exp.budgetCategoryName === selectedBudgetCategory.name)
                        .map((expense) => (
                          <View key={expense.id} style={[styles.budgetDetailItem, isDark && styles.budgetDetailItemDark]}>
                            <View style={styles.budgetDetailItemLeft}>
                              <IconSymbol name="dollarsign.circle.fill" size={20} color={isDark ? '#66BB6A' : '#4CAF50'} />
                              <View style={styles.budgetDetailItemInfo}>
                                <Text style={[styles.budgetDetailItemName, isDark && styles.budgetDetailItemNameDark]}>
                                  {expense.description}
                                </Text>
                                <Text style={[styles.budgetDetailItemDate, isDark && styles.budgetDetailItemDateDark]}>
                                  {new Date(expense.createdAt.toMillis()).toLocaleDateString()}
                                </Text>
                              </View>
                            </View>
                            <Text style={[styles.budgetDetailItemAmount, isDark && styles.budgetDetailItemAmountDark]}>
                              {formatCurrency(expense.amount)}
                            </Text>
                          </View>
                        ))
                    )}
                  </View>

                  {/* Shopping Lists with Items in this Category */}
                  <View style={styles.budgetDetailSection}>
                    <Text style={[styles.budgetDetailSectionTitle, isDark && styles.budgetDetailSectionTitleDark]}>
                      Shopping Lists
                    </Text>
                    {shoppingLists.length === 0 ? (
                      <Text style={[styles.budgetDetailEmpty, isDark && styles.budgetDetailEmptyDark]}>
                        No shopping lists
                      </Text>
                    ) : (
                      shoppingLists.map((list) => {
                        // Note: We can't get items without selecting the list, so we'll just show the list
                        // In a future update, we could subscribe to all items or create a service to get items by category
                        return (
                          <TouchableOpacity
                            key={list.id}
                            style={[styles.budgetDetailItem, isDark && styles.budgetDetailItemDark]}
                            onPress={() => {
                              setBudgetDetailModalVisible(false);
                              router.push('/(tabs)/shopping');
                            }}>
                            <View style={styles.budgetDetailItemLeft}>
                              <IconSymbol
                                name="list.bullet.rectangle.fill"
                                size={20}
                                color={isDark ? '#4FC3F7' : '#0a7ea4'}
                              />
                              <Text style={[styles.budgetDetailItemName, isDark && styles.budgetDetailItemNameDark]}>
                                {list.name}
                              </Text>
                            </View>
                            <IconSymbol name="chevron.right" size={16} color={isDark ? '#938F99' : '#999'} />
                          </TouchableOpacity>
                        );
                      })
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Family Modal */}
      <Modal
        visible={familyModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setFamilyModalVisible(false);
          setFamilyModalMode(null);
          setFamilyName('');
          setInviteCode('');
        }}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                {family ? 'Family Invite Code' : (familyModalMode === 'create' ? 'Create Family' : familyModalMode === 'join' ? 'Join Family' : 'Add Family')}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  setFamilyModalVisible(false);
                  setFamilyModalMode(null);
                  setFamilyName('');
                  setInviteCode('');
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <IconSymbol name="xmark.circle.fill" size={24} color={isDark ? '#938F99' : '#79747E'} />
              </TouchableOpacity>
            </View>

            {family ? (
              // Show invite code if user already has a family
              <View style={styles.inviteCodeContainer}>
                <Text style={[styles.inviteCodeLabel, isDark && styles.inviteCodeLabelDark]}>
                  Share this code with family members to invite them
                </Text>
                <View style={[styles.inviteCodeBox, isDark && styles.inviteCodeBoxDark]}>
                  <Text style={[styles.inviteCodeText, isDark && styles.inviteCodeTextDark]}>
                    {family.inviteCode}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.copyButton, isDark && styles.copyButtonDark]}
                  onPress={async () => {
                    try {
                      await Clipboard.setStringAsync(family.inviteCode);
                      Alert.alert('Copied!', 'Invite code copied to clipboard');
                    } catch (error) {
                      Alert.alert('Error', 'Failed to copy invite code');
                    }
                  }}>
                  <IconSymbol name="doc.on.doc.fill" size={20} color="#FFFFFF" />
                  <Text style={styles.copyButtonText}>Copy Invite Code</Text>
                </TouchableOpacity>
                <Text style={[styles.inviteCodeHint, isDark && styles.inviteCodeHintDark]}>
                  Family members can use this code to join your family
                </Text>
              </View>
            ) : familyModalMode === null ? (
              <View style={styles.familyModeSelection}>
                <TouchableOpacity
                  style={[styles.familyModeButton, isDark && styles.familyModeButtonDark]}
                  onPress={() => setFamilyModalMode('create')}>
                  <IconSymbol name="plus.circle.fill" size={32} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
                  <Text style={[styles.familyModeButtonText, isDark && styles.familyModeButtonTextDark]}>
                    Create Family
                  </Text>
                  <Text style={[styles.familyModeButtonSubtext, isDark && styles.familyModeButtonSubtextDark]}>
                    Start a new family group
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.familyModeButton, isDark && styles.familyModeButtonDark]}
                  onPress={() => setFamilyModalMode('join')}>
                  <IconSymbol name="person.2.fill" size={32} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
                  <Text style={[styles.familyModeButtonText, isDark && styles.familyModeButtonTextDark]}>
                    Join Family
                  </Text>
                  <Text style={[styles.familyModeButtonSubtext, isDark && styles.familyModeButtonSubtextDark]}>
                    Join with an invite code
                  </Text>
                </TouchableOpacity>
              </View>
            ) : familyModalMode === 'create' ? (
              <View style={styles.familyForm}>
                <Text style={[styles.familyFormLabel, isDark && styles.familyFormLabelDark]}>
                  Family Name
                </Text>
                <TextInput
                  style={[styles.familyFormInput, isDark && styles.familyFormInputDark]}
                  placeholder="Enter family name"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  value={familyName}
                  onChangeText={setFamilyName}
                  autoCapitalize="words"
                  editable={!authLoading}
                />
                <TouchableOpacity
                  style={[styles.familyFormButton, authLoading && styles.familyFormButtonDisabled]}
                  onPress={handleCreateFamily}
                  disabled={authLoading}>
                  <Text style={styles.familyFormButtonText}>
                    {authLoading ? 'Creating...' : 'Create Family'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.familyFormBackButton}
                  onPress={() => setFamilyModalMode(null)}>
                  <Text style={[styles.familyFormBackButtonText, isDark && styles.familyFormBackButtonTextDark]}>
                    Back
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.familyForm}>
                <Text style={[styles.familyFormLabel, isDark && styles.familyFormLabelDark]}>
                  Invite Code
                </Text>
                <TextInput
                  style={[styles.familyFormInput, isDark && styles.familyFormInputDark]}
                  placeholder="Enter invite code"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  value={inviteCode}
                  onChangeText={setInviteCode}
                  autoCapitalize="characters"
                  editable={!authLoading}
                />
                <TouchableOpacity
                  style={[styles.familyFormButton, authLoading && styles.familyFormButtonDisabled]}
                  onPress={handleJoinFamily}
                  disabled={authLoading}>
                  <Text style={styles.familyFormButtonText}>
                    {authLoading ? 'Joining...' : 'Join Family'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.familyFormBackButton}
                  onPress={() => setFamilyModalMode(null)}>
                  <Text style={[styles.familyFormBackButtonText, isDark && styles.familyFormBackButtonTextDark]}>
                    Back
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </KeyboardAvoidingView>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  containerDark: {
    backgroundColor: '#1C1B1F',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 80, // Space for tab bar
  },
  header: {
    padding: 20,
    paddingTop: 60,
    paddingBottom: 28,
    backgroundColor: '#FFFFFF',
  },
  headerDark: {
    backgroundColor: '#1C1B1F',
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarDark: {
    backgroundColor: '#4FC3F7',
  },
  avatarText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  headerText: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 20,
    color: '#111',
    fontWeight: '700',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  greetingDark: {
    color: '#E6E1E5',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
    lineHeight: 20,
  },
  subtitleDark: {
    color: '#938F99',
  },
  familyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: '#E3F2FD',
  },
  familyName: {
    fontSize: 12,
    color: '#0a7ea4',
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  familyNameDark: {
    color: '#4FC3F7',
  },
  dashboardSection: {
    paddingHorizontal: 20,
    paddingBottom: 8,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statCardDark: {
    backgroundColor: '#2C2C2C',
    borderColor: '#3C3C3C',
  },
  statIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111',
    marginBottom: 2,
    letterSpacing: -0.3,
  },
  statNumberDark: {
    color: '#E6E1E5',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  statLabelDark: {
    color: '#938F99',
  },
  section: {
    padding: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
  },
  sectionTitleDark: {
    color: '#E6E1E5',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#0a7ea4',
    borderRadius: 8,
  },
  addButtonDark: {
    backgroundColor: '#4FC3F7',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  emptySection: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  emptyTextDark: {
    color: '#666',
  },
  emptyButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
  },
  emptyButtonDark: {
    backgroundColor: '#1E3A5F',
  },
  emptyButtonText: {
    color: '#0a7ea4',
    fontSize: 14,
    fontWeight: '600',
  },
  emptyButtonTextDark: {
    color: '#4FC3F7',
  },
  eventItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  eventItemDark: {
    backgroundColor: '#2C2C2C',
    borderColor: '#3C3C3C',
  },
  eventDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  eventContent: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  eventTitleDark: {
    color: '#E6E1E5',
  },
  eventMeta: {
    gap: 2,
  },
  eventDate: {
    fontSize: 13,
    fontWeight: '500',
  },
  eventDescription: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  eventDescriptionDark: {
    color: '#938F99',
  },
  eventCreatedAt: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  eventCreatedAtDark: {
    color: '#666',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  creatorBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    alignSelf: 'flex-start',
  },
  creatorBadgeDark: {
    backgroundColor: '#3C3C3C',
  },
  creatorAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorAvatarDark: {
    backgroundColor: '#4FC3F7',
  },
  creatorInitials: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  creatorName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  creatorNameDark: {
    color: '#938F99',
  },
  eventAction: {
    padding: 4,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  modalContentDark: {
    backgroundColor: '#2C2C2C',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
  },
  modalTitleDark: {
    color: '#E6E1E5',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalBody: {
    gap: 16,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  modalLabelDark: {
    color: '#938F99',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#111',
  },
  modalInputDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#3C3C3C',
    color: '#E6E1E5',
  },
  modalTextArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonCancel: {
    backgroundColor: '#f5f5f5',
  },
  modalButtonCancelDark: {
    backgroundColor: '#1E1E1E',
  },
  modalButtonSave: {
    backgroundColor: '#0a7ea4',
  },
  modalButtonSaveDark: {
    backgroundColor: '#4FC3F7',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  modalButtonTextCancel: {
    color: '#666',
  },
  categoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  categoryChipDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#3C3C3C',
  },
  categoryChipSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#0a7ea4',
  },
  categoryChipSelectedDark: {
    backgroundColor: '#1E3A5F',
    borderColor: '#4FC3F7',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  categoryChipTextDark: {
    color: '#938F99',
  },
  categoryChipTextSelected: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  pickerContainer: {
    gap: 8,
  },
  memberOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  memberOptionDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#3C3C3C',
  },
  memberOptionSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#0a7ea4',
  },
  memberOptionSelectedDark: {
    backgroundColor: '#1E3A5F',
    borderColor: '#4FC3F7',
  },
  memberOptionText: {
    fontSize: 16,
    color: '#111',
    fontWeight: '500',
  },
  memberOptionTextDark: {
    color: '#E6E1E5',
  },
  memberOptionTextSelected: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  // Budget Styles
  budgetSection: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  manageButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  manageButtonDark: {
    backgroundColor: '#2C2C2C',
  },
  manageButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  manageButtonTextDark: {
    color: '#4FC3F7',
  },
  budgetCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  budgetCardDark: {
    backgroundColor: '#2C2C2C',
  },
  budgetSummaryRow: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 20,
  },
  budgetSummaryLeft: {
    flex: 1,
  },
  budgetSummaryHeader: {
    marginBottom: 16,
  },
  budgetSummaryLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  budgetSummaryLabelDark: {
    color: '#938F99',
  },
  budgetSummaryAmount: {
    fontSize: 26,
    fontWeight: '700',
    color: '#0a7ea4',
    marginBottom: 4,
    letterSpacing: -0.4,
  },
  budgetSummaryLimit: {
    fontSize: 16,
    fontWeight: '500',
    color: '#999',
  },
  budgetSummaryLimitDark: {
    color: '#666',
  },
  pieChartContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  budgetCategoriesList: {
    gap: 12,
  },
  budgetCategoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    backgroundColor: '#F9F9F9',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  budgetCategoryItemDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#3C3C3C',
  },
  budgetCategoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  budgetCategoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  budgetCategoryInfo: {
    flex: 1,
  },
  budgetCategoryName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111',
    marginBottom: 2,
  },
  budgetCategoryNameDark: {
    color: '#E6E1E5',
  },
  budgetCategoryAmount: {
    fontSize: 13,
    fontWeight: '500',
    color: '#666',
  },
  budgetCategoryAmountDark: {
    color: '#938F99',
  },
  budgetCategoryRight: {
    alignItems: 'flex-end',
  },
  budgetCategoryPercentage: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a7ea4',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    padding: 14,
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    marginTop: 4,
  },
  viewAllButtonDark: {
    backgroundColor: '#1E1E1E',
  },
  viewAllButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  viewAllButtonTextDark: {
    color: '#4FC3F7',
  },
  // Budget Detail Modal Styles
  budgetDetailSummary: {
    marginBottom: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  budgetDetailAmount: {
    marginBottom: 12,
  },
  budgetDetailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  budgetDetailLabelDark: {
    color: '#938F99',
  },
  budgetDetailValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111',
  },
  budgetDetailValueDark: {
    color: '#E6E1E5',
  },
  budgetDetailProgress: {
    height: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetDetailBar: {
    height: '100%',
    borderRadius: 4,
  },
  budgetDetailScroll: {
    flex: 1,
  },
  budgetDetailSection: {
    marginBottom: 32,
  },
  budgetDetailSectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 16,
  },
  budgetDetailSectionTitleDark: {
    color: '#E6E1E5',
  },
  budgetDetailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  budgetDetailItemDark: {
    backgroundColor: '#2C2C2C',
    borderColor: '#3C3C3C',
  },
  budgetDetailItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  budgetDetailItemInfo: {
    flex: 1,
    gap: 4,
  },
  budgetDetailItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  budgetDetailItemNameDark: {
    color: '#E6E1E5',
  },
  budgetDetailItemDate: {
    fontSize: 12,
    color: '#999',
  },
  budgetDetailItemDateDark: {
    color: '#666',
  },
  budgetDetailItemAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0a7ea4',
  },
  budgetDetailItemAmountDark: {
    color: '#4FC3F7',
  },
  budgetDetailEmpty: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
    padding: 16,
    textAlign: 'center',
  },
  budgetDetailEmptyDark: {
    color: '#666',
  },
  addFamilyButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFamilyButtonDark: {
    backgroundColor: '#1E3A5F',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 24,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    gap: 10,
    paddingVertical: 18,
    paddingHorizontal: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionButtonDark: {
    backgroundColor: '#2C2C2C',
    borderColor: '#3C3C3C',
  },
  actionIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  actionLabelDark: {
    color: '#E6E1E5',
  },
  familyModeSelection: {
    gap: 16,
    marginTop: 8,
  },
  familyModeButton: {
    padding: 20,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E0E0E0',
  },
  familyModeButtonDark: {
    backgroundColor: '#2C2C2C',
    borderColor: '#3C3C3C',
  },
  familyModeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginTop: 12,
  },
  familyModeButtonTextDark: {
    color: '#E6E1E5',
  },
  familyModeButtonSubtext: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  familyModeButtonSubtextDark: {
    color: '#938F99',
  },
  familyForm: {
    marginTop: 8,
  },
  familyFormLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 8,
  },
  familyFormLabelDark: {
    color: '#E6E1E5',
  },
  familyFormInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  familyFormInputDark: {
    backgroundColor: '#2C2C2C',
    color: '#E6E1E5',
    borderColor: '#3C3C3C',
  },
  familyFormButton: {
    backgroundColor: '#0a7ea4',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  familyFormButtonDisabled: {
    opacity: 0.6,
  },
  familyFormButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  familyFormBackButton: {
    padding: 12,
    alignItems: 'center',
  },
  familyFormBackButtonText: {
    fontSize: 16,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  familyFormBackButtonTextDark: {
    color: '#4FC3F7',
  },
});
