
import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { IndianRupee } from "lucide-react";
import { useRoommates } from "@/hooks/useRoommates";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/use-toast";
import { useExpenseCalculations } from "./overview/hooks/useExpenseCalculations";
import { useExpenses } from "@/hooks/useExpenses";

import { SummaryCards } from "./overview/SummaryCards";
import { ChartsSection } from "./overview/ChartsSection";

interface ExpenseOverviewProps {
  onExpenseUpdate: () => void;
  currentUserId: string | undefined;
}

export const ExpenseOverview = ({
  onExpenseUpdate,
  currentUserId,
}: ExpenseOverviewProps) => {
  const { expenses, loading } = useExpenses(); // Use fresh data from useExpenses
  const { roommates } = useRoommates();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const currentUserDisplayName = useMemo(() => {
    return profile?.name || user?.email?.split('@')[0] || 'You';
  }, [profile, user]);

  // Convert to the format expected by calculations
  const formattedExpenses = useMemo(() => {
    return expenses.map(expense => ({
      id: expense.id,
      description: expense.description,
      amount: expense.amount,
      paidBy: expense.paid_by,
      date: new Date(expense.date).toISOString(),
      category: expense.category,
      sharers: expense.sharers || []
    }));
  }, [expenses]);

  const {
    totalExpenses,
    categoryData,
    monthlyData,
  } = useExpenseCalculations({
    expenses: formattedExpenses,
    currentUserDisplayName,
    roommates,
    profile,
    currentUserId,
    user,
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const lastExpenseDate = formattedExpenses.length > 0 ? formattedExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (formattedExpenses.length === 0) {
    return (
      <div className="text-center py-12">
        <IndianRupee className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
        <p className="text-gray-500">No expenses to display.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SummaryCards
        totalExpenses={totalExpenses}
        expenseCount={formattedExpenses.length}
        lastExpenseDate={lastExpenseDate}
      />

      <ChartsSection
        categoryData={categoryData}
        monthlyData={monthlyData}
        colors={COLORS}
      />
    </div>
  );
};
