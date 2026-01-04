import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  onSnapshot,
  Timestamp,
  Unsubscribe 
} from 'firebase/firestore';
import { db } from './firebase';
import { Note } from '@/src/types';

const COLLECTION_NAME = 'notes';

/**
 * Create a new note
 */
export async function createNote(userId: string, title: string, content: string): Promise<Note> {
  const now = Timestamp.now();
  const noteData = {
    title: title.trim(),
    content: content.trim(),
    userId,
    createdAt: now,
    updatedAt: now,
  };

  const docRef = await addDoc(collection(db, COLLECTION_NAME), noteData);
  return {
    id: docRef.id,
    ...noteData,
  } as Note;
}

/**
 * Update an existing note
 */
export async function updateNote(noteId: string, updates: { title?: string; content?: string }): Promise<void> {
  const updateData: any = {
    updatedAt: Timestamp.now(),
  };

  if (updates.title !== undefined) {
    updateData.title = updates.title.trim();
  }
  if (updates.content !== undefined) {
    updateData.content = updates.content.trim();
  }

  await updateDoc(doc(db, COLLECTION_NAME, noteId), updateData);
}

/**
 * Delete a note
 */
export async function deleteNote(noteId: string): Promise<void> {
  await deleteDoc(doc(db, COLLECTION_NAME, noteId));
}

/**
 * Get a single note by ID
 */
export async function getNote(noteId: string): Promise<Note | null> {
  const noteDoc = await getDoc(doc(db, COLLECTION_NAME, noteId));
  if (!noteDoc.exists()) {
    return null;
  }
  return { id: noteDoc.id, ...noteDoc.data() } as Note;
}

/**
 * Get all notes for a user
 */
export async function getNotes(userId: string): Promise<Note[]> {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  })) as Note[];
}

/**
 * Subscribe to notes for a user (real-time updates)
 */
export function subscribeToNotes(
  userId: string,
  callback: (notes: Note[]) => void
): Unsubscribe {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('updatedAt', 'desc')
  );

  return onSnapshot(q, (querySnapshot) => {
    const notes = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Note[];
    callback(notes);
  });
}

