
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

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
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      console.log('Fetching expenses for user:', user.email);
      
      // Query expenses table. RLS policy will ensure only relevant expenses are returned.
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        // Removed .eq('user_id', user.id) to rely on RLS
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase error fetching expenses:', error);
        throw error;
      }
      
      console.log('Fetched expenses:', data);
      setExpenses(data || []);
    } catch (error: any) {
      console.error('Error fetching expenses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch expenses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const addExpense = async (expense: Omit<Expense, 'id' | 'user_id'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expenses')
        .insert([{ ...expense, user_id: user.id }]) // RLS for insert: auth.uid() = user_id
        .select()
        .single();

      if (error) throw error;
      // setExpenses(prev => [data, ...prev]); // Refetch to get full list per RLS
      await fetchExpenses(); // Refetch to ensure list is up-to-date with RLS
      
      toast({
        title: "Expense Added",
        description: "Your expense has been added successfully",
      });
    } catch (error: any) {
      console.error('Error adding expense:', error);
      toast({
        title: "Error",
        description: "Failed to add expense",
        variant: "destructive",
      });
    }
  };

  const deleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId); // RLS for delete: auth.uid() = user_id

      if (error) throw error;
      // setExpenses(prev => prev.filter(expense => expense.id !== expenseId)); // Refetch
      await fetchExpenses(); // Refetch to ensure list is up-to-date
      
      toast({
        title: "Expense Deleted",
        description: "The expense has been removed successfully",
      });
    } catch (error: any) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "Failed to delete expense",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (user) {
      fetchExpenses();
    } else {
      // Clear expenses if user logs out
      setExpenses([]);
      setLoading(false);
    }
  }, [user]);

  return {
    expenses,
    loading,
    addExpense,
    deleteExpense,
    refetch: fetchExpenses
  };
};

