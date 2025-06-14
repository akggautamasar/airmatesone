
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { IndianRupee, Trash2 } from "lucide-react";

interface Expense {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  date: string;
  category: string;
  sharers?: string[] | null;
}

interface RecentExpensesListProps {
  expenses: Expense[];
  currentUserDisplayName: string;
  allParticipantNames: string[];
  userEmailPrefix: string | undefined;
  profileName: string | undefined;
  onDeleteExpense: (expenseId: string) => Promise<void>;
}

export const RecentExpensesList: React.FC<RecentExpensesListProps> = ({
  expenses,
  currentUserDisplayName,
  allParticipantNames,
  userEmailPrefix,
  profileName,
  onDeleteExpense,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Expenses</CardTitle>
        <CardDescription>Your latest spending activity.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {expenses.slice(0, 5).map((expense) => (
            <div key={expense.id} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center space-x-4">
                <div className="rounded-full bg-blue-100 p-2">
                  <IndianRupee className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">{expense.description}</p>
                  <p className="text-sm text-muted-foreground">
                    Paid by {expense.paidBy === userEmailPrefix || expense.paidBy === profileName ? currentUserDisplayName : expense.paidBy} • {new Date(expense.date).toLocaleDateString()} • {expense.category}
                    {expense.sharers && expense.sharers.length > 0 && expense.sharers.length < allParticipantNames.length ? (
                      <span className="block text-xs">Shared with: {expense.sharers.map(s => s === userEmailPrefix || s === profileName ? currentUserDisplayName : s).join(', ')}</span>
                    ) : (
                      <span className="block text-xs">Shared with: All</span>
                    )}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <span className="font-semibold">₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete "{expense.description}"? This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction onClick={() => onDeleteExpense(expense.id)}>
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          ))}
          {expenses.length === 0 && (
               <div className="text-center py-8 text-muted-foreground">
                  <p>No recent expenses to show.</p>
              </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
