import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Clock, Check, Info } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
export type { Settlement } from '@/types';
import { SettlementItem } from './settlement/SettlementItem';
import { Settlement } from '@/types';

export interface SettlementHistoryProps {
  settlements: Settlement[];
  onUpdateStatus: (transaction_group_id: string, newStatus: "pending" | "debtor_paid" | "settled") => void;
  onDeleteSettlementGroup: (transaction_group_id: string) => void;
  hasActiveExpenses: boolean;
}

const SettlementHistory = ({ settlements, onUpdateStatus, onDeleteSettlementGroup, hasActiveExpenses }: SettlementHistoryProps) => {
  const [settlementToDelete, setSettlementToDelete] = useState<Settlement | null>(null);
  
  const pendingSettlements = settlements.filter(s => s.status === "pending" || s.status === "debtor_paid");
  const settledSettlements = settlements.filter(s => s.status === "settled");

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
                   {pendingSettlements.map((s) => (
                    <SettlementItem
                      key={s.id}
                      settlement={s}
                      isPendingTab={true}
                      onUpdateStatus={onUpdateStatus}
                      onDeleteTrigger={setSettlementToDelete}
                    />
                   ))}
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
                settledSettlements.map((s) => (
                  <SettlementItem
                    key={s.id}
                    settlement={s}
                    isPendingTab={false}
                    onUpdateStatus={onUpdateStatus}
                    onDeleteTrigger={setSettlementToDelete}
                  />
                ))
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
