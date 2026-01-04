import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { COLLECTIONS } from '@/src/constants';

/**
 * Mark an activity as read for a user
 * Activities are identified by their ID (e.g., "task-123", "event-456")
 */
export async function markActivityAsRead(userId: string, activityId: string): Promise<void> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const readActivities = userData.readActivities || [];
    
    if (!readActivities.includes(activityId)) {
      await updateDoc(userRef, {
        readActivities: [...readActivities, activityId],
      });
    }
  } catch (error) {
    console.error('Error marking activity as read:', error);
    throw error;
  }
}

/**
 * Get all read activity IDs for a user
 */
export async function getReadActivities(userId: string): Promise<string[]> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      return [];
    }

    const userData = userDoc.data();
    return userData.readActivities || [];
  } catch (error) {
    console.error('Error getting read activities:', error);
    return [];
  }
}

/**
 * Mark multiple activities as read
 */
export async function markActivitiesAsRead(userId: string, activityIds: string[]): Promise<void> {
  try {
    const userRef = doc(db, COLLECTIONS.USERS, userId);
    const userDoc = await getDoc(userRef);
    
    if (!userDoc.exists()) {
      throw new Error('User not found');
    }

    const userData = userDoc.data();
    const existingReadActivities = new Set(userData.readActivities || []);
    
    // Add new activity IDs
    activityIds.forEach(id => existingReadActivities.add(id));
    
    await updateDoc(userRef, {
      readActivities: Array.from(existingReadActivities),
    });
  } catch (error) {
    console.error('Error marking activities as read:', error);
    throw error;
  }
}

