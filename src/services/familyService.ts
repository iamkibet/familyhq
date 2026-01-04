import {
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from 'firebase/firestore';
import { db } from './firebase';
import { Family, User } from '@/src/types';
import { COLLECTIONS } from '@/src/constants';
import { generateInviteCode } from '@/src/utils';

/**
 * Create a new family
 */
export async function createFamily(name: string, adminUserId: string): Promise<Family> {
  const inviteCode = generateInviteCode();
  
  // Check if invite code already exists (unlikely but handle it)
  let codeExists = true;
  let finalCode = inviteCode;
  while (codeExists) {
    const existing = await getDocs(
      query(collection(db, COLLECTIONS.FAMILIES), where('inviteCode', '==', finalCode))
    );
    if (existing.empty) {
      codeExists = false;
    } else {
      finalCode = generateInviteCode();
    }
  }

  const familyRef = doc(collection(db, COLLECTIONS.FAMILIES));
  const family: Omit<Family, 'id'> = {
    name,
    createdAt: serverTimestamp() as any,
    inviteCode: finalCode,
  };

  await setDoc(familyRef, family);

  // Update user to belong to this family
  await updateDoc(doc(db, COLLECTIONS.USERS, adminUserId), {
    familyId: familyRef.id,
    role: 'admin',
  });

  return { id: familyRef.id, ...family } as Family;
}

/**
 * Get family by ID
 */
export async function getFamily(familyId: string): Promise<Family | null> {
  const familyDoc = await getDoc(doc(db, COLLECTIONS.FAMILIES, familyId));
  if (!familyDoc.exists()) {
    return null;
  }
  return { id: familyDoc.id, ...familyDoc.data() } as Family;
}

/**
 * Join family by invite code
 */
export async function joinFamilyByInviteCode(
  inviteCode: string,
  userId: string
): Promise<Family | null> {
  // Find family by invite code
  const familyQuery = query(
    collection(db, COLLECTIONS.FAMILIES),
    where('inviteCode', '==', inviteCode.toUpperCase())
  );
  const familyDocs = await getDocs(familyQuery);

  if (familyDocs.empty) {
    return null;
  }

  const familyDoc = familyDocs.docs[0];
  const familyId = familyDoc.id;

  // Update user to belong to this family
  await updateDoc(doc(db, COLLECTIONS.USERS, userId), {
    familyId,
    role: 'member',
  });

  return { id: familyDoc.id, ...familyDoc.data() } as Family;
}

/**
 * Get all family members
 */
export async function getFamilyMembers(familyId: string): Promise<User[]> {
  const usersQuery = query(
    collection(db, COLLECTIONS.USERS),
    where('familyId', '==', familyId)
  );
  const userDocs = await getDocs(usersQuery);
  return userDocs.docs.map((doc) => ({ id: doc.id, ...doc.data() } as User));
}

