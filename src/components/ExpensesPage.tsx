
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddExpenseForm } from './expenses/AddExpenseForm';
import { ExpenseList } from './expenses/ExpenseList';
import { SettlementTabs } from './settlements/SettlementTabs';
import { NotificationPanel } from './notifications/NotificationPanel';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';

interface ExpensesPageProps {
  onExpenseUpdate?: () => void;
}

export const ExpensesPage = ({ onExpenseUpdate }: ExpensesPageProps) => {
  const { expenses, loading, refetch } = useExpenses();
  const { user } = useAuth();

  // Filter expenses to only show those where user is involved
  const userExpenses = expenses.filter(expense => {
    const isPayer = expense.user_id === user?.id;
    const isSharer = expense.sharers?.includes(user?.email || '');
    return isPayer || isSharer;
  });

  const handleExpenseAdded = () => {
    refetch();
    if (onExpenseUpdate) {
      onExpenseUpdate();
    }
  };

  const handleExpenseDeleted = () => {
    refetch();
    if (onExpenseUpdate) {
      onExpenseUpdate();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Expenses & Settlements</h1>
      </div>

      <Tabs defaultValue="expenses" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="expenses">📦 Expenses</TabsTrigger>
          <TabsTrigger value="settlements">💸 Settlements</TabsTrigger>
          <TabsTrigger value="notifications">🔔 Notifications</TabsTrigger>
        </TabsList>

        <TabsContent value="expenses" className="space-y-6">
          <AddExpenseForm onExpenseAdded={handleExpenseAdded} />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Expenses</h2>
            <ExpenseList expenses={userExpenses} onExpenseDeleted={handleExpenseDeleted} />
          </div>
        </TabsContent>

        <TabsContent value="settlements" className="space-y-6">
          <SettlementTabs />
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <NotificationPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};
