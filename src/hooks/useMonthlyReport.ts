import { useExpenses } from './useExpenses';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { useMemo } from 'react';
import { ShoppingListItem } from '@/types/shopping';
import { Settlement } from '@/types';
import { shoppingListService } from '@/services/shoppingListService';
import { fetchSettledTransactionsForMonth } from '@/services/settlementService';
import { supabase } from '@/integrations/supabase/client';

export interface MonthlyReportData {
    totalSpent: number;
    balance: number;
    expenseCount: number;
    categoryData: { name: string, value: number }[];
    month: number;
    year: number;
    userName: string;
    purchasedItems: ShoppingListItem[];
    moneySent: Settlement[];
    moneyReceived: Settlement[];
}

export const useMonthlyReport = () => {
    const { expenses } = useExpenses();
    const { user } = useAuth();
    const { profile } = useProfile();
    
    const currentUserEmail = user?.email;
    const currentUserEmailPrefix = useMemo(() => currentUserEmail?.split('@')[0], [currentUserEmail]);
    const currentUserProfileName = profile?.name;
    const currentUserDisplayName = useMemo(() => currentUserProfileName || currentUserEmailPrefix || 'You', [currentUserProfileName, currentUserEmailPrefix]);

    const isCurrentUser = (nameOrEmail: string) => {
        if (!nameOrEmail || !user) return false;
        // Check against email, display name from profile, and email prefix.
        const checks = [currentUserEmail, currentUserProfileName, currentUserEmailPrefix];
        return checks.filter(Boolean).includes(nameOrEmail);
    };

    const calculateReport = async (year: number, month: number): Promise<MonthlyReportData> => {
        const monthlyExpenses = expenses.filter(expense => {
            const expenseDate = new Date(expense.date);
            return expenseDate.getFullYear() === year && expenseDate.getMonth() === month;
        });

        const userExpenses = monthlyExpenses.filter(e => 
            isCurrentUser(e.paid_by) || e.sharers?.some(s => isCurrentUser(s)));

        const totalSpent = userExpenses
            .filter(e => isCurrentUser(e.paid_by))
            .reduce((sum, e) => sum + e.amount, 0);

        let userShare = 0;
        userExpenses.forEach(e => {
            if (e.sharers?.some(s => isCurrentUser(s))) {
                const numSharers = e.sharers?.length || 1;
                if (numSharers > 0) {
                    userShare += e.amount / numSharers;
                }
            }
        });
        
        const balance = totalSpent - userShare;

        const categoryData = userExpenses.reduce((acc, expense) => {
            const existing = acc.find(item => item.name === expense.category);
            if (existing) {
                existing.value += expense.amount;
            } else {
                acc.push({ name: expense.category, value: expense.amount });
            }
            return acc;
        }, [] as { name: string; value: number }[]);

        const purchasedItems = user ? await shoppingListService.fetchPurchasedItemsForMonth(user.id, year, month) : [];
        const settledTransactions = user ? await fetchSettledTransactionsForMonth(supabase, user.id, year, month) : [];

        const moneySent = settledTransactions.filter(t => t.type === 'owes');
        const moneyReceived = settledTransactions.filter(t => t.type === 'owed');

        return {
            totalSpent,
            balance,
            expenseCount: userExpenses.length,
            categoryData,
            month,
            year,
            userName: currentUserDisplayName,
            purchasedItems,
            moneySent,
            moneyReceived
        };
    };

    return { calculateReport };
};
