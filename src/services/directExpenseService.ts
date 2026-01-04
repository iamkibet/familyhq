import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { DirectExpense } from '@/src/types';
import { COLLECTIONS } from '@/src/constants';

/**
 * Subscribe to direct expenses for a family (real-time)
 */
export function subscribeToDirectExpenses(
  familyId: string,
  callback: (expenses: DirectExpense[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.DIRECT_EXPENSES),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses: DirectExpense[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp) || null,
        } as DirectExpense;
      });
      callback(expenses);
    },
    (error) => {
      console.error('Error subscribing to direct expenses:', error);
      // Return empty array on error to prevent app crash
      callback([]);
    }
  );
}

/**
 * Subscribe to direct expenses for a specific budget category (real-time)
 */
export function subscribeToDirectExpensesByCategory(
  familyId: string,
  categoryName: string,
  callback: (expenses: DirectExpense[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.DIRECT_EXPENSES),
    where('budgetCategoryName', '==', categoryName),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const expenses: DirectExpense[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp) || null,
        } as DirectExpense;
      });
      callback(expenses);
    },
    (error) => {
      console.error('Error subscribing to direct expenses by category:', error);
      // Return empty array on error to prevent app crash
      callback([]);
    }
  );
}

/**
 * Add a new direct expense
 */
export async function addDirectExpense(
  familyId: string,
  expense: Omit<DirectExpense, 'id' | 'createdAt' | 'familyId'>
): Promise<string> {
  const docRef = await addDoc(
    collection(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.DIRECT_EXPENSES),
    {
      ...expense,
      familyId,
      createdAt: serverTimestamp(),
    }
  );
  return docRef.id;
}

/**
 * Delete a direct expense
 */
export async function deleteDirectExpense(
  familyId: string,
  expenseId: string
): Promise<void> {
  await deleteDoc(
    doc(db, COLLECTIONS.FAMILIES, familyId, COLLECTIONS.DIRECT_EXPENSES, expenseId)
  );
}

