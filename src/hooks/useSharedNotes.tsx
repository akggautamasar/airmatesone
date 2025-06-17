
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";
import * as z from 'zod';

export type SharedNote = Database['public']['Tables']['shared_notes']['Row'];
export type NoteReaction = Database['public']['Tables']['note_reactions']['Row'];

export type UserDetails = {
    id: string | null;
    name: string | null;
    email: string | null;
};

export type SharedNoteWithDetails = SharedNote & {
  user: UserDetails | undefined;
  done_by_user: UserDetails | undefined;
  reactions: (NoteReaction & { user: UserDetails | undefined })[];
};

export const noteSchema = z.object({
  title: z.string().optional(),
  content: z.string().min(1, { message: "Content is required." }),
  is_pinned: z.boolean().default(false),
  color_hex: z.string().optional(),
});

type NewNotePayload = z.infer<typeof noteSchema>;

export const useSharedNotes = () => {
    const { user } = useAuth();
    const { toast } = useToast();
    const queryClient = useQueryClient();

    const { data: notes, isLoading: isLoadingNotes } = useQuery({
        queryKey: ['shared_notes'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('shared_notes')
                .select('*')
                .eq('is_archived', false)
                .order('is_pinned', { ascending: false })
                .order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!user,
    });
    
    const { data: reactions, isLoading: isLoadingReactions } = useQuery({
        queryKey: ['note_reactions'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('note_reactions')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw new Error(error.message);
            return data;
        },
        enabled: !!user,
    });

    const userIds = [
        ...(notes?.map(n => n.user_id) || []),
        ...(notes?.map(n => n.done_by_user_id).filter(Boolean) as string[] || []),
        ...(reactions?.map(r => r.user_id) || []),
    ];
    const uniqueUserIds = [...new Set(userIds)].sort();
    
    const { data: userDetails, isLoading: isLoadingUserDetails } = useQuery({
        queryKey: ['users_details', uniqueUserIds],
        queryFn: async () => {
            if (uniqueUserIds.length === 0) return [];
            const { data, error } = await supabase.rpc('get_users_details', { p_user_ids: uniqueUserIds });
            if (error) throw new Error(error.message);
            return data as UserDetails[] | null;
        },
        enabled: !!user && uniqueUserIds.length > 0,
    });

    const notesWithDetails = notes?.map((note): SharedNoteWithDetails => {
        const noteReactions = reactions?.filter(r => r.note_id === note.id) || [];
        return {
            ...note,
            user: userDetails?.find(u => u.id === note.user_id),
            done_by_user: userDetails?.find(u => u.id === note.done_by_user_id),
            reactions: noteReactions.map(r => ({
                ...r,
                user: userDetails?.find(u => u.id === r.user_id)
            })),
        };
    });

    const addNoteMutation = useMutation({
        mutationFn: async (newNote: NewNotePayload) => {
            if (!user) throw new Error("User not authenticated");
            const { data, error } = await supabase
                .from('shared_notes')
                .insert({
                  title: newNote.title,
                  content: newNote.content,
                  is_pinned: newNote.is_pinned,
                  color_hex: newNote.color_hex,
                  user_id: user.id,
                })
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shared_notes'] });
            toast({ title: "Success", description: "Note added to the pinboard." });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const updateNoteMutation = useMutation({
        mutationFn: async ({ id, updates }: { id: string; updates: Partial<NewNotePayload> }) => {
            if (!user) throw new Error("User not authenticated");
            const { data, error } = await supabase
                .from('shared_notes')
                .update(updates)
                .eq('id', id)
                .eq('user_id', user.id)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shared_notes'] });
            toast({ title: "Success", description: "Note updated successfully." });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    const deleteNoteMutation = useMutation({
        mutationFn: async (id: string) => {
            if (!user) throw new Error("User not authenticated");
            const { error } = await supabase
                .from('shared_notes')
                .delete()
                .eq('id', id)
                .eq('user_id', user.id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['shared_notes'] });
            toast({ title: "Success", description: "Note deleted successfully." });
        },
        onError: (error) => {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        },
    });

    return {
        notes: notesWithDetails,
        isLoading: isLoadingNotes || isLoadingReactions || isLoadingUserDetails,
        addNote: addNoteMutation.mutate,
        updateNote: updateNoteMutation.mutate,
        deleteNote: deleteNoteMutation.mutate,
    };
}
