import { create } from 'zustand';
import { DirectExpense } from '@/src/types';
import * as directExpenseService from '@/src/services/directExpenseService';

interface DirectExpenseState {
  // State
  expenses: DirectExpense[];
  loading: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;

  // Actions
  subscribeToExpenses: (familyId: string) => void;
  deleteExpense: (familyId: string, expenseId: string) => Promise<void>;
  clearExpenses: () => void;
  setError: (error: string | null) => void;
}

export const useDirectExpenseStore = create<DirectExpenseState>((set, get) => ({
  // Initial state
  expenses: [],
  loading: false,
  error: null,
  unsubscribe: null,

  // Subscribe to direct expenses (real-time)
  subscribeToExpenses: (familyId: string) => {
    const { unsubscribe: existingUnsubscribe } = get();
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    set({ loading: true, error: null });

    const unsubscribe = directExpenseService.subscribeToDirectExpenses(familyId, (expenses) => {
      set({ expenses, loading: false });
    });

    set({ unsubscribe });
  },

  // Delete expense
  deleteExpense: async (familyId: string, expenseId: string) => {
    set({ loading: true, error: null });
    try {
      await directExpenseService.deleteDirectExpense(familyId, expenseId);
      // Real-time subscription will update expenses automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete expense', loading: false });
      throw error;
    }
  },

  // Clear expenses (cleanup)
  clearExpenses: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
    }
    set({ expenses: [], unsubscribe: null });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));

