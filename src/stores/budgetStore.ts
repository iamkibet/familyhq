import { create } from 'zustand';
import { BudgetCategory } from '@/src/types';
import * as budgetService from '@/src/services/budgetService';
import { DEFAULT_BUDGET_CATEGORIES } from '@/src/constants';

interface BudgetState {
  // State
  categories: BudgetCategory[];
  loading: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;

  // Actions
  subscribeToCategories: (familyId: string) => void;
  initializeCategories: (familyId: string) => Promise<void>;
  upsertCategory: (category: Omit<BudgetCategory, 'id'> | BudgetCategory) => Promise<void>;
  updateCategorySpent: (categoryId: string, spent: number) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;
  addDirectExpense: (familyId: string, categoryName: string, amount: number, description: string, createdBy: string) => Promise<void>;
  clearCategories: () => void;
  setError: (error: string | null) => void;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  // Initial state
  categories: [],
  loading: false,
  error: null,
  unsubscribe: null,

  // Subscribe to budget categories (real-time)
  subscribeToCategories: (familyId: string) => {
    // Clean up existing subscription
    const { unsubscribe: existingUnsubscribe } = get();
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    set({ loading: true, error: null });

    const unsubscribe = budgetService.subscribeToBudgetCategories(familyId, (categories) => {
      set({ categories, loading: false });
    });

    set({ unsubscribe });
  },

  // Initialize default categories
  initializeCategories: async (familyId: string) => {
    set({ loading: true, error: null });
    try {
      await budgetService.initializeBudgetCategories(familyId, DEFAULT_BUDGET_CATEGORIES);
      // Real-time subscription will update categories automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to initialize categories', loading: false });
      throw error;
    }
  },

  // Create or update category
  upsertCategory: async (category) => {
    set({ loading: true, error: null });
    try {
      await budgetService.upsertBudgetCategory(category);
      // Real-time subscription will update categories automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to save category', loading: false });
      throw error;
    }
  },

  // Update spent amount
  updateCategorySpent: async (categoryId: string, spent: number) => {
    set({ error: null });
    try {
      await budgetService.updateCategorySpent(categoryId, spent);
      // Real-time subscription will update categories automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to update spent', loading: false });
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (categoryId: string) => {
    set({ loading: true, error: null });
    try {
      await budgetService.deleteBudgetCategory(categoryId);
      // Real-time subscription will update categories automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete category', loading: false });
      throw error;
    }
  },

  // Add direct expense (for utilities, bills, etc.)
  addDirectExpense: async (familyId: string, categoryName: string, amount: number, description: string, createdBy: string) => {
    set({ error: null });
    try {
      await budgetService.addDirectExpense(familyId, categoryName, amount, description, createdBy);
      // Real-time subscription will update categories automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to add expense', loading: false });
      throw error;
    }
  },

  // Clear categories (cleanup)
  clearCategories: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
    }
    set({ categories: [], unsubscribe: null });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));

