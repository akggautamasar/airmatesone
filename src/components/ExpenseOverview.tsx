import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { IndianRupee, TrendingUp, TrendingDown, Users, Trash2, Mail } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Expense {
  id: number;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
  category: string;
}

interface Settlement {
  name: string;
  amount: number;
  type: "owes" | "owed";
  upiId: string;
  email: string;
}

export const ExpenseOverview = () => {
  const { toast } = useToast();
  const [isRequestLoading, setIsRequestLoading] = useState<string | null>(null);
  
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([
    { id: 1, description: "Groceries - Vegetables", amount: 500, paidBy: "Piyush Ranjan", date: "Today", category: "Groceries" },
    { id: 2, description: "Electricity Bill", amount: 2000, paidBy: "Kshitij Gupta", date: "Yesterday", category: "Utilities" },
    { id: 3, description: "Internet Bill", amount: 800, paidBy: "Ayush Vaibhav", date: "2 days ago", category: "Utilities" },
  ]);

  const settlements: Settlement[] = [
    { name: "Kshitij Gupta", amount: 150, type: "owes", upiId: "kshitij.gupta.5680-1@okhdfcbank", email: "kshitij.gupta.5680@gmail.com" },
    { name: "Ayush Vaibhav", amount: 200, type: "owed", upiId: "ayushvaibhav31@ybl", email: "ayushvaibhav31@gmail.com" },
    { name: "Abhishek Athiya", amount: 100, type: "owes", upiId: "9302596396@ybl", email: "abhiathiya786@gmail.com" },
    { name: "Jitendra Kumar Lodhi", amount: 75, type: "owes", upiId: "lodhikumar07@okhdfcbank", email: "lodhijk7@gmail.com" },
  ];

  const handleUPIPayment = (upiId: string, amount: number) => {
    const paymentUrl = `https://quantxpay.vercel.app/${upiId}/${amount}`;
    window.open(paymentUrl, '_blank');
  };

  const sendEmailRequest = async (settlement: Settlement) => {
    setIsRequestLoading(settlement.email);
    
    try {
      console.log('Attempting to send email request to:', settlement.email);
      
      // For demo purposes, we'll simulate the email request
      // In a real app, this should be handled by a backend service
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
      
      console.log('Email request simulated successfully');
      
      toast({
        title: "Request Sent!",
        description: `Payment request sent to ${settlement.name}`,
      });
      
      // Simulate a follow-up notification
      setTimeout(() => {
        toast({
          title: "Notification Delivered",
          description: `${settlement.name} has been notified about the ₹${settlement.amount} payment request`,
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error sending email request:', error);
      toast({
        title: "Request Failed",
        description: `Unable to send request to ${settlement.name}. Please try again later.`,
        variant: "destructive",
      });
    } finally {
      setIsRequestLoading(null);
    }
  };

  const deleteExpense = (expenseId: number) => {
    setRecentExpenses(recentExpenses.filter(expense => expense.id !== expenseId));
    toast({
      title: "Expense Deleted",
      description: "The expense has been removed successfully.",
    });
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-800">Total Expenses</CardTitle>
            <IndianRupee className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900">₹3,300</div>
            <p className="text-xs text-blue-600">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">You're Owed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">₹200</div>
            <p className="text-xs text-green-600">From 1 roommate</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">You Owe</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">₹325</div>
            <p className="text-xs text-orange-600">To 3 roommates</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Expenses */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Expenses</CardTitle>
            <CardDescription>Latest shared expenses in your group</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentExpenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <IndianRupee className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No expenses yet</p>
                <p className="text-sm">Add your first expense to get started</p>
              </div>
            ) : (
              recentExpenses.map((expense) => (
                <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <p className="font-medium">{expense.description}</p>
                    <p className="text-sm text-muted-foreground">Paid by {expense.paidBy} • {expense.date}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className="font-semibold">₹{expense.amount}</p>
                      <p className="text-xs text-muted-foreground">{expense.category}</p>
                    </div>
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
                          <AlertDialogAction onClick={() => deleteExpense(expense.id)}>
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Quick Settlements */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Settlements</CardTitle>
            <CardDescription>Settle up with your roommates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {settlements.map((settlement, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-full p-2">
                    <Users className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="font-medium">{settlement.name}</p>
                    <p className="text-xs text-muted-foreground">{settlement.upiId}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="text-right">
                    <p className={`font-semibold ${settlement.type === 'owes' ? 'text-orange-600' : 'text-green-600'}`}>
                      {settlement.type === 'owes' ? '-' : '+'}₹{settlement.amount}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => handleUPIPayment(settlement.upiId, settlement.amount)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Pay
                  </Button>
                  {settlement.type === 'owes' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => sendEmailRequest(settlement)}
                      disabled={isRequestLoading === settlement.email}
                      className="min-w-[80px]"
                    >
                      {isRequestLoading === settlement.email ? (
                        <div className="flex items-center space-x-1">
                          <div className="w-3 h-3 border border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
                          <span className="text-xs">Sending...</span>
                        </div>
                      ) : (
                        <>
                          <Mail className="h-3 w-3 mr-1" />
                          Request
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
