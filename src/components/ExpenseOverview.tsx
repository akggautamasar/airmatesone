
import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { IndianRupee } from "lucide-react";
import { useRoommates } from "@/hooks/useRoommates";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useToast } from "@/components/ui/use-toast";
import { useExpenseCalculations } from "./overview/hooks/useExpenseCalculations";

import { SummaryCards } from "./overview/SummaryCards";
import { ChartsSection } from "./overview/ChartsSection";

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string; 
  category: string;
  sharers?: string[] | null;
}

interface ExpenseOverviewProps {
  expenses: Expense[];
  onExpenseUpdate: () => void;
  currentUserId: string | undefined;
}

export const ExpenseOverview = ({
  expenses: propsExpenses,
  onExpenseUpdate,
  currentUserId,
}: ExpenseOverviewProps) => {
  const { roommates } = useRoommates();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const currentUserDisplayName = useMemo(() => {
    return profile?.name || user?.email?.split('@')[0] || 'You';
  }, [profile, user]);

  const {
    totalExpenses,
    categoryData,
    monthlyData,
  } = useExpenseCalculations({
    expenses: propsExpenses,
    currentUserDisplayName,
    roommates,
    profile,
    currentUserId,
    user,
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const lastExpenseDate = propsExpenses.length > 0 ? propsExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null;

  if (propsExpenses.length === 0) {
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
        expenseCount={propsExpenses.length}
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
