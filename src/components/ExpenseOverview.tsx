import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { IndianRupee, TrendingUp, TrendingDown, Users, Trash2, Mail, Check } from "lucide-react";
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
  id: string;
  name: string;
  amount: number;
  type: "owes" | "owed";
  upiId: string;
  email: string;
  status: "pending" | "settled";
  settledDate?: string;
}

interface ExpenseOverviewProps {
  onAddExpense?: (expense: Omit<Expense, 'id'>) => void;
  expenses: Expense[];
  onExpenseUpdate: (expenses: Expense[]) => void;
  settlements: Settlement[];
  onSettlementUpdate: (settlements: Settlement[]) => void;
}

export const ExpenseOverview = ({ onAddExpense, expenses, onExpenseUpdate, settlements, onSettlementUpdate }: ExpenseOverviewProps) => {
  const { toast } = useToast();
  const [isRequestLoading, setIsRequestLoading] = useState<string | null>(null);

  // Roommate data with UPI and email info
  const roommateData = [
    { name: "Kshitij Gupta", upiId: "kshitij.gupta.5680-1@okhdfcbank", email: "kshitij.gupta.5680@gmail.com" },
    { name: "Ayush Vaibhav", upiId: "ayushvaibhav31@ybl", email: "ayushvaibhav31@gmail.com" },
    { name: "Abhishek Athiya", upiId: "9302596396@ybl", email: "abhiathiya786@gmail.com" },
    { name: "Jitendra Kumar Lodhi", upiId: "lodhikumar07@okhdfcbank", email: "lodhijk7@gmail.com" },
  ];

  // Calculate settlements based on actual expenses
  const calculateSettlements = (): Settlement[] => {
    if (expenses.length === 0) return [];

    const totalRoommates = roommateData.length + 1; // +1 for "You"
    const calculatedSettlements: Settlement[] = [];

    expenses.forEach(expense => {
      const sharePerPerson = expense.amount / totalRoommates;
      
      // Everyone except the payer owes money to the payer
      if (expense.paidBy !== "You") {
        // You owe money to the person who paid
        calculatedSettlements.push({
          id: `you-to-${expense.paidBy}-${expense.id}`,
          name: "You",
          amount: sharePerPerson,
          type: "owes",
          upiId: roommateData.find(r => r.name === expense.paidBy)?.upiId || "",
          email: roommateData.find(r => r.name === expense.paidBy)?.email || "",
          status: "pending"
        });
      }

      // All other roommates owe money to the person who paid
      roommateData.forEach(roommate => {
        if (roommate.name !== expense.paidBy) {
          if (expense.paidBy === "You") {
            // Roommate owes money to you
            calculatedSettlements.push({
              id: `${roommate.name}-to-you-${expense.id}`,
              name: roommate.name,
              amount: sharePerPerson,
              type: "owes",
              upiId: "your.upi@example.com",
              email: "your.email@example.com",
              status: "pending"
            });
          } else {
            // Roommate owes money to another roommate
            calculatedSettlements.push({
              id: `${roommate.name}-to-${expense.paidBy}-${expense.id}`,
              name: roommate.name,
              amount: sharePerPerson,
              type: "owes",
              upiId: roommateData.find(r => r.name === expense.paidBy)?.upiId || "",
              email: roommateData.find(r => r.name === expense.paidBy)?.email || "",
              status: "pending"
            });
          }
        }
      });
    });

    return calculatedSettlements;
  };

  // Update settlements whenever expenses change
  useEffect(() => {
    const newCalculatedSettlements = calculateSettlements();
    const existingSettledSettlements = settlements.filter(s => s.status === "settled");
    const allSettlements = [...newCalculatedSettlements, ...existingSettledSettlements];
    onSettlementUpdate(allSettlements);
  }, [expenses]);

  const handleUPIPayment = (upiId: string, amount: number) => {
    const paymentUrl = `https://quantxpay.vercel.app/${upiId}/${amount}`;
    window.open(paymentUrl, '_blank');
  };

  const markAsPaid = (settlement: Settlement) => {
    const updatedSettlements = settlements.map(s => 
      s.id === settlement.id 
        ? { ...s, status: "settled" as const, settledDate: new Date().toLocaleDateString() }
        : s
    );
    
    onSettlementUpdate(updatedSettlements);
    
    toast({
      title: "Payment Marked as Settled",
      description: `₹${settlement.amount.toFixed(2)} payment has been marked as settled`,
    });
  };

  const sendEmailRequest = async (settlement: Settlement) => {
    setIsRequestLoading(settlement.email);
    
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
            <h3 style="margin: 0; color: #374151;">Amount Due: ₹${settlement.amount.toFixed(2)}</h3>
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
          description: `Payment request email sent successfully`,
        });
      } else {
        console.error('Email sending failed:', result);
        toast({
          title: "Failed to Send Request",
          description: result.message || `Failed to send email. Please try again.`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Email request error:', error);
      toast({
        title: "Error",
        description: `Failed to send email. Please try again.`,
        variant: "destructive",
      });
    } finally {
      setIsRequestLoading(null);
    }
  };

  const deleteExpense = (expenseId: number) => {
    const updatedExpenses = expenses.filter(expense => expense.id !== expenseId);
    onExpenseUpdate(updatedExpenses);
    toast({
      title: "Expense Deleted",
      description: "The expense has been removed successfully.",
    });
  };

  // Filter settlements to show only pending ones in the quick settlements section
  const pendingSettlements = settlements.filter(s => s.status === "pending");

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalOwed = 0;
  const totalOwes = pendingSettlements.filter(s => s.name === "You").reduce((sum, s) => sum + s.amount, 0);

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
            <div className="text-2xl font-bold text-blue-900">₹{totalExpenses}</div>
            <p className="text-xs text-blue-600">This month</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-800">You're Owed</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900">₹{totalOwed.toFixed(2)}</div>
            <p className="text-xs text-green-600">From roommates</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">You Owe</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">₹{totalOwes.toFixed(2)}</div>
            <p className="text-xs text-orange-600">To roommates</p>
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
            {expenses.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <IndianRupee className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No expenses yet</p>
                <p className="text-sm">Add your first expense to get started</p>
              </div>
            ) : (
              expenses.map((expense) => (
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
            <CardDescription>Who owes money and to whom</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {pendingSettlements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No settlements needed</p>
                <p className="text-sm">Add expenses to see settlement calculations</p>
              </div>
            ) : (
              pendingSettlements.map((settlement, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-full p-2">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {settlement.name === "You" ? "You owe" : `${settlement.name} owes`}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Payment needed
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="text-right mr-2">
                      <p className="font-semibold text-orange-600">
                        ₹{settlement.amount.toFixed(2)}
                      </p>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        onClick={() => handleUPIPayment(settlement.upiId, settlement.amount)}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Pay
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => sendEmailRequest(settlement)}
                        disabled={isRequestLoading === settlement.email}
                        className="min-w-[70px]"
                      >
                        {isRequestLoading === settlement.email ? (
                          <div className="flex items-center space-x-1">
                            <div className="w-3 h-3 border border-gray-400 border-t-blue-600 rounded-full animate-spin"></div>
                          </div>
                        ) : (
                          <>
                            <Mail className="h-3 w-3 mr-1" />
                            Request
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsPaid(settlement)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <Check className="h-3 w-3 mr-1" />
                        Mark Paid
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Export roommates data for use in other components
export const getRoommates = () => {
  const roommateData = [
    { name: "Kshitij Gupta", upiId: "kshitij.gupta.5680-1@okhdfcbank", email: "kshitij.gupta.5680@gmail.com" },
    { name: "Ayush Vaibhav", upiId: "ayushvaibhav31@ybl", email: "ayushvaibhav31@gmail.com" },
    { name: "Abhishek Athiya", upiId: "9302596396@ybl", email: "abhiathiya786@gmail.com" },
    { name: "Jitendra Kumar Lodhi", upiId: "lodhikumar07@okhdfcbank", email: "lodhijk7@gmail.com" },
  ];
  return ['You', ...roommateData.map(roommate => roommate.name)];
};
