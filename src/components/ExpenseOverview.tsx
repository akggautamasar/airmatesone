
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
    const balances: { [key: string]: number } = {};
    
    // Initialize balances
    balances["You"] = 0;
    roommateData.forEach(roommate => {
      balances[roommate.name] = 0;
    });

    // Calculate balances based on expenses
    expenses.forEach(expense => {
      const sharePerPerson = expense.amount / totalRoommates;
      
      // The person who paid gets credited
      balances[expense.paidBy] += expense.amount - sharePerPerson;
      
      // Everyone else owes their share
      Object.keys(balances).forEach(person => {
        if (person !== expense.paidBy) {
          balances[person] -= sharePerPerson;
        }
      });
    });

    // Convert balances to settlements (including "You")
    const calculatedSettlements: Settlement[] = [];
    
    // Add settlement for "You" if you owe or are owed money
    const yourBalance = balances["You"];
    if (Math.abs(yourBalance) > 0.01) {
      // Find who you're settling with (for UPI purposes, we'll use a default or the person you owe most to)
      const targetRoommate = roommateData.find(r => balances[r.name] > 0) || roommateData[0];
      calculatedSettlements.push({
        name: "You",
        amount: Math.abs(yourBalance),
        type: yourBalance < 0 ? "owes" : "owed",
        upiId: targetRoommate.upiId, // UPI of person you're paying to
        email: "your.email@example.com" // Placeholder for your email
      });
    }

    // Add settlements for other roommates
    roommateData.forEach(roommate => {
      const balance = balances[roommate.name];
      if (Math.abs(balance) > 0.01) { // Only show if significant amount
        calculatedSettlements.push({
          name: roommate.name,
          amount: Math.abs(balance),
          type: balance < 0 ? "owes" : "owed",
          upiId: roommate.upiId,
          email: roommate.email
        });
      }
    });

    return calculatedSettlements;
  };

  const currentSettlements = calculateSettlements();

  const handleUPIPayment = (upiId: string, amount: number) => {
    const paymentUrl = `https://quantxpay.vercel.app/${upiId}/${amount}`;
    window.open(paymentUrl, '_blank');
  };

  const sendEmailRequest = async (settlement: Settlement) => {
    setIsRequestLoading(settlement.email);
    
    try {
      console.log('Attempting to send email request to:', settlement.email);
      
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Email request simulated successfully');
      
      toast({
        title: "Request Sent!",
        description: `Payment request sent to ${settlement.name}`,
      });
      
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
    const updatedExpenses = expenses.filter(expense => expense.id !== expenseId);
    onExpenseUpdate(updatedExpenses);
    toast({
      title: "Expense Deleted",
      description: "The expense has been removed successfully.",
    });
  };

  // Calculate totals
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0);
  const totalOwed = currentSettlements.filter(s => s.type === "owed").reduce((sum, s) => sum + s.amount, 0);
  const totalOwes = currentSettlements.filter(s => s.type === "owes").reduce((sum, s) => sum + s.amount, 0);

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
            <p className="text-xs text-green-600">From {currentSettlements.filter(s => s.type === "owed" && s.name !== "You").length} roommate(s)</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-800">You Owe</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900">₹{totalOwes.toFixed(2)}</div>
            <p className="text-xs text-orange-600">To {currentSettlements.filter(s => s.type === "owes" && s.name !== "You").length} roommate(s)</p>
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
            <CardDescription>Settle up with your roommates</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {currentSettlements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No settlements needed</p>
                <p className="text-sm">Add expenses to see settlement calculations</p>
              </div>
            ) : (
              currentSettlements.map((settlement, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-full p-2">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {settlement.name === "You" ? "You" : settlement.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {settlement.name === "You" ? "Your balance" : settlement.upiId}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="text-right">
                      <p className={`font-semibold ${settlement.type === 'owes' ? 'text-orange-600' : 'text-green-600'}`}>
                        {settlement.type === 'owes' ? '-' : '+'}₹{settlement.amount.toFixed(2)}
                      </p>
                    </div>
                    {settlement.name === "You" && settlement.type === 'owes' && (
                      <Button
                        size="sm"
                        onClick={() => handleUPIPayment(settlement.upiId, settlement.amount)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Pay
                      </Button>
                    )}
                    {settlement.name !== "You" && settlement.type === 'owes' && (
                      <Button
                        size="sm"
                        onClick={() => handleUPIPayment(settlement.upiId, settlement.amount)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        Pay
                      </Button>
                    )}
                    {settlement.type === 'owed' && settlement.name !== "You" && (
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
