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
  onUpdateStatus: (transactionGroupId: string, status: string) => Promise<void>;
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
  
  const initiateSettlementProcess = async (
    debtorName: string, 
    creditorName: string, 
    amountToSettle: number,
    settleImmediately: boolean = false
  ) => {
    const absAmount = Math.abs(amountToSettle);
    if (absAmount < 0.01) return;

    const currentUserIsDebtor = debtorName === currentUserDisplayName;
    const currentUserIsCreditor = creditorName === currentUserDisplayName;

    const debtorRoommate = roommates.find(r => r.name === debtorName);
    const creditorRoommate = roommates.find(r => r.name === creditorName);

    const currentUserProfileDetails = {
        name: currentUserDisplayName,
        email: user?.email || '',
        upi_id: profile?.upi_id || ''
    };

    let debtorDetails, creditorDetails;

    if (currentUserIsDebtor) {
        debtorDetails = currentUserProfileDetails;
        creditorDetails = creditorRoommate ? { name: creditorRoommate.name, email: creditorRoommate.email, upi_id: creditorRoommate.upi_id } : { name: creditorName, email: 'unknown', upi_id: ''};
    } else if (currentUserIsCreditor) {
        creditorDetails = currentUserProfileDetails;
        debtorDetails = debtorRoommate ? { name: debtorRoommate.name, email: debtorRoommate.email, upi_id: debtorRoommate.upi_id } : { name: debtorName, email: 'unknown', upi_id: ''};
    } else {
        if (!debtorRoommate || !creditorRoommate) {
            toast({
                title: "Settlement Error",
                description: `Cannot initiate settlement between ${debtorName} and ${creditorName} as one or both are not registered roommates with full details.`,
                variant: "destructive",
            });
            return;
        }
        debtorDetails = { name: debtorRoommate.name, email: debtorRoommate.email, upi_id: debtorRoommate.upi_id };
        creditorDetails = { name: creditorRoommate.name, email: creditorRoommate.email, upi_id: creditorRoommate.upi_id };
    }
    
    let currentUserPerspective, otherPartyPerspective;

    if (currentUserIsDebtor) {
        currentUserPerspective = { ...debtorDetails, type: 'owes' as const };
        otherPartyPerspective = { ...creditorDetails, type: 'owed' as const };
    } else if (currentUserIsCreditor) {
        currentUserPerspective = { ...creditorDetails, type: 'owed' as const };
        otherPartyPerspective = { ...debtorDetails, type: 'owes' as const };
    } else {
        console.warn("Settlement initiation between two other parties not fully supported by this UI path in ExpenseOverview. Ensure onAddSettlementPair can handle this or adjust UI flow.");
        toast({
            title: "Mediation Not Supported",
            description: "Directly settling between two other roommates from this screen is not fully supported yet. Please manage such settlements individually or via Settlement History if applicable.",
            variant: "default"
         });
        return; 
    }
    
    const createdSettlement = await onAddSettlementPair(currentUserPerspective, otherPartyPerspective, absAmount);
    
    if (createdSettlement && settleImmediately && createdSettlement.transaction_group_id) {
      try {
        await onUpdateStatus(createdSettlement.transaction_group_id, 'settled');
        toast({
          title: "Balance Settled",
          description: `The balance with ${creditorName === currentUserDisplayName ? debtorName : creditorName} has been marked as settled.`,
        });
      } catch (error) {
        console.error("Error directly settling balance:", error);
        toast({
          title: "Settlement Error",
          description: "Could not immediately mark the balance as settled. Please check Settlement History.",
          variant: "destructive",
        });
      }
    } else if (createdSettlement && !settleImmediately) {
        toast({
          title: "Settlement Initiated",
          description: `A settlement process has been initiated with ${creditorName === currentUserDisplayName ? debtorName : creditorName}. Check Settlement History.`,
        });
    }
    onExpenseUpdate(); 
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
        settlements={settlements}
        currentUserId={currentUserId}
        onInitiateSettlement={initiateSettlementProcess}
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
