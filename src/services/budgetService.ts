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
import { BudgetCategory, BudgetPeriod } from '@/src/types';
import { COLLECTIONS } from '@/src/constants';
import * as notificationService from './notificationService';
import * as authService from './authService';
import { formatCurrency } from '@/src/utils';
import { useCurrencyStore } from '@/src/stores/currencyStore';

/**
 * Budget Period Management
 */

/**
 * Subscribe to budget periods for a family (real-time)
 */
export function subscribeToBudgetPeriods(
  familyId: string,
  callback: (periods: BudgetPeriod[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.BUDGET_PERIODS),
    where('familyId', '==', familyId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const periods: BudgetPeriod[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as BudgetPeriod));
      callback(periods);
    },
    (error) => {
      console.error('Error subscribing to budget periods:', error);
      callback([]);
    }
  );
}

/**
 * Create a new budget period
 */
export async function createBudgetPeriod(
  familyId: string,
  period: Omit<BudgetPeriod, 'id' | 'createdAt' | 'familyId' | 'isArchived'>
): Promise<string> {
  const periodRef = doc(collection(db, COLLECTIONS.BUDGET_PERIODS));
  await setDoc(periodRef, {
    ...period,
    familyId,
    isArchived: false,
    createdAt: serverTimestamp(),
  });
  return periodRef.id;
}

/**
 * Update a budget period
 */
export async function updateBudgetPeriod(
  periodId: string,
  updates: Partial<Omit<BudgetPeriod, 'id' | 'createdAt' | 'familyId'>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.BUDGET_PERIODS, periodId), updates);
}

/**
 * Archive a budget period (mark as inactive)
 */
export async function archiveBudgetPeriod(periodId: string): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.BUDGET_PERIODS, periodId), {
    isArchived: true,
  });
}

/**
 * Delete a budget period
 */
export async function deleteBudgetPeriod(periodId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.BUDGET_PERIODS, periodId));
}

/**
 * Budget Category Management
 * Categories belong to a budget period via budgetPeriodId
 */

/**
 * Subscribe to budget categories for a specific period (real-time)
 */
export function subscribeToBudgetCategories(
  familyId: string,
  periodId: string,
  callback: (categories: BudgetCategory[]) => void
): () => void {
  if (!periodId) {
    console.error('Period ID is required for subscribing to categories');
    callback([]);
    return () => {};
  }
  const q = query(
    collection(db, COLLECTIONS.BUDGET_PERIODS, periodId, COLLECTIONS.BUDGET_CATEGORIES),
    where('familyId', '==', familyId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const categories: BudgetCategory[] = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as BudgetCategory));
      callback(categories);
    },
    (error) => {
      console.error('Error subscribing to budget categories:', error);
      callback([]);
    }
  );
}

/**
 * Initialize default budget categories for a period
 * Only creates categories that don't already exist in the period
 */
export async function initializeBudgetCategories(
  familyId: string,
  periodId: string,
  categories: string[]
): Promise<void> {
  // First, check which categories already exist in this period
  const existingCategoriesQuery = query(
    collection(db, COLLECTIONS.BUDGET_PERIODS, periodId, COLLECTIONS.BUDGET_CATEGORIES),
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
    const categoryRef = doc(collection(db, COLLECTIONS.BUDGET_PERIODS, periodId, COLLECTIONS.BUDGET_CATEGORIES));
    return setDoc(categoryRef, {
      name,
      limit: 0,
      budgetPeriodId: periodId,
      spent: 0,
      familyId,
      createdAt: serverTimestamp(),
    });
  });

  await Promise.all(batch);
}

/**
 * Create or update a budget category
 * Note: Categories belong to a budget period via budgetPeriodId
 */
export async function upsertBudgetCategory(
  periodId: string,
  category: Omit<BudgetCategory, 'id'> | BudgetCategory
): Promise<void> {
  if ('id' in category && category.id) {
    // Update existing
    await updateDoc(
      doc(db, COLLECTIONS.BUDGET_PERIODS, periodId, COLLECTIONS.BUDGET_CATEGORIES, category.id),
      {
        name: category.name,
        limit: category.limit,
        // Don't update spent here - it's calculated from shopping items and direct expenses
      }
    );
  } else {
    // Create new
    const categoryRef = doc(collection(db, COLLECTIONS.BUDGET_PERIODS, periodId, COLLECTIONS.BUDGET_CATEGORIES));
    await setDoc(categoryRef, {
      ...category,
      budgetPeriodId: periodId,
      createdAt: serverTimestamp(),
    });
  }
}

/**
 * Delete a budget category
 */
export async function deleteBudgetCategory(periodId: string, categoryId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.BUDGET_PERIODS, periodId, COLLECTIONS.BUDGET_CATEGORIES, categoryId));
}

/**
 * Update spent amount for a category
 * This is called when shopping items are marked as bought
 */
export async function updateCategorySpent(
  periodId: string,
  categoryId: string,
  spent: number
): Promise<void> {
  await updateDoc(
    doc(db, COLLECTIONS.BUDGET_PERIODS, periodId, COLLECTIONS.BUDGET_CATEGORIES, categoryId),
    { spent }
  );
}

/**
 * Get budget category by name within a specific period
 */
export async function getBudgetCategoryByName(
  familyId: string,
  periodId: string,
  categoryName: string
): Promise<BudgetCategory | null> {
  if (!periodId) {
    console.error('Period ID is required for getBudgetCategoryByName');
    return null;
  }
  
  const q = query(
    collection(db, COLLECTIONS.BUDGET_PERIODS, periodId, COLLECTIONS.BUDGET_CATEGORIES),
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
 * Get budget category by name in the active period
 * Finds the active period first, then looks up the category
 * Falls back to most recent non-archived period if no active period exists
 */
export async function getBudgetCategoryByNameInActivePeriod(
  familyId: string,
  categoryName: string
): Promise<{ category: BudgetCategory; periodId: string } | null> {
  // Get all periods for the family
  const periodsQuery = query(
    collection(db, COLLECTIONS.BUDGET_PERIODS),
    where('familyId', '==', familyId),
    where('isArchived', '==', false)
  );
  
  const periodsSnapshot = await getDocs(periodsQuery);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  // Find all active periods (where today falls within the date range)
  const activePeriods: Array<{ id: string; startDate: string; endDate: string; createdAt: any }> = [];
  let mostRecentPeriod: { id: string; startDate: string; endDate: string; createdAt: any } | null = null;
  
  for (const periodDoc of periodsSnapshot.docs) {
    const period = periodDoc.data();
    const startDate = new Date(period.startDate);
    const endDate = new Date(period.endDate);
    endDate.setHours(23, 59, 59, 999);
    
    // Check if this is an active period
    if (today >= startDate && today <= endDate) {
      activePeriods.push({
        id: periodDoc.id,
        startDate: period.startDate,
        endDate: period.endDate,
        createdAt: period.createdAt,
      });
    }
    
    // Track most recent period (by endDate, then by createdAt)
    if (!mostRecentPeriod || 
        new Date(period.endDate) > new Date(mostRecentPeriod.endDate) ||
        (new Date(period.endDate).getTime() === new Date(mostRecentPeriod.endDate).getTime() &&
         period.createdAt && mostRecentPeriod.createdAt &&
         period.createdAt.toMillis() > mostRecentPeriod.createdAt.toMillis())) {
      mostRecentPeriod = {
        id: periodDoc.id,
        startDate: period.startDate,
        endDate: period.endDate,
        createdAt: period.createdAt,
      };
    }
  }
  
  // If multiple active periods, pick the one with the most recent start date
  // (newer periods take precedence over older ones)
  let activePeriod: { id: string; startDate: string; endDate: string } | null = null;
  
  if (activePeriods.length > 0) {
    // Sort by start date (most recent first), then by creation date if start dates are equal
    activePeriods.sort((a, b) => {
      const startDateA = new Date(a.startDate).getTime();
      const startDateB = new Date(b.startDate).getTime();
      
      if (startDateB !== startDateA) {
        return startDateB - startDateA; // Most recent start date first
      }
      
      // If start dates are equal, use creation date
      const createdAtA = a.createdAt?.toMillis?.() || 0;
      const createdAtB = b.createdAt?.toMillis?.() || 0;
      return createdAtB - createdAtA; // Most recently created first
    });
    
    activePeriod = {
      id: activePeriods[0].id,
      startDate: activePeriods[0].startDate,
      endDate: activePeriods[0].endDate,
    };
  }
  
  // Use active period if found, otherwise fall back to most recent period
  const periodToUse = activePeriod || mostRecentPeriod;
  
  if (!periodToUse) {
    console.warn(`No budget period found for family ${familyId}`);
    return null;
  }
  
  // Get category from the selected period
  let category = await getBudgetCategoryByName(familyId, periodToUse.id, categoryName);
  
  // If not found in the selected period, search all periods (including archived)
  if (!category) {
    console.warn(`Category "${categoryName}" not found in period ${periodToUse.id}, searching all periods...`);
    
    // Search all periods (including archived)
    const allPeriodsQuery = query(
      collection(db, COLLECTIONS.BUDGET_PERIODS),
      where('familyId', '==', familyId)
    );
    const allPeriodsSnapshot = await getDocs(allPeriodsQuery);
    
    // Try each period until we find the category
    for (const periodDoc of allPeriodsSnapshot.docs) {
      const foundCategory = await getBudgetCategoryByName(familyId, periodDoc.id, categoryName);
      if (foundCategory) {
        category = foundCategory;
        periodToUse.id = periodDoc.id;
        console.log(`Found category "${categoryName}" in period ${periodDoc.id}`);
        break;
      }
    }
  }
  
  if (!category) {
    console.warn(`Category "${categoryName}" not found in any period for family ${familyId}`);
    return null;
  }
  
  return { category, periodId: periodToUse.id };
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
  
  // Find category in active period
  const result = await getBudgetCategoryByNameInActivePeriod(familyId, categoryName);
  
  if (!result) {
    throw new Error(`Budget category "${categoryName}" not found in active period. Please create it in the Budget screen first.`);
  }
  
  const { category: categoryBudget, periodId } = result;
  
  // Budget category is in subcollection: budgetPeriods/{periodId}/budgets/{categoryId}
  const budgetRef = doc(db, COLLECTIONS.BUDGET_PERIODS, periodId, COLLECTIONS.BUDGET_CATEGORIES, categoryBudget.id);
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
        `${userName} added an expense: ${description} (${formatCurrency(amount, currency.code, currency.locale, currency.symbol)}) to ${categoryName}`
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

