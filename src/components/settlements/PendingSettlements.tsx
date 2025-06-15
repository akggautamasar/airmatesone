
import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IndianRupee, ExternalLink, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { useRoommates } from '@/hooks/useRoommates';
import { useToast } from '@/hooks/use-toast';
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

interface PendingSettlementsProps {
  settlements: Settlement[];
  expenseDetails: Record<string, ExpenseDetails>;
  onUpdate: () => void;
}

export const PendingSettlements = ({ settlements, expenseDetails, onUpdate }: PendingSettlementsProps) => {
  const { user } = useAuth();
  const { profile } = useProfile();
  const { roommates } = useRoommates();
  const { toast } = useToast();

  const handleMarkAsReceived = async (settlementId: string) => {
    try {
      const { error } = await supabase
        .from('settlements')
        .update({ 
          status: 'settled',
          marked_by_creditor: true,
          settled_date: new Date().toISOString()
        })
        .eq('id', settlementId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment marked as received!",
      });
      onUpdate();
    } catch (error: any) {
      console.error('Error updating settlement:', error);
      toast({
        title: "Error",
        description: "Failed to mark as received.",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (settlementId: string) => {
    try {
      const { error } = await supabase
        .from('settlements')
        .update({ 
          status: 'settled',
          marked_by_debtor: true,
          settled_date: new Date().toISOString()
        })
        .eq('id', settlementId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Payment marked as paid!",
      });
      onUpdate();
    } catch (error: any) {
      console.error('Error updating settlement:', error);
      toast({
        title: "Error",
        description: "Failed to mark as paid.",
        variant: "destructive",
      });
    }
  };

  const getUserDisplayName = (userId: string) => {
    if (userId === user?.id) {
      return profile?.name || user?.email?.split('@')[0] || 'You';
    }
    const roommate = roommates.find(r => r.user_id === userId);
    return roommate?.name || 'Unknown User';
  };

  const getCreditorUpiId = (settlement: Settlement) => {
    console.log('Getting UPI ID for settlement:', settlement);
    console.log('Settlement UPI ID from DB:', settlement.upi_id);
    
    // The settlement.upi_id should contain the creditor's UPI ID
    // This is set when the settlement is created by the trigger function
    if (settlement.upi_id) {
      console.log('Using UPI ID from settlement record:', settlement.upi_id);
      return settlement.upi_id;
    }
    
    // Fallback: if creditor is current user, get from profile
    if (settlement.creditor_user_id === user?.id) {
      console.log('Creditor is current user, using profile UPI:', profile?.upi_id);
      return profile?.upi_id || '';
    }
    
    // Fallback: try to find in roommates
    const creditorRoommate = roommates.find(r => r.user_id === settlement.creditor_user_id);
    console.log('Found creditor roommate:', creditorRoommate);
    return creditorRoommate?.upi_id || '';
  };

  if (settlements.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <IndianRupee className="h-12 w-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-500">No pending settlements!</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {settlements.map((settlement) => {
        const expense = expenseDetails[settlement.expense_id];
        const isCreditor = settlement.creditor_user_id === user?.id;
        const isDebtor = settlement.debtor_user_id === user?.id;
        
        const creditorName = getUserDisplayName(settlement.creditor_user_id);
        const debtorName = getUserDisplayName(settlement.debtor_user_id);
        
        // Get the creditor's UPI ID properly
        const creditorUpiId = getCreditorUpiId(settlement);

        console.log('Settlement:', settlement.id);
        console.log('Is Creditor:', isCreditor, 'Is Debtor:', isDebtor);
        console.log('Creditor User ID:', settlement.creditor_user_id);
        console.log('Debtor User ID:', settlement.debtor_user_id);
        console.log('Current User ID:', user?.id);
        console.log('Final Creditor UPI ID:', creditorUpiId);

        return (
          <Card key={settlement.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-medium">
                      {expense?.description || 'Unknown Expense'}
                    </h3>
                    {expense?.category && (
                      <Badge variant="secondary">{expense.category}</Badge>
                    )}
                  </div>
                  
                  <div className="space-y-1 text-sm text-gray-600">
                    {expense?.date && (
                      <div>Date: {format(new Date(expense.date), 'PPP')}</div>
                    )}
                    
                    {isCreditor && (
                      <div className="text-green-600">
                        {debtorName} owes you ₹{settlement.amount.toFixed(2)}
                      </div>
                    )}
                    
                    {isDebtor && (
                      <div className="text-red-600">
                        You owe ₹{settlement.amount.toFixed(2)} to {creditorName}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex flex-col gap-2">
                  <div className="text-right">
                    <div className="text-lg font-semibold">
                      ₹{settlement.amount.toFixed(2)}
                    </div>
                  </div>
                  
                  {isCreditor && (
                    <Button
                      size="sm"
                      onClick={() => handleMarkAsReceived(settlement.id)}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <Check className="h-4 w-4 mr-1" />
                      Mark as Received
                    </Button>
                  )}
                  
                  {isDebtor && (
                    <div className="space-y-2">
                      {creditorUpiId && (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                        >
                          <a
                            href={`https://quantxpay.vercel.app/${creditorUpiId}/${settlement.amount}`}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-1" />
                            Pay to {creditorName}
                          </a>
                        </Button>
                      )}
                      
                      <Button
                        size="sm"
                        onClick={() => handleMarkAsPaid(settlement.id)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Check className="h-4 w-4 mr-1" />
                        Mark as Paid
                      </Button>
                    </div>
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
