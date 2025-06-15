import React, { useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { IndianRupee } from "lucide-react";
import { useExpenses } from "@/hooks/useExpenses";
import { useRoommates } from "@/hooks/useRoommates";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { Settlement as DetailedSettlement } from "@/components/SettlementHistory";
import { useToast } from "@/components/ui/use-toast";
import { useExpenseCalculations } from "./overview/hooks/useExpenseCalculations";

import { SummaryCards } from "./overview/SummaryCards";
import { ChartsSection } from "./overview/ChartsSection";
import { RecentExpensesList } from "./overview/RecentExpensesList";
import { BalanceList } from './overview/BalanceList';

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
    amount: number,
    initialStatus?: 'pending' | 'debtor_paid' | 'settled'
  ) => Promise<DetailedSettlement | null>;
  currentUserId: string | undefined;
  onUpdateStatus: (transactionGroupId: string, newStatus: "pending" | "debtor_paid" | "settled") => Promise<void>;
  onDeleteSettlementGroup?: (transactionGroupId: string) => Promise<void>;
}

export const ExpenseOverview = ({
  expenses: propsExpenses,
  onExpenseUpdate,
  settlements,
  onAddSettlementPair,
  currentUserId,
  onUpdateStatus,
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

  const handlePayViaUpi = (upiId: string, amount: number) => {
    const memo = `Payment for shared expenses`;
    const upiUrl = `upi://pay?pa=${upiId}&am=${amount.toFixed(2)}&tn=${encodeURIComponent(memo)}`;
    window.open(upiUrl, '_blank');
    toast({
      title: "Opening UPI App",
      description: "If it doesn't open, please check if you have a UPI app installed."
    });
  };

  const handleDebtorMarksAsPaid = async (debtorName: string, creditorName: string, amountToSettle: number, initialStatus: 'pending' | 'debtor_paid' | 'settled' = 'debtor_paid') => {
    const currentUserIsDebtor = debtorName === currentUserDisplayName;
    const isPartOfTransaction = currentUserIsDebtor || creditorName === currentUserDisplayName;

    if (!isPartOfTransaction) {
        toast({ title: "Error", description: "You are not part of this transaction.", variant: "destructive" });
        return;
    }

    const currentUserInfo = {
      name: currentUserDisplayName,
      email: user?.email || '',
      upi_id: profile?.upi_id || ''
    };
    
    const otherPartyName = currentUserIsDebtor ? creditorName : debtorName;
    const otherPartyRoommateInfo = roommates.find(r => r.name === otherPartyName);
    
    if (!otherPartyRoommateInfo) {
      toast({ title: "Error", description: `Could not find details for ${otherPartyName}`, variant: "destructive" });
      return;
    }
    const otherPartyDetails = {
      name: otherPartyRoommateInfo.name,
      email: otherPartyRoommateInfo.email,
      upi_id: otherPartyRoommateInfo.upi_id || ''
    };

    await onAddSettlementPair(
      { ...currentUserInfo, type: currentUserIsDebtor ? 'owes' : 'owed' },
      { ...otherPartyDetails, type: currentUserIsDebtor ? 'owed' : 'owes' },
      amountToSettle,
      initialStatus
    );
    onExpenseUpdate();
  };

  const handleCreditorConfirmsReceipt = async (transactionGroupId: string) => {
    await onUpdateStatus(transactionGroupId, 'settled');
  };

  const lastExpenseDate = propsExpenses.length > 0 ? propsExpenses.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0].date : null;

  if (propsExpenses.length === 0 && settlements.filter(s => s.status !== 'settled').length === 0) {
    return (
      <div className="text-center py-12">
        <IndianRupee className="h-16 w-16 mx-auto text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">All Clear!</h3>
        <p className="text-gray-500">No expenses or pending settlements. Add a new expense to get started.</p>
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
        onDebtorMarksAsPaid={handleDebtorMarksAsPaid}
        onCreditorConfirmsReceipt={handleCreditorConfirmsReceipt}
        onCreditorRequestsPayment={async () => {
          // This feature is not requested. Can be added later.
          console.log("Request payment clicked");
        }}
        onPayViaUpi={handlePayViaUpi}
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
