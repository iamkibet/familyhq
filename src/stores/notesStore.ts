import { create } from 'zustand';
import { Note } from '@/src/types';
import * as notesService from '@/src/services/notesService';

interface NotesState {
  notes: Note[];
  loading: boolean;
  error: string | null;
  subscribeToNotes: (userId: string) => () => void;
  createNote: (userId: string, title: string, content: string) => Promise<void>;
  updateNote: (noteId: string, updates: { title?: string; content?: string }) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  clearNotes: () => void;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  loading: false,
  error: null,

  subscribeToNotes: (userId: string) => {
    set({ loading: true, error: null });
    return notesService.subscribeToNotes(userId, (notes) => {
      set({ notes, loading: false, error: null });
    });
  },

  createNote: async (userId: string, title: string, content: string) => {
    try {
      set({ loading: true, error: null });
      await notesService.createNote(userId, title, content);
      // Notes will be updated via subscription
    } catch (error: any) {
      set({ error: error.message || 'Failed to create note', loading: false });
      throw error;
    }
  },

  updateNote: async (noteId: string, updates: { title?: string; content?: string }) => {
    try {
      set({ loading: true, error: null });
      await notesService.updateNote(noteId, updates);
      // Notes will be updated via subscription
    } catch (error: any) {
      set({ error: error.message || 'Failed to update note', loading: false });
      throw error;
    }
  },

  deleteNote: async (noteId: string) => {
    try {
      set({ loading: true, error: null });
      await notesService.deleteNote(noteId);
      // Notes will be updated via subscription
    } catch (error: any) {
      set({ error: error.message || 'Failed to delete note', loading: false });
      throw error;
    }
  },

  clearNotes: () => {
    set({ notes: [], error: null });
  },
}));

