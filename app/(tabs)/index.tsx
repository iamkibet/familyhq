import React, { useState, useEffect } from 'react';
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
import { formatDate, formatDateForInput, formatRelativeTime, isToday, isPast } from '@/src/utils';
import { useFormatCurrency } from '@/src/hooks/use-format-currency';
import { FamilyEvent, ShoppingItem, Task, User, BudgetCategory, DirectExpense } from '@/src/types';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { PieChart } from '@/src/components/PieChart';

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
  const { lists: shoppingLists, items: allShoppingItems } = useShoppingStore();
  const { tasks, addTask } = useTaskStore();
  const { events, addEvent, updateEvent, deleteEvent } = useCalendarStore();
  const { categories: budgetCategories } = useBudgetStore();
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

  // Calculate budget statistics
  const totalBudgetLimit = budgetCategories.reduce((sum, cat) => sum + cat.limit, 0);
  const totalBudgetSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalBudgetRemaining = totalBudgetLimit - totalBudgetSpent;
  const budgetPercentageUsed = totalBudgetLimit > 0 ? (totalBudgetSpent / totalBudgetLimit) * 100 : 0;

  // Prepare pie chart data for budget categories
  const pieChartData = budgetCategories
    .filter((cat) => cat.spent > 0)
    .map((cat, index) => {
      const colors = isDark
        ? ['#4FC3F7', '#66BB6A', '#FFA726', '#EF5350', '#AB47BC', '#26C6DA', '#FFCA28']
        : ['#0a7ea4', '#4CAF50', '#FF9800', '#F44336', '#9C27B0', '#00BCD4', '#FFC107'];
      return {
        name: cat.name,
        value: cat.spent,
        color: colors[index % colors.length],
      };
    });

  const getBudgetStatusColor = (percentage: number) => {
    if (percentage >= 100) return '#F44336'; // Red
    if (percentage >= 80) return '#FF9800'; // Orange
    return isDark ? '#4FC3F7' : '#0a7ea4'; // Blue/Teal
  };

  const budgetStatusColor = getBudgetStatusColor(budgetPercentageUsed);

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
        {/* Header Section */}
        <View style={[styles.header, isDark && styles.headerDark]}>
          <View style={styles.headerTop}>
            <View style={styles.headerLeft}>
              <Text style={[styles.greeting, isDark && styles.greetingDark]}>Hello,</Text>
              <Text style={[styles.title, isDark && styles.titleDark]}>
                {userData?.name?.split(' ')[0] || 'Family'}
              </Text>
              {family && (
                <View style={styles.familyBadge}>
                  <IconSymbol name="house.fill" size={14} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
                  <Text style={[styles.familyName, isDark && styles.familyNameDark]}>{family.name}</Text>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={[styles.addFamilyButton, isDark && styles.addFamilyButtonDark]}
              onPress={() => {
                setFamilyModalMode(null);
                setFamilyModalVisible(true);
              }}>
              <IconSymbol name="person.2.badge.plus.fill" size={20} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Quick Stats Dashboard */}
        <View style={styles.dashboardSection}>
          <View style={styles.statsRow}>
            <TouchableOpacity
              style={[styles.statCard, isDark && styles.statCardDark]}
              onPress={() => router.push('/(tabs)/shopping')}
              activeOpacity={0.7}>
              <View style={[styles.statIconContainer, { backgroundColor: isDark ? '#1E3A5F' : '#E3F2FD' }]}>
                <IconSymbol name="cart.fill" size={18} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
              </View>
              <Text style={[styles.statNumber, isDark && styles.statNumberDark]}>{shoppingLists.length}</Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Lists</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, isDark && styles.statCardDark]}
              onPress={() => router.push('/(tabs)/tasks')}
              activeOpacity={0.7}>
              <View style={[styles.statIconContainer, { backgroundColor: isDark ? '#1B5E20' : '#E8F5E9' }]}>
                <IconSymbol name="checkmark.square.fill" size={18} color={isDark ? '#66BB6A' : '#4CAF50'} />
              </View>
              <Text style={[styles.statNumber, isDark && styles.statNumberDark]}>{activeTasks}</Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Tasks</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.statCard, isDark && styles.statCardDark]}
              onPress={openAddEventModal}
              activeOpacity={0.7}>
              <View style={[styles.statIconContainer, { backgroundColor: isDark ? '#4A148C' : '#F3E5F5' }]}>
                <IconSymbol name="calendar" size={18} color={isDark ? '#AB47BC' : '#9C27B0'} />
              </View>
              <Text style={[styles.statNumber, isDark && styles.statNumberDark]}>{upcomingEvents.length}</Text>
              <Text style={[styles.statLabel, isDark && styles.statLabelDark]}>Events</Text>
            </TouchableOpacity>
          </View>
        </View>

      {/* Budget Overview Section */}
      {budgetCategories.length > 0 && (
        <View style={styles.budgetSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionHeaderLeft}>
              <IconSymbol name="dollarsign.circle.fill" size={22} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
              <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>Budget Overview</Text>
            </View>
            <TouchableOpacity
              style={[styles.manageButton, isDark && styles.manageButtonDark]}
              onPress={() => router.push('/(tabs)/budget')}>
              <Text style={[styles.manageButtonText, isDark && styles.manageButtonTextDark]}>Manage</Text>
            </TouchableOpacity>
          </View>

          <View style={[styles.budgetCard, isDark && styles.budgetCardDark]}>
            {/* Budget Summary with Pie Chart */}
            <View style={styles.budgetSummaryRow}>
              <View style={styles.budgetSummaryLeft}>
                <View style={styles.budgetSummaryHeader}>
                  <Text style={[styles.budgetSummaryLabel, isDark && styles.budgetSummaryLabelDark]}>
                    Total Spent
                  </Text>
                  <Text style={[styles.budgetSummaryAmount, { color: budgetStatusColor }]}>
                    {formatCurrency(totalBudgetSpent).replace(/\.00$/, '')}
                  </Text>
                  <Text style={[styles.budgetSummaryLimit, isDark && styles.budgetSummaryLimitDark]}>
                    of {formatCurrency(totalBudgetLimit).replace(/\.00$/, '')}
                  </Text>
                </View>
              </View>
              {pieChartData.length > 0 && (
                <View style={styles.pieChartContainer}>
                  <PieChart
                    data={pieChartData}
                    size={140}
                    isDark={isDark}
                    totalValue={totalBudgetLimit}
                    centerLabel={budgetPercentageUsed.toFixed(0) + '%'}
                  />
                </View>
              )}
            </View>

            {/* Budget Categories List */}
            <View style={styles.budgetCategoriesList}>
              {budgetCategories.slice(0, 3).map((category) => {
                const percentage = category.limit > 0 ? (category.spent / category.limit) * 100 : 0;
                const categoryColor = getBudgetStatusColor(percentage);
                
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.budgetCategoryItem, isDark && styles.budgetCategoryItemDark]}
                    onPress={() => {
                      setSelectedBudgetCategory(category);
                      setBudgetDetailModalVisible(true);
                    }}
                    activeOpacity={0.7}>
                    <View style={styles.budgetCategoryLeft}>
                      <View style={[styles.budgetCategoryDot, { backgroundColor: categoryColor }]} />
                      <View style={styles.budgetCategoryInfo}>
                        <Text style={[styles.budgetCategoryName, isDark && styles.budgetCategoryNameDark]}>
                          {category.name}
                        </Text>
                        <Text style={[styles.budgetCategoryAmount, isDark && styles.budgetCategoryAmountDark]}>
                          {formatCurrency(category.spent)} / {formatCurrency(category.limit)}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.budgetCategoryRight}>
                      <Text style={[styles.budgetCategoryPercentage, { color: categoryColor }]}>
                        {percentage.toFixed(0)}%
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
              {budgetCategories.length > 3 && (
                <TouchableOpacity
                  style={[styles.viewAllButton, isDark && styles.viewAllButtonDark]}
                  onPress={() => router.push('/(tabs)/budget')}>
                  <Text style={[styles.viewAllButtonText, isDark && styles.viewAllButtonTextDark]}>
                    View all {budgetCategories.length} categories
                  </Text>
                  <IconSymbol name="chevron.right" size={16} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderLeft}>
            <IconSymbol name="calendar" size={20} color={isDark ? '#4FC3F7' : '#0a7ea4'} />
            <Text style={[styles.sectionTitle, isDark && styles.sectionTitleDark]}>
              Family Calendar
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, isDark && styles.addButtonDark]}
            onPress={openAddEventModal}>
            <IconSymbol name="plus" size={16} color="#FFFFFF" />
            <Text style={styles.addButtonText}>Add Event</Text>
          </TouchableOpacity>
        </View>

        {upcomingEvents.length === 0 ? (
          <View style={styles.emptySection}>
            <IconSymbol name="calendar" size={32} color={isDark ? '#666' : '#999'} />
            <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>No upcoming events</Text>
            <TouchableOpacity
              style={[styles.emptyButton, isDark && styles.emptyButtonDark]}
              onPress={openAddEventModal}>
              <Text style={[styles.emptyButtonText, isDark && styles.emptyButtonTextDark]}>
                Add Your First Event
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          upcomingEvents.map((event) => {
            const dateStatus = getEventDateStatus(event.date);
            return (
              <TouchableOpacity
                key={event.id}
                style={[styles.eventItem, isDark && styles.eventItemDark]}
                onPress={() => openEditEventModal(event)}
                onLongPress={() => handleDeleteEvent(event)}>
                <View style={[styles.eventDot, { backgroundColor: dateStatus.color }]} />
                <View style={styles.eventContent}>
                  <View style={styles.eventHeader}>
                    <Text style={[styles.eventTitle, isDark && styles.eventTitleDark]}>{event.title}</Text>
                    <View style={[styles.creatorBadge, isDark && styles.creatorBadgeDark]}>
                      <View style={[styles.creatorAvatar, isDark && styles.creatorAvatarDark]}>
                        <Text style={styles.creatorInitials}>{getUserInitials(event.createdBy)}</Text>
                      </View>
                      <Text style={[styles.creatorName, isDark && styles.creatorNameDark]}>
                        {getUserName(event.createdBy)}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.eventMeta}>
                    <Text style={[styles.eventDate, { color: dateStatus.color }]}>
                      {dateStatus.text}
                    </Text>
                    {event.description && (
                      <Text style={[styles.eventDescription, isDark && styles.eventDescriptionDark]}>
                        {event.description}
                      </Text>
                    )}
                  </View>
                  <Text style={[styles.eventCreatedAt, isDark && styles.eventCreatedAtDark]}>
                    Created {formatRelativeTime(event.createdAt)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={styles.eventAction}
                  onPress={() => openEditEventModal(event)}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                  <IconSymbol name="chevron.right" size={16} color={isDark ? '#938F99' : '#79747E'} />
                </TouchableOpacity>
              </TouchableOpacity>
            );
          })
        )}
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
    paddingBottom: 24,
    backgroundColor: '#FFFFFF',
  },
  headerDark: {
    backgroundColor: '#1C1B1F',
  },
  greeting: {
    fontSize: 16,
    color: '#666',
    marginBottom: 4,
    fontWeight: '500',
  },
  greetingDark: {
    color: '#938F99',
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#111',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  titleDark: {
    color: '#E6E1E5',
  },
  familyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  familyName: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  familyNameDark: {
    color: '#938F99',
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
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  headerLeft: {
    flex: 1,
  },
  addFamilyButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  addFamilyButtonDark: {
    backgroundColor: '#1E3A5F',
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
