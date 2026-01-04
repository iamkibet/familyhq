import { create } from 'zustand';
import { BudgetCategory, BudgetPeriod } from '@/src/types';
import * as budgetService from '@/src/services/budgetService';
import { DEFAULT_BUDGET_CATEGORIES } from '@/src/constants';

interface BudgetState {
  // Period state
  periods: BudgetPeriod[];
  activePeriod: BudgetPeriod | null;
  periodsUnsubscribe: (() => void) | null;
  
  // Category state
  categories: BudgetCategory[];
  categoriesUnsubscribe: (() => void) | null;
  
  // General state
  loading: boolean;
  error: string | null;

  // Period actions
  subscribeToPeriods: (familyId: string) => void;
  createPeriod: (familyId: string, period: Omit<BudgetPeriod, 'id' | 'createdAt' | 'familyId' | 'isArchived'>) => Promise<void>;
  updatePeriod: (periodId: string, updates: Partial<Omit<BudgetPeriod, 'id' | 'createdAt' | 'familyId'>>) => Promise<void>;
  archivePeriod: (periodId: string) => Promise<void>;
  deletePeriod: (periodId: string) => Promise<void>;
  clearPeriods: () => void;
  
  // Category actions
  subscribeToCategories: (familyId: string, periodId: string) => void;
  initializeCategories: (familyId: string, periodId: string) => Promise<void>;
  upsertCategory: (periodId: string, category: Omit<BudgetCategory, 'id'> | BudgetCategory) => Promise<void>;
  deleteCategory: (periodId: string, categoryId: string) => Promise<void>;
  clearCategories: () => void;
  
  // Utility
  setError: (error: string | null) => void;
}

export const useBudgetStore = create<BudgetState>((set, get) => ({
  // Initial state
  periods: [],
  activePeriod: null,
  periodsUnsubscribe: null,
  categories: [],
  categoriesUnsubscribe: null,
  loading: false,
  error: null,

  // Subscribe to budget periods (real-time)
  subscribeToPeriods: (familyId: string) => {
    // Clean up existing subscription
    const { periodsUnsubscribe: existingUnsubscribe } = get();
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    set({ loading: true, error: null });

    const unsubscribe = budgetService.subscribeToBudgetPeriods(familyId, (periods) => {
      // Find active period (not archived and current date is within range)
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      // Find all periods where today falls within the date range
      const activePeriods = periods.filter((period) => {
        if (period.isArchived) return false;
        const startDate = new Date(period.startDate);
        const endDate = new Date(period.endDate);
        endDate.setHours(23, 59, 59, 999);
        return today >= startDate && today <= endDate;
      });
      
      // If multiple active periods, pick the one with the most recent start date
      // (newer periods take precedence over older ones)
      let active: BudgetPeriod | null = null;
      
      if (activePeriods.length > 0) {
        // Sort by start date (most recent first), then by creation date if start dates are equal
        activePeriods.sort((a, b) => {
          const startDateA = new Date(a.startDate).getTime();
          const startDateB = new Date(b.startDate).getTime();
          
          if (startDateB !== startDateA) {
            return startDateB - startDateA; // Most recent start date first
          }
          
          // If start dates are equal, use creation date
          const createdAtA = a.createdAt?.toMillis?.() || 0;
          const createdAtB = b.createdAt?.toMillis?.() || 0;
          return createdAtB - createdAtA; // Most recently created first
        });
        
        active = activePeriods[0];
      }

      set({ periods, activePeriod: active, loading: false });
    });

    set({ periodsUnsubscribe: unsubscribe });
  },

  // Create a new budget period
  createPeriod: async (familyId: string, period: Omit<BudgetPeriod, 'id' | 'createdAt' | 'familyId' | 'isArchived'>) => {
    set({ loading: true, error: null });
    try {
      await budgetService.createBudgetPeriod(familyId, period);
      // Real-time subscription will update periods automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to create period', loading: false });
      throw error;
    }
  },

  // Update a budget period
  updatePeriod: async (periodId: string, updates: Partial<Omit<BudgetPeriod, 'id' | 'createdAt' | 'familyId'>>) => {
    set({ error: null });
    try {
      await budgetService.updateBudgetPeriod(periodId, updates);
    } catch (error: any) {
      set({ error: error.message || 'Failed to update period', loading: false });
      throw error;
    }
  },

  // Archive a budget period
  archivePeriod: async (periodId: string) => {
    set({ error: null });
    try {
      await budgetService.archiveBudgetPeriod(periodId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to archive period', loading: false });
      throw error;
    }
  },

  // Delete a budget period
  deletePeriod: async (periodId: string) => {
    set({ loading: true, error: null });
    try {
      await budgetService.deleteBudgetPeriod(periodId);
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete period', loading: false });
      throw error;
    }
  },

  // Clear periods (cleanup)
  clearPeriods: () => {
    const { periodsUnsubscribe } = get();
    if (periodsUnsubscribe) {
      periodsUnsubscribe();
    }
    set({ periods: [], activePeriod: null, periodsUnsubscribe: null });
  },

  // Subscribe to budget categories for a period (real-time)
  subscribeToCategories: (familyId: string, periodId: string) => {
    // Clean up existing subscription
    const { categoriesUnsubscribe: existingUnsubscribe } = get();
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    set({ loading: true, error: null });

    const unsubscribe = budgetService.subscribeToBudgetCategories(familyId, periodId, (categories) => {
      set({ categories, loading: false });
    });

    set({ categoriesUnsubscribe: unsubscribe });
  },

  // Initialize default categories for a period
  initializeCategories: async (familyId: string, periodId: string) => {
    set({ loading: true, error: null });
    try {
      await budgetService.initializeBudgetCategories(familyId, periodId, DEFAULT_BUDGET_CATEGORIES);
      // Real-time subscription will update categories automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to initialize categories', loading: false });
      throw error;
    }
  },

  // Create or update category
  upsertCategory: async (periodId: string, category: Omit<BudgetCategory, 'id'> | BudgetCategory) => {
    set({ loading: true, error: null });
    try {
      await budgetService.upsertBudgetCategory(periodId, category);
      // Real-time subscription will update categories automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to save category', loading: false });
      throw error;
    }
  },

  // Delete category
  deleteCategory: async (periodId: string, categoryId: string) => {
    set({ loading: true, error: null });
    try {
      await budgetService.deleteBudgetCategory(periodId, categoryId);
      // Real-time subscription will update categories automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete category', loading: false });
      throw error;
    }
  },

  // Clear categories (cleanup)
  clearCategories: () => {
    const { categoriesUnsubscribe } = get();
    if (categoriesUnsubscribe) {
      categoriesUnsubscribe();
    }
    set({ categories: [], categoriesUnsubscribe: null });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));
