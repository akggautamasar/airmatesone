
import React, { useState, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AddExpenseForm } from './expenses/AddExpenseForm';
import { ExpenseList } from './expenses/ExpenseList';
import { SettlementTabs } from './settlements/SettlementTabs';
import { NotificationPanel } from './notifications/NotificationPanel';
import { useExpenses } from '@/hooks/useExpenses';
import { useAuth } from '@/hooks/useAuth';
import { ExpenseFilters, ExpenseFiltersState } from './expenses/ExpenseFilters';

interface ExpensesPageProps {
  onExpenseUpdate?: () => void;
}

export const ExpensesPage = ({ onExpenseUpdate }: ExpensesPageProps) => {
  const { expenses, loading, refetch } = useExpenses();
  const { user } = useAuth();
  const [filters, setFilters] = useState<ExpenseFiltersState>({});

  // Filter expenses to only show those where user is involved
  const userExpenses = useMemo(() => expenses.filter(expense => {
    const isPayer = expense.user_id === user?.id;
    const isSharer = expense.sharers?.includes(user?.email || '');
    return isPayer || isSharer;
  }), [expenses, user]);

  const filteredExpenses = useMemo(() => {
    return userExpenses.filter(expense => {
      // Date range filter
      if (filters.dateRange?.from) {
        const expenseDate = new Date(expense.date);
        if (expenseDate < filters.dateRange.from) return false;
      }
      if (filters.dateRange?.to) {
        const expenseDate = new Date(expense.date);
        // Add 1 day to the end date to include the whole day
        const toDate = new Date(filters.dateRange.to);
        toDate.setDate(toDate.getDate() + 1);
        if (expenseDate >= toDate) return false;
      }

      // Category filter
      if (filters.category && expense.category !== filters.category) {
        return false;
      }

      // Paid by filter
      if (filters.paidBy && expense.paid_by !== filters.paidBy) {
        return false;
      }
      
      // Split with filter
      if (filters.splitWith && !expense.sharers?.includes(filters.splitWith)) {
        return false;
      }

      // Amount range filter
      if (filters.minAmount && expense.amount < parseFloat(filters.minAmount)) {
        return false;
      }
      if (filters.maxAmount && expense.amount > parseFloat(filters.maxAmount)) {
        return false;
      }

      return true;
    });
  }, [userExpenses, filters]);


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
          <ExpenseFilters filters={filters} onFilterChange={setFilters} />
          <div className="space-y-4">
            <h2 className="text-xl font-semibold">Your Expenses</h2>
            <ExpenseList expenses={filteredExpenses} onExpenseDeleted={handleExpenseDeleted} />
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
