
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface ExpenseCategory {
  id: string;
  name: string;
  type: 'income' | 'expense';
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface ExpenseSubcategory {
  id: string;
  name: string;
  category_id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PaymentMode {
  id: string;
  name: string;
  type: 'cash' | 'bank' | 'wallet' | 'card' | 'upi';
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface PersonalTransaction {
  id: string;
  user_id: string;
  transaction_date: string;
  type: 'income' | 'expense';
  category_id: string;
  subcategory_id?: string;
  payment_mode_id: string;
  amount: number;
  description?: string;
  notes?: string;
  voice_note_url?: string;
  is_recurring: boolean;
  recurring_frequency?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  created_at: string;
  updated_at: string;
  category?: ExpenseCategory;
  subcategory?: ExpenseSubcategory;
  payment_mode?: PaymentMode;
}

export interface MonthlyBudget {
  id: string;
  user_id: string;
  category_id: string;
  month: number;
  year: number;
  budget_amount: number;
  created_at: string;
  updated_at: string;
  category?: ExpenseCategory;
}

export const usePersonalExpenses = () => {
  const [transactions, setTransactions] = useState<PersonalTransaction[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [subcategories, setSubcategories] = useState<ExpenseSubcategory[]>([]);
  const [paymentModes, setPaymentModes] = useState<PaymentMode[]>([]);
  const [budgets, setBudgets] = useState<MonthlyBudget[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCategories = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error fetching categories:', error);
      toast({
        title: "Error",
        description: "Failed to fetch categories",
        variant: "destructive",
      });
    }
  };

  const fetchSubcategories = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('expense_subcategories')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      setSubcategories(data || []);
    } catch (error: any) {
      console.error('Error fetching subcategories:', error);
    }
  };

  const fetchPaymentModes = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('payment_modes')
        .select('*')
        .eq('user_id', user.id)
        .order('name');
      
      if (error) throw error;
      setPaymentModes(data || []);
    } catch (error: any) {
      console.error('Error fetching payment modes:', error);
    }
  };

  const fetchTransactions = async (month?: number, year?: number) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('personal_transactions')
        .select(`
          *,
          category:expense_categories(*),
          subcategory:expense_subcategories(*),
          payment_mode:payment_modes(*)
        `)
        .eq('user_id', user.id)
        .order('transaction_date', { ascending: false });

      if (month && year) {
        const startDate = new Date(year, month - 1, 1).toISOString().split('T')[0];
        const endDate = new Date(year, month, 0).toISOString().split('T')[0];
        query = query.gte('transaction_date', startDate).lte('transaction_date', endDate);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setTransactions(data || []);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive",
      });
    }
  };

  const fetchBudgets = async (month?: number, year?: number) => {
    if (!user) return;
    
    try {
      let query = supabase
        .from('monthly_budgets')
        .select(`
          *,
          category:expense_categories(*)
        `)
        .eq('user_id', user.id);

      if (month && year) {
        query = query.eq('month', month).eq('year', year);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      setBudgets(data || []);
    } catch (error: any) {
      console.error('Error fetching budgets:', error);
    }
  };

  const addTransaction = async (transaction: Omit<PersonalTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('personal_transactions')
        .insert([{ ...transaction, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchTransactions();
      toast({
        title: "Success",
        description: "Transaction added successfully",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive",
      });
    }
  };

  const updateTransaction = async (id: string, updates: Partial<PersonalTransaction>) => {
    try {
      const { error } = await supabase
        .from('personal_transactions')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      await fetchTransactions();
      toast({
        title: "Success",
        description: "Transaction updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating transaction:', error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
    }
  };

  const deleteTransaction = async (id: string) => {
    try {
      const { error } = await supabase
        .from('personal_transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      await fetchTransactions();
      toast({
        title: "Success",
        description: "Transaction deleted successfully",
      });
    } catch (error: any) {
      console.error('Error deleting transaction:', error);
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
    }
  };

  const addCategory = async (category: Omit<ExpenseCategory, 'id' | 'user_id' | 'created_at' | 'updated_at'>) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('expense_categories')
        .insert([{ ...category, user_id: user.id }])
        .select()
        .single();

      if (error) throw error;
      
      await fetchCategories();
      toast({
        title: "Success",
        description: "Category added successfully",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error adding category:', error);
      toast({
        title: "Error",
        description: "Failed to add category",
        variant: "destructive",
      });
    }
  };

  const setBudget = async (categoryId: string, month: number, year: number, amount: number) => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('monthly_budgets')
        .upsert([
          {
            user_id: user.id,
            category_id: categoryId,
            month,
            year,
            budget_amount: amount,
          }
        ])
        .select()
        .single();

      if (error) throw error;
      
      await fetchBudgets(month, year);
      toast({
        title: "Success",
        description: "Budget set successfully",
      });
      
      return data;
    } catch (error: any) {
      console.error('Error setting budget:', error);
      toast({
        title: "Error",
        description: "Failed to set budget",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      if (!user) return;
      
      setLoading(true);
      await Promise.all([
        fetchCategories(),
        fetchSubcategories(),
        fetchPaymentModes(),
        fetchTransactions(),
        fetchBudgets(),
      ]);
      setLoading(false);
    };

    initializeData();
  }, [user]);

  return {
    transactions,
    categories,
    subcategories,
    paymentModes,
    budgets,
    loading,
    fetchTransactions,
    fetchBudgets,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    setBudget,
  };
};
