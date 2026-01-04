import { create } from 'zustand';
import { FamilyEvent } from '@/src/types';
import * as calendarService from '@/src/services/calendarService';

interface CalendarState {
  // State
  events: FamilyEvent[];
  loading: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;

  // Actions
  subscribeToEvents: (familyId: string) => void;
  addEvent: (familyId: string, event: Omit<FamilyEvent, 'id' | 'createdAt' | 'familyId'>) => Promise<void>;
  updateEvent: (
    eventId: string,
    updates: Partial<Omit<FamilyEvent, 'id' | 'familyId' | 'createdAt' | 'createdBy'>>
  ) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
  clearEvents: () => void;
  setError: (error: string | null) => void;
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  // Initial state
  events: [],
  loading: false,
  error: null,
  unsubscribe: null,

  // Subscribe to events (real-time)
  subscribeToEvents: (familyId: string) => {
    // Clean up existing subscription
    const { unsubscribe: existingUnsubscribe } = get();
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    set({ loading: true, error: null });

    const unsubscribe = calendarService.subscribeToEvents(familyId, (events) => {
      set({ events, loading: false });
    });

    set({ unsubscribe });
  },

  // Add event
  addEvent: async (familyId: string, event) => {
    set({ loading: true, error: null });
    try {
      await calendarService.addEvent(familyId, event);
      // Real-time subscription will update events automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to add event', loading: false });
      throw error;
    }
  },

  // Update event
  updateEvent: async (eventId: string, updates) => {
    set({ loading: true, error: null });
    try {
      await calendarService.updateEvent(eventId, updates);
      // Real-time subscription will update events automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to update event', loading: false });
      throw error;
    }
  },

  // Delete event
  deleteEvent: async (eventId: string) => {
    set({ loading: true, error: null });
    try {
      await calendarService.deleteEvent(eventId);
      // Real-time subscription will update events automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete event', loading: false });
      throw error;
    }
  },

  // Clear events (cleanup)
  clearEvents: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
    }
    set({ events: [], unsubscribe: null });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));

