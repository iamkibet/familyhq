import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useBudgetStore } from '@/src/stores/budgetStore';
import { useAuthStore } from '@/src/stores/authStore';
import { useDirectExpenseStore } from '@/src/stores/directExpenseStore';
import { useShoppingStore } from '@/src/stores/shoppingStore';
import { BudgetCategory, BudgetPeriod } from '@/src/types';
import { useFormatCurrency } from '@/src/hooks/use-format-currency';
import { formatDate, formatDateForInput, isDateBefore, isDateInRange } from '@/src/utils';
import { DatePicker } from '@/src/components/DatePicker';
import { IconSymbol } from '@/components/ui/icon-symbol';

type ViewMode = 'periods' | 'categories';

export default function BudgetScreen() {
  const { family } = useAuthStore();
  const formatCurrency = useFormatCurrency();
  const {
    periods,
    activePeriod,
    categories,
    loading,
    subscribeToPeriods,
    createPeriod,
    updatePeriod,
    archivePeriod,
    deletePeriod,
    subscribeToCategories,
    initializeCategories,
    upsertCategory,
    deleteCategory,
    clearPeriods,
    clearCategories,
  } = useBudgetStore();
  const { expenses: directExpenses, subscribeToExpenses, clearExpenses } = useDirectExpenseStore();
  const { items: allShoppingItems, subscribeToAllItems, subscribeToLists } = useShoppingStore();
  
  const [viewMode, setViewMode] = useState<ViewMode>('periods');
  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriod | null>(null);
  const [periodModalVisible, setPeriodModalVisible] = useState(false);
  const [categoryModalVisible, setCategoryModalVisible] = useState(false);
  const [editingPeriod, setEditingPeriod] = useState<BudgetPeriod | null>(null);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  
  const [periodFormData, setPeriodFormData] = useState({
    name: '',
    startDate: formatDateForInput(new Date()),
    endDate: (() => {
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);
      return formatDateForInput(endDate);
    })(),
  });
  
  const [categoryFormData, setCategoryFormData] = useState({
    name: '',
    limit: '0',
  });

  useEffect(() => {
    if (family?.id) {
      subscribeToPeriods(family.id);
      subscribeToExpenses(family.id);
      subscribeToLists(family.id);
    }

    return () => {
      clearPeriods();
      clearExpenses();
    };
  }, [family?.id]);

  // Subscribe to categories when a period is selected
  useEffect(() => {
    if (family?.id && selectedPeriod) {
      subscribeToCategories(family.id, selectedPeriod.id);
    } else {
      clearCategories();
    }
    return () => {
      clearCategories();
    };
  }, [family?.id, selectedPeriod?.id]);

  // Subscribe to all shopping items when lists are available
  const { lists: shoppingLists } = useShoppingStore();
  useEffect(() => {
    if (family?.id && shoppingLists.length > 0) {
      subscribeToAllItems(family.id);
    }
  }, [family?.id, shoppingLists.length, subscribeToAllItems]);

  const resetPeriodForm = () => {
    const defaultEndDate = new Date();
    defaultEndDate.setMonth(defaultEndDate.getMonth() + 1);
    setPeriodFormData({
      name: '',
      startDate: formatDateForInput(new Date()),
      endDate: formatDateForInput(defaultEndDate),
    });
    setEditingPeriod(null);
  };

  const resetCategoryForm = () => {
    setCategoryFormData({
      name: '',
      limit: '0',
    });
    setEditingCategory(null);
  };

  const openPeriodModal = (period?: BudgetPeriod) => {
    if (period) {
      setEditingPeriod(period);
      setPeriodFormData({
        name: period.name,
        startDate: period.startDate,
        endDate: period.endDate,
      });
    } else {
      resetPeriodForm();
    }
    setPeriodModalVisible(true);
  };

  const openCategoryModal = (category?: BudgetCategory) => {
    if (selectedPeriod?.isArchived) {
      Alert.alert('Error', 'Cannot add or edit categories in an archived period');
      return;
    }
    
    if (category) {
      setEditingCategory(category);
      setCategoryFormData({
        name: category.name,
        limit: category.limit.toString(),
      });
    } else {
      resetCategoryForm();
    }
    setCategoryModalVisible(true);
  };

  const handleSavePeriod = async () => {
    if (!periodFormData.name.trim()) {
      Alert.alert('Error', 'Please enter a period name');
      return;
    }

    if (!periodFormData.startDate || !periodFormData.endDate) {
      Alert.alert('Error', 'Please select both start and end dates');
      return;
    }

    if (isDateBefore(periodFormData.endDate, periodFormData.startDate)) {
      Alert.alert('Error', 'End date must be after start date');
      return;
    }

    if (!family?.id) {
      Alert.alert('Error', 'Family not found');
      return;
    }

    try {
      if (editingPeriod) {
        await updatePeriod(editingPeriod.id, {
          name: periodFormData.name.trim(),
          startDate: periodFormData.startDate,
          endDate: periodFormData.endDate,
        });
      } else {
        await createPeriod(family.id, {
          name: periodFormData.name.trim(),
          startDate: periodFormData.startDate,
          endDate: periodFormData.endDate,
        });
      }
      setPeriodModalVisible(false);
      resetPeriodForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save period');
    }
  };

  const handleSaveCategory = async () => {
    if (!categoryFormData.name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (!selectedPeriod) {
      Alert.alert('Error', 'Please select a budget period first');
      return;
    }

    if (selectedPeriod.isArchived) {
      Alert.alert('Error', 'Cannot add or edit categories in an archived period');
      return;
    }

    try {
      const limit = parseFloat(categoryFormData.limit) || 0;

      if (editingCategory) {
        await upsertCategory(selectedPeriod.id, {
          ...editingCategory,
          name: categoryFormData.name.trim(),
          limit,
        });
      } else {
        await upsertCategory(selectedPeriod.id, {
          name: categoryFormData.name.trim(),
          limit,
          budgetPeriodId: selectedPeriod.id,
          spent: 0,
          familyId: family!.id,
        });
      }
      setCategoryModalVisible(false);
      resetCategoryForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save category');
    }
  };

  const handleDeletePeriod = (period: BudgetPeriod) => {
    Alert.alert(
      'Delete Period',
      `Are you sure you want to delete "${period.name}"? This will also delete all categories in this period.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deletePeriod(period.id);
              if (selectedPeriod?.id === period.id) {
                setSelectedPeriod(null);
                setViewMode('periods');
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete period');
            }
          },
        },
      ]
    );
  };

  const handleDeleteCategory = (category: BudgetCategory) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (selectedPeriod) {
                await deleteCategory(selectedPeriod.id, category.id);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const handleSelectPeriod = (period: BudgetPeriod) => {
    setSelectedPeriod(period);
    setViewMode('categories');
  };

  const handleBackToPeriods = () => {
    setSelectedPeriod(null);
    setViewMode('periods');
  };

  // Calculate spent for a category within the period's date range
  const calculateCategorySpent = (category: BudgetCategory, period: BudgetPeriod): number => {
    if (!selectedPeriod) return 0;

    // Get direct expenses within the budget period
    const categoryDirectExpenses = directExpenses.filter((exp) => {
      if (exp.budgetCategoryName !== category.name) return false;
      const expenseDate = getExpenseDate(exp.createdAt);
      if (!expenseDate) return false;
      return isDateInRange(expenseDate, period.startDate, period.endDate);
    });

    // Get shopping items within the budget period
    const categoryShoppingItems = allShoppingItems.filter((item) => {
      if (!item.isBought || item.budgetCategoryName !== category.name) return false;
      const itemDate = getExpenseDate(item.createdAt);
      if (!itemDate) return false;
      return isDateInRange(itemDate, period.startDate, period.endDate);
    });

    const directExpenseTotal = categoryDirectExpenses.reduce((sum, exp) => sum + exp.amount, 0);
    const shoppingItemTotal = categoryShoppingItems.reduce(
      (sum, item) => sum + item.estimatedPrice * item.quantity,
      0
    );

    return directExpenseTotal + shoppingItemTotal;
  };

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

  const getRemaining = (category: BudgetCategory, period: BudgetPeriod) => {
    const spent = calculateCategorySpent(category, period);
    return category.limit - spent;
  };

  const getStatusColor = (category: BudgetCategory, period: BudgetPeriod) => {
    const remaining = getRemaining(category, period);
    if (remaining < 0) return '#d32f2f';
    if (remaining < category.limit * 0.2) return '#f57c00';
    return '#388e3c';
  };

  const activePeriods = periods.filter((p) => !p.isArchived);
  const archivedPeriods = periods.filter((p) => p.isArchived);

  if (viewMode === 'categories' && selectedPeriod) {
    const totalLimit = categories.reduce((sum, cat) => sum + cat.limit, 0);
    const totalSpent = categories.reduce((sum, cat) => sum + calculateCategorySpent(cat, selectedPeriod), 0);
    const totalRemaining = totalLimit - totalSpent;

    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBackToPeriods} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>{selectedPeriod.name}</Text>
          <Text style={styles.subtitle}>
            {formatDate(selectedPeriod.startDate)} - {formatDate(selectedPeriod.endDate)}
          </Text>
          <View style={styles.summaryContainer}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Total Limit</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalLimit)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Spent</Text>
              <Text style={styles.summaryValue}>{formatCurrency(totalSpent)}</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryLabel}>Remaining</Text>
              <Text style={[styles.summaryValue, { color: totalRemaining < 0 ? '#d32f2f' : '#388e3c' }]}>
                {formatCurrency(totalRemaining)}
              </Text>
            </View>
          </View>
        </View>

        {loading && categories.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#0a7ea4" />
          </View>
        ) : (
          <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
            {categories.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No categories yet</Text>
                <Text style={styles.emptySubtext}>
                  {selectedPeriod.isArchived
                    ? 'This period is archived and cannot be modified'
                    : 'Tap the + button to add your first category'}
                </Text>
              </View>
            ) : (
              categories.map((category) => {
                const spent = calculateCategorySpent(category, selectedPeriod);
                const remaining = getRemaining(category, selectedPeriod);
                const percentage = category.limit > 0 ? (spent / category.limit) * 100 : 0;
                const statusColor = getStatusColor(category, selectedPeriod);

                return (
                  <TouchableOpacity
                    key={category.id}
                    style={styles.categoryCard}
                    onPress={() => {
                      if (!selectedPeriod.isArchived) {
                        openCategoryModal(category);
                      }
                    }}
                    onLongPress={() => {
                      if (!selectedPeriod.isArchived) {
                        handleDeleteCategory(category);
                      }
                    }}>
                    <View style={styles.categoryHeader}>
                      <Text style={styles.categoryName}>{category.name}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
                        <Text style={[styles.statusText, { color: statusColor }]}>
                          {remaining < 0 ? 'Exceeded' : remaining < category.limit * 0.2 ? 'Warning' : 'Safe'}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.categoryAmounts}>
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Limit:</Text>
                        <Text style={styles.amountValue}>{formatCurrency(category.limit)}</Text>
                      </View>
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Spent:</Text>
                        <Text style={styles.amountValue}>{formatCurrency(spent)}</Text>
                      </View>
                      <View style={styles.amountRow}>
                        <Text style={styles.amountLabel}>Remaining:</Text>
                        <Text style={[styles.amountValue, { color: remaining < 0 ? '#d32f2f' : '#388e3c' }]}>
                          {formatCurrency(remaining)}
                        </Text>
                      </View>
                    </View>
                    {category.limit > 0 && (
                      <View style={styles.progressBarContainer}>
                        <View style={styles.progressBar}>
                          <View
                            style={[
                              styles.progressFill,
                              {
                                width: `${Math.min(percentage, 100)}%`,
                                backgroundColor: statusColor,
                              },
                            ]}
                          />
                        </View>
                        <Text style={styles.progressText}>{percentage.toFixed(0)}%</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })
            )}
          </ScrollView>
        )}

        {!selectedPeriod.isArchived && (
          <TouchableOpacity style={styles.fab} onPress={() => openCategoryModal()}>
            <Text style={styles.fabText}>+</Text>
          </TouchableOpacity>
        )}

        {/* Category Modal */}
        <Modal
          visible={categoryModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setCategoryModalVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>
                {editingCategory ? 'Edit Category' : 'Add Category'}
              </Text>

              <Text style={styles.label}>Category Name</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g., Groceries"
                value={categoryFormData.name}
                onChangeText={(text) => setCategoryFormData({ ...categoryFormData, name: text })}
                autoFocus
              />

              <Text style={styles.label}>Budget Limit</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                value={categoryFormData.limit}
                onChangeText={(text) => setCategoryFormData({ ...categoryFormData, limit: text })}
                keyboardType="decimal-pad"
              />

              <View style={styles.modalButtons}>
                {editingCategory && (
                  <TouchableOpacity
                    style={[styles.modalButton, styles.deleteButtonModal]}
                    onPress={() => {
                      setCategoryModalVisible(false);
                      resetCategoryForm();
                      handleDeleteCategory(editingCategory);
                    }}>
                    <Text style={styles.deleteButtonTextModal}>Delete</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => {
                    setCategoryModalVisible(false);
                    resetCategoryForm();
                  }}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSaveCategory}>
                  <Text style={styles.saveButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  // Periods view
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Family Budget</Text>
        <Text style={styles.subtitle}>Manage your budget periods and categories</Text>
      </View>

      {loading && periods.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0a7ea4" />
        </View>
      ) : (
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {activePeriods.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Active Periods</Text>
              {activePeriods.map((period) => (
                <View key={period.id} style={styles.periodCard}>
                  <TouchableOpacity
                    style={styles.periodContent}
                    onPress={() => handleSelectPeriod(period)}
                    activeOpacity={0.7}>
                    <View style={styles.periodHeader}>
                      <Text style={styles.periodName}>{period.name}</Text>
                      {activePeriod?.id === period.id && (
                        <View style={styles.activeBadge}>
                          <Text style={styles.activeBadgeText}>Active</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.periodDate}>
                      {formatDate(period.startDate)} - {formatDate(period.endDate)}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.periodActions}>
                    <TouchableOpacity
                      style={styles.moreButton}
                      onPress={() => {
                        Alert.alert(
                          period.name,
                          'What would you like to do?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Edit', onPress: () => openPeriodModal(period) },
                            { text: 'Archive', onPress: () => archivePeriod(period.id) },
                            { text: 'Delete', style: 'destructive', onPress: () => handleDeletePeriod(period) },
                          ]
                        );
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <IconSymbol name="ellipsis" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {archivedPeriods.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, styles.expiredSectionTitle]}>Archived Periods</Text>
              {archivedPeriods.map((period) => (
                <View key={period.id} style={[styles.periodCard, styles.archivedCard]}>
                  <TouchableOpacity
                    style={styles.periodContent}
                    onPress={() => handleSelectPeriod(period)}
                    activeOpacity={0.7}>
                    <View style={styles.periodHeader}>
                      <Text style={[styles.periodName, styles.archivedText]}>{period.name}</Text>
                    </View>
                    <Text style={[styles.periodDate, styles.archivedText]}>
                      {formatDate(period.startDate)} - {formatDate(period.endDate)}
                    </Text>
                  </TouchableOpacity>
                  <View style={styles.periodActions}>
                    <TouchableOpacity
                      style={styles.moreButton}
                      onPress={() => {
                        Alert.alert(
                          period.name,
                          'What would you like to do?',
                          [
                            { text: 'Cancel', style: 'cancel' },
                            { text: 'Edit', onPress: () => openPeriodModal(period) },
                            { text: 'Delete', style: 'destructive', onPress: () => handleDeletePeriod(period) },
                          ]
                        );
                      }}
                      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <IconSymbol name="ellipsis" size={20} color="#666" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>
          )}

          {periods.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No budget periods yet</Text>
              <Text style={styles.emptySubtext}>Tap the + button to create your first budget period</Text>
            </View>
          )}
        </ScrollView>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => openPeriodModal()}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Period Modal */}
      <Modal
        visible={periodModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPeriodModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingPeriod ? 'Edit Period' : 'Create Budget Period'}
            </Text>

            <Text style={styles.label}>Period Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g., January 2024 Budget"
              value={periodFormData.name}
              onChangeText={(text) => setPeriodFormData({ ...periodFormData, name: text })}
              autoFocus
            />

            <DatePicker
              label="Start Date"
              value={periodFormData.startDate}
              onChange={(date) => setPeriodFormData({ ...periodFormData, startDate: date })}
            />

            <DatePicker
              label="End Date"
              value={periodFormData.endDate}
              onChange={(date) => setPeriodFormData({ ...periodFormData, endDate: date })}
              minimumDate={new Date(periodFormData.startDate)}
            />

            <View style={styles.modalButtons}>
              {editingPeriod && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButtonModal]}
                  onPress={() => {
                    setPeriodModalVisible(false);
                    resetPeriodForm();
                    handleDeletePeriod(editingPeriod);
                  }}>
                  <Text style={styles.deleteButtonTextModal}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setPeriodModalVisible(false);
                  resetPeriodForm();
                }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSavePeriod}>
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    marginBottom: 8,
  },
  backButtonText: {
    fontSize: 16,
    color: '#0a7ea4',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    fontWeight: '500',
  },
  summaryContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
    marginBottom: 12,
    marginLeft: 4,
  },
  expiredSectionTitle: {
    color: '#999',
  },
  periodCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  archivedCard: {
    opacity: 0.6,
  },
  periodContent: {
    flex: 1,
    padding: 16,
  },
  periodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  periodActions: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 12,
    gap: 8,
  },
  editButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#E3F2FD',
  },
  moreButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
  },
  periodName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
  archivedText: {
    color: '#999',
  },
  periodDate: {
    fontSize: 14,
    color: '#666',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: '#4caf50',
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryName: {
    fontSize: 20,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  categoryAmounts: {
    marginBottom: 12,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  amountLabel: {
    fontSize: 14,
    color: '#666',
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: '#f0f0f0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    minWidth: 40,
    textAlign: 'right',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  fabText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '300',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
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
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  saveButton: {
    backgroundColor: '#0a7ea4',
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  deleteButtonModal: {
    backgroundColor: '#d32f2f',
  },
  deleteButtonTextModal: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});
