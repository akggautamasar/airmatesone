
import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { Settlement } from '@/types';
import { SettlementItem } from '@/components/settlement/SettlementItem';
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

interface PendingSettlementsProps {
  settlements: Settlement[];
  onUpdateStatus: (transaction_group_id: string, newStatus: "pending" | "debtor_paid" | "settled") => void;
  onDeleteSettlementGroup: (transaction_group_id: string) => void;
}

export const PendingSettlements: React.FC<PendingSettlementsProps> = ({ settlements, onUpdateStatus, onDeleteSettlementGroup }) => {
  const [settlementToDelete, setSettlementToDelete] = React.useState<Settlement | null>(null);

  const pendingSettlements = settlements.filter(s => s.status === "pending" || s.status === "debtor_paid");

  const getStatusText = (status: Settlement['status'], type: Settlement['type'], name: string) => {
    if (status === 'pending') {
      return type === 'owes' ? `You owe ${name}` : `${name} owes you`;
    }
    if (status === 'debtor_paid') {
      return type === 'owes' ? `You've marked as paid to ${name}, awaiting their confirmation` : `${name} marked as paid, confirm receipt`;
    }
    return 'Unknown status';
  };

  return (
    <AlertDialog>
      <Card>
        <CardHeader>
          <CardTitle>Pending Settlements</CardTitle>
          <CardDescription>Actions you need to take or are waiting on.</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingSettlements.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground">
              <Clock className="h-10 w-10 mx-auto mb-3 opacity-50" />
              <p>No pending settlements.</p>
            </div>
          ) : (
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
          )}
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
