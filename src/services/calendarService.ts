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
} from 'firebase/firestore';
import { db } from './firebase';
import { FamilyEvent } from '@/src/types';
import { COLLECTIONS } from '@/src/constants';
import * as notificationService from './notificationService';
import * as authService from './authService';

/**
 * Subscribe to events for a family (real-time)
 */
export function subscribeToEvents(
  familyId: string,
  callback: (events: FamilyEvent[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.EVENTS),
    where('familyId', '==', familyId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const events: FamilyEvent[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp) || null,
        } as FamilyEvent;
      });
      
      // Sort by date (upcoming first)
      events.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateA - dateB;
      });
      
      callback(events);
    },
    (error) => {
      console.error('Error subscribing to events:', error);
      // Return empty array on error to prevent app crash
      callback([]);
    }
  );
}

/**
 * Add a new event
 */
export async function addEvent(
  familyId: string,
  event: Omit<FamilyEvent, 'id' | 'createdAt' | 'familyId'>
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.EVENTS), {
    ...event,
    familyId,
    createdAt: serverTimestamp(),
  });
  
  // Send notification
  try {
    const userData = await authService.getCurrentUserData(event.createdBy);
    const userName = userData?.name || 'Someone';
    const eventDate = new Date(event.date).toLocaleDateString();
    
    // Immediate notification for new event
    notificationService.scheduleNotification(
      'New Family Event',
      `${userName} added a new event: ${event.title} on ${eventDate}`
    ).catch((error) => {
      console.warn('Failed to send notification:', error);
    });
    
    // Schedule "today" reminder if event is today
    if (isToday(event.date)) {
      const todayDate = new Date();
      todayDate.setHours(8, 0, 0, 0); // 8 AM reminder
      if (todayDate.getTime() > Date.now()) {
        notificationService.scheduleNotificationForDate(
          'Event Today',
          `Today: ${event.title}`,
          todayDate
        ).catch((error) => {
          console.warn('Failed to schedule today reminder:', error);
        });
      }
    }
  } catch (error) {
    console.warn('Failed to get user name for notification:', error);
  }
  
  return docRef.id;
}

/**
 * Update an event
 */
export async function updateEvent(
  eventId: string,
  updates: Partial<Omit<FamilyEvent, 'id' | 'familyId' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.EVENTS, eventId), updates);
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.EVENTS, eventId));
}

