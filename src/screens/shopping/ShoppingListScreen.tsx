import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { useFormatCurrency } from '@/src/hooks/use-format-currency';
import { useFamilyMembers } from '@/src/hooks/useFamilyMembers';
import { useAuthStore } from '@/src/stores/authStore';
import { useBudgetStore } from '@/src/stores/budgetStore';
import { useDirectExpenseStore } from '@/src/stores/directExpenseStore';
import { useShoppingStore } from '@/src/stores/shoppingStore';
import * as budgetService from '@/src/services/budgetService';
import { DirectExpense, ShoppingItem, ShoppingList } from '@/src/types';
import { formatRelativeTime } from '@/src/utils';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ShoppingListScreen() {
  const { userData, family } = useAuthStore();
  const { categories: budgetCategories } = useBudgetStore();
  const colorScheme = useThemeScheme();
  const isDark = colorScheme === 'dark';
  const formatCurrency = useFormatCurrency();
  const { getUserName, getUserInitials } = useFamilyMembers();
  
  const {
    lists,
    items,
    selectedListId,
    listsLoading,
    itemsLoading,
    subscribeToLists,
    createList,
    updateList,
    deleteList,
    selectList,
    subscribeToItems,
    subscribeToAllItems,
    addItem,
    updateItem,
    deleteItem,
    toggleBought,
    clearAll,
  } = useShoppingStore();

  const [listModalVisible, setListModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [directExpenseModalVisible, setDirectExpenseModalVisible] = useState(false);
  const [fabMenuOpen, setFabMenuOpen] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [listFormData, setListFormData] = useState({ name: '' });
  const [itemFormData, setItemFormData] = useState({
    name: '',
    quantity: '1',
    estimatedPrice: '0',
    budgetCategoryName: budgetCategories[0]?.name || '',
  });
  const [directExpenseFormData, setDirectExpenseFormData] = useState({
    description: '',
    amount: '0',
    budgetCategoryName: '',
  });
  
  const { addDirectExpense } = useBudgetStore();
  const { expenses: directExpenses, subscribeToExpenses, deleteExpense, clearExpenses } = useDirectExpenseStore();
  const [showDirectExpenses, setShowDirectExpenses] = useState(false);
  const fabAnimation = useState(new Animated.Value(0))[0];

  // Update form data when budget categories are loaded
  useEffect(() => {
    if (budgetCategories.length > 0 && !directExpenseFormData.budgetCategoryName) {
      setDirectExpenseFormData(prev => ({
        ...prev,
        budgetCategoryName: budgetCategories[0].name,
      }));
    }
  }, [budgetCategories]);

  // Subscribe to lists and direct expenses when family is available
  useEffect(() => {
    if (family?.id) {
      subscribeToLists(family.id);
      subscribeToExpenses(family.id);
    }
    return () => {
      clearAll();
      clearExpenses();
    };
  }, [family?.id]);

  // Subscribe to items when a list is selected, OR subscribe to all items when viewing lists
  useEffect(() => {
    if (family?.id) {
      if (selectedListId) {
        // Subscribe to items for the selected list
        subscribeToItems(family.id, selectedListId);
      } else if (lists.length > 0) {
        // When viewing all lists, subscribe to all items to show counts
        subscribeToAllItems(family.id);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family?.id, selectedListId, lists.length]);

  // Check and update completion status for all lists when lists or items change
  // This ensures lists with all items bought are marked as complete
  useEffect(() => {
    if (family?.id && lists.length > 0) {
      // For each list, check if we need to update its completion status
      lists.forEach((list) => {
        // Get items for this list from the store (if we have them loaded)
        const listItems = items.filter((i) => i.shoppingListId === list.id);
        
        if (listItems.length > 0) {
          // We have items data, check completion status
          const activeItemsCount = listItems.filter((i) => !i.isBought).length;
          const shouldBeComplete = activeItemsCount === 0;
          
          // If completion status doesn't match, update it in Firestore
          if (list.completed !== shouldBeComplete) {
            // Import and call the service function to update Firestore
            import('@/src/services/shoppingService').then((shoppingService) => {
              shoppingService.updateListCompletionStatus(family.id, list.id).catch((error) => {
                console.warn(`Failed to update completion status for list ${list.id}:`, error);
              });
            });
          }
        } else {
          // We don't have items data for this list, but we should check Firestore
          // This handles cases where items exist but aren't loaded yet
          // The updateListCompletionStatus function will fetch items from Firestore
          if (list.completed === undefined || list.completed === null) {
            // If completed field is not set, check it
            import('@/src/services/shoppingService').then((shoppingService) => {
              shoppingService.updateListCompletionStatus(family.id, list.id).catch((error) => {
                console.warn(`Failed to update completion status for list ${list.id}:`, error);
              });
            });
          }
        }
      });
    }
  }, [family?.id, lists, items]);

  const resetListForm = () => {
    setListFormData({ name: '' });
    setEditingList(null);
  };

  const resetItemForm = () => {
    setItemFormData({
      name: '',
      quantity: '1',
      estimatedPrice: '0',
      budgetCategoryName: budgetCategories[0]?.name || '',
    });
    setEditingItem(null);
  };

  const openAddListModal = () => {
    resetListForm();
    setListModalVisible(true);
  };

  const openEditListModal = (list: ShoppingList) => {
    setEditingList(list);
    setListFormData({ name: list.name });
    setListModalVisible(true);
  };

  const openAddItemModal = () => {
    if (!selectedListId) {
      Alert.alert('Error', 'Please select a shopping list first');
      closeFabMenu();
      return;
    }
    resetItemForm();
    setItemModalVisible(true);
    closeFabMenu();
  };

  const openDirectExpenseModal = () => {
    if (budgetCategories.length === 0) {
      Alert.alert('Error', 'Please set up budget categories first in the Budget screen');
      closeFabMenu();
      return;
    }
    setDirectExpenseFormData({
      description: '',
      amount: '0',
      budgetCategoryName: budgetCategories[0]?.name || '',
    });
    setDirectExpenseModalVisible(true);
    closeFabMenu();
  };

  const toggleFabMenu = () => {
    if (fabMenuOpen) {
      closeFabMenu();
    } else {
      openFabMenu();
    }
  };

  const openFabMenu = () => {
    setFabMenuOpen(true);
    Animated.spring(fabAnimation, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  };

  const closeFabMenu = () => {
    Animated.spring(fabAnimation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start(() => {
      setFabMenuOpen(false);
    });
  };

  const handleSaveDirectExpense = async () => {
    if (!directExpenseFormData.description.trim()) {
      Alert.alert('Error', 'Please enter a description');
      return;
    }

    if (!directExpenseFormData.budgetCategoryName) {
      Alert.alert('Error', 'Please select a budget category');
      return;
    }

    const amount = parseFloat(directExpenseFormData.amount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Error', 'Please enter a valid amount greater than 0');
      return;
    }

    if (!family?.id) {
      Alert.alert('Error', 'Family not found');
      return;
    }

    if (budgetCategories.length === 0) {
      Alert.alert('Error', 'No budget categories found. Please set up budget categories first.');
      return;
    }

    if (!userData) {
      Alert.alert('Error', 'User not found');
      return;
    }

    try {
      await budgetService.addDirectExpense(
        family.id,
        directExpenseFormData.budgetCategoryName,
        amount,
        directExpenseFormData.description.trim(),
        userData.id
      );
      setDirectExpenseModalVisible(false);
      setDirectExpenseFormData({
        description: '',
        amount: '0',
        budgetCategoryName: budgetCategories[0]?.name || '',
      });
      Alert.alert('Success', `$${amount.toFixed(2)} added to ${directExpenseFormData.budgetCategoryName} budget`);
    } catch (error: any) {
      console.error('Error adding direct expense:', error);
      Alert.alert('Error', error.message || 'Failed to add expense. Please try again.');
    }
  };

  const openEditItemModal = (item: ShoppingItem) => {
    setEditingItem(item);
    setItemFormData({
      name: item.name,
      quantity: item.quantity.toString(),
      estimatedPrice: item.estimatedPrice.toString(),
      budgetCategoryName: item.budgetCategoryName,
    });
    setItemModalVisible(true);
  };

  const handleSaveList = async () => {
    if (!listFormData.name.trim()) {
      Alert.alert('Error', 'Please enter a list name');
      return;
    }

    if (!family?.id || !userData) {
      Alert.alert('Error', 'Family not found');
      return;
    }

    try {
      if (editingList) {
        await updateList(family.id, editingList.id, { name: listFormData.name.trim() });
      } else {
        await createList(family.id, {
          name: listFormData.name.trim(),
          createdBy: userData.id,
        });
      }
      setListModalVisible(false);
      resetListForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save list');
    }
  };

  const handleSaveItem = async () => {
    if (!itemFormData.name.trim()) {
      Alert.alert('Error', 'Please enter an item name');
      return;
    }

    if (!itemFormData.budgetCategoryName) {
      Alert.alert('Error', 'Please select a budget category');
      return;
    }

    if (!family?.id || !userData || !selectedListId) {
      Alert.alert('Error', 'Family or list not found');
      return;
    }

    try {
      const itemData = {
        name: itemFormData.name.trim(),
        quantity: parseInt(itemFormData.quantity) || 1,
        estimatedPrice: parseFloat(itemFormData.estimatedPrice) || 0,
        budgetCategoryName: itemFormData.budgetCategoryName,
        isBought: editingItem?.isBought || false,
        createdBy: userData.id,
      };

      if (editingItem) {
        await updateItem(family.id, selectedListId, editingItem.id, itemData);
      } else {
        await addItem(family.id, selectedListId, itemData);
      }
      setItemModalVisible(false);
      resetItemForm();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to save item');
    }
  };

  const handleDeleteList = (list: ShoppingList) => {
    if (!family?.id) return;
    Alert.alert('Delete List', `Are you sure you want to delete "${list.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteList(family.id, list.id);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete list');
          }
        },
      },
    ]);
  };

  const handleToggleListComplete = async (list: ShoppingList, e?: any) => {
    if (e) {
      e.stopPropagation();
    }
    if (!family?.id) return;
    try {
      const newCompletedStatus = !list.completed;
      await updateList(family.id, list.id, {
        completed: newCompletedStatus,
      });
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update list status');
    }
  };

  const handleDeleteItem = (item: ShoppingItem) => {
    if (!family?.id || !selectedListId) return;
    Alert.alert('Delete Item', `Are you sure you want to delete "${item.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteItem(family.id, selectedListId, item.id);
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete item');
          }
        },
      },
    ]);
  };

  const handleToggleBought = async (item: ShoppingItem) => {
    if (!family?.id || !selectedListId) return;
    try {
      await toggleBought(family.id, selectedListId, item.id, !item.isBought);
      // Budget will be updated automatically via the transaction
    } catch (error: any) {
      console.error('Error toggling bought status:', error);
      Alert.alert('Error', error.message || 'Failed to update item. Please check if the budget category exists.');
    }
  };

  const handleDeleteDirectExpense = (expense: DirectExpense) => {
    if (!family?.id) return;
    Alert.alert('Delete Expense', `Are you sure you want to delete "${expense.description}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense(family.id, expense.id);
            // Note: Budget will need to be updated manually or via a function that subtracts the amount
            // For now, we'll just delete the expense record
          } catch (error: any) {
            Alert.alert('Error', error.message || 'Failed to delete expense');
          }
        },
      },
    ]);
  };

  const totalEstimated = items.reduce((sum, item) => {
    return sum + (item.isBought ? 0 : item.estimatedPrice * item.quantity);
  }, 0);

  const totalDirectExpenses = directExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const selectedList = lists.find((l) => l.id === selectedListId);

  // Render direct expense item
  const renderDirectExpense = ({ item }: { item: DirectExpense }) => (
    <TouchableOpacity
      style={[styles.expenseItem, isDark && styles.expenseItemDark]}
      onLongPress={() => handleDeleteDirectExpense(item)}>
      <View style={styles.expenseContent}>
        <View style={styles.expenseLeft}>
          <View style={[styles.expenseIcon, { backgroundColor: isDark ? '#66BB6A' : '#4CAF50' }]}>
            <IconSymbol name="dollarsign.circle.fill" size={20} color="#FFFFFF" />
          </View>
          <View style={styles.expenseInfo}>
            <View style={styles.expenseHeader}>
              <Text style={[styles.expenseDescription, isDark && styles.expenseDescriptionDark]}>
                {item.description}
              </Text>
              <View style={[styles.creatorBadge, isDark && styles.creatorBadgeDark]}>
                <View style={[styles.creatorAvatar, isDark && styles.creatorAvatarDark]}>
                  <Text style={styles.creatorInitials}>{getUserInitials(item.createdBy)}</Text>
                </View>
                <Text style={[styles.creatorName, isDark && styles.creatorNameDark]}>
                  {getUserName(item.createdBy)}
                </Text>
              </View>
            </View>
            <View style={styles.expenseMeta}>
              <View style={[styles.budgetCategoryBadge, isDark && styles.budgetCategoryBadgeDark]}>
                <Text style={[styles.budgetCategoryText, isDark && styles.budgetCategoryTextDark]}>
                  {item.budgetCategoryName}
                </Text>
              </View>
              <Text style={[styles.expenseDate, isDark && styles.expenseDateDark]}>
                {formatRelativeTime(item.createdAt)}
              </Text>
            </View>
          </View>
        </View>
        <Text style={[styles.expenseAmount, isDark && styles.expenseAmountDark]}>
          {formatCurrency(item.amount)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Render shopping lists view
  const renderList = ({ item }: { item: ShoppingList }) => {
    const listItems = items.filter((i) => i.shoppingListId === item.id);
    const activeItemsCount = listItems.filter((i) => !i.isBought).length;
    const totalItemsCount = listItems.length;
    const isComplete = item.completed || (totalItemsCount > 0 && activeItemsCount === 0);
    
    return (
      <TouchableOpacity
        style={[
          styles.listRow,
          isDark && styles.listRowDark,
          selectedListId === item.id && styles.listRowSelected,
        ]}
        onPress={() => selectList(item.id)}
        onLongPress={() => openEditListModal(item)}
        activeOpacity={0.7}>
        {/* List Name & Creator */}
        <View style={styles.rowMainContent}>
          <View style={styles.rowHeader}>
            <Text 
              style={[
                styles.rowTitle,
                isDark && styles.rowTitleDark,
                isComplete && styles.rowTitleComplete
              ]}
              numberOfLines={1}>
              {item.name}
            </Text>
            <View style={[styles.creatorBadgeCompact, isDark && styles.creatorBadgeCompactDark]}>
              <View style={[styles.creatorAvatarCompact, isDark && styles.creatorAvatarCompactDark]}>
                <Text style={styles.creatorInitialsCompact}>{getUserInitials(item.createdBy)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Items Count & Date */}
        <View style={styles.rowMeta}>
          <View style={styles.rowStats}>
            <View style={styles.statBadge}>
              <IconSymbol 
                name="list.bullet.rectangle.fill" 
                size={14} 
                color={isDark ? '#938F99' : '#666'} 
              />
              <Text style={[
                styles.statText,
                isDark && styles.statTextDark,
              ]}>
                {totalItemsCount}
              </Text>
            </View>
          </View>
          <Text style={[styles.rowDate, isDark && styles.rowDateDark]}>
            {formatRelativeTime(item.createdAt)}
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.rowActions}>
          <TouchableOpacity
            onPress={(e) => handleToggleListComplete(item, e)}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <IconSymbol
              name={item.completed ? "checkmark.circle.fill" : "checkmark.circle"}
              size={22}
              color={item.completed ? '#4CAF50' : (isDark ? '#938F99' : '#999')}
            />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={(e) => {
              e.stopPropagation();
              handleDeleteList(item);
            }}
            style={styles.actionButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <IconSymbol name="trash.fill" size={18} color={isDark ? '#938F99' : '#999'} />
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  // Render shopping items view
  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <TouchableOpacity
      style={[styles.itemContainer, isDark && styles.itemContainerDark, item.isBought && styles.itemBought]}
      onPress={() => handleToggleBought(item)}
      onLongPress={() => openEditItemModal(item)}>
      <View style={styles.itemContent}>
        <View style={styles.checkboxContainer}>
          <View style={[styles.checkbox, item.isBought && styles.checkboxChecked]}>
            {item.isBought && <Text style={styles.checkmark}>✓</Text>}
          </View>
        </View>

        <View style={styles.itemInfo}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemName, isDark && styles.itemNameDark, item.isBought && styles.itemNameBought]}>
              {item.name}
            </Text>
            <View style={[styles.creatorBadge, isDark && styles.creatorBadgeDark]}>
              <View style={[styles.creatorAvatar, isDark && styles.creatorAvatarDark]}>
                <Text style={styles.creatorInitials}>{getUserInitials(item.createdBy)}</Text>
              </View>
              <Text style={[styles.creatorName, isDark && styles.creatorNameDark]}>
                {getUserName(item.createdBy)}
              </Text>
            </View>
          </View>
          <View style={styles.itemDetails}>
            <Text style={[styles.itemDetailText, isDark && styles.itemDetailTextDark]}>
              {item.quantity}x • {formatCurrency(item.estimatedPrice * item.quantity)}
            </Text>
            <View style={[styles.budgetCategoryBadge, isDark && styles.budgetCategoryBadgeDark]}>
              <Text style={[styles.budgetCategoryText, isDark && styles.budgetCategoryTextDark]}>
                {item.budgetCategoryName}
              </Text>
            </View>
          </View>
          <Text style={[styles.itemCreatedAt, isDark && styles.itemCreatedAtDark]}>
            Added {formatRelativeTime(item.createdAt)}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteItem(item)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconSymbol name="xmark.circle.fill" size={20} color={isDark ? '#938F99' : '#999'} />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // If no list is selected, show lists
  if (!selectedListId) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={[styles.header, isDark && styles.headerDark]}>
          <View style={styles.headerTop}>
            <View>
              <Text style={[styles.title, isDark && styles.titleDark]}>
                {showDirectExpenses ? 'Direct Expenses' : 'Shopping Lists'}
              </Text>
              <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
                {showDirectExpenses
                  ? `${directExpenses.length} ${directExpenses.length === 1 ? 'expense' : 'expenses'} • ${formatCurrency(totalDirectExpenses)}`
                  : `${lists.length} ${lists.length === 1 ? 'list' : 'lists'}`}
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.toggleButton, isDark && styles.toggleButtonDark]}
              onPress={() => setShowDirectExpenses(!showDirectExpenses)}>
              <IconSymbol
                name={showDirectExpenses ? 'list.bullet.rectangle.fill' : 'dollarsign.circle.fill'}
                size={20}
                color={isDark ? '#4FC3F7' : '#0a7ea4'}
              />
              <Text style={[styles.toggleButtonText, isDark && styles.toggleButtonTextDark]}>
                {showDirectExpenses ? 'Lists' : 'Expenses'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDirectExpenses ? (
          // Direct Expenses View
          <FlatList
            data={directExpenses}
            renderItem={renderDirectExpense}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.expensesContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <IconSymbol name="dollarsign.circle" size={48} color={isDark ? '#666' : '#999'} />
                <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>No direct expenses yet</Text>
                <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
                  Tap the + button to add your first expense
                </Text>
              </View>
            }
          />
        ) : (
          // Shopping Lists View
          <>
            {listsLoading && lists.length === 0 ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={isDark ? '#4FC3F7' : '#0a7ea4'} />
              </View>
            ) : (
              <FlatList
                data={lists}
                renderItem={renderList}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.listsContainer}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <IconSymbol name="list.bullet.rectangle" size={48} color={isDark ? '#666' : '#999'} />
                    <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                      No shopping lists yet
                    </Text>
                    <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
                      Tap the + button to create your first list
                    </Text>
                  </View>
                }
              />
            )}
          </>
        )}

        {/* Floating Action Menu - Lists View */}
        <View style={styles.fabContainer}>
          {/* Backdrop */}
          {fabMenuOpen && (
            <TouchableOpacity style={styles.fabBackdrop} activeOpacity={1} onPress={closeFabMenu} />
          )}

          {/* Menu Options */}
          {fabMenuOpen && (
            <Animated.View
              style={[
                styles.fabMenuContainer,
                {
                  opacity: fabAnimation,
                  transform: [
                    {
                      scale: fabAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 1],
                      }),
                    },
                  ],
                },
              ]}>
              <TouchableOpacity
                style={[styles.fabOption, isDark && styles.fabOptionDark]}
                onPress={() => {
                  openAddListModal();
                  closeFabMenu();
                }}
                activeOpacity={0.7}>
                <View style={[styles.fabOptionIcon, { backgroundColor: isDark ? '#4FC3F7' : '#0a7ea4' }]}>
                  <IconSymbol name="list.bullet.rectangle.fill" size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.fabOptionText, isDark && styles.fabOptionTextDark]}>New List</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.fabOption, isDark && styles.fabOptionDark]}
                onPress={openDirectExpenseModal}
                activeOpacity={0.7}>
                <View style={[styles.fabOptionIcon, { backgroundColor: isDark ? '#66BB6A' : '#4CAF50' }]}>
                  <IconSymbol name="dollarsign.circle.fill" size={20} color="#FFFFFF" />
                </View>
                <Text style={[styles.fabOptionText, isDark && styles.fabOptionTextDark]}>Direct Expense</Text>
              </TouchableOpacity>
            </Animated.View>
          )}

          {/* Main FAB Button */}
          <TouchableOpacity
            style={[styles.fab, isDark && styles.fabDark]}
            onPress={toggleFabMenu}
            activeOpacity={0.8}>
            <Animated.View
              style={{
                transform: [
                  {
                    rotate: fabAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '45deg'],
                    }),
                  },
                ],
              }}>
              <IconSymbol name="plus" size={24} color="#FFFFFF" />
            </Animated.View>
          </TouchableOpacity>
        </View>

        {/* List Modal */}
        <Modal
          visible={listModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setListModalVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}>
            <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
                {editingList ? 'Edit List' : 'New Shopping List'}
              </Text>
              <TextInput
                style={[styles.modalInput, isDark && styles.modalInputDark]}
                placeholder="List name (e.g., Grocery Store)"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={listFormData.name}
                onChangeText={(text) => setListFormData({ name: text })}
                autoFocus
              />
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel, isDark && styles.modalButtonCancelDark]}
                  onPress={() => {
                    setListModalVisible(false);
                    resetListForm();
                  }}>
                  <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave, isDark && styles.modalButtonSaveDark]}
                  onPress={handleSaveList}>
                  <Text style={styles.modalButtonText}>Save</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Direct Expense Modal */}
        <Modal
          visible={directExpenseModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setDirectExpenseModalVisible(false)}>
          <KeyboardAvoidingView
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            style={styles.modalOverlay}>
            <ScrollView
              style={[styles.modalContent, isDark && styles.modalContentDark]}
              contentContainerStyle={styles.modalScrollContent}>
              <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Add Direct Expense</Text>
              <Text style={[styles.modalSubLabel, isDark && styles.modalSubLabelDark]}>
                For expenses like utilities, bills, or other direct payments that don&apos;t go through shopping lists
              </Text>

              <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Description</Text>
              <TextInput
                style={[styles.modalInput, isDark && styles.modalInputDark]}
                placeholder="e.g., Water bill, Internet subscription"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={directExpenseFormData.description}
                onChangeText={(text) => setDirectExpenseFormData({ ...directExpenseFormData, description: text })}
                autoFocus
              />

              <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Amount</Text>
              <TextInput
                style={[styles.modalInput, isDark && styles.modalInputDark]}
                placeholder="0.00"
                placeholderTextColor={isDark ? '#666' : '#999'}
                value={directExpenseFormData.amount}
                onChangeText={(text) => setDirectExpenseFormData({ ...directExpenseFormData, amount: text })}
                keyboardType="decimal-pad"
              />

              <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Budget Category</Text>
              <View style={styles.budgetCategoryContainer}>
                {budgetCategories.map((category) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.budgetCategoryButton,
                      isDark && styles.budgetCategoryButtonDark,
                      directExpenseFormData.budgetCategoryName === category.name &&
                        styles.budgetCategoryButtonSelected,
                      directExpenseFormData.budgetCategoryName === category.name &&
                        isDark &&
                        styles.budgetCategoryButtonSelectedDark,
                    ]}
                    onPress={() =>
                      setDirectExpenseFormData({
                        ...directExpenseFormData,
                        budgetCategoryName: category.name,
                      })
                    }>
                    <Text
                      style={[
                        styles.budgetCategoryButtonText,
                        isDark && styles.budgetCategoryButtonTextDark,
                        directExpenseFormData.budgetCategoryName === category.name &&
                          styles.budgetCategoryButtonTextSelected,
                      ]}>
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonCancel, isDark && styles.modalButtonCancelDark]}
                  onPress={() => {
                    setDirectExpenseModalVisible(false);
                    setDirectExpenseFormData({
                      description: '',
                      amount: '0',
                      budgetCategoryName: budgetCategories[0]?.name || '',
                    });
                  }}>
                  <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.modalButtonSave, isDark && styles.modalButtonSaveDark]}
                  onPress={handleSaveDirectExpense}>
                  <Text style={styles.modalButtonText}>Add Expense</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  // If list is selected, show items
  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => selectList(null)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <IconSymbol name="chevron.left" size={20} color={isDark ? '#E6E1E5' : '#111'} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title, isDark && styles.titleDark]}>{selectedList?.name}</Text>
          <View style={styles.totalContainer}>
            <Text style={[styles.totalLabel, isDark && styles.totalLabelDark]}>Total Estimated:</Text>
            <Text style={[styles.totalAmount, isDark && styles.totalAmountDark]}>
              {formatCurrency(totalEstimated)}
            </Text>
          </View>
        </View>
      </View>

      {itemsLoading && items.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={isDark ? '#4FC3F7' : '#0a7ea4'} />
        </View>
      ) : (
        <FlatList
          data={items}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={items.length === 0 ? styles.emptyList : undefined}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <IconSymbol name="cart" size={48} color={isDark ? '#666' : '#999'} />
              <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>No items yet</Text>
              <Text style={[styles.emptySubtext, isDark && styles.emptySubtextDark]}>
                Tap the + button to add your first item
              </Text>
            </View>
          }
        />
      )}

      {/* Floating Action Menu */}
      <View style={styles.fabContainer}>
        {/* Backdrop */}
        {fabMenuOpen && (
          <TouchableOpacity style={styles.fabBackdrop} activeOpacity={1} onPress={closeFabMenu} />
        )}

        {/* Menu Options */}
        {fabMenuOpen && (
          <Animated.View
            style={[
              styles.fabMenuContainer,
              {
                opacity: fabAnimation,
                transform: [
                  {
                    scale: fabAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    }),
                  },
                ],
              },
            ]}>
            <TouchableOpacity
              style={[styles.fabOption, isDark && styles.fabOptionDark]}
              onPress={openAddItemModal}
              activeOpacity={0.7}>
              <View style={[styles.fabOptionIcon, { backgroundColor: isDark ? '#4FC3F7' : '#0a7ea4' }]}>
                <IconSymbol name="cart.badge.plus" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.fabOptionText, isDark && styles.fabOptionTextDark]}>Add to List</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.fabOption, isDark && styles.fabOptionDark]}
              onPress={openDirectExpenseModal}
              activeOpacity={0.7}>
              <View style={[styles.fabOptionIcon, { backgroundColor: isDark ? '#66BB6A' : '#4CAF50' }]}>
                <IconSymbol name="dollarsign.circle.fill" size={20} color="#FFFFFF" />
              </View>
              <Text style={[styles.fabOptionText, isDark && styles.fabOptionTextDark]}>Direct Expense</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Main FAB Button */}
        <TouchableOpacity
          style={[styles.fab, isDark && styles.fabDark]}
          onPress={toggleFabMenu}
          activeOpacity={0.8}>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: fabAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '45deg'],
                  }),
                },
              ],
            }}>
            <IconSymbol name="plus" size={24} color="#FFFFFF" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Item Modal */}
      <Modal
        visible={itemModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setItemModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <ScrollView
            style={[styles.modalContent, isDark && styles.modalContentDark]}
            contentContainerStyle={styles.modalScrollContent}>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              {editingItem ? 'Edit Item' : 'Add Item'}
            </Text>

            <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Item Name</Text>
            <TextInput
              style={[styles.modalInput, isDark && styles.modalInputDark]}
              placeholder="e.g., Cabbage"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={itemFormData.name}
              onChangeText={(text) => setItemFormData({ ...itemFormData, name: text })}
              autoFocus
            />

            <View style={styles.rowInputs}>
              <View style={styles.halfInput}>
                <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Quantity</Text>
                <TextInput
                  style={[styles.modalInput, isDark && styles.modalInputDark]}
                  placeholder="1"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  value={itemFormData.quantity}
                  onChangeText={(text) => setItemFormData({ ...itemFormData, quantity: text })}
                  keyboardType="numeric"
                />
              </View>

              <View style={styles.halfInput}>
                <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Price</Text>
                <TextInput
                  style={[styles.modalInput, isDark && styles.modalInputDark]}
                  placeholder="0.00"
                  placeholderTextColor={isDark ? '#666' : '#999'}
                  value={itemFormData.estimatedPrice}
                  onChangeText={(text) => setItemFormData({ ...itemFormData, estimatedPrice: text })}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>

            <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Budget Category</Text>
            <Text style={[styles.modalSubLabel, isDark && styles.modalSubLabelDark]}>
              This item will affect the selected budget category when marked as bought
            </Text>
            <View style={styles.budgetCategoryContainer}>
              {budgetCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.budgetCategoryButton,
                    isDark && styles.budgetCategoryButtonDark,
                    itemFormData.budgetCategoryName === category.name && styles.budgetCategoryButtonSelected,
                    itemFormData.budgetCategoryName === category.name &&
                      isDark &&
                      styles.budgetCategoryButtonSelectedDark,
                  ]}
                  onPress={() => setItemFormData({ ...itemFormData, budgetCategoryName: category.name })}>
                  <Text
                    style={[
                      styles.budgetCategoryButtonText,
                      isDark && styles.budgetCategoryButtonTextDark,
                      itemFormData.budgetCategoryName === category.name &&
                        styles.budgetCategoryButtonTextSelected,
                    ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, isDark && styles.modalButtonCancelDark]}
                onPress={() => {
                  setItemModalVisible(false);
                  resetItemForm();
                }}>
                <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave, isDark && styles.modalButtonSaveDark]}
                onPress={handleSaveItem}>
                <Text style={styles.modalButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Direct Expense Modal */}
      <Modal
        visible={directExpenseModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setDirectExpenseModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <ScrollView
            style={[styles.modalContent, isDark && styles.modalContentDark]}
            contentContainerStyle={styles.modalScrollContent}>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>Add Direct Expense</Text>
            <Text style={[styles.modalSubLabel, isDark && styles.modalSubLabelDark]}>
              For expenses like utilities, bills, or other direct payments that don&apos;t go through shopping lists
            </Text>

            <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Description</Text>
            <TextInput
              style={[styles.modalInput, isDark && styles.modalInputDark]}
              placeholder="e.g., Water bill, Internet subscription"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={directExpenseFormData.description}
              onChangeText={(text) => setDirectExpenseFormData({ ...directExpenseFormData, description: text })}
              autoFocus
            />

            <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Amount</Text>
            <TextInput
              style={[styles.modalInput, isDark && styles.modalInputDark]}
              placeholder="0.00"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={directExpenseFormData.amount}
              onChangeText={(text) => setDirectExpenseFormData({ ...directExpenseFormData, amount: text })}
              keyboardType="decimal-pad"
            />

            <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Budget Category</Text>
            <View style={styles.budgetCategoryContainer}>
              {budgetCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.budgetCategoryButton,
                    isDark && styles.budgetCategoryButtonDark,
                    directExpenseFormData.budgetCategoryName === category.name &&
                      styles.budgetCategoryButtonSelected,
                    directExpenseFormData.budgetCategoryName === category.name &&
                      isDark &&
                      styles.budgetCategoryButtonSelectedDark,
                  ]}
                  onPress={() =>
                    setDirectExpenseFormData({
                      ...directExpenseFormData,
                      budgetCategoryName: category.name,
                    })
                  }>
                  <Text
                    style={[
                      styles.budgetCategoryButtonText,
                      isDark && styles.budgetCategoryButtonTextDark,
                      directExpenseFormData.budgetCategoryName === category.name &&
                        styles.budgetCategoryButtonTextSelected,
                    ]}>
                    {category.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonCancel, isDark && styles.modalButtonCancelDark]}
                onPress={() => {
                  setDirectExpenseModalVisible(false);
                  setDirectExpenseFormData({
                    description: '',
                    amount: '0',
                    budgetCategoryName: budgetCategories[0]?.name || '',
                  });
                }}>
                <Text style={[styles.modalButtonText, styles.modalButtonTextCancel]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.modalButtonSave, isDark && styles.modalButtonSaveDark]}
                onPress={handleSaveDirectExpense}>
                <Text style={styles.modalButtonText}>Add Expense</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
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
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#f8f8f8',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerDark: {
    backgroundColor: '#2C2C2C',
    borderBottomColor: '#3C3C3C',
  },
  backButton: {
    marginBottom: 12,
  },
  headerContent: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#111',
  },
  titleDark: {
    color: '#E6E1E5',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
  },
  subtitleDark: {
    color: '#938F99',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  totalLabel: {
    fontSize: 16,
    color: '#666',
  },
  totalLabelDark: {
    color: '#938F99',
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  totalAmountDark: {
    color: '#4FC3F7',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  // Modern Table-like Row Design
  listRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingLeft: 16,
    paddingRight: 0,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    minHeight: 72,
  },
  listRowDark: {
    backgroundColor: '#2C2C2C',
  },
  listRowSelected: {
    backgroundColor: '#E3F2FD',
  },
  rowMainContent: {
    flex: 1,
    marginRight: 14,
  },
  rowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  rowTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#111',
    flex: 1,
    marginRight: 10,
    letterSpacing: 0.2,
  },
  rowTitleDark: {
    color: '#E6E1E5',
  },
  rowTitleComplete: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  progressContainer: {
    marginTop: 6,
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarDark: {
    backgroundColor: '#3C3C3C',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0a7ea4',
    borderRadius: 3,
  },
  progressFillComplete: {
    backgroundColor: '#4CAF50',
  },
  rowMeta: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    minWidth: 85,
    marginRight: 10,
  },
  rowStats: {
    marginBottom: 6,
  },
  statBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  statText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  statTextDark: {
    color: '#938F99',
  },
  rowDate: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  rowDateDark: {
    color: '#666',
  },
  rowActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 6,
  },
  creatorBadgeCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorBadgeCompactDark: {
    backgroundColor: '#3C3C3C',
  },
  creatorAvatarCompact: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  creatorAvatarCompactDark: {
    backgroundColor: '#4FC3F7',
  },
  creatorInitialsCompact: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  expenseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
    gap: 8,
  },
  listCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  listCardDate: {
    fontSize: 10,
    color: '#999',
  },
  listCardDateDark: {
    color: '#666',
  },
  listCardMetaSeparator: {
    fontSize: 10,
    color: '#999',
  },
  listCardMetaSeparatorDark: {
    color: '#666',
  },
  listCardItemsCount: {
    fontSize: 10,
    color: '#666',
  },
  listCardItemsCountDark: {
    color: '#938F99',
  },
  listCardItemsCountComplete: {
    color: '#4CAF50',
    fontWeight: '600',
  },
  emptyList: {
    flex: 1,
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
  itemContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  itemContainerDark: {
    backgroundColor: '#1C1B1F',
    borderBottomColor: '#3C3C3C',
  },
  itemBought: {
    backgroundColor: '#f9f9f9',
    opacity: 0.7,
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  checkboxContainer: {
    marginRight: 16,
  },
  checkbox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  checkboxChecked: {
    backgroundColor: '#0a7ea4',
  },
  checkmark: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    marginBottom: 4,
  },
  itemNameDark: {
    color: '#E6E1E5',
  },
  itemNameBought: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  itemDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  itemDetailText: {
    fontSize: 14,
    color: '#666',
  },
  itemDetailTextDark: {
    color: '#938F99',
  },
  budgetCategoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#E3F2FD',
  },
  budgetCategoryBadgeDark: {
    backgroundColor: '#1E3A5F',
  },
  budgetCategoryText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#0a7ea4',
  },
  budgetCategoryTextDark: {
    color: '#4FC3F7',
  },
  itemCreatedAt: {
    fontSize: 11,
    color: '#999',
    marginTop: 4,
    fontStyle: 'italic',
  },
  itemCreatedAtDark: {
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  fabContainer: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    zIndex: 1000,
  },
  fabBackdrop: {
    position: 'absolute',
    top: -10000,
    left: -10000,
    right: -10000,
    bottom: -10000,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    zIndex: 999,
  },
  fabMenuContainer: {
    position: 'absolute',
    bottom: 80,
    right: 0,
    alignItems: 'flex-end',
    gap: 16,
    zIndex: 1001,
  },
  fabOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 28,
    gap: 12,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    minWidth: 180,
  },
  fabOptionDark: {
    backgroundColor: '#2C2C2C',
  },
  fabOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fabOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  fabOptionTextDark: {
    color: '#E6E1E5',
  },
  fab: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    zIndex: 1002,
  },
  fabDark: {
    backgroundColor: '#4FC3F7',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '90%',
  },
  modalContentDark: {
    backgroundColor: '#2C2C2C',
  },
  modalScrollContent: {
    paddingBottom: 20,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111',
    marginBottom: 24,
  },
  modalTitleDark: {
    color: '#E6E1E5',
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
  modalSubLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 12,
  },
  modalSubLabelDark: {
    color: '#666',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    color: '#111',
  },
  modalInputDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#3C3C3C',
    color: '#E6E1E5',
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  budgetCategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  budgetCategoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  budgetCategoryButtonDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#3C3C3C',
  },
  budgetCategoryButtonSelected: {
    backgroundColor: '#0a7ea4',
    borderColor: '#0a7ea4',
  },
  budgetCategoryButtonSelectedDark: {
    backgroundColor: '#4FC3F7',
    borderColor: '#4FC3F7',
  },
  budgetCategoryButtonText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  budgetCategoryButtonTextDark: {
    color: '#938F99',
  },
  budgetCategoryButtonTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  // Direct Expenses Styles
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#E3F2FD',
  },
  toggleButtonDark: {
    backgroundColor: '#1E3A5F',
  },
  toggleButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0a7ea4',
  },
  toggleButtonTextDark: {
    color: '#4FC3F7',
  },
  expensesContainer: {
    padding: 20,
    gap: 12,
  },
  expenseItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expenseItemDark: {
    backgroundColor: '#2C2C2C',
    borderColor: '#3C3C3C',
  },
  expenseContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  expenseIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
    gap: 4,
  },
  expenseDescription: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111',
  },
  expenseDescriptionDark: {
    color: '#E6E1E5',
  },
  expenseMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expenseDate: {
    fontSize: 12,
    color: '#999',
  },
  expenseDateDark: {
    color: '#666',
  },
  expenseAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0a7ea4',
  },
  expenseAmountDark: {
    color: '#4FC3F7',
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
    color: '#fff',
  },
  modalButtonTextCancel: {
    color: '#666',
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
});
