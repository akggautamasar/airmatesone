import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Chore, ChoreInsert } from '@/types/chores';
import { useAuth } from './useAuth';
import { useRoommates } from './useRoommates';

const fetchChores = async (userId: string | undefined, userEmail: string | undefined, roommateEmails: string[]) => {
  if (!userId || !userEmail) return [];

  // Get all emails that should have access (user + roommates)
  const allEmails = [userEmail, ...roommateEmails];

  const { data, error } = await supabase
    .from('chores')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching chores:", error);
    throw new Error(error.message);
  }

  // Filter chores to only show those that include the user or their roommates
  const filteredChores = (data || []).filter(chore => 
    chore.participants?.some(participant => allEmails.includes(participant))
  );

  return filteredChores;
};

const addChore = async (chore: ChoreInsert) => {
  const { data, error } = await supabase
    .from('chores')
    .insert(chore)
    .select()
    .single();
  
  if (error) {
    console.error("Error adding chore:", error);
    throw new Error(error.message);
  }
  return data;
};

const deleteChore = async (choreId: string) => {
    const { error } = await supabase
        .from('chores')
        .delete()
        .eq('id', choreId);

    if (error) {
        console.error("Error deleting chore:", error);
        throw new Error(error.message);
    }
};

export const useChores = () => {
  const { user } = useAuth();
  const { roommates } = useRoommates();
  const queryClient = useQueryClient();

  // Get roommate emails for filtering
  const roommateEmails = roommates.map(r => r.email);

  const { data: chores = [], isLoading: loading, refetch } = useQuery<Chore[]>({
    queryKey: ['chores', user?.id, roommateEmails],
    queryFn: () => fetchChores(user?.id, user?.email, roommateEmails),
    enabled: !!user,
  });

  const addChoreMutation = useMutation({
    mutationFn: addChore,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chores'] });
    },
  });

  const deleteChoreMutation = useMutation({
    mutationFn: deleteChore,
    onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['chores'] });
    },
  });

  return { 
    chores, 
    loading, 
    refetch,
    addChore: addChoreMutation.mutateAsync,
    deleteChore: deleteChoreMutation.mutateAsync,
    isAdding: addChoreMutation.isPending,
  };
};
