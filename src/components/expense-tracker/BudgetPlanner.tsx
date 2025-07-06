
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Plus, Target, AlertTriangle, TrendingUp } from 'lucide-react';
import { usePersonalExpenses } from '@/hooks/usePersonalExpenses';
import { formatIndianCurrency } from '@/utils/indianCurrency';

export const BudgetPlanner = () => {
  const { categories, budgets, transactions, setBudget, fetchBudgets } = usePersonalExpenses();
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [newBudget, setNewBudget] = useState({
    category_id: '',
    amount: 0,
  });
  const [showForm, setShowForm] = useState(false);

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  const monthlyBudgets = React.useMemo(() => {
    return budgets.filter(b => b.month === selectedMonth && b.year === selectedYear);
  }, [budgets, selectedMonth, selectedYear]);

  const monthlyExpenses = React.useMemo(() => {
    const monthStart = new Date(selectedYear, selectedMonth - 1, 1);
    const monthEnd = new Date(selectedYear, selectedMonth, 0);
    
    return transactions.filter(t => {
      const transactionDate = new Date(t.transaction_date);
      return t.type === 'expense' && 
             transactionDate >= monthStart && 
             transactionDate <= monthEnd;
    });
  }, [transactions, selectedMonth, selectedYear]);

  const getBudgetProgress = (budget: any) => {
    const categoryExpenses = monthlyExpenses
      .filter(t => t.category_id === budget.category_id)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const percentage = (categoryExpenses / budget.budget_amount) * 100;
    
    return {
      spent: categoryExpenses,
      percentage: Math.min(percentage, 100),
      isOverBudget: categoryExpenses > budget.budget_amount,
      remaining: budget.budget_amount - categoryExpenses,
    };
  };

  const expenseCategories = categories.filter(c => c.type === 'expense');
  const availableCategories = expenseCategories.filter(
    c => !monthlyBudgets.some(b => b.category_id === c.id)
  );

  const handleAddBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBudget.category_id || newBudget.amount <= 0) return;

    await setBudget(newBudget.category_id, selectedMonth, selectedYear, newBudget.amount);
    setNewBudget({ category_id: '', amount: 0 });
    setShowForm(false);
    await fetchBudgets(selectedMonth, selectedYear);
  };

  const totalBudget = monthlyBudgets.reduce((sum, b) => sum + b.budget_amount, 0);
  const totalSpent = monthlyExpenses.reduce((sum, t) => sum + t.amount, 0);
  const overallProgress = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  return (
    <div className="space-y-6 p-4">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Budget Planner</h1>
          <p className="text-muted-foreground">Set and track your monthly spending goals</p>
        </div>
        
        <div className="flex gap-2">
          <Select value={selectedMonth.toString()} onValueChange={(value) => setSelectedMonth(parseInt(value))}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {months.map((month) => (
                <SelectItem key={month.value} value={month.value.toString()}>
                  {month.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select value={selectedYear.toString()} onValueChange={(value) => setSelectedYear(parseInt(value))}>
            <SelectTrigger className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Overall Budget Summary */}
      {monthlyBudgets.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Overall Budget Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total Budget</span>
                <span className="text-lg font-bold">{formatIndianCurrency(totalBudget)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-lg font-medium">Total Spent</span>
                <span className={`text-lg font-bold ${totalSpent > totalBudget ? 'text-red-600' : 'text-green-600'}`}>
                  {formatIndianCurrency(totalSpent)}
                </span>
              </div>
              <Progress 
                value={overallProgress} 
                className={`h-3 ${totalSpent > totalBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-green-500'}`}
              />
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{overallProgress.toFixed(1)}% of budget used</span>
                <span>
                  {totalBudget - totalSpent >= 0 
                    ? `${formatIndianCurrency(totalBudget - totalSpent)} remaining`
                    : `${formatIndianCurrency(Math.abs(totalBudget - totalSpent))} over budget`
                  }
                </span>
              </div>
            </div>
            
            {totalSpent > totalBudget && (
              <Alert className="mt-4 border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
                  You have exceeded your overall budget by {formatIndianCurrency(totalSpent - totalBudget)}
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      )}

      {/* Category Budgets */}
      <div className="grid gap-4">
        {monthlyBudgets.map((budget) => {
          const progress = getBudgetProgress(budget);
          
          return (
            <Card key={budget.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-medium">
                      {budget.category?.icon} {budget.category?.name}
                    </span>
                    {progress.isOverBudget && (
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">
                      {formatIndianCurrency(progress.spent)} / {formatIndianCurrency(budget.budget_amount)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {progress.percentage.toFixed(1)}% used
                    </div>
                  </div>
                </div>
                
                <Progress 
                  value={progress.percentage} 
                  className={`h-3 mb-2 ${progress.isOverBudget ? '[&>div]:bg-red-500' : '[&>div]:bg-blue-500'}`}
                />
                
                <div className="flex justify-between text-sm">
                  <span className={progress.isOverBudget ? 'text-red-600' : 'text-green-600'}>
                    {progress.remaining >= 0 
                      ? `${formatIndianCurrency(progress.remaining)} remaining`
                      : `${formatIndianCurrency(Math.abs(progress.remaining))} over budget`
                    }
                  </span>
                  <span className="text-muted-foreground">
                    Budget: {formatIndianCurrency(budget.budget_amount)}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Add New Budget */}
      {availableCategories.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>Add Budget</CardTitle>
                <CardDescription>Set spending limits for your expense categories</CardDescription>
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowForm(!showForm)}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Budget
              </Button>
            </div>
          </CardHeader>
          
          {showForm && (
            <CardContent>
              <form onSubmit={handleAddBudget} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newBudget.category_id} onValueChange={(value) => 
                      setNewBudget({ ...newBudget, category_id: value })
                    }>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {availableCategories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.icon} {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="amount">Budget Amount (₹)</Label>
                    <Input
                      id="amount"
                      type="number"
                      min="0"
                      step="0.01"
                      value={newBudget.amount}
                      onChange={(e) => setNewBudget({ ...newBudget, amount: parseFloat(e.target.value) || 0 })}
                      placeholder="0.00"
                      required
                    />
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button type="submit" disabled={!newBudget.category_id || newBudget.amount <= 0}>
                    Set Budget
                  </Button>
                  <Button type="button" variant="outline" onClick={() => setShowForm(false)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          )}
        </Card>
      )}

      {monthlyBudgets.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No budgets set</h3>
            <p className="text-muted-foreground mb-4">
              Start by setting budgets for your expense categories to track your spending goals
            </p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Set Your First Budget
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
