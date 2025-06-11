
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { IndianRupee, TrendingUp, TrendingDown, Users } from "lucide-react";

export const ExpenseOverview = () => {
  const recentExpenses = [
    { id: 1, description: "Groceries - Vegetables", amount: 500, paidBy: "You", date: "Today", category: "Groceries" },
    { id: 2, description: "Electricity Bill", amount: 2000, paidBy: "Rahul", date: "Yesterday", category: "Utilities" },
    { id: 3, description: "Internet Bill", amount: 800, paidBy: "Priya", date: "2 days ago", category: "Utilities" },
  ];

  const settlements = [
    { name: "Rahul", amount: 150, type: "owes", upiId: "rahul@paytm" },
    { name: "Priya", amount: 200, type: "owed", upiId: "priya@phonepe" },
    { name: "Arjun", amount: 100, type: "owes", upiId: "arjun@gpay" },
  ];

  const handleUPIPayment = (upiId: string, amount: number) => {
    const paymentUrl = `https://quantxpay.vercel.app/${upiId}/${amount}`;
    window.open(paymentUrl, '_blank');
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
            {recentExpenses.map((expense) => (
              <div key={expense.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">Paid by {expense.paidBy} • {expense.date}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold">₹{expense.amount}</p>
                  <p className="text-xs text-muted-foreground">{expense.category}</p>
                </div>
              </div>
            ))}
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
                  {settlement.type === 'owes' && (
                    <Button
                      size="sm"
                      onClick={() => handleUPIPayment(settlement.upiId, settlement.amount)}
                      className="bg-gradient-to-r from-blue-600 to-green-600 hover:from-blue-700 hover:to-green-700"
                    >
                      Pay
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
