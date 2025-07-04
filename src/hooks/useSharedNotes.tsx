
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRoommates } from './useRoommates';
import { useToast } from './use-toast';
import * as z from 'zod';

export const noteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, "Content is required"),
  is_pinned: z.boolean().default(false),
  color_hex: z.string().optional(),
});

interface SharedNote {
  id: string;
  title: string | null;
  content: string;
  color_hex: string | null;
  is_pinned: boolean;
  is_done: boolean;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
  user_id: string;
  done_by_user_id: string | null;
  user_profile?: {
    name: string | null;
    email: string;
  };
  done_by_profile?: {
    name: string | null;
    email: string;
  };
  reactions?: Array<{
    id: string;
    emoji: string;
    user_id: string;
    user_profile?: {
      name: string | null;
      email: string;
    };
  }>;
}

export interface SharedNoteWithDetails extends SharedNote {
  user?: {
    name: string | null;
    email: string;
  };
}

export type NoteFormData = {
  title?: string;
  content: string;
  is_pinned?: boolean;
  color_hex?: string;
};

export const useSharedNotes = () => {
  const [notes, setNotes] = useState<SharedNoteWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { roommates } = useRoommates();
  const { toast } = useToast();

  const fetchNotes = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      // Get all emails that should have access (user + roommates)
      const roommateEmails = roommates.map(r => r.email);
      const allEmails = [user.email, ...roommateEmails].filter(Boolean);

      // Fetch notes with user profiles
      const { data: notesData, error: notesError } = await supabase
        .from('shared_notes')
        .select(`
          *,
          note_reactions (
            id,
            emoji,
            user_id
          )
        `)
        .eq('is_archived', false)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;

      if (!notesData || notesData.length === 0) {
        setNotes([]);
        setLoading(false);
        return;
      }

      // Get all unique user IDs from notes and reactions
      const allUserIds = new Set<string>();
      notesData.forEach(note => {
        allUserIds.add(note.user_id);
        if (note.done_by_user_id) allUserIds.add(note.done_by_user_id);
        note.note_reactions?.forEach((reaction: any) => {
          allUserIds.add(reaction.user_id);
        });
      });

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .rpc('get_users_details', { p_user_ids: Array.from(allUserIds) });

      if (profilesError) {
        console.error('Error fetching user profiles:', profilesError);
      }

      const profilesMap = new Map(
        profiles?.map(p => [p.id, { name: p.name, email: p.email }]) || []
      );

      // Filter notes to only show those created by users in the roommate network
      const filteredNotes = notesData
        .filter(note => {
          const creatorProfile = profilesMap.get(note.user_id);
          return creatorProfile && allEmails.includes(creatorProfile.email);
        })
        .map(note => ({
          ...note,
          user: profilesMap.get(note.user_id),
          user_profile: profilesMap.get(note.user_id),
          done_by_profile: note.done_by_user_id ? profilesMap.get(note.done_by_user_id) : undefined,
          reactions: note.note_reactions?.map((reaction: any) => ({
            ...reaction,
            user_profile: profilesMap.get(reaction.user_id)
          })) || []
        }));

      setNotes(filteredNotes);
    } catch (error: any) {
      console.error('Error fetching notes:', error);
      toast({
        title: "Error",
        description: "Failed to fetch notes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (newNote: NoteFormData) => {
    if (!user) return;

    try {
      const noteData = {
        title: newNote.title || null,
        content: newNote.content,
        is_pinned: newNote.is_pinned || false,
        color_hex: newNote.color_hex || null,
        is_done: false,
        is_archived: false,
        done_by_user_id: null,
        user_id: user.id
      };

      const { data, error } = await supabase
        .from('shared_notes')
        .insert([noteData])
        .select('*')
        .single();

      if (error) throw error;

      setNotes(prevNotes => [
        {
          ...data,
          user: { name: user.user_metadata?.name as string, email: user.email as string },
          user_profile: { name: user.user_metadata?.name as string, email: user.email as string },
          reactions: []
        },
        ...prevNotes
      ]);
    } catch (error: any) {
      console.error('Error adding note:', error);
      toast({
        title: "Error",
        description: "Failed to add note",
        variant: "destructive",
      });
    }
  };

  const updateNote = async (id: string, updates: Partial<Omit<SharedNote, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'user_profile' | 'done_by_profile' | 'reactions'>>) => {
    try {
      const { data, error } = await supabase
        .from('shared_notes')
        .update(updates)
        .eq('id', id)
        .select('*')
        .single();

      if (error) throw error;

      setNotes(prevNotes =>
        prevNotes.map(note => (note.id === id ? { ...note, ...data } : note))
      );
    } catch (error: any) {
      console.error('Error updating note:', error);
      toast({
        title: "Error",
        description: "Failed to update note",
        variant: "destructive",
      });
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error } = await supabase
        .from('shared_notes')
        .delete()
        .eq('id', noteId);

      if (error) throw error;

      setNotes(prevNotes => prevNotes.filter(note => note.id !== noteId));
    } catch (error: any) {
      console.error('Error deleting note:', error);
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    }
  };

  const toggleReaction = async (noteId: string, emoji: string) => {
    if (!user) return;

    try {
      // Check if the user has already reacted with this emoji
      const { data: existingReaction, error: existingReactionError } = await supabase
        .from('note_reactions')
        .select('*')
        .eq('note_id', noteId)
        .eq('user_id', user.id)
        .eq('emoji', emoji)
        .single();

      if (existingReactionError && existingReactionError.code !== 'PGRST116') {
        throw existingReactionError;
      }

      if (existingReaction) {
        // Delete the existing reaction
        const { error: deleteError } = await supabase
          .from('note_reactions')
          .delete()
          .eq('id', existingReaction.id);

        if (deleteError) throw deleteError;

        setNotes(prevNotes => {
          return prevNotes.map(note => {
            if (note.id === noteId) {
              return {
                ...note,
                reactions: note.reactions?.filter(reaction => reaction.id !== existingReaction.id)
              };
            }
            return note;
          });
        });
      } else {
        // Add a new reaction
        const { data: newReaction, error: newReactionError } = await supabase
          .from('note_reactions')
          .insert([{ note_id: noteId, user_id: user.id, emoji }])
          .select('*')
          .single();

        if (newReactionError) throw newReactionError;

        setNotes(prevNotes => {
          return prevNotes.map(note => {
            if (note.id === noteId) {
              return {
                ...note,
                reactions: [...(note.reactions || []), {
                  ...newReaction,
                  user_profile: { name: user.user_metadata?.name as string, email: user.email as string }
                }]
              };
            }
            return note;
          });
        });
      }
    } catch (error: any) {
      console.error('Error toggling reaction:', error);
      toast({
        title: "Error",
        description: "Failed to toggle reaction",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchNotes();
  }, [user, roommates]);

  useEffect(() => {
    if (!user) return;

    // Create a unique channel name to avoid conflicts
    const channelName = `shared_notes_changes_${user.id}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'shared_notes' },
        (payload) => {
          console.log('Real-time update:', payload);
          fetchNotes();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  return {
    notes,
    loading,
    addNote,
    updateNote,
    deleteNote,
    toggleReaction,
    refetch: fetchNotes
  };
};
