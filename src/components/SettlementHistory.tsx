
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button"; // Added Button import
import { Clock, Check, ExternalLink } from "lucide-react"; // Added ExternalLink

interface Settlement {
  id: string;
  name: string; // Name of the other person involved in the settlement
  amount: number;
  type: "owes" | "owed"; // "owes" means current user owes `name`; "owed" means `name` owes current user
  upiId: string; // UPI ID of `name` if type is "owes"; current user's UPI if type is "owed"
  email: string; // Email of `name`
  status: "pending" | "settled";
  settledDate?: string;
}

interface SettlementHistoryProps {
  settlements: Settlement[];
}

const SettlementHistory = ({ settlements }: SettlementHistoryProps) => {
  const pendingSettlements = settlements.filter(s => s.status === "pending");
  const settledSettlements = settlements.filter(s => s.status === "settled");

  const handleSettleClick = (upiId: string, amount: number) => {
    if (!upiId || amount <= 0) {
      console.error("Invalid UPI ID or amount for settlement.");
      // Optionally, show a toast message to the user
      return;
    }
    const paymentUrl = `https://quantxpay.vercel.app/${upiId}/${amount.toFixed(2)}`;
    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
  };

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
                <div key={settlement.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200 space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <div className="bg-orange-500 rounded-full p-2 flex-shrink-0">
                      <Clock className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {settlement.type === "owes" ? `You owe ${settlement.name}` : `${settlement.name} owes you`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Pending payment
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1 self-end sm:self-center">
                    <p className="font-semibold text-orange-600">₹{settlement.amount.toFixed(2)}</p>
                    {settlement.type === "owes" && settlement.upiId && (
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleSettleClick(settlement.upiId, settlement.amount)}
                        className="bg-white hover:bg-gray-50 border-orange-300 text-orange-600 hover:text-orange-700"
                      >
                        Settle via UPI
                        <ExternalLink className="ml-2 h-3 w-3" />
                      </Button>
                    )}
                    {settlement.type === "owes" && !settlement.upiId && (
                       <p className="text-xs text-muted-foreground">UPI ID not available</p>
                    )}
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
                        {settlement.type === "owes" ? `You paid ${settlement.name}` : `${settlement.name} paid you`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {settlement.settledDate ? `Settled on ${settlement.settledDate}` : "Settled"}
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

