import React, { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { Calendar, Users, Trash2, IndianRupee, CreditCard, BadgeCheck } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useRoommates } from "@/hooks/useRoommates";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Settlement as DetailedSettlement } from "@/components/SettlementHistory";
import { useToast } from "@/components/ui/use-toast";
import { useExpenseCalculations } from "./overview/hooks/useExpenseCalculations";

import { SummaryCards } from "./overview/SummaryCards";
import { BalanceList } from "./overview/BalanceList";
import { ChartsSection } from "./overview/ChartsSection";
import { RecentExpensesList } from "./overview/RecentExpensesList";

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string; 
  category: string;
  sharers?: string[] | null;
}

interface ExpenseOverviewProps {
  expenses: Expense[];
  onExpenseUpdate: () => void;
  settlements: DetailedSettlement[]; 
  onAddSettlementPair: (
    currentUserInvolves: { name: string; email: string; upi_id: string; type: 'owes' | 'owed' },
    otherPartyInvolves: { name: string; email: string; upi_id: string; type: 'owes' | 'owed' },
    amount: number
  ) => Promise<DetailedSettlement | null>;
  currentUserId: string | undefined;
  onUpdateStatus: (transactionGroupId: string, newStatus: "pending" | "debtor_paid" | "settled") => Promise<void>; // Keep this prop name for clarity
  onDeleteSettlementGroup?: (transactionGroupId: string) => Promise<void>;
}

export const ExpenseOverview = ({
  expenses: propsExpenses,
  onExpenseUpdate,
  settlements,
  onAddSettlementPair,
  currentUserId,
  onUpdateStatus,
  // onDeleteSettlementGroup // Keep if used, otherwise remove
}: ExpenseOverviewProps) => {
  const { deleteExpense } = useExpenses();
  const { roommates } = useRoommates();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const currentUserDisplayName = useMemo(() => {
    return profile?.name || user?.email?.split('@')[0] || 'You';
  }, [profile, user]);

  const {
    allParticipantNames,
    totalExpenses,
    finalBalances,
    categoryData,
    monthlyData,
  } = useExpenseCalculations({
    expenses: propsExpenses,
    currentUserDisplayName,
    settlements,
    roommates,
    profile,
    currentUserId,
    user,
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      await deleteExpense(expenseId);
      onExpenseUpdate(); 
      toast({ title: "Expense Deleted", description: "The expense has been successfully deleted."});
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({ title: "Error", description: "Could not delete the expense.", variant: "destructive"});
    }
  };
  
  const initiateDebtorPaymentProcess = async (
    _debtorNameIgnored: string, 
    creditorName: string,
    amountToSettle: number
  ) => {
    const absAmount = Math.abs(amountToSettle);
    if (absAmount < 0.01) return;

    const existingPendingSettlement = settlements.find(s => 
      s.name === creditorName && 
      s.type === 'owes' &&       
      s.status === 'pending' &&  
      s.transaction_group_id
    );

    let targetTransactionGroupId: string | undefined = existingPendingSettlement?.transaction_group_id;

    if (!existingPendingSettlement) {
      const debtorDetails = {
          name: currentUserDisplayName,
          email: user?.email || '',
          upi_id: profile?.upi_id || ''
      };
      const creditorRoommate = roommates.find(r => r.name === creditorName);
      const creditorDetails = creditorRoommate 
          ? { name: creditorRoommate.name, email: creditorRoommate.email, upi_id: creditorRoommate.upi_id } 
          : { name: creditorName, email: 'unknown', upi_id: ''}; 

      const currentUserPerspective = { ...debtorDetails, type: 'owes' as const };
      const otherPartyPerspective = { ...creditorDetails, type: 'owed' as const };
      
      console.log(`Debtor (${currentUserDisplayName}) initiating payment process to ${creditorName}. No existing pending settlement found. Creating new.`);
      const createdSettlement = await onAddSettlementPair(currentUserPerspective, otherPartyPerspective, absAmount);
      
      if (createdSettlement && createdSettlement.transaction_group_id) {
        targetTransactionGroupId = createdSettlement.transaction_group_id;
        console.log(`New settlement pair created with transaction_group_id: ${targetTransactionGroupId} for debtor ${currentUserDisplayName} to ${creditorName}.`);
      } else {
        console.error("Settlement pair creation failed or did not return a transaction group ID during debtor payment process. Settlement:", createdSettlement);
        toast({
            title: "Error Initializing Payment",
            description: "Could not create a settlement record. Please try again.",
            variant: "destructive",
        });
        return;
      }
    } else {
      console.log(`Debtor (${currentUserDisplayName}) initiating payment process to ${creditorName}. Found existing pending settlement with transaction_group_id: ${targetTransactionGroupId}.`);
    }

    if (targetTransactionGroupId) {
      console.log(`Updating transaction_group_id ${targetTransactionGroupId} to 'debtor_paid'.`);
      await onUpdateStatus(targetTransactionGroupId, 'debtor_paid');
      toast({
        title: "Payment Marked as Paid",
        description: `Your payment to ${creditorName} for ₹${absAmount.toFixed(2)} has been marked. ${creditorName} will be notified to confirm.`,
      });
    } else {
      console.error("Failed to obtain transaction_group_id for updating status to debtor_paid. This indicates an issue in finding or creating settlement.");
      toast({
          title: "Error Marking Payment",
          description: "Could not mark payment due to an internal error (missing transaction ID).",
          variant: "destructive",
      });
    }
    onExpenseUpdate();
  };

  const initiateCreditorRequestProcess = async (
    debtorName: string,
    _creditorNameIgnored: string, 
    amountToSettle: number
  ) => {
    const absAmount = Math.abs(amountToSettle);
    if (absAmount < 0.01) return;
    
    const existingPendingRequest = settlements.find(s => 
      s.name === debtorName && 
      s.type === 'owed' &&      
      s.status === 'pending'
    );

    if (existingPendingRequest) {
      console.log(`Creditor (${currentUserDisplayName}) attempting to request payment from ${debtorName}. Existing pending request found.`);
      toast({
        title: "Payment Already Requested",
        description: `You've already requested ₹${absAmount.toFixed(2)} from ${debtorName}. It's currently marked as pending.`,
      });
      return; 
    }
    
    console.log(`Creditor (${currentUserDisplayName}) initiating payment request to ${debtorName}. No existing pending request found. Creating new.`);
    const creditorDetails = {
        name: currentUserDisplayName,
        email: user?.email || '',
        upi_id: profile?.upi_id || ''
    };
    const debtorRoommate = roommates.find(r => r.name === debtorName);
    const debtorDetails = debtorRoommate 
        ? { name: debtorRoommate.name, email: debtorRoommate.email, upi_id: debtorRoommate.upi_id } 
        : { name: debtorName, email: 'unknown', upi_id: ''}; 

    const currentUserPerspective = { ...creditorDetails, type: 'owed' as const }; 
    const otherPartyPerspective = { ...debtorDetails, type: 'owes' as const };  

    try {
        const createdSettlement = await onAddSettlementPair(currentUserPerspective, otherPartyPerspective, absAmount);
        if (createdSettlement) {
            toast({
              title: "Payment Requested",
              description: `A payment request for ₹${absAmount.toFixed(2)} has been sent to ${debtorName}.`,
            });
        } else {
            console.error("Settlement pair creation failed for creditor request. Returned null.");
            throw new Error("Settlement pair creation failed.");
        }
        onExpenseUpdate(); 
    } catch (error) {
        console.error("Error in initiateCreditorRequestProcess:", error);
        toast({
            title: "Error Requesting Payment",
            description: `Could not request payment from ${debtorName}. Please try again. Details: ${error instanceof Error ? error.message : String(error)}`,
            variant: "destructive",
        });
    }
  };
  
  const handlePayClick = (upiId: string, amount: number) => {
    if (!upiId || amount <= 0) {
      console.error("Invalid UPI ID or amount for payment.");
      toast({ title: "Payment Error", description: "Invalid UPI ID or amount.", variant: "destructive" });
      return;
    }
    const paymentUrl = `https://quantxpay.vercel.app/${upiId}/${amount.toFixed(2)}`;
    window.open(paymentUrl, '_blank', 'noopener,noreferrer');
  };

  const lastExpenseDate = propsExpenses.length > 0 ? propsExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null;

  if (propsExpenses.length === 0 &&
      settlements.filter(s => s.status !== 'settled').length === 0 &&
      finalBalances.every(b => Math.abs(b.balance) < 0.01)) {
    return (
      <div className="text-center py-12">
        <IndianRupee className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
        <p className="text-gray-500">No outstanding expenses or pending settlements. Add a new expense to get started.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SummaryCards
        totalExpenses={totalExpenses}
        expenseCount={propsExpenses.length}
        lastExpenseDate={lastExpenseDate}
      />

      <BalanceList
        finalBalances={finalBalances}
        currentUserDisplayName={currentUserDisplayName}
        roommates={roommates}
        settlements={settlements}
        currentUserId={currentUserId}
        onDebtorMarksAsPaid={initiateDebtorPaymentProcess}
        onCreditorConfirmsReceipt={onUpdateStatus}
        onCreditorRequestsPayment={initiateCreditorRequestProcess}
        onPayViaUpi={handlePayClick}
      />

      <ChartsSection
        categoryData={categoryData}
        monthlyData={monthlyData}
        colors={COLORS}
      />

      <RecentExpensesList
        expenses={propsExpenses}
        currentUserDisplayName={currentUserDisplayName}
        allParticipantNames={allParticipantNames}
        userEmailPrefix={user?.email?.split('@')[0]}
        profileName={profile?.name}
        onDeleteExpense={handleDeleteExpense}
      />
    </div>
  );
};
