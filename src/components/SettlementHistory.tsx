import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Clock, Check, CreditCard, BadgeCheck, Send, CheckCircle, UserCheck } from "lucide-react";

export interface Settlement {
  id: string;
  name: string; 
  amount: number;
  type: "owes" | "owed"; 
  upiId: string; 
  email: string; 
  status: "pending" | "debtor_paid" | "settled"; 
  settledDate?: string;
  transaction_group_id?: string; 
  user_id: string; 
}

interface SettlementHistoryProps {
  settlements: Settlement[];
  currentUserId: string | undefined; 
  onUpdateStatus: (transaction_group_id: string, newStatus: "pending" | "debtor_paid" | "settled") => void;
}

const SettlementHistory = ({ settlements, currentUserId, onUpdateStatus }: SettlementHistoryProps) => {
  const pendingSettlements = settlements.filter(s => s.status === "pending" || s.status === "debtor_paid");
  const settledSettlements = settlements.filter(s => s.status === "settled");

  const handlePayClick = (upiId: string, amount: number) => {
    if (!upiId || amount <= 0) {
      console.error("Invalid UPI ID or amount for payment.");
      return;
    }
    const paymentUrl = `https://quantxpay.vercel.app/${upiId}/${amount.toFixed(2)}`;
    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
  };

  const getStatusColor = (status: Settlement['status']) => {
    if (status === 'pending') return 'orange';
    if (status === 'debtor_paid') return 'blue';
    if (status === 'settled') return 'green';
    return 'gray';
  };

  const getStatusText = (status: Settlement['status'], type: Settlement['type'], name: string) => {
    if (status === 'pending') {
      return type === 'owes' ? `You owe ${name}` : `${name} owes you`;
    }
    if (status === 'debtor_paid') {
      // This state means the debtor has paid, and creditor needs to confirm.
      return type === 'owes' ? `You've marked as paid to ${name}, awaiting their confirmation` : `${name} marked as paid, confirm receipt`;
    }
    if (status === 'settled') {
      return type === 'owes' ? `You paid ${name}` : `${name} paid you`;
    }
    return 'Unknown status';
  };
  
  const getActionText = (status: Settlement['status'], type: Settlement['type']) => {
    if (type === 'owes') { // Current user owes money
      if (status === 'pending') return "Mark as Paid & Finalize"; // Changed text
      // If debtor_paid, it means current user (debtor) already acted, waiting for creditor. No action for debtor here.
      if (status === 'debtor_paid') return "Awaiting Confirmation"; 
    } else { // Current user is owed money
      if (status === 'pending') return "Awaiting Payment"; // No action for creditor if pending
      if (status === 'debtor_paid') return "Confirm & Settle"; // Debtor paid, creditor confirms to 'settled'
    }
    return null;
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
              </div>
            ) : (
              pendingSettlements.map((settlement) => {
                const color = getStatusColor(settlement.status);
                const actionButtonText = getActionText(settlement.status, settlement.type);

                return (
                <div key={settlement.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-${color}-50 rounded-lg border border-${color}-200 space-y-2 sm:space-y-0`}>
                  <div className="flex items-center space-x-3">
                    <div className={`bg-${color}-500 rounded-full p-2 flex-shrink-0`}>
                      {settlement.status === 'pending' && <Clock className="h-4 w-4 text-white" />}
                      {settlement.status === 'debtor_paid' && <Send className="h-4 w-4 text-white" />}
                      {/* Removed settled icon here as it's for pending tab */}
                    </div>
                    <div>
                      <p className="font-medium">
                        {getStatusText(settlement.status, settlement.type, settlement.name)}
                      </p>
                      <p className={`text-sm text-${color}-600`}>
                        Status: {settlement.status.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1 self-end sm:self-center">
                    <p className={`font-semibold text-${color}-600`}>₹{settlement.amount.toFixed(2)}</p>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 mt-1 w-full sm:w-auto justify-end">
                        {settlement.type === "owes" && settlement.status === "pending" && settlement.upiId && (
                            <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handlePayClick(settlement.upiId, settlement.amount)}
                                className={`bg-white hover:bg-gray-50 border-${color}-300 text-${color}-600 hover:text-${color}-700 w-full sm:w-auto`}
                            >
                                Pay via UPI
                                <CreditCard className="ml-2 h-3 w-3" />
                            </Button>
                        )}

                        {actionButtonText && settlement.transaction_group_id && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    if (settlement.type === 'owes' && settlement.status === 'pending') {
                                        // Debtor marks as paid, directly settle
                                        onUpdateStatus(settlement.transaction_group_id!, 'settled'); 
                                    } else if (settlement.type === 'owed' && settlement.status === 'debtor_paid') {
                                        // Creditor confirms receipt, settle
                                        onUpdateStatus(settlement.transaction_group_id!, 'settled');
                                    }
                                    // Note: if type is 'owes' and status is 'debtor_paid', actionButtonText is "Awaiting Confirmation", button is disabled.
                                }}
                                className={`bg-white hover:bg-gray-50 border-green-400 text-green-600 hover:text-green-700 w-full sm:w-auto`}
                                disabled={actionButtonText === "Awaiting Payment" || actionButtonText === "Awaiting Confirmation"}
                            >
                                {actionButtonText}
                                {actionButtonText === "Mark as Paid & Finalize" && <UserCheck className="ml-2 h-3 w-3" />} 
                                {actionButtonText === "Confirm & Settle" && <CheckCircle className="ml-2 h-3 w-3" />}
                            </Button>
                        )}
                         {settlement.type === "owes" && settlement.status === "pending" && !settlement.upiId && settlement.transaction_group_id && (
                             <Button
                                variant="outline"
                                size="sm"
                                onClick={() => onUpdateStatus(settlement.transaction_group_id!, 'settled')} // Directly settle
                                className="bg-white hover:bg-gray-50 border-green-400 text-green-600 hover:text-green-700 w-full sm:w-auto"
                             >
                                Mark as Paid & Finalize (Manual) 
                                <UserCheck className="ml-2 h-3 w-3" />
                            </Button>
                        )}
                    </div>
                    {settlement.type === "owes" && settlement.status === "pending" && !settlement.upiId && (
                       <p className="text-xs text-muted-foreground">UPI ID not available for direct payment</p>
                    )}
                  </div>
                </div>
              )})
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
                        {getStatusText(settlement.status, settlement.type, settlement.name)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {settlement.settledDate ? `Settled on ${new Date(settlement.settledDate).toLocaleDateString()}` : "Settled"}
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
