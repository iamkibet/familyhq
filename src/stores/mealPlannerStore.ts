import { create } from 'zustand';
import { MealPlanEntry, MealType } from '@/src/types';
import * as mealPlannerService from '@/src/services/mealPlannerService';

/** Week is identified by Monday's date YYYY-MM-DD */
type WeekKey = string;

/** Map: "YYYY-MM-DD" -> Map<MealType, MealPlanEntry> */
export type EntriesByDate = Record<string, Record<MealType, MealPlanEntry | null>>;

interface MealPlannerState {
  entries: MealPlanEntry[];
  /** Current week range (Monday–Sunday) we're subscribed to */
  weekStart: string | null;
  weekEnd: string | null;
  loading: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;

  /** Load plans for the given week (sets weekStart/weekEnd and subscribes) */
  loadWeek: (familyId: string, date: Date) => void;
  /** Get entries grouped by date and mealType for the timetable */
  getEntriesByDate: (start: string, end: string) => EntriesByDate;
  addEntry: (
    familyId: string,
    entry: Omit<MealPlanEntry, 'id' | 'createdAt' | 'familyId'>
  ) => Promise<void>;
  updateEntry: (
    entryId: string,
    updates: Partial<Omit<MealPlanEntry, 'id' | 'familyId' | 'createdAt' | 'createdBy'>>
  ) => Promise<void>;
  deleteEntry: (entryId: string) => Promise<void>;
  clearEntries: () => void;
  setError: (error: string | null) => void;
}

function toLocalDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function buildEntriesByDate(entries: MealPlanEntry[], start: string, end: string): EntriesByDate {
  const result: EntriesByDate = {};
  const startD = new Date(start + 'T12:00:00');
  const endD = new Date(end + 'T12:00:00');
  for (let d = new Date(startD); d <= endD; d.setDate(d.getDate() + 1)) {
    const dateStr = toLocalDateStr(d);
    result[dateStr] = {
      breakfast: null,
      lunch: null,
      dinner: null,
      snack: null,
    };
  }
  for (const e of entries) {
    if (!e || typeof e.date !== 'string' || !e.mealType) continue;
    if (result[e.date] && e.mealType in result[e.date]) {
      result[e.date][e.mealType] = e;
    }
  }
  return result;
}

export const useMealPlannerStore = create<MealPlannerState>((set, get) => ({
  entries: [],
  weekStart: null,
  weekEnd: null,
  loading: false,
  error: null,
  unsubscribe: null,

  loadWeek: (familyId: string, date: Date) => {
    const { unsubscribe: existing } = get();
    if (existing) existing();

    const { start, end } = mealPlannerService.getWeekRange(date);
    set({ loading: true, error: null, weekStart: start, weekEnd: end });

    const unsubscribe = mealPlannerService.subscribeToMealPlans(
      familyId,
      start,
      end,
      (entries) => set({ entries, loading: false })
    );
    set({ unsubscribe });
  },

  getEntriesByDate: (start: string, end: string) => {
    return buildEntriesByDate(get().entries, start, end);
  },

  addEntry: async (familyId, entry) => {
    set({ loading: true, error: null });
    try {
      await mealPlannerService.addMealPlanEntry(familyId, entry);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to add meal';
      set({ error: message, loading: false });
      throw err;
    }
  },

  updateEntry: async (entryId, updates) => {
    set({ loading: true, error: null });
    try {
      await mealPlannerService.updateMealPlanEntry(entryId, updates);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update meal';
      set({ error: message, loading: false });
      throw err;
    }
  },

  deleteEntry: async (entryId) => {
    set({ loading: true, error: null });
    try {
      await mealPlannerService.deleteMealPlanEntry(entryId);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete meal';
      set({ error: message, loading: false });
      throw err;
    }
  },

  clearEntries: () => {
    const { unsubscribe } = get();
    if (unsubscribe) unsubscribe();
    set({ entries: [], weekStart: null, weekEnd: null, unsubscribe: null });
  },

  setError: (error: string | null) => set({ error }),
}));
