
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useToast } from "@/components/ui/use-toast";
import { Database } from "@/integrations/supabase/types";

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
            const { data, error } = await supabase.from('note_reactions').select('*');
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
    const uniqueUserIds = [...new Set(userIds)];
    
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
        mutationFn: async (newNote: Omit<SharedNote, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'is_archived' | 'is_done' | 'done_by_user_id'>) => {
            if (!user) throw new Error("User not authenticated");
            const { data, error } = await supabase
                .from('shared_notes')
                .insert([{ ...newNote, user_id: user.id }])
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

    return {
        notes: notesWithDetails,
        isLoading: isLoadingNotes || isLoadingReactions || isLoadingUserDetails,
        addNote: addNoteMutation.mutate,
    };
}
