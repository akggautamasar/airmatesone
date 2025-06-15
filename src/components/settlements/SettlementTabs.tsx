
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PendingSettlements } from './PendingSettlements';
import { SettledSettlements } from './SettledSettlements';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Settlement {
  id: string;
  expense_id: string;
  debtor_user_id: string;
  creditor_user_id: string;
  amount: number;
  status: string;
  marked_by_debtor: boolean;
  marked_by_creditor: boolean;
  settled_date: string | null;
  created_at: string;
  name: string;
  email: string;
  upi_id: string;
  type: string;
  user_id: string;
}

interface ExpenseDetails {
  id: string;
  description: string;
  date: string;
  category: string;
}

export const SettlementTabs = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [expenseDetails, setExpenseDetails] = useState<Record<string, ExpenseDetails>>({});
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSettlements = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .or(`debtor_user_id.eq.${user.id},creditor_user_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setSettlements(data || []);

      // Fetch expense details for all settlements
      const expenseIds = [...new Set(data?.map(s => s.expense_id).filter(Boolean))];
      if (expenseIds.length > 0) {
        const { data: expenses, error: expenseError } = await supabase
          .from('expenses')
          .select('id, description, date, category')
          .in('id', expenseIds);

        if (expenseError) throw expenseError;

        const expenseMap: Record<string, ExpenseDetails> = {};
        expenses?.forEach(expense => {
          expenseMap[expense.id] = expense;
        });
        setExpenseDetails(expenseMap);
      }
    } catch (error: any) {
      console.error('Error fetching settlements:', error);
      toast({
        title: "Error",
        description: "Failed to fetch settlements.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettlements();
  }, [user]);

  const handleSettlementUpdate = () => {
    fetchSettlements();
  };

  const pendingSettlements = settlements.filter(s => s.status === 'pending');
  const settledSettlements = settlements.filter(s => s.status === 'settled');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Tabs defaultValue="pending" className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="pending">
          🔁 Pending ({pendingSettlements.length})
        </TabsTrigger>
        <TabsTrigger value="settled">
          ✅ Settled ({settledSettlements.length})
        </TabsTrigger>
      </TabsList>

      <TabsContent value="pending" className="space-y-4">
        <PendingSettlements 
          settlements={pendingSettlements}
          expenseDetails={expenseDetails}
          onUpdate={handleSettlementUpdate}
        />
      </TabsContent>

      <TabsContent value="settled" className="space-y-4">
        <SettledSettlements 
          settlements={settledSettlements}
          expenseDetails={expenseDetails}
        />
      </TabsContent>
    </Tabs>
  );
};
