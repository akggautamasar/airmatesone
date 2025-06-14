
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

  // Calculate net expenses for each participant
  const netExpenses = useMemo(() => {
    const expenseMap = new Map<string, { paid: number; owes: number }>();
    
    // Initialize all participants
    allParticipantNames.forEach(name => {
      expenseMap.set(name, { paid: 0, owes: 0 });
    });

    // Calculate what each person paid and owes
    propsExpenses.forEach(expense => {
      const payerName = expense.paidBy === user?.email?.split('@')[0] || expense.paidBy === profile?.name 
        ? currentUserDisplayName 
        : expense.paidBy;
      
      // Add to what they paid
      if (expenseMap.has(payerName)) {
        const current = expenseMap.get(payerName)!;
        expenseMap.set(payerName, { ...current, paid: current.paid + expense.amount });
      }

      // Calculate what each person owes for this expense
      const effectiveSharers = expense.sharers && expense.sharers.length > 0
        ? expense.sharers.map(s => s === user?.email?.split('@')[0] || s === profile?.name ? currentUserDisplayName : s)
        : allParticipantNames;

      const amountPerSharer = expense.amount / effectiveSharers.length;
      effectiveSharers.forEach(sharerName => {
        if (expenseMap.has(sharerName)) {
          const current = expenseMap.get(sharerName)!;
          expenseMap.set(sharerName, { ...current, owes: current.owes + amountPerSharer });
        }
      });
    });

    // Apply settled settlements to reduce net amounts
    settlements.filter(s => s.status === 'settled').forEach(settlement => {
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

      // Reduce the debt by the settled amount
      if (debtorName && expenseMap.has(debtorName)) {
        const current = expenseMap.get(debtorName)!;
        expenseMap.set(debtorName, { ...current, owes: Math.max(0, current.owes - settlement.amount) });
      }
    });

    // Convert to array with net expenses
    return Array.from(expenseMap.entries()).map(([name, amounts]) => ({
      name,
      netExpense: parseFloat((amounts.paid - amounts.owes).toFixed(2)),
      totalPaid: amounts.paid,
      totalOwes: amounts.owes
    }));
  }, [propsExpenses, allParticipantNames, currentUserDisplayName, settlements, roommates, profile, currentUserId, user]);

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

      {/* Net Expenses Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Net Expenses Overview</CardTitle>
          <CardDescription>Each person's net contribution after all expenses and settlements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {netExpenses.map((person, index) => (
            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-gray-50 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className={`rounded-full p-2 ${person.netExpense > 0 ? 'bg-green-100' : person.netExpense < 0 ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <Users className={`h-4 w-4 ${person.netExpense > 0 ? 'text-green-600' : person.netExpense < 0 ? 'text-red-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className="font-medium">{person.name}{person.name === currentUserDisplayName ? " (You)" : ""}</p>
                  <p className="text-sm text-gray-600">
                    Paid: ₹{person.totalPaid.toFixed(2)} | Share: ₹{person.totalOwes.toFixed(2)}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <Badge variant={person.netExpense > 0 ? "default" : person.netExpense < 0 ? "destructive" : "secondary"} className={`${person.netExpense > 0 ? 'bg-green-500 hover:bg-green-600' : ''} whitespace-nowrap`}>
                  {person.netExpense === 0 ? "Even" :
                    person.netExpense > 0 ? `Net Paid ₹${person.netExpense.toFixed(2)}` :
                      `Net Owes ₹${Math.abs(person.netExpense).toFixed(2)}`}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

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
