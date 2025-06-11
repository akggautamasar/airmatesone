
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Clock, Check, Users } from "lucide-react";

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

interface SettlementHistoryProps {
  settlements: Settlement[];
}

const SettlementHistory = ({ settlements }: SettlementHistoryProps) => {
  const pendingSettlements = settlements.filter(s => s.status === "pending");
  const settledSettlements = settlements.filter(s => s.status === "settled");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Settlement History</CardTitle>
        <CardDescription>
          Track all pending and completed settlement transactions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="pending" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="pending">Pending ({pendingSettlements.length})</TabsTrigger>
            <TabsTrigger value="settled">Settled ({settledSettlements.length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="pending" className="space-y-4 mt-4">
            {pendingSettlements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No pending settlements</p>
                <p className="text-sm">All settlements are up to date</p>
              </div>
            ) : (
              pendingSettlements.map((settlement) => (
                <div key={settlement.id} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-500 rounded-full p-2">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {settlement.name === "You" ? "You owe" : `${settlement.name} owes`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pending payment
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-orange-600">₹{settlement.amount.toFixed(2)}</p>
                    <p className="text-xs text-orange-500">Pending</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="settled" className="space-y-4 mt-4">
            {settledSettlements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Check className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No settled transactions yet</p>
                <p className="text-sm">Completed settlements will appear here</p>
              </div>
            ) : (
              settledSettlements.map((settlement) => (
                <div key={settlement.id} className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center space-x-3">
                    <div className="bg-green-500 rounded-full p-2">
                      <Check className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {settlement.name === "You" ? "You paid" : `${settlement.name} paid`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Settled on {settlement.settledDate}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">₹{settlement.amount.toFixed(2)}</p>
                    <p className="text-xs text-green-500">Settled</p>
                  </div>
                </div>
              ))
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export { SettlementHistory };
