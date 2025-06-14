import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Calendar, Users, Trash2, IndianRupee, CreditCard, BadgeCheck } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useRoommates } from "@/hooks/useRoommates";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
  category: string;
  sharers?: string[] | null;
}

interface Settlement {
  id:string;
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

export const ExpenseOverview = ({ expenses: propsExpenses, onExpenseUpdate, settlements, onSettlementUpdate }: ExpenseOverviewProps) => {
  const { deleteExpense } = useExpenses();
  const { roommates } = useRoommates();
  const { user } = useAuth();
  const { profile } = useProfile();
  const [localSettlements, setLocalSettlements] = useState<Settlement[]>(settlements);

  const currentUserDisplayName = useMemo(() => {
    return profile?.name || user?.email?.split('@')[0] || 'You';
  }, [profile, user]);

  const allParticipantNames = useMemo(() => {
    const names = new Set<string>([currentUserDisplayName]);
    roommates.forEach(r => names.add(r.name));
    return Array.from(names);
  }, [currentUserDisplayName, roommates]);

  const calculations = useMemo(() => {
    const totalExpenses = propsExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    const balanceMap = new Map<string, number>();
    allParticipantNames.forEach(name => balanceMap.set(name, 0));

    propsExpenses.forEach(expense => {
      const payerName = expense.paidBy;
      
      balanceMap.set(payerName, (balanceMap.get(payerName) || 0) + expense.amount);

      const expenseSharers = expense.sharers && expense.sharers.length > 0 ? expense.sharers : allParticipantNames;
      const numSharers = expenseSharers.length;
      
      if (numSharers > 0) {
        const amountPerSharer = expense.amount / numSharers;
        expenseSharers.forEach(sharerName => {
          balanceMap.set(sharerName, (balanceMap.get(sharerName) || 0) - amountPerSharer);
        });
      }
    });

    const finalBalances: { name: string; balance: number }[] = [];
    balanceMap.forEach((balance, name) => {
      finalBalances.push({ name, balance });
    });

    return {
      totalExpenses,
      finalBalances
    };
  }, [propsExpenses, allParticipantNames, currentUserDisplayName]);

  useEffect(() => {
    setLocalSettlements(settlements);
  }, [settlements]);

  const categoryData = propsExpenses.reduce((acc, expense) => {
    const existing = acc.find(item => item.name === expense.category);
    if (existing) {
      existing.value += expense.amount;
    } else {
      acc.push({ name: expense.category, value: expense.amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]);

  const monthlyData = propsExpenses.reduce((acc, expense) => {
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

  const handlePayClick = (upiId: string, amount: number) => {
    if (!upiId || amount <= 0) {
      console.error("Invalid UPI ID or amount for payment.");
      // Optionally, show a toast message to the user
      return;
    }
    const paymentUrl = `https://quantxpay.vercel.app/${upiId}/${amount.toFixed(2)}`;
    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
  };

  if (propsExpenses.length === 0) {
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{calculations.totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {propsExpenses.length} expense{propsExpenses.length !== 1 ? 's' : ''} recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Recent Activity</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{propsExpenses.length > 0 ? new Date(propsExpenses[0].date).toLocaleDateString() : 'N/A'}</div>
            <p className="text-xs text-muted-foreground">Last expense added</p>
          </CardContent>
        </Card>
      </div>

      {/* Balances Section */}
      <Card>
        <CardHeader>
          <CardTitle>Current Balances</CardTitle>
          <CardDescription>Who owes what to whom, based on shared expenses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {calculations.finalBalances.map((person, index) => {
            const isViewingOwnBalance = person.name === currentUserDisplayName;
            const roommateInfo = roommates.find(r => r.name === person.name);

            return (
              <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-gray-50 space-y-2 sm:space-y-0">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Users className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{person.name}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-end sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 self-end sm:self-center w-full sm:w-auto justify-end">
                  <Badge variant={person.balance > 0.005 ? "default" : person.balance < -0.005 ? "destructive" : "secondary"}>
                    {person.balance === 0 || (person.balance < 0.005 && person.balance > -0.005) ? "Settled" : 
                     person.balance > 0 ? `Gets ₹${person.balance.toFixed(2)}` : 
                     `Owes ₹${Math.abs(person.balance).toFixed(2)}`}
                  </Badge>
                  
                  {!isViewingOwnBalance && (
                    <>
                      {/* Scenario: The person being displayed (person) IS OWED money (person.balance > 0),
                          so the CURRENT USER might need to PAY them. */}
                      {person.balance > 0.005 && (
                        <>
                          {roommateInfo?.upi_id && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handlePayClick(roommateInfo.upi_id, person.balance)}
                              className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 w-full sm:w-auto"
                            >
                              Pay
                              <CreditCard className="ml-2 h-3 w-3" />
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => createSettlement(currentUserDisplayName, person.name, person.balance)}
                            className="border-green-400 text-green-600 hover:bg-green-50 hover:text-green-700 w-full sm:w-auto"
                          >
                            Mark as Paid
                            <BadgeCheck className="ml-2 h-3 w-3" />
                          </Button>
                        </>
                      )}

                      {/* Scenario: The person being displayed (person) OWES money (person.balance < 0),
                          so the CURRENT USER might need to REQUEST from them. */}
                      {person.balance < -0.005 && (
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => createSettlement(person.name, currentUserDisplayName, Math.abs(person.balance))}
                          className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700 w-full sm:w-auto"
                        >
                          Request
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </div>
            );
          })}
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
          <CardDescription>Your latest spending activity. {/** Sharers: {expense.sharers ? expense.sharers.join(', ') : 'All'} */}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {propsExpenses.slice(0, 5).map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg border">
                <div className="flex items-center space-x-4">
                  <div className="rounded-full bg-blue-100 p-2">
                    <IndianRupee className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">
                      Paid by {expense.paidBy} • {new Date(expense.date).toLocaleDateString()} • {expense.category}
                      {expense.sharers && expense.sharers.length > 0 && expense.sharers.length < allParticipantNames.length ? (
                        <span className="block text-xs">Shared with: {expense.sharers.join(', ')}</span>
                      ) : (
                        <span className="block text-xs">Shared with: All</span>
                      )}
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
