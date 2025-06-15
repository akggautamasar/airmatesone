
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Chore, ChoreInsert } from '@/types/chores';
import { useAuth } from './useAuth';

const fetchChores = async (userId: string | undefined) => {
  if (!userId) return [];

  const { data, error } = await supabase
    .from('chores')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching chores:", error);
    throw new Error(error.message);
  }
  return data || [];
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
  const queryClient = useQueryClient();

  const { data: chores = [], isLoading: loading, refetch } = useQuery<Chore[]>({
    queryKey: ['chores', user?.id],
    queryFn: () => fetchChores(user?.id),
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
