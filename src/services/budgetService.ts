import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  getDocs,
  serverTimestamp,
  runTransaction,
} from 'firebase/firestore';
import { db } from './firebase';
import { BudgetCategory } from '@/src/types';
import { COLLECTIONS } from '@/src/constants';
import * as notificationService from './notificationService';
import * as authService from './authService';
import { formatCurrency } from '@/src/utils';

/**
 * Subscribe to budget categories for a family (real-time)
 */
export function subscribeToBudgetCategories(
  familyId: string,
  callback: (categories: BudgetCategory[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.BUDGETS),
    where('familyId', '==', familyId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const categories: BudgetCategory[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as BudgetCategory[];
      callback(categories);
    },
    (error) => {
      console.error('Error subscribing to budget categories:', error);
      // Return empty array on error to prevent app crash
      callback([]);
    }
  );
}

/**
 * Initialize default budget categories for a family
 * Only creates categories that don't already exist
 */
export async function initializeBudgetCategories(
  familyId: string,
  categories: string[]
): Promise<void> {
  // First, check which categories already exist
  const existingCategoriesQuery = query(
    collection(db, COLLECTIONS.BUDGETS),
    where('familyId', '==', familyId)
  );
  const existingSnapshot = await getDocs(existingCategoriesQuery);
  const existingCategoryNames = new Set(
    existingSnapshot.docs.map((doc) => doc.data().name as string)
  );

  // Only create categories that don't exist
  const categoriesToCreate = categories.filter((name) => !existingCategoryNames.has(name));

  if (categoriesToCreate.length === 0) {
    return; // All categories already exist
  }

  const batch = categoriesToCreate.map((name) => {
    const categoryRef = doc(collection(db, COLLECTIONS.BUDGETS));
    return setDoc(categoryRef, {
      name,
      limit: 0,
      spent: 0,
      familyId,
      createdAt: serverTimestamp(),
    });
  });

  await Promise.all(batch);
}

/**
 * Create or update a budget category
 */
export async function upsertBudgetCategory(
  category: Omit<BudgetCategory, 'id'> | BudgetCategory
): Promise<void> {
  if ('id' in category && category.id) {
    // Update existing
    await updateDoc(doc(db, COLLECTIONS.BUDGETS, category.id), {
      name: category.name,
      limit: category.limit,
      // Don't update spent here - it's calculated from shopping items
    });
  } else {
    // Create new
    const categoryRef = doc(collection(db, COLLECTIONS.BUDGETS));
    await setDoc(categoryRef, {
      ...category,
      createdAt: serverTimestamp(),
    });
  }
}

/**
 * Delete a budget category
 */
export async function deleteBudgetCategory(categoryId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.BUDGETS, categoryId));
}

/**
 * Update spent amount for a category
 * This is called when shopping items are marked as bought
 */
export async function updateCategorySpent(
  categoryId: string,
  spent: number
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.BUDGETS, categoryId), { spent });
}

/**
 * Get budget category by name (for linking shopping items to budget)
 */
export async function getBudgetCategoryByName(
  familyId: string,
  categoryName: string
): Promise<BudgetCategory | null> {
  const q = query(
    collection(db, COLLECTIONS.BUDGETS),
    where('familyId', '==', familyId),
    where('name', '==', categoryName)
  );

  const docs = await getDocs(q);
  
  if (docs.empty) {
    return null;
  }

  const doc = docs.docs[0];
  return { id: doc.id, ...doc.data() } as BudgetCategory;
}

/**
 * Add a direct expense to a budget category
 * This is for expenses that don't go through shopping lists (e.g., utilities, bills)
 * Uses transaction to atomically update the budget and store the expense record
 */
export async function addDirectExpense(
  familyId: string,
  categoryName: string,
  amount: number,
  description: string,
  createdBy: string
): Promise<void> {
  if (!familyId) {
    throw new Error('Family ID is required');
  }
  
  if (!categoryName) {
    throw new Error('Category name is required');
  }
  
  if (!amount || amount <= 0) {
    throw new Error('Amount must be greater than 0');
  }
  
  const categoryBudget = await getBudgetCategoryByName(familyId, categoryName);
  
  if (!categoryBudget) {
    throw new Error(`Budget category "${categoryName}" not found. Please create it in the Budget screen first.`);
  }
  
  const budgetRef = doc(db, COLLECTIONS.BUDGETS, categoryBudget.id);
  const expenseRef = doc(collection(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.DIRECT_EXPENSES));
  
  try {
    await runTransaction(db, async (transaction) => {
      const budgetDoc = await transaction.get(budgetRef);
      
      if (!budgetDoc.exists()) {
        throw new Error('Budget category document not found');
      }
      
      const currentSpent = (budgetDoc.data().spent as number) || 0;
      const newSpent = currentSpent + amount;
      
      // Update budget
      transaction.update(budgetRef, { spent: newSpent });
      
              // Store expense record
              transaction.set(expenseRef, {
                description,
                amount,
                budgetCategoryName: categoryName,
                createdBy,
                familyId,
                createdAt: serverTimestamp(),
              });
            });
            
            // Send notification after successful transaction
            try {
              const userData = await authService.getCurrentUserData(createdBy);
              const userName = userData?.name || 'Someone';
              // Get currency from store for notification
              const currency = useCurrencyStore.getState().currency;
              notificationService.scheduleNotification(
                'Direct Expense Added',
                `${userName} added an expense: ${description} (${formatCurrency(amount, currency.code, currency.locale)}) to ${categoryName}`
              ).catch((error) => {
                console.warn('Failed to send notification:', error);
              });
            } catch (error) {
              console.warn('Failed to get user name for notification:', error);
            }
          } catch (error: any) {
            console.error('Error in addDirectExpense transaction:', error);
            throw new Error(error.message || 'Failed to update budget. Please try again.');
          }
        }

