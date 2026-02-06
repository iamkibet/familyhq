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
  orderBy,
} from 'firebase/firestore';
import { db } from './firebase';
import { MealPlanEntry, MealType } from '@/src/types';
import { COLLECTIONS } from '@/src/constants';

/** Format a Date as YYYY-MM-DD in local timezone */
function toLocalDateString(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/**
 * Get start and end of week (Monday–Sunday) for a given date, in local timezone.
 * Returns YYYY-MM-DD strings.
 */
export function getWeekRange(date: Date): { start: string; end: string } {
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  const start = toLocalDateString(d);
  d.setDate(d.getDate() + 6);
  const end = toLocalDateString(d);
  return { start, end };
}

/**
 * Subscribe to meal plans for a family and a date range (e.g. one week).
 * Firestore composite index required: familyId (Asc), date (Asc).
 */
export function subscribeToMealPlans(
  familyId: string,
  startDate: string,
  endDate: string,
  callback: (entries: MealPlanEntry[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.MEAL_PLANS),
    where('familyId', '==', familyId),
    where('date', '>=', startDate),
    where('date', '<=', endDate),
    orderBy('date', 'asc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const entries: MealPlanEntry[] = snapshot.docs
        .map((docSnap) => {
          const data = docSnap.data();
          if (!data || typeof data.date !== 'string' || !data.mealType || !data.title || !data.createdBy) {
            return null;
          }
          return {
            id: docSnap.id,
            familyId: data.familyId,
            date: data.date,
            mealType: data.mealType,
            title: data.title,
            description: data.description,
            createdBy: data.createdBy,
            createdAt: (data.createdAt as Timestamp) || null,
            ingredients: Array.isArray(data.ingredients) ? data.ingredients : undefined,
          } as MealPlanEntry;
        })
        .filter((e): e is MealPlanEntry => e != null);
      callback(entries);
    },
    (error) => {
      console.error('mealPlanner subscribe error:', error);
      callback([]);
    }
  );
}

/**
 * Firestore does not allow undefined as a field value.
 * Build a document with only defined fields so addDoc/updateDoc never receive undefined.
 */
function buildMealPlanDocument(
  entry: Omit<MealPlanEntry, 'id' | 'createdAt' | 'familyId'>,
  familyId: string
): Record<string, unknown> {
  const data: Record<string, unknown> = {
    familyId,
    date: entry.date,
    mealType: entry.mealType,
    title: entry.title,
    createdBy: entry.createdBy,
    createdAt: serverTimestamp(),
  };
  if (entry.description != null && entry.description !== '') {
    data.description = entry.description;
  }
  if (Array.isArray(entry.ingredients) && entry.ingredients.length > 0) {
    data.ingredients = entry.ingredients.filter((i) => i != null && i !== '');
  }
  return data;
}

/**
 * Add a meal plan entry.
 */
export async function addMealPlanEntry(
  familyId: string,
  entry: Omit<MealPlanEntry, 'id' | 'createdAt' | 'familyId'>
): Promise<string> {
  if (!entry || typeof entry.date !== 'string' || !entry.mealType || !entry.title || !entry.createdBy) {
    throw new Error('Meal plan entry must have date, mealType, title, and createdBy');
  }
  const data = buildMealPlanDocument(entry, familyId);
  const docRef = await addDoc(collection(db, COLLECTIONS.MEAL_PLANS), data);
  return docRef.id;
}

/**
 * Firestore does not allow undefined. Build update object with only defined fields.
 */
function buildMealPlanUpdates(
  updates: Partial<Omit<MealPlanEntry, 'id' | 'familyId' | 'createdAt' | 'createdBy'>>
): Record<string, unknown> {
  const data: Record<string, unknown> = {};
  if (updates.date != null) data.date = updates.date;
  if (updates.mealType != null) data.mealType = updates.mealType;
  if (updates.title != null) data.title = updates.title;
  if (updates.description !== undefined) {
    data.description = updates.description === '' || updates.description == null ? null : updates.description;
  }
  if (updates.ingredients !== undefined) {
    data.ingredients = Array.isArray(updates.ingredients)
      ? updates.ingredients.filter((i) => i != null && i !== '')
      : null;
  }
  return data;
}

/**
 * Update an existing meal plan entry.
 */
export async function updateMealPlanEntry(
  entryId: string,
  updates: Partial<Omit<MealPlanEntry, 'id' | 'familyId' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  const data = buildMealPlanUpdates(updates);
  if (Object.keys(data).length === 0) return;
  await updateDoc(doc(db, COLLECTIONS.MEAL_PLANS, entryId), data);
}

/**
 * Delete a meal plan entry.
 */
export async function deleteMealPlanEntry(entryId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.MEAL_PLANS, entryId));
}
