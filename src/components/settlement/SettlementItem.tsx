import React from 'react';
import { Button } from "@/components/ui/button";
import { AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Clock, Check, CreditCard, UserCheck, CheckCircle, Send, Trash2 } from "lucide-react";
import { Settlement } from '@/types';

interface SettlementItemProps {
  settlement: Settlement;
  isPendingTab: boolean;
  onUpdateStatus: (transaction_group_id: string, newStatus: "pending" | "debtor_paid" | "settled") => void;
  onDeleteTrigger: (settlement: Settlement) => void;
}

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
    if (type === 'owes') { // Current user owes money (debtor)
      if (status === 'pending') return "Mark as Paid"; 
      if (status === 'debtor_paid') return "Awaiting Confirmation"; 
    } else { // Current user is owed money (creditor)
      if (status === 'pending') return "Mark as Received"; 
      if (status === 'debtor_paid') return "Confirm Receipt"; 
    }
    return null;
};

const handlePayClick = (upiId: string, amount: number) => {
    if (!upiId || amount <= 0) {
      console.error("Invalid UPI ID or amount for payment.");
      return;
    }
    const paymentUrl = `https://quantxpay.vercel.app/${upiId}/${amount.toFixed(2)}`;
    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
};

export const SettlementItem = ({ settlement, isPendingTab, onUpdateStatus, onDeleteTrigger }: SettlementItemProps) => {
    const color = getStatusColor(settlement.status);
    const actionButtonText = getActionText(settlement.status, settlement.type);

    // Fix unavailable UPI logic (avoid false or empty string)
    const hasValidUpi =
      settlement.upiId && typeof settlement.upiId === "string" && settlement.upiId.trim().length > 2 && !["null", "undefined", "-"].includes(settlement.upiId);

    // Always show the correct options depending on settlement type/status/user
    return (
      <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-3 bg-${color}-50 rounded-lg border border-${color}-200 space-y-2 sm:space-y-0`}>
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
            {/* Only show Pay via UPI for debtor, pending, and with a valid UPI */}
            {isPendingTab && settlement.type === "owes" && settlement.status === "pending" && hasValidUpi && (
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
          {/* Show Mark as Paid for debtor with pending, whether or not UPI is present */}
          {isPendingTab && settlement.type === "owes" && settlement.status === "pending" && settlement.transaction_group_id && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                  handleStatusUpdate('debtor_paid');
              }}
              className="bg-white hover:bg-gray-50 border-green-400 text-green-600 hover:text-green-700 w-full sm:w-auto"
            >
              Mark as Paid
              <UserCheck className="ml-2 h-3 w-3" />
            </Button>
          )}
          {/* Show Creditors the expected Confirm/Mark as Received */}
          {isPendingTab && settlement.type === "owed" && (
            <>
              {settlement.status === "pending" && settlement.transaction_group_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                      handleStatusUpdate('settled');
                  }}
                  className="bg-white hover:bg-gray-50 border-green-400 text-green-600 hover:text-green-700 w-full sm:w-auto"
                >
                  Mark as Received
                  <CheckCircle className="ml-2 h-3 w-3" />
                </Button>
              )}
              {settlement.status === "debtor_paid" && settlement.transaction_group_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                      handleStatusUpdate('settled');
                  }}
                  className="bg-white hover:bg-gray-50 border-green-400 text-green-600 hover:text-green-700 w-full sm:w-auto"
                >
                  Confirm Receipt
                  <CheckCircle className="ml-2 h-3 w-3" />
                </Button>
              )}
            </>
          )}
          {settlement.transaction_group_id && (
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-white hover:bg-gray-50 border-destructive text-destructive hover:text-destructive/90 w-full sm:w-auto"
                  onClick={() => onDeleteTrigger(settlement)}
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </AlertDialogTrigger>
            )}
          </div>
          {isPendingTab && settlement.type === "owes" && settlement.status === "pending" && !hasValidUpi && (
              <p className="text-xs text-muted-foreground mt-1">UPI ID not available for direct payment</p>
          )}
        </div>
      </div>
    );
};
