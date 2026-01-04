import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import { useBudgetStore } from '@/src/stores/budgetStore';
import { useAuthStore } from '@/src/stores/authStore';
import { BudgetCategory } from '@/src/types';
import { useFormatCurrency } from '@/src/hooks/use-format-currency';

export default function BudgetScreen() {
  const { family } = useAuthStore();
  const formatCurrency = useFormatCurrency();
  const {
    categories,
    loading,
    subscribeToCategories,
    initializeCategories,
    upsertCategory,
    deleteCategory,
    clearCategories,
  } = useBudgetStore();
  const [modalVisible, setModalVisible] = useState(false);
  const [editingCategory, setEditingCategory] = useState<BudgetCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    limit: '0',
  });
  const [initialized, setInitialized] = useState(false);
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const swipeAnimations = useRef<{ [key: string]: Animated.Value }>({});

  useEffect(() => {
    if (family?.id) {
      subscribeToCategories(family.id);
      
      // Initialize categories if none exist (first time)
      if (categories.length === 0 && !initialized) {
        initializeCategories(family.id).catch(() => {
          // Ignore error if categories already exist
        });
        setInitialized(true);
      }
    }

    return () => {
      clearCategories();
    };
  }, [family?.id]);

  const resetForm = () => {
    setFormData({
      name: '',
      limit: '0',
    });
    setEditingCategory(null);
  };

  const openAddModal = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEditModal = (category: BudgetCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      limit: category.limit.toString(),
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      Alert.alert('Error', 'Please enter a category name');
      return;
    }

    if (!family?.id) {
      Alert.alert('Error', 'Family not found');
      return;
    }

    try {
      const limit = parseFloat(formData.limit) || 0;

      if (editingCategory) {
        await upsertCategory({
          ...editingCategory,
          name: formData.name.trim(),
          limit,
        });
      } else {
        await upsertCategory({
          name: formData.name.trim(),
          limit,
          spent: 0,
          familyId: family.id,
        });
      }

      setModalVisible(false);
      resetForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save category');
    }
  };

  const handleDelete = (category: BudgetCategory) => {
    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This will remove all budget tracking for this category.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              // Close swipe if open
              if (swipedItemId === category.id) {
                setSwipedItemId(null);
              }
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to delete category');
            }
          },
        },
      ]
    );
  };

  const handleLongPress = (category: BudgetCategory) => {
    Alert.alert(
      category.name,
      'What would you like to do?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => openEditModal(category) },
        { text: 'Delete', style: 'destructive', onPress: () => handleDelete(category) },
      ]
    );
  };

  const getRemaining = (category: BudgetCategory) => {
    return category.limit - category.spent;
  };

  const getStatusColor = (category: BudgetCategory) => {
    const remaining = getRemaining(category);
    if (remaining < 0) return '#d32f2f'; // Exceeded - red
    if (remaining < category.limit * 0.2) return '#f57c00'; // Warning - orange
    return '#388e3c'; // Safe - green
  };

  const getStatusText = (category: BudgetCategory) => {
    const remaining = getRemaining(category);
    if (remaining < 0) return 'Exceeded';
    if (remaining < category.limit * 0.2) return 'Warning';
    return 'Safe';
  };

  const totalLimit = categories.reduce((sum, cat) => sum + cat.limit, 0);
  const totalSpent = categories.reduce((sum, cat) => sum + cat.spent, 0);
  const totalRemaining = totalLimit - totalSpent;

  const renderItem = ({ item }: { item: BudgetCategory }) => {
    const remaining = getRemaining(item);
    const percentage = item.limit > 0 ? (item.spent / item.limit) * 100 : 0;
    const statusColor = getStatusColor(item);
    const isSwiped = swipedItemId === item.id;

    // Initialize animation value for this item if not exists
    if (!swipeAnimations.current[item.id]) {
      swipeAnimations.current[item.id] = new Animated.Value(0);
    }

    const translateX = swipeAnimations.current[item.id];

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        // Only allow swiping left (negative dx)
        if (gestureState.dx < 0) {
          translateX.setValue(Math.max(gestureState.dx, -80));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -40) {
          // Swipe left enough to reveal delete
          Animated.spring(translateX, {
            toValue: -80,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
          setSwipedItemId(item.id);
        } else {
          // Snap back
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
            tension: 50,
            friction: 8,
          }).start();
          setSwipedItemId(null);
        }
      },
    });

    return (
      <View style={styles.swipeContainer}>
        {/* Delete button background */}
        <View style={styles.deleteButtonContainer}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDelete(item)}
            activeOpacity={0.8}>
            <Text style={styles.deleteButtonText}>Delete</Text>
          </TouchableOpacity>
        </View>

        {/* Main card */}
        <Animated.View
          style={[
            styles.categoryCard,
            {
              transform: [{ translateX }],
            },
          ]}
          {...panResponder.panHandlers}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (isSwiped) {
                // Close swipe on tap
                Animated.spring(translateX, {
                  toValue: 0,
                  useNativeDriver: true,
                  tension: 50,
                  friction: 8,
                }).start();
                setSwipedItemId(null);
              } else {
                openEditModal(item);
              }
            }}
            onLongPress={() => handleLongPress(item)}>
            <View style={styles.categoryHeader}>
              <View style={styles.categoryHeaderLeft}>
                <Text style={styles.categoryName}>{item.name}</Text>
                {categories.filter((c) => c.name === item.name).length > 1 && (
                  <View style={styles.duplicateBadge}>
                    <Text style={styles.duplicateBadgeText}>Duplicate</Text>
                  </View>
                )}
              </View>
              <View
                style={[
                  styles.statusBadge,
                  { backgroundColor: statusColor + '20' },
                ]}>
                <Text style={[styles.statusText, { color: statusColor }]}>
                  {getStatusText(item)}
                </Text>
              </View>
            </View>

            <View style={styles.categoryAmounts}>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Limit:</Text>
                <Text style={styles.amountValue}>{formatCurrency(item.limit)}</Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Spent:</Text>
                <Text style={styles.amountValue}>{formatCurrency(item.spent)}</Text>
              </View>
              <View style={styles.amountRow}>
                <Text style={styles.amountLabel}>Remaining:</Text>
                <Text
                  style={[
                    styles.amountValue,
                    { color: remaining < 0 ? '#d32f2f' : '#388e3c' },
                  ]}>
                  {formatCurrency(remaining)}
                </Text>
              </View>
            </View>

            {item.limit > 0 && (
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
        </Animated.View>
      </View>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>No budget categories yet</Text>
      <Text style={styles.emptySubtext}>Tap the + button to add your first category</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Family Budget</Text>
        <View style={styles.summaryContainer}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Limit</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalLimit)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Total Spent</Text>
            <Text style={styles.summaryValue}>{formatCurrency(totalSpent)}</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Remaining</Text>
            <Text
              style={[
                styles.summaryValue,
                { color: totalRemaining < 0 ? '#d32f2f' : '#388e3c' },
              ]}>
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
        <FlatList
          data={categories}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          ListEmptyComponent={renderEmptyState}
          contentContainerStyle={categories.length === 0 ? styles.emptyList : styles.listContent}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={openAddModal}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}>
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
              value={formData.name}
              onChangeText={(text) => setFormData({ ...formData, name: text })}
              autoFocus
            />

            <Text style={styles.label}>Monthly Limit</Text>
            <TextInput
              style={styles.input}
              placeholder="0.00"
              value={formData.limit}
              onChangeText={(text) => setFormData({ ...formData, limit: text })}
              keyboardType="decimal-pad"
            />

            <View style={styles.modalButtons}>
              {editingCategory && (
                <TouchableOpacity
                  style={[styles.modalButton, styles.deleteButtonModal]}
                  onPress={() => {
                    setModalVisible(false);
                    resetForm();
                    handleDelete(editingCategory);
                  }}>
                  <Text style={styles.deleteButtonTextModal}>Delete</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.saveButton]} onPress={handleSave}>
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 16,
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
  emptyList: {
    flex: 1,
  },
  listContent: {
    padding: 16,
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
  swipeContainer: {
    marginBottom: 12,
    overflow: 'hidden',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 0,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    backgroundColor: '#d32f2f',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  deleteButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  categoryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 8,
  },
  duplicateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: '#ff9800',
  },
  duplicateBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '600',
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

