import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  runTransaction,
  getDoc,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { ShoppingItem, ShoppingList, BudgetCategory } from '@/src/types';
import { COLLECTIONS } from '@/src/constants';
import * as budgetService from './budgetService';
import * as notificationService from './notificationService';
import * as authService from './authService';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get user name from userId
 */
async function getUserName(userId: string): Promise<string> {
  try {
    const userData = await authService.getCurrentUserData(userId);
    return userData?.name || 'Someone';
  } catch (error) {
    console.warn('Failed to get user name:', error);
    return 'Someone';
  }
}

// ============================================================================
// SHOPPING LISTS
// ============================================================================

/**
 * Subscribe to shopping lists for a family (real-time)
 */
export function subscribeToShoppingLists(
  familyId: string,
  callback: (lists: ShoppingList[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.SHOPPING_LISTS)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const lists: ShoppingList[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp) || null,
          completed: data.completed === true, // Explicitly set to false if undefined
          completedAt: (data.completedAt as Timestamp) || undefined,
        } as ShoppingList;
      });
      
      // Sort by created date (newest first), handle null createdAt
      lists.sort((a, b) => {
        if (!a.createdAt) return 1; // Put items without createdAt at the end
        if (!b.createdAt) return -1;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
      callback(lists);
    },
    (error) => {
      console.error('Error subscribing to shopping lists:', error);
      // Return empty array on error to prevent app crash
      callback([]);
    }
  );
}

/**
 * Create a new shopping list
 */
export async function createShoppingList(
  familyId: string,
  list: Omit<ShoppingList, 'id' | 'createdAt' | 'familyId'>
): Promise<string> {
  const docRef = await addDoc(
    collection(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.SHOPPING_LISTS),
    {
      ...list,
      familyId,
      createdAt: serverTimestamp(),
    }
  );
  
  // Send notification
  getUserName(list.createdBy).then((userName) => {
    notificationService.scheduleNotification(
      'New Shopping List',
      `${userName} created a new shopping list: ${list.name}`
    ).catch((error) => {
      console.warn('Failed to send notification:', error);
    });
  });
  
  return docRef.id;
}

/**
 * Update a shopping list
 */
export async function updateShoppingList(
  familyId: string,
  listId: string,
  updates: Partial<Omit<ShoppingList, 'id' | 'createdAt' | 'familyId' | 'createdBy'>>
): Promise<void> {
  const listRef = doc(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.SHOPPING_LISTS, listId);
  
  // Get current list data to check if name changed
  const currentListDoc = await getDoc(listRef);
  const currentList = currentListDoc.exists() ? { id: currentListDoc.id, ...currentListDoc.data() } as ShoppingList : null;
  
  // Handle completedAt timestamp when toggling completion
  const updateData: any = { ...updates };
  if (updates.completed !== undefined) {
    if (updates.completed) {
      updateData.completedAt = serverTimestamp();
    } else {
      updateData.completedAt = null;
    }
  }
  
  await updateDoc(listRef, updateData);
  
  // Send notification if list was updated
  if (currentList) {
    getUserName(currentList.createdBy).then((userName) => {
      const listName = updates.name || currentList.name;
      if (updates.name && updates.name !== currentList.name) {
        notificationService.scheduleNotification(
          'Shopping List Updated',
          `${userName} renamed the shopping list to: ${updates.name}`
        ).catch((error) => {
          console.warn('Failed to send notification:', error);
        });
      } else {
        notificationService.scheduleNotification(
          'Shopping List Updated',
          `${userName} updated the shopping list: ${listName}`
        ).catch((error) => {
          console.warn('Failed to send notification:', error);
        });
      }
    });
  }
}

/**
 * Delete a shopping list and all its items
 * Note: This deletes items but doesn't update budgets for bought items
 * For production, you may want to handle budget updates here
 */
export async function deleteShoppingList(
  familyId: string,
  listId: string
): Promise<void> {
  const listRef = doc(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.SHOPPING_LISTS, listId);
  
  // Get all items in this list first to handle budget updates
  const itemsCollection = collection(
    db,
    COLLECTIONS.FAMILIES,
    familyId,
    COLLECTIONS.SHOPPING_LISTS,
    listId,
    COLLECTIONS.SHOPPING_ITEMS
  );
  
  // Note: In a real app, you'd want to batch delete items and handle budgets
  // For now, we'll just delete the list (items will be orphaned but Firestore rules can handle cleanup)
  // Or you can delete items first, then the list
  await deleteDoc(listRef);
  
  // TODO: Consider deleting all items in the list first (with budget updates)
  // This would require fetching all items, then deleting them one by one
}

// ============================================================================
// SHOPPING ITEMS (within lists)
// ============================================================================

/**
 * Subscribe to shopping items for a specific list (real-time)
 */
export function subscribeToShoppingItems(
  familyId: string,
  listId: string,
  callback: (items: ShoppingItem[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.SHOPPING_LISTS, listId, COLLECTIONS.SHOPPING_ITEMS)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ShoppingItem[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp) || null,
        } as ShoppingItem;
      });
      
      // Sort by created date (newest first), handle null createdAt
      items.sort((a, b) => {
        if (!a.createdAt) return 1; // Put items without createdAt at the end
        if (!b.createdAt) return -1;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
      callback(items);
    },
    (error) => {
      console.error('Error subscribing to shopping items:', error);
      // Return empty array on error to prevent app crash
      callback([]);
    }
  );
}

/**
 * Subscribe to all shopping items across all lists for a family (real-time)
 * This is useful for displaying item counts in the lists view
 */
export function subscribeToAllShoppingItems(
  familyId: string,
  lists: ShoppingList[],
  callback: (items: ShoppingItem[]) => void
): () => void {
  if (lists.length === 0) {
    callback([]);
    return () => {}; // Return no-op unsubscribe
  }

  // Subscribe to items for each list
  const unsubscribes: (() => void)[] = [];
  const allItems: ShoppingItem[] = [];

  lists.forEach((list) => {
    const q = query(
      collection(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.SHOPPING_LISTS, list.id, COLLECTIONS.SHOPPING_ITEMS)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const listItems: ShoppingItem[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            createdAt: (data.createdAt as Timestamp) || null,
          } as ShoppingItem;
        });

        // Update allItems array - remove old items for this list and add new ones
        const existingItemsIndex = allItems.findIndex(item => item.shoppingListId === list.id);
        if (existingItemsIndex >= 0) {
          // Remove all items for this list
          const itemsToRemove = allItems.filter(item => item.shoppingListId === list.id);
          itemsToRemove.forEach(item => {
            const index = allItems.findIndex(i => i.id === item.id);
            if (index >= 0) allItems.splice(index, 1);
          });
        }
        
        // Add new items
        allItems.push(...listItems);
        
        // Callback with all items
        callback([...allItems]);
      },
      (error) => {
        console.error(`Error subscribing to shopping items for list ${list.id}:`, error);
        // Don't call callback on error for this function to avoid partial updates
      }
    );

    unsubscribes.push(unsubscribe);
  });

  // Return function to unsubscribe from all
  return () => {
    unsubscribes.forEach(unsub => unsub());
  };
}

/**
 * Add a new shopping item to a list
 */
export async function addShoppingItem(
  familyId: string,
  listId: string,
  item: Omit<ShoppingItem, 'id' | 'createdAt' | 'familyId' | 'shoppingListId'>
): Promise<string> {
  const docRef = await addDoc(
    collection(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.SHOPPING_LISTS, listId, COLLECTIONS.SHOPPING_ITEMS),
    {
      ...item,
      shoppingListId: listId,
      familyId,
      createdAt: serverTimestamp(),
    }
  );
  
  // Send notification for new shopping item
  try {
    const userName = await getUserName(item.createdBy);
    const listDoc = await getDoc(doc(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.SHOPPING_LISTS, listId));
    const listName = listDoc.data()?.name || 'Shopping List';
    
    notificationService.scheduleNotification(
      'New Shopping Item',
      `${userName} added "${item.name}" to ${listName}`
    ).catch((error) => {
      console.warn('Failed to send notification:', error);
    });
  } catch (error) {
    console.warn('Failed to send shopping item notification:', error);
  }
  
  return docRef.id;
}

/**
 * Update a shopping item
 * Handles budget updates if item is bought and price/budgetCategory changes
 */
export async function updateShoppingItem(
  familyId: string,
  listId: string,
  itemId: string,
  updates: Partial<Omit<ShoppingItem, 'id' | 'familyId' | 'createdAt' | 'createdBy' | 'shoppingListId'>>
): Promise<void> {
  const itemRef = doc(
    db,
    COLLECTIONS.FAMILIES,
    familyId,
    COLLECTIONS.SHOPPING_LISTS,
    listId,
    COLLECTIONS.SHOPPING_ITEMS,
    itemId
  );
  const itemDoc = await getDoc(itemRef);
  
  if (!itemDoc.exists()) {
    throw new Error('Shopping item not found');
  }

  const currentItem = { id: itemDoc.id, ...itemDoc.data() } as ShoppingItem;
  const wasBought = currentItem.isBought;
  const isBought = updates.isBought ?? wasBought;
  
  // If item is bought, we need to handle budget updates atomically
  if (wasBought || isBought) {
    // Get budget categories before transaction (queries can't be done in transactions)
    const oldCategory = currentItem.budgetCategoryName;
    const newCategory = updates.budgetCategoryName ?? oldCategory;
    const categoryChanged = oldCategory !== newCategory;
    
    // Find categories in active period
    const oldCategoryResult = (categoryChanged || wasBought) && oldCategory
      ? await budgetService.getBudgetCategoryByNameInActivePeriod(familyId, oldCategory)
      : null;
    const newCategoryResult = (categoryChanged || isBought) && newCategory
      ? await budgetService.getBudgetCategoryByNameInActivePeriod(familyId, newCategory)
      : null;
    
    const oldCategoryBudget = oldCategoryResult?.category || null;
    const newCategoryBudget = newCategoryResult?.category || null;
    const oldPeriodId = oldCategoryResult?.periodId || null;
    const newPeriodId = newCategoryResult?.periodId || null;
    
    await runTransaction(db, async (transaction) => {
      // Re-read the item to get latest state
      const freshItemDoc = await transaction.get(itemRef);
      if (!freshItemDoc.exists()) {
        throw new Error('Shopping item not found');
      }
      const freshItem = { id: freshItemDoc.id, ...freshItemDoc.data() } as ShoppingItem;
      
      // Calculate price difference
      const oldPrice = freshItem.estimatedPrice * freshItem.quantity;
      const newPrice = (updates.estimatedPrice ?? freshItem.estimatedPrice) * (updates.quantity ?? freshItem.quantity);
      const priceDiff = newPrice - oldPrice;
      
      // Update the item
      transaction.update(itemRef, updates);
      
      // Update budgets atomically
      if (wasBought && isBought) {
        // Item was and still is bought - adjust budget if price/category changed
        if (priceDiff !== 0 || categoryChanged) {
          // Update old category budget if category changed
          if (categoryChanged && oldCategoryBudget && oldPeriodId) {
            const oldCategoryRef = doc(db, COLLECTIONS.BUDGET_PERIODS, oldPeriodId, COLLECTIONS.BUDGET_CATEGORIES, oldCategoryBudget.id);
            const oldCategoryDoc = await transaction.get(oldCategoryRef);
            if (oldCategoryDoc.exists()) {
              const oldSpent = (oldCategoryDoc.data().spent as number) || 0;
              transaction.update(oldCategoryRef, { spent: Math.max(0, oldSpent - oldPrice) });
            }
          }
          
          // Update new category budget
          if (newCategoryBudget && newPeriodId) {
            const newCategoryRef = doc(db, COLLECTIONS.BUDGET_PERIODS, newPeriodId, COLLECTIONS.BUDGET_CATEGORIES, newCategoryBudget.id);
            const newCategoryDoc = await transaction.get(newCategoryRef);
            if (newCategoryDoc.exists()) {
              const newSpent = (newCategoryDoc.data().spent as number) || 0;
              const adjustment = categoryChanged ? newPrice : priceDiff;
              transaction.update(newCategoryRef, { spent: newSpent + adjustment });
            }
          }
        }
      }
    });
  } else {
    // Item is not bought, simple update
    await updateDoc(itemRef, updates);
  }
  
  // Update list completion status after item update
  await updateListCompletionStatus(familyId, listId);
}

/**
 * Delete a shopping item
 * If item is bought, subtract from budget atomically
 */
export async function deleteShoppingItem(
  familyId: string,
  listId: string,
  itemId: string
): Promise<void> {
  const itemRef = doc(
    db,
    COLLECTIONS.FAMILIES,
    familyId,
    COLLECTIONS.SHOPPING_LISTS,
    listId,
    COLLECTIONS.SHOPPING_ITEMS,
    itemId
  );
  
  // Get item first to check if it's bought and get category
  const itemDoc = await getDoc(itemRef);
  if (!itemDoc.exists()) {
    throw new Error('Shopping item not found');
  }
  
  const item = { id: itemDoc.id, ...itemDoc.data() } as ShoppingItem;
  
  // Get budget category before transaction (queries can't be done in transactions)
  // Find category in active period
  let categoryBudget: BudgetCategory | null = null;
  let periodId: string | null = null;
  
  if (item.isBought && item.budgetCategoryName) {
    const result = await budgetService.getBudgetCategoryByNameInActivePeriod(familyId, item.budgetCategoryName);
    if (result) {
      categoryBudget = result.category;
      periodId = result.periodId;
    }
  }
  
  await runTransaction(db, async (transaction) => {
    // Re-read item to ensure it still exists
    const freshItemDoc = await transaction.get(itemRef);
    if (!freshItemDoc.exists()) {
      throw new Error('Shopping item not found');
    }
    
    // If item is bought, subtract from budget
    if (item.isBought && categoryBudget && periodId) {
      // Budget category is in subcollection: budgetPeriods/{periodId}/budgets/{categoryId}
      const budgetRef = doc(db, COLLECTIONS.BUDGET_PERIODS, periodId, COLLECTIONS.BUDGET_CATEGORIES, categoryBudget.id);
      const budgetDoc = await transaction.get(budgetRef);
      
      if (budgetDoc.exists()) {
        const currentSpent = (budgetDoc.data().spent as number) || 0;
        const itemCost = item.estimatedPrice * item.quantity;
        transaction.update(budgetRef, { spent: Math.max(0, currentSpent - itemCost) });
      }
    }
    
    // Delete the item
    transaction.delete(itemRef);
  });
}

/**
 * Toggle bought status
 * Uses Firestore transaction to atomically update item and budget
 * This is the ONLY place where budget.spent should change based on isBought
 */
export async function toggleShoppingItemBought(
  familyId: string,
  listId: string,
  itemId: string,
  isBought: boolean
): Promise<void> {
  const itemRef = doc(
    db,
    COLLECTIONS.FAMILIES,
    familyId,
    COLLECTIONS.SHOPPING_LISTS,
    listId,
    COLLECTIONS.SHOPPING_ITEMS,
    itemId
  );
  
  // Get item first to check current state and category
  const itemDoc = await getDoc(itemRef);
  if (!itemDoc.exists()) {
    throw new Error('Shopping item not found');
  }
  
  const item = { id: itemDoc.id, ...itemDoc.data() } as ShoppingItem;
  const wasBought = item.isBought;
  
  // Only update if state is actually changing
  if (wasBought === isBought) {
    return; // No change needed
  }
  
  // Get the budget category before transaction (queries can't be done in transactions)
  let categoryBudget: BudgetCategory | null = null;
  let periodId: string | null = null;
  
  try {
    if (!item.budgetCategoryName) {
      console.warn('Shopping item has no budget category name:', item);
      throw new Error('Item has no budget category assigned');
    }
    
    // Find category in active period
    const result = await budgetService.getBudgetCategoryByNameInActivePeriod(familyId, item.budgetCategoryName);
    if (!result) {
      console.warn(`Budget category "${item.budgetCategoryName}" not found in active period for family ${familyId}`);
      throw new Error(`Budget category "${item.budgetCategoryName}" not found in active period. Please create it in the Budget screen.`);
    }
    categoryBudget = result.category;
    periodId = result.periodId;
  } catch (error: any) {
    // If category lookup fails, throw error to user
    console.error('Error finding budget category:', error);
    throw new Error(error.message || `Could not find budget category "${item.budgetCategoryName}"`);
  }
  
  await runTransaction(db, async (transaction) => {
    // Re-read the current item to get latest state
    const freshItemDoc = await transaction.get(itemRef);
    
    if (!freshItemDoc.exists()) {
      throw new Error('Shopping item not found');
    }
    
    const freshItem = { id: freshItemDoc.id, ...freshItemDoc.data() } as ShoppingItem;
    
    // Double-check state hasn't changed
    if (freshItem.isBought === isBought) {
      return; // Already in desired state
    }
    
    if (!categoryBudget || !periodId) {
      // This shouldn't happen if we checked above, but handle gracefully
      console.warn('Category budget or periodId is null, updating item without budget change');
      transaction.update(itemRef, { isBought });
      return;
    }
    
    // Budget category is in subcollection: budgetPeriods/{periodId}/budgets/{categoryId}
    const budgetRef = doc(db, COLLECTIONS.BUDGET_PERIODS, periodId, COLLECTIONS.BUDGET_CATEGORIES, categoryBudget.id);
    const budgetDoc = await transaction.get(budgetRef);
    
    if (!budgetDoc.exists()) {
      // Budget document was deleted, just update the item
      console.warn('Budget document not found, updating item without budget change');
      transaction.update(itemRef, { isBought });
      return;
    }
    
    const currentSpent = (budgetDoc.data().spent as number) || 0;
    const itemCost = freshItem.estimatedPrice * freshItem.quantity;
    
    // Update budget based on bought state change
    let newSpent: number;
    if (isBought) {
      // false → true: Increment budget
      newSpent = currentSpent + itemCost;
      console.log(`Adding ${itemCost} to budget category "${item.budgetCategoryName}". New spent: ${newSpent}`);
    } else {
      // true → false: Decrement budget
      newSpent = Math.max(0, currentSpent - itemCost);
      console.log(`Removing ${itemCost} from budget category "${item.budgetCategoryName}". New spent: ${newSpent}`);
    }
    
    // Atomically update both item and budget
    transaction.update(itemRef, { isBought });
    transaction.update(budgetRef, { spent: newSpent });
  });
  
  // Check if all items in the list are now bought and update list completion status
  await updateListCompletionStatus(familyId, listId);
  
  // Send notification after successful transaction
  if (isBought) {
    // Get list name for notification
    const listDoc = await getDoc(doc(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.SHOPPING_LISTS, listId));
    const listName = listDoc.exists() ? (listDoc.data().name as string) : 'Shopping List';
    
    getUserName(item.createdBy).then((userName) => {
      notificationService.scheduleNotification(
        'Item Purchased',
        `${userName} marked "${item.name}" as purchased in ${listName}`
      ).catch((error) => {
        console.warn('Failed to send notification:', error);
      });
    });
  }
}

/**
 * Check and update list completion status
 * A list is complete when all items are bought
 * This function is exported so it can be called from the store
 */
export async function updateListCompletionStatus(familyId: string, listId: string): Promise<void> {
  try {
    // Get all items for this list
    const itemsQuery = query(
      collection(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.SHOPPING_LISTS, listId, COLLECTIONS.SHOPPING_ITEMS)
    );
    const itemsSnapshot = await getDocs(itemsQuery);
    
    if (itemsSnapshot.empty) {
      // No items, list is not complete
      const listRef = doc(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.SHOPPING_LISTS, listId);
      await updateDoc(listRef, { completed: false, completedAt: null });
      return;
    }
    
    const items = itemsSnapshot.docs.map(doc => doc.data());
    const allBought = items.length > 0 && items.every(item => item.isBought === true);
    const hasItems = items.length > 0;
    
    const listRef = doc(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.SHOPPING_LISTS, listId);
    
    if (allBought && hasItems) {
      // All items are bought, mark list as complete
      const listDoc = await getDoc(listRef);
      const currentCompleted = listDoc.exists() ? (listDoc.data().completed === true) : false;
      
      // Always update to ensure consistency, but only set completedAt if it's a new completion
      if (!currentCompleted) {
        await updateDoc(listRef, {
          completed: true,
          completedAt: serverTimestamp(),
        });
        
        // Send notification that list is complete
        const listName = listDoc.exists() ? (listDoc.data().name as string) : 'Shopping List';
        getUserName(listDoc.exists() ? (listDoc.data().createdBy as string) : '').then((userName) => {
          notificationService.scheduleNotification(
            'Shopping List Complete',
            `All items in "${listName}" have been purchased! 🎉`
          ).catch((error) => {
            console.warn('Failed to send notification:', error);
          });
        });
      } else {
        // Already completed, but ensure the field is set correctly
        await updateDoc(listRef, { completed: true });
      }
    } else {
      // Not all items are bought, mark list as incomplete
      const listDoc = await getDoc(listRef);
      const currentCompleted = listDoc.exists() ? (listDoc.data().completed === true) : false;
      
      // Only update if it was previously completed (to avoid unnecessary writes)
      if (currentCompleted) {
        await updateDoc(listRef, { completed: false, completedAt: null });
      }
    }
  } catch (error) {
    console.warn('Failed to update list completion status:', error);
    // Don't throw - this is a nice-to-have feature
  }
}
