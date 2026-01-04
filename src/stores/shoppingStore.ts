import { create } from 'zustand';
import { ShoppingItem, ShoppingList } from '@/src/types';
import * as shoppingService from '@/src/services/shoppingService';

interface ShoppingState {
  // Lists state
  lists: ShoppingList[];
  selectedListId: string | null;
  listsLoading: boolean;
  listsUnsubscribe: (() => void) | null;
  
  // Items state
  items: ShoppingItem[];
  itemsLoading: boolean;
  itemsUnsubscribe: (() => void) | null;
  
  // General state
  error: string | null;

  // List actions
  subscribeToLists: (familyId: string) => void;
  createList: (familyId: string, list: Omit<ShoppingList, 'id' | 'createdAt' | 'familyId'>) => Promise<void>;
  updateList: (familyId: string, listId: string, updates: Partial<Omit<ShoppingList, 'id' | 'createdAt' | 'familyId' | 'createdBy'>>) => Promise<void>;
  deleteList: (familyId: string, listId: string) => Promise<void>;
  selectList: (listId: string | null) => void;
  
  // Item actions
  subscribeToItems: (familyId: string, listId: string) => void;
  subscribeToAllItems: (familyId: string) => void;
  addItem: (
    familyId: string,
    listId: string,
    item: Omit<ShoppingItem, 'id' | 'createdAt' | 'familyId' | 'shoppingListId'>
  ) => Promise<void>;
  updateItem: (
    familyId: string,
    listId: string,
    itemId: string,
    updates: Partial<Omit<ShoppingItem, 'id' | 'familyId' | 'createdAt' | 'createdBy' | 'shoppingListId'>>
  ) => Promise<void>;
  deleteItem: (familyId: string, listId: string, itemId: string) => Promise<void>;
  toggleBought: (familyId: string, listId: string, itemId: string, isBought: boolean) => Promise<void>;
  
  // Cleanup
  clearAll: () => void;
  setError: (error: string | null) => void;
}

export const useShoppingStore = create<ShoppingState>((set, get) => ({
  // Initial state
  lists: [],
  selectedListId: null,
  listsLoading: false,
  listsUnsubscribe: null,
  items: [],
  itemsLoading: false,
  itemsUnsubscribe: null,
  error: null,

  // Subscribe to shopping lists (real-time)
  subscribeToLists: (familyId: string) => {
    const { listsUnsubscribe: existingUnsubscribe } = get();
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    set({ listsLoading: true, error: null });

    const unsubscribe = shoppingService.subscribeToShoppingLists(familyId, (lists) => {
      set({ lists, listsLoading: false });
    });

    set({ listsUnsubscribe: unsubscribe });
  },

  // Create a new shopping list
  createList: async (familyId: string, list) => {
    set({ listsLoading: true, error: null });
    try {
      await shoppingService.createShoppingList(familyId, list);
      // Real-time subscription will update lists automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to create list', listsLoading: false });
      throw error;
    }
  },

  // Update a shopping list
  updateList: async (familyId: string, listId: string, updates) => {
    set({ listsLoading: true, error: null });
    try {
      await shoppingService.updateShoppingList(familyId, listId, updates);
      // Real-time subscription will update lists automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to update list', listsLoading: false });
      throw error;
    }
  },

  // Delete a shopping list
  deleteList: async (familyId: string, listId: string) => {
    set({ listsLoading: true, error: null });
    try {
      await shoppingService.deleteShoppingList(familyId, listId);
      // Real-time subscription will update lists automatically
      // If deleted list was selected, clear selection
      const { selectedListId } = get();
      if (selectedListId === listId) {
        set({ selectedListId: null, items: [] });
      }
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete list', listsLoading: false });
      throw error;
    }
  },

  // Select a list (this will trigger item subscription)
  selectList: (listId: string | null) => {
    set({ selectedListId: listId });
    // Clear items when deselecting
    if (!listId) {
      const { itemsUnsubscribe } = get();
      if (itemsUnsubscribe) {
        itemsUnsubscribe();
      }
      set({ items: [], itemsUnsubscribe: null });
    }
  },

  // Subscribe to shopping items for a specific list (real-time)
  subscribeToItems: (familyId: string, listId: string) => {
    const { itemsUnsubscribe: existingUnsubscribe } = get();
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    set({ itemsLoading: true, error: null });

    const unsubscribe = shoppingService.subscribeToShoppingItems(familyId, listId, async (items) => {
      set({ items, itemsLoading: false });
      
      // Check and update list completion status when items change
      // This ensures lists are marked as complete when all items are bought
      const { lists } = get();
      const currentList = lists.find(l => l.id === listId);
      if (currentList) {
        const activeItemsCount = items.filter((i) => !i.isBought).length;
        const totalItemsCount = items.length;
        const shouldBeComplete = totalItemsCount > 0 && activeItemsCount === 0;
        
        // If completion status doesn't match, update it
        if (currentList.completed !== shouldBeComplete) {
          // Update completion status in the background (don't await to avoid blocking)
          shoppingService.updateListCompletionStatus(familyId, listId).catch((error) => {
            console.warn('Failed to update list completion status:', error);
          });
        }
      }
    });

    set({ itemsUnsubscribe: unsubscribe });
  },

  // Subscribe to all items across all lists (for showing counts in lists view)
  subscribeToAllItems: (familyId: string) => {
    const { itemsUnsubscribe: existingUnsubscribe, lists } = get();
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    if (lists.length === 0) {
      set({ items: [], itemsLoading: false, itemsUnsubscribe: null });
      return;
    }

    set({ itemsLoading: true, error: null });

    const unsubscribe = shoppingService.subscribeToAllShoppingItems(familyId, lists, (items) => {
      set({ items, itemsLoading: false });
    });

    set({ itemsUnsubscribe: unsubscribe });
  },

  // Add item to a list
  addItem: async (familyId: string, listId: string, item) => {
    set({ itemsLoading: true, error: null });
    try {
      await shoppingService.addShoppingItem(familyId, listId, item);
      // Real-time subscription will update items automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to add item', itemsLoading: false });
      throw error;
    }
  },

  // Update item
  updateItem: async (familyId: string, listId: string, itemId: string, updates) => {
    set({ itemsLoading: true, error: null });
    try {
      await shoppingService.updateShoppingItem(familyId, listId, itemId, updates);
      // Real-time subscription will update items automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to update item', itemsLoading: false });
      throw error;
    }
  },

  // Delete item
  deleteItem: async (familyId: string, listId: string, itemId: string) => {
    set({ itemsLoading: true, error: null });
    try {
      await shoppingService.deleteShoppingItem(familyId, listId, itemId);
      // Real-time subscription will update items automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete item', itemsLoading: false });
      throw error;
    }
  },

  // Toggle bought status
  toggleBought: async (familyId: string, listId: string, itemId: string, isBought: boolean) => {
    set({ error: null });
    try {
      await shoppingService.toggleShoppingItemBought(familyId, listId, itemId, isBought);
      // Real-time subscription will update items automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to update item', itemsLoading: false });
      throw error;
    }
  },

  // Clear all (cleanup)
  clearAll: () => {
    const { listsUnsubscribe, itemsUnsubscribe } = get();
    if (listsUnsubscribe) {
      listsUnsubscribe();
    }
    if (itemsUnsubscribe) {
      itemsUnsubscribe();
    }
    set({
      lists: [],
      items: [],
      selectedListId: null,
      listsUnsubscribe: null,
      itemsUnsubscribe: null,
    });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));
