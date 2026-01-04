import { IconSymbol } from '@/components/ui/icon-symbol';
import { useThemeScheme } from '@/hooks/use-theme-scheme';
import { useFormatCurrency } from '@/src/hooks/use-format-currency';
import { useAuthStore } from '@/src/stores/authStore';
import { useBudgetStore } from '@/src/stores/budgetStore';
import { useDirectExpenseStore } from '@/src/stores/directExpenseStore';
import { useShoppingStore } from '@/src/stores/shoppingStore';
import { ShoppingItem, ShoppingList } from '@/src/types';
import { formatDate } from '@/src/utils';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
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
    addItem,
    updateItem,
    deleteItem,
    toggleBought,
    clearAll,
  } = useShoppingStore();

  // Keep direct expense subscriptions for backend (not shown in UI)
  const { subscribeToExpenses, clearExpenses } = useDirectExpenseStore();

  const [listModalVisible, setListModalVisible] = useState(false);
  const [itemModalVisible, setItemModalVisible] = useState(false);
  const [editingList, setEditingList] = useState<ShoppingList | null>(null);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  const [listFormData, setListFormData] = useState({ name: '' });
  const [itemFormData, setItemFormData] = useState({
    name: '',
    quantity: '1',
    estimatedPrice: '0',
    budgetCategoryName: budgetCategories[0]?.name || '',
  });

  // Subscribe to lists and expenses when family is available
  useEffect(() => {
    if (family?.id) {
      subscribeToLists(family.id);
      subscribeToExpenses(family.id);
    }
    return () => {
      clearAll();
      clearExpenses();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family?.id]);

  // Subscribe to items when list is selected
  useEffect(() => {
    if (family?.id && selectedListId) {
      subscribeToItems(family.id, selectedListId);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [family?.id, selectedListId]);

  // Update item form when budget categories are loaded
  useEffect(() => {
    if (budgetCategories.length > 0 && !itemFormData.budgetCategoryName) {
      setItemFormData(prev => ({
        ...prev,
        budgetCategoryName: budgetCategories[0].name,
      }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [budgetCategories]);

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
    resetItemForm();
    setItemModalVisible(true);
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
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update item');
    }
  };

  const totalEstimated = items.reduce((sum, item) => {
    return sum + (item.isBought ? 0 : item.estimatedPrice * item.quantity);
  }, 0);

  const selectedList = lists.find((l) => l.id === selectedListId);

  // Render shopping list card
  const renderList = ({ item, index }: { item: ShoppingList; index: number }) => {
    const listItems = items.filter((i) => i.shoppingListId === item.id);
    const activeItemsCount = listItems.filter((i) => !i.isBought).length;
    const totalItemsCount = listItems.length;
    const isComplete = item.completed || (totalItemsCount > 0 && activeItemsCount === 0);
    
    return (
      <TouchableOpacity
        style={[styles.listCard, isDark && styles.listCardDark]}
        onPress={() => selectList(item.id)}
        onLongPress={() => {
          Alert.alert(
            item.name,
            'What would you like to do?',
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Edit', onPress: () => openEditListModal(item) },
              { text: 'Delete', style: 'destructive', onPress: () => handleDeleteList(item) },
            ]
          );
        }}
        activeOpacity={0.7}>
        <View style={styles.listCardContent}>
          <Text style={[styles.listCardNumber, isDark && styles.listCardNumberDark]}>
            {index + 1}.
          </Text>
          <Text 
            style={[
              styles.listCardTitle, 
              isDark && styles.listCardTitleDark,
              isComplete && styles.listCardTitleComplete
            ]}>
            {item.name}
          </Text>
          {isComplete && (
            <IconSymbol name="checkmark.circle.fill" size={20} color="#4CAF50" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  // Render shopping item row
  const renderItem = ({ item }: { item: ShoppingItem }) => (
    <TouchableOpacity
      style={[styles.itemRow, isDark && styles.itemRowDark, item.isBought && styles.itemRowBought]}
      onPress={() => handleToggleBought(item)}
      onLongPress={() => {
        Alert.alert(
          item.name,
          'What would you like to do?',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Edit', onPress: () => openEditItemModal(item) },
            { text: 'Delete', style: 'destructive', onPress: () => handleDeleteItem(item) },
          ]
        );
      }}
      activeOpacity={0.7}>
      <View style={styles.itemCheckbox}>
        {item.isBought && (
          <IconSymbol name="checkmark.circle.fill" size={24} color="#4CAF50" />
        )}
        {!item.isBought && (
          <IconSymbol name="circle" size={24} color={isDark ? '#666' : '#999'} />
        )}
      </View>
      <View style={styles.itemContent}>
        <Text
          style={[
            styles.itemName,
            isDark && styles.itemNameDark,
            item.isBought && styles.itemNameBought,
          ]}>
          {item.name}
        </Text>
        <Text style={[styles.itemMeta, isDark && styles.itemMetaDark]}>
          {item.quantity} × {formatCurrency(item.estimatedPrice)}
        </Text>
      </View>
    </TouchableOpacity>
  );

  // Lists Overview State
  if (!selectedListId) {
    return (
      <View style={[styles.container, isDark && styles.containerDark]}>
        <View style={[styles.header, isDark && styles.headerDark]}>
          <Text style={[styles.title, isDark && styles.titleDark]}>Shopping</Text>
          <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
            {lists.length} {lists.length === 1 ? 'list' : 'lists'}
          </Text>
        </View>

        {listsLoading && lists.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={isDark ? '#4FC3F7' : '#0a7ea4'} />
          </View>
        ) : (
          <FlatList
            data={lists}
            renderItem={({ item, index }) => renderList({ item, index })}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listsContainer}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>
                  No shopping lists yet
                </Text>
              </View>
            }
          />
        )}

        {/* Simple FAB */}
        <TouchableOpacity
          style={[styles.fab, isDark && styles.fabDark]}
          onPress={openAddListModal}
          activeOpacity={0.8}>
          <IconSymbol name="plus" size={24} color="#FFFFFF" />
        </TouchableOpacity>

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
                {editingList ? 'Edit List' : 'New List'}
              </Text>
              <TextInput
                style={[styles.modalInput, isDark && styles.modalInputDark]}
                placeholder="List name"
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
                  <Text style={styles.modalButtonText}>{editingList ? 'Save' : 'Create'}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>
      </View>
    );
  }

  // Items View State
  return (
    <View style={[styles.container, isDark && styles.containerDark]}>
      <View style={[styles.header, isDark && styles.headerDark]}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => selectList(null)}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <IconSymbol name="chevron.left" size={20} color={isDark ? '#E6E1E5' : '#111'} />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.headerActionButton}
            onPress={() => {
              if (selectedList) {
                Alert.alert(
                  selectedList.name,
                  'What would you like to do?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Edit', onPress: () => openEditListModal(selectedList) },
                    { text: 'Delete', style: 'destructive', onPress: () => handleDeleteList(selectedList) },
                  ]
                );
              }
            }}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <IconSymbol name="ellipsis" size={20} color={isDark ? '#E6E1E5' : '#111'} />
          </TouchableOpacity>
        </View>
        <View style={styles.headerContent}>
          <Text style={[styles.title, isDark && styles.titleDark]}>{selectedList?.name}</Text>
          <View style={styles.headerMeta}>
            <Text style={[styles.subtitle, isDark && styles.subtitleDark]}>
              {formatCurrency(totalEstimated)} estimated
            </Text>
            {selectedList?.createdAt && (
              <Text style={[styles.dateText, isDark && styles.dateTextDark]}>
                Created {formatDate(
                  selectedList.createdAt && typeof selectedList.createdAt.toDate === 'function'
                    ? selectedList.createdAt.toDate()
                    : selectedList.createdAt instanceof Date
                    ? selectedList.createdAt
                    : new Date()
                )}
              </Text>
            )}
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
              <Text style={[styles.emptyText, isDark && styles.emptyTextDark]}>No items yet</Text>
            </View>
          }
        />
      )}

      {/* Simple FAB */}
      <TouchableOpacity
        style={[styles.fab, isDark && styles.fabDark]}
        onPress={openAddItemModal}
        activeOpacity={0.8}>
        <IconSymbol name="plus" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Item Modal */}
      <Modal
        visible={itemModalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setItemModalVisible(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}>
          <View style={[styles.modalContent, isDark && styles.modalContentDark]}>
            <Text style={[styles.modalTitle, isDark && styles.modalTitleDark]}>
              {editingItem ? 'Edit Item' : 'Add Item'}
            </Text>

            <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Item name</Text>
            <TextInput
              style={[styles.modalInput, isDark && styles.modalInputDark]}
              placeholder="e.g., Milk"
              placeholderTextColor={isDark ? '#666' : '#999'}
              value={itemFormData.name}
              onChangeText={(text) => setItemFormData({ ...itemFormData, name: text })}
              autoFocus
            />

            <View style={styles.modalRow}>
              <View style={styles.modalRowItem}>
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

              <View style={styles.modalRowItem}>
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

            <Text style={[styles.modalLabel, isDark && styles.modalLabelDark]}>Budget category</Text>
            <View style={styles.budgetCategoryContainer}>
              {budgetCategories.map((category) => (
                <TouchableOpacity
                  key={category.id}
                  style={[
                    styles.budgetCategoryButton,
                    isDark && styles.budgetCategoryButtonDark,
                    itemFormData.budgetCategoryName === category.name &&
                      styles.budgetCategoryButtonSelected,
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
                <Text style={styles.modalButtonText}>{editingItem ? 'Save' : 'Add'}</Text>
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
  containerDark: {
    backgroundColor: '#1C1B1F',
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  headerDark: {
    backgroundColor: '#1C1B1F',
    borderBottomColor: '#3C3C3C',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerContent: {
    gap: 4,
  },
  headerMeta: {
    gap: 4,
    marginTop: 4,
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
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  dateTextDark: {
    color: '#666',
  },
  headerActionButton: {
    padding: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listsContainer: {
    padding: 16,
    gap: 12,
  },
  listCard: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  listCardDark: {
    backgroundColor: '#1C1B1F',
    borderBottomColor: '#3C3C3C',
  },
  listCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  listCardNumber: {
    fontSize: 16,
    fontWeight: '600',
    color: '#999',
    minWidth: 24,
  },
  listCardNumberDark: {
    color: '#666',
  },
  listCardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111',
    flex: 1,
  },
  listCardTitleDark: {
    color: '#E6E1E5',
  },
  listCardTitleComplete: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyList: {
    flex: 1,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  emptyTextDark: {
    color: '#666',
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#fff',
  },
  itemRowDark: {
    backgroundColor: '#1C1B1F',
    borderBottomColor: '#3C3C3C',
  },
  itemRowBought: {
    opacity: 0.6,
  },
  itemCheckbox: {
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
    gap: 4,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#111',
  },
  itemNameDark: {
    color: '#E6E1E5',
  },
  itemNameBought: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  itemMeta: {
    fontSize: 14,
    color: '#666',
  },
  itemMetaDark: {
    color: '#938F99',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0a7ea4',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
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
  },
  modalContentDark: {
    backgroundColor: '#2C2C2C',
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
    marginTop: 16,
  },
  modalLabelDark: {
    color: '#938F99',
  },
  modalInput: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#111',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  modalInputDark: {
    backgroundColor: '#3C3C3C',
    borderColor: '#4C4C4C',
    color: '#E6E1E5',
  },
  modalRow: {
    flexDirection: 'row',
    gap: 12,
  },
  modalRowItem: {
    flex: 1,
  },
  budgetCategoryContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  budgetCategoryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  budgetCategoryButtonDark: {
    backgroundColor: '#3C3C3C',
    borderColor: '#4C4C4C',
  },
  budgetCategoryButtonSelected: {
    backgroundColor: '#E3F2FD',
    borderColor: '#0a7ea4',
  },
  budgetCategoryButtonSelectedDark: {
    backgroundColor: '#1E3A5F',
    borderColor: '#4FC3F7',
  },
  budgetCategoryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  budgetCategoryButtonTextDark: {
    color: '#938F99',
  },
  budgetCategoryButtonTextSelected: {
    color: '#0a7ea4',
    fontWeight: '600',
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
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
    backgroundColor: '#3C3C3C',
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
});
