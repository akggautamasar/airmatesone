
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users } from "lucide-react";

interface Balance {
  name: string;
  balance: number;
}

interface NetExpensesOverviewProps {
  finalBalances: Balance[];
  currentUserDisplayName: string;
}

export const NetExpensesOverview: React.FC<NetExpensesOverviewProps> = ({ finalBalances, currentUserDisplayName }) => {
  const significantBalances = finalBalances.filter(p => p.balance < -0.005 || p.balance > 0.005);

  if (significantBalances.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Net Expenses Overview</CardTitle>
                <CardDescription>Who owes whom based on all expenses.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-4 text-muted-foreground">
                    <p>Everyone is settled up!</p>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Net Expenses Overview</CardTitle>
        <CardDescription>Who owes whom based on all expenses.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {significantBalances.map((person, index) => {
            const isYou = person.name === currentUserDisplayName;
            const owes = person.balance > 0.005;
            const isOwed = person.balance < -0.005;
            
            return (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center space-x-3">
                        <div className={`rounded-full p-2 ${owes ? 'bg-red-100 dark:bg-red-900/30' : 'bg-green-100 dark:bg-green-900/30'}`}>
                            <Users className={`h-4 w-4 ${owes ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                        </div>
                        <p className="font-medium text-sm text-gray-800 dark:text-gray-200">{person.name}{isYou ? " (You)" : ""}</p>
                    </div>
                    <Badge variant={owes ? "destructive" : "default"} className={`${isOwed ? 'bg-green-500 hover:bg-green-600' : ''}`}>
                        {owes ? `Owes ₹${person.balance.toFixed(2)}` : `Is Owed ₹${Math.abs(person.balance).toFixed(2)}`}
                    </Badge>
                </div>
            );
        })}
      </CardContent>
    </Card>
  );
};
