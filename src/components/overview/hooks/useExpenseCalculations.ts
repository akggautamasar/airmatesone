
import { useMemo } from 'react';
import { User } from '@supabase/supabase-js';
import { Settlement as DetailedSettlement } from "@/components/SettlementHistory";

// Define the Expense type as it's used internally for calculations
interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
  category: string;
  sharers?: string[] | null;
}

// Use the actual types from the hooks instead of Tables<'profiles'>
interface Roommate {
  id: string;
  name: string;
  upi_id: string;
  email: string;
  phone?: string;
  balance: number;
  user_id: string;
}

interface ProfileData {
  id: string;
  name: string | null;
  upi_id: string | null;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
}

interface UseExpenseCalculationsProps {
  expenses: Expense[];
  currentUserDisplayName: string;
  settlements: DetailedSettlement[];
  roommates: Roommate[];
  profile: ProfileData | null;
  currentUserId: string | undefined;
  user: User | null;
}

interface ExpenseCalculationsResult {
  allParticipantNames: string[];
  totalExpenses: number;
  finalBalances: { name: string; balance: number }[];
  categoryData: { name: string; value: number }[];
  monthlyData: { month: string; amount: number }[];
}

export const useExpenseCalculations = ({
  expenses,
  currentUserDisplayName,
  settlements,
  roommates,
  profile,
  currentUserId,
  user,
}: UseExpenseCalculationsProps): ExpenseCalculationsResult => {

  const allParticipantNames = useMemo(() => {
    const names = new Set<string>([currentUserDisplayName]);
    // Always include all roommates
    roommates.forEach(r => names.add(r.name));
    
    // Add any additional participants from expenses who aren't already roommates
    if (expenses.length > 0) {
        expenses.forEach(e => {
            const payerDisplayName = e.paidBy === user?.email?.split('@')[0] || e.paidBy === profile?.name ? currentUserDisplayName : e.paidBy;
            if (payerDisplayName !== currentUserDisplayName && !roommates.find(rm => rm.name === payerDisplayName)) names.add(payerDisplayName);
        });
        expenses.forEach(e => e.sharers?.forEach(s => {
            const sharerDisplayName = s === user?.email?.split('@')[0] || s === profile?.name ? currentUserDisplayName : s;
            if (sharerDisplayName !== currentUserDisplayName && !roommates.find(rm => rm.name === sharerDisplayName)) names.add(sharerDisplayName);
        }));
    }
    return Array.from(names);
  }, [currentUserDisplayName, roommates, expenses, user, profile]);

  const calculations = useMemo(() => {
    const totalExpensesValue = expenses.reduce((sum, expense) => sum + expense.amount, 0);
    
    // Initialize balance map for ALL participants (including roommates who haven't paid anything)
    const balanceMap = new Map<string, number>();
    allParticipantNames.forEach(name => balanceMap.set(name, 0));

    // Calculate expenses - what each person paid and owes
    expenses.forEach(expense => {
        const payerName = expense.paidBy === user?.email?.split('@')[0] || expense.paidBy === profile?.name ? currentUserDisplayName : expense.paidBy;
        
        // Add to what they paid (credit)
        if (balanceMap.has(payerName)) {
             balanceMap.set(payerName, (balanceMap.get(payerName) || 0) + expense.amount);
        } else if (allParticipantNames.includes(payerName)) {
             balanceMap.set(payerName, expense.amount);
        }

        // Calculate what each person owes for this expense (debit)
        const effectiveSharers = expense.sharers && expense.sharers.length > 0
          ? expense.sharers.map(s => s === user?.email?.split('@')[0] || s === profile?.name ? currentUserDisplayName : s)
          : allParticipantNames;

        const numSharers = effectiveSharers.length;

        if (numSharers > 0) {
          const amountPerSharer = expense.amount / numSharers;
          effectiveSharers.forEach(sharerName => {
             if (balanceMap.has(sharerName)) {
                balanceMap.set(sharerName, (balanceMap.get(sharerName) || 0) - amountPerSharer);
             } else if (allParticipantNames.includes(sharerName)) {
                balanceMap.set(sharerName, -amountPerSharer);
             }
          });
        }
    });

    // Apply settled settlements to adjust balances
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
          
          // Apply settlement: debtor gets positive adjustment (reduces their debt), creditor gets negative (reduces what they're owed)
          if (debtorName && allParticipantNames.includes(debtorName) && balanceMap.has(debtorName)) {
              balanceMap.set(debtorName, (balanceMap.get(debtorName) || 0) + settlement.amount);
          }
          if (creditorName && allParticipantNames.includes(creditorName) && balanceMap.has(creditorName)) {
              balanceMap.set(creditorName, (balanceMap.get(creditorName) || 0) - settlement.amount);
          }
        }
    });

    // Convert to final balances array
    const finalBalancesArray: { name: string; balance: number }[] = [];
    allParticipantNames.forEach(name => {
        if (balanceMap.has(name)) {
             finalBalancesArray.push({ name, balance: parseFloat(balanceMap.get(name)!.toFixed(2)) });
        } else {
             finalBalancesArray.push({ name, balance: 0 });
        }
    });
    
    // Sort to maintain consistent order
    finalBalancesArray.sort((a, b) => allParticipantNames.indexOf(a.name) - allParticipantNames.indexOf(b.name));

    return {
      totalExpenses: totalExpensesValue,
      finalBalances: finalBalancesArray
    };
  }, [expenses, allParticipantNames, currentUserDisplayName, settlements, roommates, profile, currentUserId, user]);

  const categoryData = useMemo(() => expenses.reduce((acc, expense) => {
    const existing = acc.find(item => item.name === expense.category);
    if (existing) {
      existing.value += expense.amount;
    } else {
      acc.push({ name: expense.category, value: expense.amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]), [expenses]);

  const monthlyData = useMemo(() => expenses.reduce((acc, expense) => {
    const dateObj = new Date(expense.date);
    const month = !isNaN(dateObj.getTime()) ? dateObj.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : "Invalid Date";

    const existing = acc.find(item => item.month === month);
    if (existing) {
      existing.amount += expense.amount;
    } else {
      acc.push({ month, amount: expense.amount });
    }
    return acc;
  }, [] as { month: string; amount: number }[]), [expenses]);

  return {
    allParticipantNames,
    totalExpenses: calculations.totalExpenses,
    finalBalances: calculations.finalBalances,
    categoryData,
    monthlyData,
  };
};
