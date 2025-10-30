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
  const [isFetching, setIsFetching] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchExpenses = async () => {
    if (!user || isFetching) {
      if (!user) {
        setExpenses([]);
        setLoading(false);
      }
      return;
    }

    try {
      setIsFetching(true);
      setLoading(true);
      
      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        setExpenses([]); 
      } else {
        setExpenses(data || []);
      }
    } catch (error: any) {
      setExpenses([]);
      toast({
        title: "Error",
        description: "Failed to fetch expenses due to an unexpected error.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (user?.id && !isFetching) {
      fetchExpenses();
    } else if (!user) {
      setExpenses([]);
      setLoading(false);
    }
  }, [user?.id]);

  return {
    expenses,
    loading,
    refetch: fetchExpenses
  };
};
