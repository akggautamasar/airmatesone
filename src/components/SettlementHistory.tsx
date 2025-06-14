
import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Clock, Check, CreditCard, UserCheck, CheckCircle, Send, Trash2, Info } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

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
  onDeleteSettlementGroup: (transaction_group_id: string) => void;
  hasActiveExpenses: boolean; // New prop
}

const SettlementHistory = ({ settlements, currentUserId, onUpdateStatus, onDeleteSettlementGroup, hasActiveExpenses }: SettlementHistoryProps) => {
  const [settlementToDelete, setSettlementToDelete] = useState<Settlement | null>(null);
  
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
      return type === 'owes' ? `You've marked as paid to ${name}, awaiting their confirmation` : `${name} marked as paid, confirm receipt`;
    }
    if (status === 'settled') {
      return type === 'owes' ? `You paid ${name}` : `Received from ${name}`;
    }
    return 'Unknown status';
  };
  
  const getActionText = (status: Settlement['status'], type: Settlement['type']) => {
    if (type === 'owes') { // Current user owes money
      if (status === 'pending') return "Mark as Paid & Finalize"; 
      if (status === 'debtor_paid') return "Awaiting Confirmation"; 
    } else { // Current user is owed money
      if (status === 'pending') return "Awaiting Payment"; 
      if (status === 'debtor_paid') return "Confirm & Settle"; 
    }
    return null;
  };

  const renderSettlementItem = (settlement: Settlement, isPendingTab: boolean) => {
    const color = getStatusColor(settlement.status);
    const actionButtonText = getActionText(settlement.status, settlement.type);

    return (
      <div key={settlement.id} className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-${color}-50 rounded-lg border border-${color}-200 space-y-2 sm:space-y-0`}>
        <div className="flex items-center space-x-3">
          <div className={`bg-${color}-500 rounded-full p-2 flex-shrink-0`}>
            {settlement.status === 'pending' && <Clock className="h-4 w-4 text-white" />}
            {settlement.status === 'debtor_paid' && <Send className="h-4 w-4 text-white" />}
            {settlement.status === 'settled' && <Check className="h-4 w-4 text-white" />}
          </div>
          <div>
            <p className="font-medium">
              {getStatusText(settlement.status, settlement.type, settlement.name)}
            </p>
            <p className={`text-sm ${isPendingTab ? `text-${color}-600` : 'text-muted-foreground'}`}>
              {isPendingTab 
                ? `Status: ${settlement.status.replace('_', ' ')}` 
                : (settlement.settledDate ? `Settled on ${new Date(settlement.settledDate).toLocaleDateString()}` : "Settled")}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end space-y-1 self-end sm:self-center">
          <p className={`font-semibold text-${color}-600`}>₹{settlement.amount.toFixed(2)}</p>
          
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 mt-1 w-full sm:w-auto justify-end">
            {isPendingTab && settlement.type === "owes" && settlement.status === "pending" && settlement.upiId && (
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

            {isPendingTab && actionButtonText && settlement.transaction_group_id && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                        if (settlement.type === 'owes' && settlement.status === 'pending') {
                            // For "Mark as Paid & Finalize", directly settle if user is debtor and it's pending
                            onUpdateStatus(settlement.transaction_group_id!, 'settled'); 
                        } else if (settlement.type === 'owed' && settlement.status === 'debtor_paid') {
                            // For "Confirm & Settle", creditor confirms debtor's payment
                            onUpdateStatus(settlement.transaction_group_id!, 'settled');
                        }
                        // No action for "Awaiting Payment" or "Awaiting Confirmation" from this button directly
                    }}
                    className={`bg-white hover:bg-gray-50 border-green-400 text-green-600 hover:text-green-700 w-full sm:w-auto`}
                    disabled={actionButtonText === "Awaiting Payment" || actionButtonText === "Awaiting Confirmation"}
                >
                    {actionButtonText}
                    {actionButtonText === "Mark as Paid & Finalize" && <UserCheck className="ml-2 h-3 w-3" />} 
                    {actionButtonText === "Confirm & Settle" && <CheckCircle className="ml-2 h-3 w-3" />}
                </Button>
            )}
             {isPendingTab && settlement.type === "owes" && settlement.status === "pending" && !settlement.upiId && settlement.transaction_group_id && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onUpdateStatus(settlement.transaction_group_id!, 'settled')} 
                    className="bg-white hover:bg-gray-50 border-green-400 text-green-600 hover:text-green-700 w-full sm:w-auto"
                  >
                    Mark as Paid & Finalize (Manual) 
                    <UserCheck className="ml-2 h-3 w-3" />
                </Button>
            )}
            {settlement.transaction_group_id && (
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50 border-destructive text-destructive hover:text-destructive/90 w-full sm:w-auto"
                  onClick={() => setSettlementToDelete(settlement)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
            )}
          </div>
          {isPendingTab && settlement.type === "owes" && settlement.status === "pending" && !settlement.upiId && (
              <p className="text-xs text-muted-foreground mt-1">UPI ID not available for direct payment</p>
          )}
        </div>
      </div>
    );
  };

  return (
    <AlertDialog>
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
                  <p>No pending settlements.</p>
                </div>
              ) : (
                <>
                  {!hasActiveExpenses && (
                    <div className="p-3 mb-4 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 text-sm flex items-start space-x-2">
                      <Info className="h-5 w-5 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium">No Active Expenses</p>
                        <p>
                          The pending settlements listed below may relate to past activity or can be managed/deleted individually using the trash icon.
                        </p>
                      </div>
                    </div>
                  )}
                  <div className="space-y-4">
                   {pendingSettlements.map((s) => renderSettlementItem(s, true))}
                  </div>
                </>
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
                settledSettlements.map((s) => renderSettlementItem(s, false))
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action will delete the settlement: <br />
            {settlementToDelete && `${getStatusText(settlementToDelete.status, settlementToDelete.type, settlementToDelete.name)} for ₹${settlementToDelete.amount.toFixed(2)}.`}
            <br />
            This will remove the settlement for both parties involved. This cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setSettlementToDelete(null)}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={() => {
              if (settlementToDelete && settlementToDelete.transaction_group_id) {
                onDeleteSettlementGroup(settlementToDelete.transaction_group_id);
              }
              setSettlementToDelete(null);
            }}
            className="bg-destructive hover:bg-destructive/90"
          >
            Delete
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

export { SettlementHistory };
