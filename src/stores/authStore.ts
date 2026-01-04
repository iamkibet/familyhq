import { create } from 'zustand';
import { User as FirebaseUser } from 'firebase/auth';
import { User, Family } from '@/src/types';
import * as authService from '@/src/services/authService';
import * as familyService from '@/src/services/familyService';

interface AuthState {
  // State
  currentUser: FirebaseUser | null;
  userData: User | null;
  family: Family | null;
  loading: boolean;
  error: string | null;

  // Actions
  initializeAuth: () => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  createFamily: (name: string) => Promise<void>;
  joinFamily: (inviteCode: string) => Promise<void>;
  loadFamilyData: () => Promise<void>;
  setError: (error: string | null) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // Initial state
  currentUser: null,
  userData: null,
  family: null,
  loading: false,
  error: null,

  // Initialize auth state listener
  initializeAuth: async () => {
    set({ loading: true, error: null });
    try {
      authService.onAuthStateChange(async (firebaseUser) => {
        if (firebaseUser) {
          const userData = await authService.getCurrentUserData(firebaseUser.uid);
          set({ currentUser: firebaseUser, userData });
          
          // Load family data if user has a family
          if (userData?.familyId) {
            await get().loadFamilyData();
          }
        } else {
          set({ currentUser: null, userData: null, family: null });
        }
        set({ loading: false });
      });
    } catch (error: any) {
      set({ error: error.message || 'Failed to initialize auth', loading: false });
    }
  },

  // Sign up
  signUp: async (email: string, password: string, name: string) => {
    set({ loading: true, error: null });
    try {
      await authService.signUp(email, password, name);
      // Auth state change listener will update currentUser and userData
    } catch (error: any) {
      set({ error: error.message || 'Failed to sign up', loading: false });
      throw error;
    }
  },

  // Sign in
  signIn: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      await authService.signIn(email, password);
      // Auth state change listener will update currentUser and userData
    } catch (error: any) {
      set({ error: error.message || 'Failed to sign in', loading: false });
      throw error;
    }
  },

  // Sign in with Google
  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      await authService.signInWithGoogle();
      // Auth state change listener will update currentUser and userData
    } catch (error: any) {
      set({ error: error.message || 'Failed to sign in with Google', loading: false });
      throw error;
    }
  },

  // Sign out
  signOut: async () => {
    set({ loading: true, error: null });
    try {
      await authService.signOutUser();
      set({ currentUser: null, userData: null, family: null, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to sign out', loading: false });
      throw error;
    }
  },

  // Create family
  createFamily: async (name: string) => {
    const { currentUser } = get();
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    set({ loading: true, error: null });
    try {
      const family = await familyService.createFamily(name, currentUser.uid);
      
      // Reload user data to get updated familyId
      const userData = await authService.getCurrentUserData(currentUser.uid);
      set({ family, userData, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to create family', loading: false });
      throw error;
    }
  },

  // Join family by invite code
  joinFamily: async (inviteCode: string) => {
    const { currentUser } = get();
    if (!currentUser) {
      throw new Error('User must be authenticated');
    }

    set({ loading: true, error: null });
    try {
      const family = await familyService.joinFamilyByInviteCode(inviteCode, currentUser.uid);
      
      if (!family) {
        throw new Error('Invalid invite code');
      }

      // Reload user data to get updated familyId
      const userData = await authService.getCurrentUserData(currentUser.uid);
      set({ family, userData, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to join family', loading: false });
      throw error;
    }
  },

  // Load family data
  loadFamilyData: async () => {
    const { userData } = get();
    if (!userData?.familyId) {
      return;
    }

    set({ loading: true, error: null });
    try {
      const family = await familyService.getFamily(userData.familyId);
      set({ family, loading: false });
    } catch (error: any) {
      set({ error: error.message || 'Failed to load family data', loading: false });
    }
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));

