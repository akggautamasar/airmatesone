
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, CheckCircle } from 'lucide-react';
import { formatIndianCurrency } from '@/utils/indianCurrency';
import { MonthlyBudget } from '@/hooks/usePersonalExpenses';

interface BudgetOverviewProps {
  budgets: MonthlyBudget[];
  expenses: Array<{ name: string; amount: number }>;
  selectedMonth: number;
  selectedYear: number;
}

export const BudgetOverview: React.FC<BudgetOverviewProps> = ({ 
  budgets, 
  expenses, 
  selectedMonth, 
  selectedYear 
}) => {
  const monthlyBudgets = budgets.filter(
    b => b.month === selectedMonth && b.year === selectedYear
  );

  const getBudgetStatus = (budget: MonthlyBudget) => {
    const categoryExpense = expenses.find(e => e.name === budget.category?.name);
    const spent = categoryExpense?.amount || 0;
    const percentage = (spent / budget.budget_amount) * 100;
    
    return {
      spent,
      percentage: Math.min(percentage, 100),
      isOverBudget: spent > budget.budget_amount,
      remaining: budget.budget_amount - spent,
    };
  };

  const overallBudgetStatus = React.useMemo(() => {
    const totalBudget = monthlyBudgets.reduce((sum, b) => sum + b.budget_amount, 0);
    const totalSpent = expenses.reduce((sum, e) => sum + e.amount, 0);
    
    return {
      totalBudget,
      totalSpent,
      percentage: totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0,
      isOverBudget: totalSpent > totalBudget,
    };
  }, [monthlyBudgets, expenses]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Budget Overview</CardTitle>
        <CardDescription>Track your spending against budgets</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Overall Budget Status */}
        {monthlyBudgets.length > 0 && (
          <div className="p-4 border rounded-lg">
            <div className="flex justify-between items-center mb-2">
              <span className="font-medium">Overall Budget</span>
              <span className={`font-bold ${overallBudgetStatus.isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                {formatIndianCurrency(overallBudgetStatus.totalSpent)} / {formatIndianCurrency(overallBudgetStatus.totalBudget)}
              </span>
            </div>
            <Progress 
              value={overallBudgetStatus.percentage} 
              className={`h-2 ${overallBudgetStatus.isOverBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`}
            />
            <p className="text-sm text-muted-foreground mt-1">
              {overallBudgetStatus.percentage.toFixed(1)}% of budget used
            </p>
          </div>
        )}

        {/* Individual Budget Categories */}
        <div className="space-y-3">
          {monthlyBudgets.map((budget) => {
            const status = getBudgetStatus(budget);
            
            return (
              <div key={budget.id} className="p-3 border rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{budget.category?.name}</span>
                    {status.isOverBudget ? (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    ) : (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    )}
                  </div>
                  <span className={`text-sm font-medium ${status.isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    {formatIndianCurrency(status.spent)} / {formatIndianCurrency(budget.budget_amount)}
                  </span>
                </div>
                <Progress 
                  value={status.percentage} 
                  className={`h-2 ${status.isOverBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'}`}
                />
                <div className="flex justify-between text-xs text-muted-foreground mt-1">
                  <span>{status.percentage.toFixed(1)}% used</span>
                  <span>
                    {status.remaining >= 0 
                      ? `${formatIndianCurrency(status.remaining)} remaining`
                      : `${formatIndianCurrency(Math.abs(status.remaining))} over budget`
                    }
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Budget Alerts */}
        {monthlyBudgets.some(b => getBudgetStatus(b).isOverBudget) && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              You have exceeded your budget in some categories. Consider reviewing your spending.
            </AlertDescription>
          </Alert>
        )}

        {monthlyBudgets.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p>No budgets set for this month</p>
            <p className="text-sm">Create budgets to track your spending goals</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
