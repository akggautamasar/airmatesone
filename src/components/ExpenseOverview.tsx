
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { IndianRupee, TrendingUp, TrendingDown, Users, Trash2 } from "lucide-react";
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
  
  const [recentExpenses, setRecentExpenses] = useState<Expense[]>([
    { id: 1, description: "Groceries - Vegetables", amount: 500, paidBy: "You", date: "Today", category: "Groceries" },
    { id: 2, description: "Electricity Bill", amount: 2000, paidBy: "Rahul", date: "Yesterday", category: "Utilities" },
    { id: 3, description: "Internet Bill", amount: 800, paidBy: "Priya", date: "2 days ago", category: "Utilities" },
  ]);

  const settlements: Settlement[] = [
    { name: "Rahul", amount: 150, type: "owes", upiId: "rahul@paytm", email: "worksbeyondworks@gmail.com" },
    { name: "Priya", amount: 200, type: "owed", upiId: "priya@phonepe", email: "priya@example.com" },
    { name: "Arjun", amount: 100, type: "owes", upiId: "arjun@gpay", email: "arjun@example.com" },
  ];

  const handleUPIPayment = (upiId: string, amount: number) => {
    const paymentUrl = `https://quantxpay.vercel.app/${upiId}/${amount}`;
    window.open(paymentUrl, '_blank');
  };

  const sendEmailRequest = async (settlement: Settlement) => {
    const emailData = {
      from: "AirMates@airmedisphere.in",
      to: [settlement.email],
      subject: "Payment Request from AirMates",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Payment Request from AirMates</h2>
          <p>Hi ${settlement.name},</p>
          <p>You have a pending payment request on AirMates.</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0; color: #374151;">Amount Due: ₹${settlement.amount}</h3>
          </div>
          <p>Please settle this amount at your earliest convenience.</p>
          <p>Best regards,<br/>AirMates Team</p>
        </div>
      `
    };

    try {
      console.log('Sending email request to:', settlement.email);
      console.log('Email data:', emailData);
      
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer re_FP4rP9T5_Kb4CC9NEihP8GK6JushBooPL`
        },
        body: JSON.stringify(emailData)
      });

      console.log('Response status:', response.status);

      const result = await response.json();
      console.log('API Response:', result);
      
      if (response.ok) {
        toast({
          title: "Request Sent!",
          description: `Payment request email sent to ${settlement.name}`,
        });
      } else {
        console.error('Email sending failed:', result);
        toast({
          title: "Failed to Send Request",
          description: result.message || `Failed to send email to ${settlement.name}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Email request error:', error);
      toast({
        title: "Error",
        description: `Failed to send email to ${settlement.name}. Please try again.`,
        variant: "destructive",
      });
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
            <div className="text-2xl font-bold text-orange-900">₹250</div>
            <p className="text-xs text-orange-600">To 2 roommates</p>
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
                    >
                      Request
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
