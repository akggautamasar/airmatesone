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
  onDeleteSettlementGroup
}: ExpenseOverviewProps) => {
  const { deleteExpense } = useExpenses();
  const { roommates } = useRoommates();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const currentUserDisplayName = useMemo(() => {
    return profile?.name || user?.email?.split('@')[0] || 'You';
  }, [profile, user]);

  const allParticipantNames = useMemo(() => {
    const names = new Set<string>([currentUserDisplayName]);
    roommates.forEach(r => names.add(r.name));
    if (propsExpenses.length > 0) {
        propsExpenses.forEach(e => {
            const payerDisplayName = e.paidBy === user?.email?.split('@')[0] || e.paidBy === profile?.name ? currentUserDisplayName : e.paidBy;
            if (payerDisplayName !== currentUserDisplayName && !roommates.find(rm => rm.name === payerDisplayName)) names.add(payerDisplayName);
        });
        propsExpenses.forEach(e => e.sharers?.forEach(s => {
            const sharerDisplayName = s === user?.email?.split('@')[0] || s === profile?.name ? currentUserDisplayName : s;
            if (sharerDisplayName !== currentUserDisplayName && !roommates.find(rm => rm.name === sharerDisplayName)) names.add(sharerDisplayName);
        }));
    }
    return Array.from(names);
  }, [currentUserDisplayName, roommates, propsExpenses, user, profile]);

  const calculations = useMemo(() => {
    const totalExpensesValue = propsExpenses.reduce((sum, expense) => sum + expense.amount, 0);
    let finalBalancesArray: { name: string; balance: number }[] = [];

    if (propsExpenses.length === 0) {
        // No expenses: all participant balances are zero for the overview.
        finalBalancesArray = allParticipantNames.map(name => ({ name, balance: 0 }));
    } else {
        // Expenses exist: calculate balances from expenses and apply *settled* settlements.
        const balanceMap = new Map<string, number>();
        allParticipantNames.forEach(name => balanceMap.set(name, 0));

        // Process expenses
        propsExpenses.forEach(expense => {
            const payerName = expense.paidBy === user?.email?.split('@')[0] || expense.paidBy === profile?.name ? currentUserDisplayName : expense.paidBy;
            if (balanceMap.has(payerName)) { // Ensure payer is in the map
                 balanceMap.set(payerName, (balanceMap.get(payerName) || 0) + expense.amount);
            } else if (allParticipantNames.includes(payerName)) { // Payer might not be a roommate but part of allParticipantNames
                 balanceMap.set(payerName, expense.amount);
            }


            const effectiveSharers = expense.sharers && expense.sharers.length > 0
              ? expense.sharers.map(s => s === user?.email?.split('@')[0] || s === profile?.name ? currentUserDisplayName : s)
              : allParticipantNames;

            const numSharers = effectiveSharers.length;

            if (numSharers > 0) {
              const amountPerSharer = expense.amount / numSharers;
              effectiveSharers.forEach(sharerName => {
                 if (balanceMap.has(sharerName)) { // Ensure sharer is in the map
                    balanceMap.set(sharerName, (balanceMap.get(sharerName) || 0) - amountPerSharer);
                 } else if (allParticipantNames.includes(sharerName)) { // Sharer might not be a roommate
                    balanceMap.set(sharerName, -amountPerSharer);
                 }
              });
            }
        });

        // Apply *settled* transactions to adjust expense-driven balances
        settlements.forEach(settlement => {
            if (settlement.status === 'settled') {
              let debtorName: string | undefined;
              let creditorName: string | undefined;
              const settlementOwnerIsCurrentUser = settlement.user_id === currentUserId;

              if (settlementOwnerIsCurrentUser) {
                  if (settlement.type === 'owes') {
                      debtorName = currentUserDisplayName;
                      creditorName = settlement.name;
                  } else {
                      debtorName = settlement.name;
                      creditorName = currentUserDisplayName;
                  }
              } else {
                  const ownerProfile = roommates.find(r => r.user_id === settlement.user_id);
                  const ownerDisplayName = ownerProfile?.name || `User ${settlement.user_id.substring(0,5)}`;
                  if (settlement.type === 'owes') {
                      debtorName = ownerDisplayName;
                      creditorName = (settlement.name === user?.email || settlement.name === profile?.name) ? currentUserDisplayName : settlement.name;
                  } else {
                      debtorName = (settlement.name === user?.email || settlement.name === profile?.name) ? currentUserDisplayName : settlement.name;
                      creditorName = ownerDisplayName;
                  }
              }
              
              // Ensure names from settlements are part of allParticipantNames before adjusting map
              // And ensure they are in balanceMap (which should be true if they are in allParticipantNames)
              if (debtorName && allParticipantNames.includes(debtorName) && balanceMap.has(debtorName)) {
                  balanceMap.set(debtorName, (balanceMap.get(debtorName) || 0) + settlement.amount);
              }
              if (creditorName && allParticipantNames.includes(creditorName) && balanceMap.has(creditorName)) {
                  balanceMap.set(creditorName, (balanceMap.get(creditorName) || 0) - settlement.amount);
              }
            }
        });

        allParticipantNames.forEach(name => { // Ensure all participants have an entry, even if 0
            if (balanceMap.has(name)) {
                 finalBalancesArray.push({ name, balance: parseFloat(balanceMap.get(name)!.toFixed(2)) });
            } else {
                 finalBalancesArray.push({ name, balance: 0 });
            }
        });
         // Sort to ensure consistent order if needed, or remove if order doesn't matter / set by allParticipantNames
        finalBalancesArray.sort((a, b) => allParticipantNames.indexOf(a.name) - allParticipantNames.indexOf(b.name));
    }

    return {
      totalExpenses: totalExpensesValue,
      finalBalances: finalBalancesArray
    };
  }, [propsExpenses, allParticipantNames, currentUserDisplayName, settlements, roommates, profile, currentUserId, user]);

  const categoryData = useMemo(() => propsExpenses.reduce((acc, expense) => {
    const existing = acc.find(item => item.name === expense.category);
    if (existing) {
      existing.value += expense.amount;
    } else {
      acc.push({ name: expense.category, value: expense.amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]), [propsExpenses]);

  const monthlyData = useMemo(() => propsExpenses.reduce((acc, expense) => {
    const dateObj = new Date(expense.date); 
    const month = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Invalid Date";

    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += expense.amount;
    } else {
      acc.push({ month, amount: expense.amount });
    }
    return acc;
  }, [] as { month: string; amount: number }[]), [propsExpenses]);

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
    _debtorNameIgnored: string, // This will be currentUserDisplayName, passed from BalanceList
    creditorName: string, 
    amountToSettle: number
  ) => {
    const absAmount = Math.abs(amountToSettle);
    if (absAmount < 0.01) return;

    // 'settlements' prop contains only the current user's (debtor's) settlement records.
    // Find an existing 'pending' settlement initiated by the current user (debtor) to this creditor.
    const existingPendingSettlement = settlements.find(s => 
      s.name === creditorName && // Other party is the creditor
      s.type === 'owes' &&       // Current user owes them
      s.status === 'pending' &&  // It's currently pending
      s.transaction_group_id
      // Optional: && Math.abs(s.amount - absAmount) < 0.01 // if matching amount is desired
    );

    let targetTransactionGroupId: string | undefined = existingPendingSettlement?.transaction_group_id;

    if (!existingPendingSettlement) {
      // No existing 'pending' settlement from debtor to creditor, so create one.
      // onAddSettlementPair will create a new pair with status 'pending'.
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

    // Now, update the status of the target settlement group to 'debtor_paid'
    if (targetTransactionGroupId) {
      console.log(`Updating transaction_group_id ${targetTransactionGroupId} to 'debtor_paid'.`);
      await onUpdateStatus(targetTransactionGroupId, 'debtor_paid');
      toast({
        title: "Payment Marked as Paid",
        description: `Your payment to ${creditorName} for ₹${absAmount.toFixed(2)} has been marked. ${creditorName} will be notified to confirm.`,
      });
    } else {
      // This case should ideally not be reached if logic above is correct
      console.error("Failed to obtain transaction_group_id for updating status to debtor_paid. This indicates an issue in finding or creating settlement.");
      toast({
          title: "Error Marking Payment",
          description: "Could not mark payment due to an internal error (missing transaction ID).",
          variant: "destructive",
      });
    }
    onExpenseUpdate(); // Refetch data
  };

  const initiateCreditorRequestProcess = async (
    debtorName: string,
    _creditorNameIgnored: string, // This will be currentUserDisplayName
    amountToSettle: number
  ) => {
    const absAmount = Math.abs(amountToSettle);
    if (absAmount < 0.01) return;
    
    // 'settlements' prop contains only the current user's (creditor's) settlement records.
    // Check if current user (creditor) already has a 'pending' settlement TO this debtor.
    const existingPendingRequest = settlements.find(s => 
      s.name === debtorName && // Other party is the debtor
      s.type === 'owed' &&      // Current user is owed by them (creditor's perspective)
      s.status === 'pending'
      // Optional: && Math.abs(s.amount - absAmount) < 0.01 // if matching amount is desired
    );

    if (existingPendingRequest) {
      console.log(`Creditor (${currentUserDisplayName}) attempting to request payment from ${debtorName}. Existing pending request found.`);
      toast({
        title: "Payment Already Requested",
        description: `You've already requested ₹${absAmount.toFixed(2)} from ${debtorName}. It's currently marked as pending.`,
      });
      return; // Do not create a duplicate pending request
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

    const currentUserPerspective = { ...creditorDetails, type: 'owed' as const }; // Creditor is owed
    const otherPartyPerspective = { ...debtorDetails, type: 'owes' as const };   // Debtor owes

    try {
        // onAddSettlementPair should create settlements with 'pending' status by default
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

  // Condition for "All Clear!" message:
  // No expenses, no pending/active settlements, and calculated final balances are all effectively zero.
  // With the new logic, if propsExpenses.length === 0, calculations.finalBalances will be all zeros.
  if (propsExpenses.length === 0 && 
      settlements.filter(s => s.status !== 'settled').length === 0 && 
      calculations.finalBalances.every(b => Math.abs(b.balance) < 0.01)) {
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
        totalExpenses={calculations.totalExpenses}
        expenseCount={propsExpenses.length}
        lastExpenseDate={lastExpenseDate}
      />

      <BalanceList
        finalBalances={calculations.finalBalances}
        currentUserDisplayName={currentUserDisplayName}
        roommates={roommates}
        settlements={settlements} // This is current user's settlements
        currentUserId={currentUserId}
        onDebtorMarksAsPaid={initiateDebtorPaymentProcess} // Updated
        onCreditorConfirmsReceipt={onUpdateStatus} 
        onCreditorRequestsPayment={initiateCreditorRequestProcess} // Updated
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
