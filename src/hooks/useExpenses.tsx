
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
        // No throw error here to allow UI to potentially show stale data or an empty list
        // But ensure expenses are cleared if fetch truly fails bad
        setExpenses([]); 
      } else {
        console.log('fetchExpenses: Successfully fetched expenses. Raw data:', data);
        console.log('fetchExpenses: Total expenses count from Supabase (respecting RLS):', count);
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

  const addExpense = async (expense: Omit<Expense, 'id' | 'user_id'>) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to add expenses.",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('addExpense: Attempting to add expense for user ID:', user.id, 'Data:', expense);
      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expense, user_id: user.id }])
        .select()
        .single();

      if (error) {
        console.error('addExpense: Supabase error adding expense. Message:', error.message, 'Details:', error.details, 'Hint:', error.hint, 'Code:', error.code);
        throw error;
      }
      console.log('addExpense: Successfully added expense. Response data:', data);
      await fetchExpenses(); 
      
      toast({
        title: "Expense Added",
        description: "Your expense has been added successfully.",
      });
    } catch (error: any) {
      console.error('addExpense: Catch block error adding expense:', error);
      toast({
        title: "Error",
        description: `Failed to add expense: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  const deleteExpense = async (expenseId: string) => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to delete expenses.",
        variant: "destructive",
      });
      return;
    }
    console.log('deleteExpense: Attempting to delete expense ID:', expenseId, 'for user ID:', user.id);
    try {
      const { error, status } = await supabase // Capture status for delete
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        console.error('deleteExpense: Supabase error deleting expense. Message:', error.message, 'Details:', error.details, 'Hint:', error.hint, 'Code:', error.code, 'Status:', status);
        throw error;
      }
      console.log('deleteExpense: Successfully deleted expense ID:', expenseId, 'Status:', status);
      await fetchExpenses(); 
      
      toast({
        title: "Expense Deleted",
        description: "The expense has been removed successfully.",
      });
    } catch (error: any) {
      console.error('deleteExpense: Catch block error deleting expense:', error);
      toast({
        title: "Error",
        description: `Failed to delete expense: ${error.message || 'Unknown error'}`,
        variant: "destructive",
      });
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
  }, [user]); // Only re-run if user object itself changes. fetchExpenses is stable.

  return {
    expenses,
    loading,
    addExpense,
    deleteExpense,
    refetch: fetchExpenses
  };
};
