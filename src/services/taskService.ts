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
import { Task } from '@/src/types';
import { COLLECTIONS } from '@/src/constants';
import * as notificationService from './notificationService';
import * as authService from './authService';

/**
 * Subscribe to tasks for a family (real-time)
 */
export function subscribeToTasks(
  familyId: string,
  callback: (tasks: Task[]) => void
): () => void {
  const q = query(
    collection(db, COLLECTIONS.TASKS),
    where('familyId', '==', familyId)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const tasks: Task[] = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: (data.createdAt as Timestamp) || null,
        } as Task;
      });
      
      // Sort by due date (upcoming first), then by created date
      tasks.sort((a, b) => {
        const dateA = new Date(a.dueDate).getTime();
        const dateB = new Date(b.dueDate).getTime();
        if (dateA !== dateB) return dateA - dateB;
        // Handle null createdAt
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return b.createdAt.toMillis() - a.createdAt.toMillis();
      });
      
      callback(tasks);
    },
    (error) => {
      console.error('Error subscribing to tasks:', error);
      // Return empty array on error to prevent app crash
      callback([]);
    }
  );
}

/**
 * Add a new task
 */
export async function addTask(
  familyId: string,
  task: Omit<Task, 'id' | 'createdAt' | 'familyId'>
): Promise<string> {
  const docRef = await addDoc(collection(db, COLLECTIONS.TASKS), {
    ...task,
    familyId,
    createdAt: serverTimestamp(),
  });
  
  // Send notification
  try {
    const userData = await authService.getCurrentUserData(task.createdBy);
    const userName = userData?.name || 'Someone';
    notificationService.scheduleNotification(
      'New Task',
      `${userName} added a new task: ${task.title}`
    ).catch((error) => {
      console.warn('Failed to send notification:', error);
    });
  } catch (error) {
    console.warn('Failed to get user name for notification:', error);
  }
  
  return docRef.id;
}

/**
 * Update a task
 */
export async function updateTask(
  taskId: string,
  updates: Partial<Omit<Task, 'id' | 'familyId' | 'createdAt' | 'createdBy'>>
): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.TASKS, taskId), updates);
}

/**
 * Delete a task
 */
export async function deleteTask(taskId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTIONS.TASKS, taskId));
}

/**
 * Toggle task completion
 */
export async function toggleTaskCompleted(taskId: string, completed: boolean): Promise<void> {
  await updateDoc(doc(db, COLLECTIONS.TASKS, taskId), { completed });
}

