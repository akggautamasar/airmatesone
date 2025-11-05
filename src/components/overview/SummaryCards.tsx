
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, Calendar } from "lucide-react";

interface SummaryCardsProps {
  totalExpenses: number;
  expenseCount: number;
  lastExpenseDate: string | null;
}

export const SummaryCards: React.FC<SummaryCardsProps> = ({ totalExpenses, expenseCount, lastExpenseDate }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Total Expenses</CardTitle>
          <IndianRupee className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">₹{totalExpenses.toFixed(2)}</div>
          <p className="text-xs text-muted-foreground">
            {expenseCount} expense{expenseCount !== 1 ? 's' : ''} recorded
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-xs sm:text-sm font-medium">Recent Activity</CardTitle>
          <Calendar className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-xl sm:text-2xl font-bold">{lastExpenseDate ? new Date(lastExpenseDate).toLocaleDateString() : 'N/A'}</div>
          <p className="text-xs text-muted-foreground">Last expense added</p>
        </CardContent>
      </Card>
    </div>
  );
};
