import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, BadgeCheck, Send, CircleCheck } from "lucide-react";
import { Settlement as DetailedSettlement } from "@/components/SettlementHistory";

interface Roommate {
  id: string;
  name: string;
  email: string;
  upi_id: string;
  user_id: string;
}

interface BalanceListProps {
  finalBalances: Array<{ name: string; balance: number }>;
  currentUserDisplayName: string;
  roommates: Roommate[];
  settlements: DetailedSettlement[];
  currentUserId: string | undefined;
  onDebtorMarksAsPaid: (debtorName: string, creditorName: string, amountToSettle: number) => Promise<void>;
  onCreditorConfirmsReceipt: (transactionGroupId: string, newStatus: "settled") => Promise<void>;
  onCreditorRequestsPayment: (debtorName: string, creditorName: string, amountToSettle: number) => Promise<void>;
  onPayViaUpi: (upiId: string, amount: number) => void;
}

export const BalanceList: React.FC<BalanceListProps> = ({
  finalBalances,
  currentUserDisplayName,
  roommates,
  settlements,
  currentUserId,
  onDebtorMarksAsPaid,
  onCreditorConfirmsReceipt,
  onCreditorRequestsPayment,
  onPayViaUpi,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Balances</CardTitle>
        <CardDescription>Who owes what. Manage or view detailed settlements in the 'Settlements' tab.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {finalBalances.map((person, index) => {
          const isViewingOwnBalance = person.name === currentUserDisplayName;

          let actionContent = null;
          let statusText = null;

          if (!isViewingOwnBalance) {
            const otherPartyName = person.name;
            const amount = person.balance;

            const otherPartyRoommateInfo = roommates.find(r => r.name === otherPartyName);
            const otherPartyUserId = otherPartyRoommateInfo?.user_id;

            // Match all settlements between current user and this person (regardless of which side)
            const pairSettlements = settlements.filter(s =>
              (s.status !== 'settled') && (
                // I owe them (I am debtor), or they owe me (I am creditor)
                (s.user_id === currentUserId && s.name === otherPartyName) ||
                (s.user_id === otherPartyUserId && s.name === currentUserDisplayName)
              )
            );

            // Prefer 'debtor_paid' status, fallback to 'pending' if exists
            const relevantSettlement = pairSettlements.find(s => s.status === 'debtor_paid')
              || pairSettlements.find(s => s.status === 'pending');

            // --------- (Debtor: current user owes this roommate) ---------
            if (amount > 0.005) {
              // Case: current user = DEBTOR.
              if (
                relevantSettlement &&
                relevantSettlement.status === 'debtor_paid'
              ) {
                // Debtor marked as paid, awaiting creditor confirmation.
                statusText = <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Payment marked, awaiting {otherPartyName}'s confirmation</Badge>;
                actionContent = null;
              } else {
                statusText = (relevantSettlement && relevantSettlement.status === 'pending')
                  ? <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">Payment pending to {otherPartyName}</Badge>
                  : null;
                actionContent = (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 mt-1 w-full sm:w-auto justify-end">
                    {otherPartyRoommateInfo?.upi_id && (
                      <Button size="sm" variant="outline" onClick={() => onPayViaUpi(otherPartyRoommateInfo.upi_id, amount)} className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 w-full sm:w-auto">
                        Pay via UPI <CreditCard className="ml-2 h-3 w-3" />
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => onDebtorMarksAsPaid(currentUserDisplayName, otherPartyName, amount)} className="border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700 w-full sm:w-auto">
                      I've Paid <Send className="ml-2 h-3 w-3" />
                    </Button>
                  </div>
                );
              }
            } // --------- (Creditor: current user is owed by this roommate) ------
            else if (amount < -0.005) {
              // current user is creditor.
              const absAmount = Math.abs(amount);

              // The creditor should see "Confirm payment received" if there's a debtor_paid status
              if (relevantSettlement && relevantSettlement.status === 'debtor_paid') {
                statusText = <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">{otherPartyName} marked as paid</Badge>;
                let groupId = relevantSettlement.transaction_group_id;
                actionContent = groupId && (
                  <Button size="sm" variant="outline" onClick={() => onCreditorConfirmsReceipt(groupId, 'settled')} className="border-green-400 text-green-600 hover:bg-green-50 hover:text-green-700 w-full sm:w-auto">
                    Confirm Payment Received <CircleCheck className="ml-2 h-3 w-3" />
                  </Button>
                );
              } else {
                statusText = (relevantSettlement && relevantSettlement.status === 'pending')
                  ? <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">Awaiting payment from {otherPartyName}</Badge>
                  : null;
                actionContent = (
                  <Button size="sm" variant="outline" onClick={() => onCreditorRequestsPayment(otherPartyName, currentUserDisplayName, absAmount)} className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700 w-full sm:w-auto">
                    Request Payment
                  </Button>
                );
              }
            } else {
              actionContent = null;
              statusText = null;
            }
          } else {
            actionContent = null;
            statusText = null;
          }

          return (
            <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-gray-50 space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className={`rounded-full p-2 ${person.balance > 0.005 ? 'bg-green-100' : person.balance < -0.005 ? 'bg-red-100' : 'bg-gray-100'}`}>
                  <Users className={`h-4 w-4 ${person.balance > 0.005 ? 'text-green-600' : person.balance < -0.005 ? 'text-red-600' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className="font-medium">{person.name}{isViewingOwnBalance ? " (You)" : ""}</p>
                  {statusText && <div className="mt-1">{statusText}</div>}
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 self-end sm:self-center w-full sm:w-auto justify-end">
                <Badge variant={person.balance > 0.005 ? "default" : person.balance < -0.005 ? "destructive" : "secondary"} className={`${person.balance > 0.005 ? 'bg-green-500 hover:bg-green-600' : ''} whitespace-nowrap`}>
                  {person.balance === 0 || (person.balance < 0.005 && person.balance > -0.005) ? "Settled Up" : 
                   person.balance > 0 ? `Is Owed ₹${person.balance.toFixed(2)}` : 
                   `Owes ₹${Math.abs(person.balance).toFixed(2)}`}
                </Badge>
                {actionContent}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
