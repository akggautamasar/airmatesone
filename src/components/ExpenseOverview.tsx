import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Users, Trash2, IndianRupee } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useRoommates } from "@/hooks/useRoommates";
import { useAuth } from "@/hooks/useAuth";

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string; // This should ideally be paid_by to match useExpenses hook if it's coming from there
  date: string;
  category: string;
}

interface Settlement {
  id: string;
  amount: number;
  from: string;
  to: string;
  status: string;
}

interface ExpenseOverviewProps {
  expenses: Expense[];
  onExpenseUpdate: () => void;
  settlements: Settlement[];
  onSettlementUpdate: (settlements: Settlement[]) => void;
}

export const ExpenseOverview = ({ expenses, onExpenseUpdate, settlements, onSettlementUpdate }: ExpenseOverviewProps) => {
  const { deleteExpense } = useExpenses();
  const { roommates } = useRoommates();
  const { user } = useAuth();
  const [localSettlements, setLocalSettlements] = useState<Settlement[]>([]);

  // Memoize calculations to prevent unnecessary re-renders
  const calculations = useMemo(() => {
    const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Calculate balances based on expenses and roommates
    const balanceMap = new Map<string, number>();
    
    // Initialize all roommates and current user with 0 balance
    const currentUserEmail = user?.email || '';
    balanceMap.set(currentUserEmail, 0);
    
    roommates.forEach(roommate => {
      balanceMap.set(roommate.email, 0);
    });

    // Calculate who paid what
    const totalPeople = roommates.length + 1; // +1 for current user
    const perPersonShare = totalExpenses > 0 && totalPeople > 0 ? totalExpenses / totalPeople : 0;

    expenses.forEach(expense => {
      // Find who paid this expense
      const paidByEmail = expense.paidBy === 'You' || expense.paidBy === user?.email?.split('@')[0] 
        ? currentUserEmail 
        : roommates.find(r => r.name === expense.paidBy || r.email === expense.paidBy)?.email || expense.paidBy;
      
      if (paidByEmail && balanceMap.has(paidByEmail)) {
        balanceMap.set(paidByEmail, (balanceMap.get(paidByEmail) || 0) + expense.amount);
      }
    });

    // Calculate final balances (what each person owes/is owed)
    const finalBalances: { name: string; email: string; balance: number }[] = [];
    
    balanceMap.forEach((amountPaid, email) => {
      const balance = amountPaid - perPersonShare;
      let name = email;
      
      if (email === currentUserEmail) {
        name = 'You';
      } else {
        const roommate = roommates.find(r => r.email === email);
        name = roommate?.name || email.split('@')[0];
      }
      
      finalBalances.push({ name, email, balance });
    });

    return {
      totalExpenses,
      perPersonShare,
      finalBalances
    };
  }, [expenses, roommates, user?.email]);

  // Use useEffect with proper dependencies to avoid infinite loops
  useEffect(() => {
    if (settlements.length !== localSettlements.length) {
      setLocalSettlements(settlements);
    }
  }, [settlements.length]); // Only depend on length to avoid infinite loops

  const categoryData = expenses.reduce((acc, expense) => {
    const existing = acc.find(item => item.name === expense.category);
    if (existing) {
      existing.value += expense.amount;
    } else {
      acc.push({ name: expense.category, value: expense.amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const monthlyData = expenses.reduce((acc, expense) => {
    const month = new Date(expense.date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += expense.amount;
    } else {
      acc.push({ month, amount: expense.amount });
    }
    return acc;
  }, [] as { month: string; amount: number }[]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
      onExpenseUpdate();
    } catch (error) {
      console.error('Error deleting expense:', error);
    }
  };

  const createSettlement = (from: string, to: string, amount: number) => {
    const newSettlement: Settlement = {
      id: Math.random().toString(36).substr(2, 9),
      amount: Math.abs(amount),
      from,
      to,
      status: 'pending'
    };
    
    const updatedSettlements = [...localSettlements, newSettlement];
    setLocalSettlements(updatedSettlements);
    onSettlementUpdate(updatedSettlements);
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-12">
        <IndianRupee className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No expenses yet</h3>
        <p className="text-gray-500">Start by adding your first expense to see insights here.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{calculations.totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {expenses.length} expense{expenses.length !== 1 ? 's' : ''} recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Per Person</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{calculations.perPersonShare.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Split among {roommates.length + 1} people
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{expenses.length > 0 ? new Date(expenses[0].date).toLocaleDateString() : 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Last expense added</p>
          </CardContent>
        </Card>
      </div>

      {/* Balances Section */}
      <Card>
        <CardHeader>
          <CardTitle>Current Balances</CardTitle>
          <CardDescription>Who owes what to whom</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {calculations.finalBalances.map((person, index) => (
            <div key={index} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
              <div className="flex items-center space-x-3">
                <div className="rounded-full bg-blue-100 p-2">
                  <Users className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{person.name}</p>
                  <p className="text-sm text-muted-foreground">{person.email}</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant={person.balance > 0 ? "default" : person.balance < 0 ? "destructive" : "secondary"}>
                  {person.balance === 0 ? "Settled" : 
                   person.balance > 0 ? `Gets ₹${person.balance.toFixed(2)}` : 
                   `Owes ₹${Math.abs(person.balance).toFixed(2)}`}
                </Badge>
                {person.balance !== 0 && person.name !== 'You' && (
                  <Button 
                    size="sm" 
                    onClick={() => {
                      if (person.balance < 0) {
                        // They owe you money
                        createSettlement(person.name, 'You', Math.abs(person.balance));
                      } else {
                        // You owe them money
                        createSettlement('You', person.name, person.balance);
                      }
                    }}
                  >
                    {person.balance < 0 ? 'Request' : 'Settle'}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Breakdown */}
        <Card>
          <CardHeader>
            <CardTitle>Expenses by Category</CardTitle>
            <CardDescription>Breakdown of spending categories</CardDescription>
          </CardHeader>
          <CardContent>
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No category data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monthly Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Monthly Spending Trend</CardTitle>
            <CardDescription>Track your spending over time</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${value.toLocaleString('en-IN')}`} />
                  <Tooltip formatter={(value) => [`₹${Number(value).toLocaleString('en-IN')}`, 'Amount']} />
                  <Legend />
                  <Bar dataKey="amount" fill="#8884d8" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                No monthly data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Expenses */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Expenses</CardTitle>
          <CardDescription>Your latest spending activity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {expenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <IndianRupee className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Paid by {expense.paidBy} • {new Date(expense.date).toLocaleDateString()} • {expense.category}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="font-semibold">₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{expense.description}"? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDeleteExpense(expense.id)}>
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
