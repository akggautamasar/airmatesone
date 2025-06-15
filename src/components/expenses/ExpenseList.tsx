
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IndianRupee, Calendar, Users, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface Expense {
  id: string;
  description: string;
  amount: number;
  paid_by: string;
  date: string;
  category: string;
  sharers?: string[] | null;
  user_id: string;
}

interface ExpenseListProps {
  expenses: Expense[];
  onExpenseDeleted?: () => void;
}

export const ExpenseList = ({ expenses, onExpenseDeleted }: ExpenseListProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { toast } = useToast();

  const currentUserDisplayName = profile?.name || user?.email?.split('@')[0] || 'You';

  const handleDeleteExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) {
        console.error('Error deleting expense:', error);
        toast({
          title: "Error",
          description: "Failed to delete expense. Please try again.",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success",
        description: "Expense deleted successfully.",
      });

      if (onExpenseDeleted) {
        onExpenseDeleted();
      }
    } catch (error) {
      console.error('Error deleting expense:', error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while deleting the expense.",
        variant: "destructive",
      });
    }
  };

  if (expenses.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <IndianRupee className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No expenses yet. Add your first expense!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {expenses.map((expense) => {
        const paidByDisplay = expense.paid_by === user?.email ? currentUserDisplayName : expense.paid_by;
        const sharersDisplay = expense.sharers?.map(sharer => 
          sharer === user?.email ? currentUserDisplayName : sharer
        ).join(', ') || 'Everyone';
        
        const userShare = expense.sharers && expense.sharers.length > 0 
          ? expense.amount / expense.sharers.length 
          : 0;

        const isPayer = expense.paid_by === user?.email;
        const isSharer = expense.sharers?.includes(user?.email || '');
        const canDelete = expense.user_id === user?.id; // Only creator can delete

        return (
          <Card key={expense.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">{expense.description}</h3>
                    <Badge variant="secondary">{expense.category}</Badge>
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      <span>{format(new Date(expense.date), 'PPP')}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <IndianRupee className="h-4 w-4" />
                      <span>₹{expense.amount.toFixed(2)} paid by {paidByDisplay}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Split with: {sharersDisplay}</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right flex flex-col items-end gap-2">
                  <div className="text-lg font-semibold">
                    ₹{expense.amount.toFixed(2)}
                  </div>
                  
                  {isPayer && isSharer && (
                    <div className="text-sm text-green-600">
                      You paid ₹{(expense.amount - userShare).toFixed(2)} extra
                    </div>
                  )}
                  
                  {isPayer && !isSharer && (
                    <div className="text-sm text-green-600">
                      You are owed ₹{expense.amount.toFixed(2)}
                    </div>
                  )}
                  
                  {!isPayer && isSharer && (
                    <div className="text-sm text-red-600">
                      You owe ₹{userShare.toFixed(2)}
                    </div>
                  )}
                  
                  {!isPayer && !isSharer && (
                    <div className="text-sm text-gray-500">
                      Not involved
                    </div>
                  )}

                  {canDelete && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Expense</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete this expense? This will also remove all related settlements. This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteExpense(expense.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
