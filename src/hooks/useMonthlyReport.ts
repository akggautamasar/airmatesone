
import { useExpenses } from './useExpenses';
import { useAuth } from './useAuth';
import { useProfile } from './useProfile';
import { useMemo } from 'react';

export interface MonthlyReportData {
    totalSpent: number;
    balance: number;
    expenseCount: number;
    categoryData: { name: string, value: number }[];
    month: number;
    year: number;
    userName: string;
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

    const calculateReport = (year: number, month: number): MonthlyReportData => {
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

        return {
            totalSpent,
            balance,
            expenseCount: userExpenses.length,
            categoryData,
            month,
            year,
            userName: currentUserDisplayName
        };
    };

    return { calculateReport };
};
