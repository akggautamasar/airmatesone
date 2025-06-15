
import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useRoommates } from '@/hooks/useRoommates';
import { format } from 'date-fns';

interface Settlement {
  id: string;
  expense_id: string;
  debtor_user_id: string;
  creditor_user_id: string;
  amount: number;
  status: string;
  marked_by_debtor: boolean;
  marked_by_creditor: boolean;
  settled_date: string | null;
  created_at: string;
  name: string;
  email: string;
  upi_id: string;
  type: string;
  user_id: string;
}

interface ExpenseDetails {
  id: string;
  description: string;
  date: string;
  category: string;
}

interface SettledSettlementsProps {
  settlements: Settlement[];
  expenseDetails: Record<string, ExpenseDetails>;
}

export const SettledSettlements = ({ settlements, expenseDetails }: SettledSettlementsProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { roommates } = useRoommates();

  const getUserDisplayName = (userId: string) => {
    if (userId === user?.id) {
      return profile?.name || user?.email?.split('@')[0] || 'You';
    }
    const roommate = roommates.find(r => r.user_id === userId);
    return roommate?.name || 'Unknown User';
  };

  if (settlements.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
          <p className="text-gray-500">No settled payments yet!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {settlements.map((settlement) => {
        const expense = expenseDetails[settlement.expense_id];
        const isCreditor = settlement.creditor_user_id === user?.id;
        
        const creditorName = getUserDisplayName(settlement.creditor_user_id);
        const debtorName = getUserDisplayName(settlement.debtor_user_id);

        return (
          <Card key={settlement.id} className="border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <h3 className="font-medium">
                      {expense?.description || 'Unknown Expense'}
                    </h3>
                    {expense?.category && (
                      <Badge variant="secondary">{expense.category}</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    {expense?.date && (
                      <div>Expense Date: {format(new Date(expense.date), 'PPP')}</div>
                    )}
                    
                    {settlement.settled_date && (
                      <div>Settled: {format(new Date(settlement.settled_date), 'PPP')}</div>
                    )}
                    
                    {isCreditor && (
                      <div className="text-green-600">
                        ✅ {debtorName} paid you ₹{settlement.amount.toFixed(2)}
                      </div>
                    )}
                    
                    {!isCreditor && (
                      <div className="text-blue-600">
                        ✅ You paid ₹{settlement.amount.toFixed(2)} to {creditorName}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-lg font-semibold text-green-600">
                    ₹{settlement.amount.toFixed(2)}
                  </div>
                  <div className="text-sm text-green-600">
                    Settled
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
