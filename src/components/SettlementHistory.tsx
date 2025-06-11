
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, CheckCircle, Clock, XCircle } from "lucide-react";

interface Settlement {
  id: number;
  from: string;
  to: string;
  amount: number;
  description: string;
  status: 'completed' | 'pending' | 'failed';
  date: string;
  upiTransactionId?: string;
}

export const SettlementHistory = () => {
  const settlements: Settlement[] = [
    {
      id: 1,
      from: "You",
      to: "Rahul",
      amount: 250,
      description: "Electricity bill settlement",
      status: "completed",
      date: "2024-01-15",
      upiTransactionId: "UPI123456789"
    },
    {
      id: 2,
      from: "Priya",
      to: "You",
      amount: 150,
      description: "Grocery expenses",
      status: "pending",
      date: "2024-01-14"
    },
    {
      id: 3,
      from: "You",
      to: "Arjun",
      amount: 300,
      description: "Internet bill split",
      status: "completed",
      date: "2024-01-12",
      upiTransactionId: "UPI987654321"
    },
    {
      id: 4,
      from: "Sneha",
      to: "You",
      amount: 100,
      description: "Cleaning supplies",
      status: "failed",
      date: "2024-01-10"
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-orange-600" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-orange-100 text-orange-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <History className="h-5 w-5" />
          <span>Settlement History</span>
        </CardTitle>
        <CardDescription>
          Track all payment settlements between roommates
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {settlements.map((settlement) => (
          <div key={settlement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-600 to-green-600 rounded-full">
                {getStatusIcon(settlement.status)}
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <p className="font-medium">
                    {settlement.from} → {settlement.to}
                  </p>
                  <Badge className={getStatusColor(settlement.status)}>
                    {settlement.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{settlement.description}</p>
                <div className="flex items-center space-x-4 text-xs text-muted-foreground mt-1">
                  <span>{new Date(settlement.date).toLocaleDateString()}</span>
                  {settlement.upiTransactionId && (
                    <span>ID: {settlement.upiTransactionId}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <p className="font-semibold">₹{settlement.amount}</p>
              {settlement.status === 'pending' && (
                <p className="text-xs text-orange-600">Awaiting payment</p>
              )}
            </div>
          </div>
        ))}
        
        {settlements.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No settlement history yet</p>
            <p className="text-sm">Settlements will appear here once you start making payments</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
