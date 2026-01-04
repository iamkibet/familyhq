import { create } from 'zustand';
import * as readActivitiesService from '@/src/services/readActivitiesService';

interface ReadActivitiesState {
  readActivityIds: Set<string>;
  loading: boolean;
  error: string | null;

  loadReadActivities: (userId: string) => Promise<void>;
  markAsRead: (userId: string, activityId: string) => Promise<void>;
  markMultipleAsRead: (userId: string, activityIds: string[]) => Promise<void>;
  isRead: (activityId: string) => boolean;
  clearReadActivities: () => void;
}

export const useReadActivitiesStore = create<ReadActivitiesState>((set, get) => ({
  readActivityIds: new Set<string>(),
  loading: false,
  error: null,

  loadReadActivities: async (userId: string) => {
    set({ loading: true, error: null });
    try {
      const readActivities = await readActivitiesService.getReadActivities(userId);
      set({ 
        readActivityIds: new Set(readActivities),
        loading: false 
      });
    } catch (error: any) {
      set({ 
        error: error.message || 'Failed to load read activities',
        loading: false 
      });
    }
  },

  markAsRead: async (userId: string, activityId: string) => {
    try {
      await readActivitiesService.markActivityAsRead(userId, activityId);
      const { readActivityIds } = get();
      const newSet = new Set(readActivityIds);
      newSet.add(activityId);
      set({ readActivityIds: newSet });
    } catch (error: any) {
      set({ error: error.message || 'Failed to mark activity as read' });
      throw error;
    }
  },

  markMultipleAsRead: async (userId: string, activityIds: string[]) => {
    try {
      await readActivitiesService.markActivitiesAsRead(userId, activityIds);
      const { readActivityIds } = get();
      const newSet = new Set(readActivityIds);
      activityIds.forEach(id => newSet.add(id));
      set({ readActivityIds: newSet });
    } catch (error: any) {
      set({ error: error.message || 'Failed to mark activities as read' });
      throw error;
    }
  },

  isRead: (activityId: string) => {
    return get().readActivityIds.has(activityId);
  },

  clearReadActivities: () => {
    set({ readActivityIds: new Set<string>(), error: null });
  },
}));

