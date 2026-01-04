import { create } from 'zustand';
import { Task } from '@/src/types';
import * as taskService from '@/src/services/taskService';

interface TaskState {
  // State
  tasks: Task[];
  loading: boolean;
  error: string | null;
  unsubscribe: (() => void) | null;

  // Actions
  subscribeToTasks: (familyId: string) => void;
  addTask: (familyId: string, task: Omit<Task, 'id' | 'createdAt' | 'familyId'>) => Promise<void>;
  updateTask: (
    taskId: string,
    updates: Partial<Omit<Task, 'id' | 'familyId' | 'createdAt' | 'createdBy'>>
  ) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleCompleted: (taskId: string, completed: boolean) => Promise<void>;
  clearTasks: () => void;
  setError: (error: string | null) => void;
}

export const useTaskStore = create<TaskState>((set, get) => ({
  // Initial state
  tasks: [],
  loading: false,
  error: null,
  unsubscribe: null,

  // Subscribe to tasks (real-time)
  subscribeToTasks: (familyId: string) => {
    // Clean up existing subscription
    const { unsubscribe: existingUnsubscribe } = get();
    if (existingUnsubscribe) {
      existingUnsubscribe();
    }

    set({ loading: true, error: null });

    const unsubscribe = taskService.subscribeToTasks(familyId, (tasks) => {
      set({ tasks, loading: false });
    });

    set({ unsubscribe });
  },

  // Add task
  addTask: async (familyId: string, task) => {
    set({ loading: true, error: null });
    try {
      await taskService.addTask(familyId, task);
      // Real-time subscription will update tasks automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to add task', loading: false });
      throw error;
    }
  },

  // Update task
  updateTask: async (taskId: string, updates) => {
    set({ loading: true, error: null });
    try {
      await taskService.updateTask(taskId, updates);
      // Real-time subscription will update tasks automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to update task', loading: false });
      throw error;
    }
  },

  // Delete task
  deleteTask: async (taskId: string) => {
    set({ loading: true, error: null });
    try {
      await taskService.deleteTask(taskId);
      // Real-time subscription will update tasks automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete task', loading: false });
      throw error;
    }
  },

  // Toggle completed
  toggleCompleted: async (taskId: string, completed: boolean) => {
    set({ error: null });
    try {
      await taskService.toggleTaskCompleted(taskId, completed);
      // Real-time subscription will update tasks automatically
    } catch (error: any) {
      set({ error: error.message || 'Failed to update task', loading: false });
      throw error;
    }
  },

  // Clear tasks (cleanup)
  clearTasks: () => {
    const { unsubscribe } = get();
    if (unsubscribe) {
      unsubscribe();
    }
    set({ tasks: [], unsubscribe: null });
  },

  // Set error
  setError: (error: string | null) => {
    set({ error });
  },
}));

