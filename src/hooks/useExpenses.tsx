import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast'; // Corrected import path

interface Expense {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  date: string;
  category: string;
  user_id: string;
  sharers?: string[] | null; // Added sharers field
}

export const useExpenses = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchExpenses = async () => {
    if (!user) {
      console.log('fetchExpenses: No user, setting loading to false and returning.');
      setExpenses([]); // Clear expenses if no user
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('fetchExpenses: Attempting to fetch for user ID:', user.id, 'Email:', user.email);
      
      const { data, error, status, count } = await supabase
        .from('expenses')
        .select('*', { count: 'exact' }) // Request count
        .order('created_at', { ascending: false });

      if (error) {
        console.error('fetchExpenses: Supabase error fetching expenses. Message:', error.message, 'Details:', error.details, 'Hint:', error.hint, 'Code:', error.code, 'Full Error:', error, 'Status:', status);
        setExpenses([]); 
      } else {
        console.log('fetchExpenses: Successfully fetched expenses. Raw data:', data);
        console.log('fetchExpenses: Total expenses count from Supabase (respecting RLS):', count);
        console.log('fetchExpenses: Setting expenses state with:', data?.length || 0, 'expenses');
        setExpenses(data || []);
      }
    } catch (error: any) {
      console.error('fetchExpenses: Catch block error fetching expenses:', error);
      setExpenses([]); // Clear expenses on catch
      toast({
        title: "Error",
        description: "Failed to fetch expenses due to an unexpected error.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.log('fetchExpenses: Finished. Loading set to false.');
    }
  };

  useEffect(() => {
    console.log('useExpenses useEffect: User object changed or component mounted. User:', user?.email, 'User ID:', user?.id);
    if (user) {
      fetchExpenses();
    } else {
      console.log('useExpenses useEffect: No user, clearing expenses.');
      setExpenses([]);
      setLoading(false);
    }
  }, [user?.id]); // Only re-run if user ID changes.

  return {
    expenses,
    loading,
    refetch: fetchExpenses
  };
};
