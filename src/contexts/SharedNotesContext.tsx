import React, { createContext, useContext, ReactNode } from 'react';
import { useSharedNotes, SharedNoteWithDetails, NoteFormData } from '@/hooks/useSharedNotes';

interface SharedNotesContextType {
  notes: SharedNoteWithDetails[];
  loading: boolean;
  addNote: (newNote: NoteFormData) => Promise<void>;
  updateNote: (id: string, updates: Partial<Omit<any, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'user_profile' | 'done_by_profile' | 'reactions'>>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  toggleReaction: (noteId: string, emoji: string) => Promise<void>;
  refetch: () => Promise<void>;
}

const SharedNotesContext = createContext<SharedNotesContextType | undefined>(undefined);

export const SharedNotesProvider = ({ children }: { children: ReactNode }) => {
  const sharedNotes = useSharedNotes();

  return (
    <SharedNotesContext.Provider value={sharedNotes}>
      {children}
    </SharedNotesContext.Provider>
  );
};

export { noteSchema, type NoteFormData } from '@/hooks/useSharedNotes';

export const useSharedNotesContext = () => {
  const context = useContext(SharedNotesContext);
  if (context === undefined) {
    throw new Error('useSharedNotesContext must be used within a SharedNotesProvider');
  }
  return context;
};
