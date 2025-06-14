
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, BadgeCheck, Send, CircleCheck } from "lucide-react"; // Added Send, CircleCheck
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
          const roommateInfo = roommates.find(r => r.name === person.name);

          // Find active settlement specific to the interaction between currentUser and person.name
          const activeSettlementWithPerson = settlements.find(s => {
            if (s.status === 'settled') return false; // Ignore settled ones for active actions

            const currentUserIsSettlementOwner = s.user_id === currentUserId;
            const otherUserIsSettlementOwner = (roommates.find(r => r.name === person.name)?.user_id || person.name) === s.user_id;

            if (currentUserIsSettlementOwner && s.name === person.name) { // Current user's record about 'person.name'
              return true;
            }
            if (otherUserIsSettlementOwner && s.name === currentUserDisplayName) { // 'person.name''s record about current user
              return true;
            }
            return false;
          });
          
          let actionContent = null;
          let statusText = null;

          if (!isViewingOwnBalance) {
            if (person.balance > 0.005) { // Current user owes this person (person.name is Creditor)
              const creditorName = person.name;
              const amountOwed = person.balance;

              if (activeSettlementWithPerson?.status === 'debtor_paid' && activeSettlementWithPerson.type === 'owes') {
                 // Current user (debtor) has marked as paid
                 statusText = <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">Payment marked, awaiting {creditorName}'s confirmation</Badge>;
              } else if (activeSettlementWithPerson?.status === 'pending' && activeSettlementWithPerson.type === 'owes') {
                // A pending settlement exists where current user owes
                statusText = <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">Settlement pending payment to {creditorName}</Badge>;
                // Still allow "I've Paid" if they haven't marked it for THIS balance action
                 actionContent = (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 mt-1 w-full sm:w-auto justify-end">
                        {roommateInfo?.upi_id && (
                            <Button size="sm" variant="outline" onClick={() => onPayViaUpi(roommateInfo.upi_id, amountOwed)} className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 w-full sm:w-auto">
                                Pay via UPI <CreditCard className="ml-2 h-3 w-3" />
                            </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => onDebtorMarksAsPaid(currentUserDisplayName, creditorName, amountOwed)} className="border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700 w-full sm:w-auto">
                            I've Paid <Send className="ml-2 h-3 w-3" />
                        </Button>
                    </div>
                );

              } else { // No active 'debtor_paid' or 'pending owes' settlement by current user for this specific balance view
                actionContent = (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 mt-1 w-full sm:w-auto justify-end">
                        {roommateInfo?.upi_id && (
                            <Button size="sm" variant="outline" onClick={() => onPayViaUpi(roommateInfo.upi_id, amountOwed)} className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 w-full sm:w-auto">
                                Pay via UPI <CreditCard className="ml-2 h-3 w-3" />
                            </Button>
                        )}
                        <Button size="sm" variant="outline" onClick={() => onDebtorMarksAsPaid(currentUserDisplayName, creditorName, amountOwed)} className="border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700 w-full sm:w-auto">
                            I've Paid <Send className="ml-2 h-3 w-3" />
                        </Button>
                    </div>
                );
              }
            } else if (person.balance < -0.005) { // Current user is owed by this person (person.name is Debtor)
              const debtorName = person.name;
              const amountOwedToCurrentUser = Math.abs(person.balance);

              if (activeSettlementWithPerson?.status === 'debtor_paid' && activeSettlementWithPerson.type === 'owed' && activeSettlementWithPerson.transaction_group_id) {
                // Debtor (person.name) has marked as paid to current user
                statusText = <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">{debtorName} marked as paid</Badge>;
                actionContent = (
                    <Button size="sm" variant="outline" onClick={() => onCreditorConfirmsReceipt(activeSettlementWithPerson.transaction_group_id!, 'settled')} className="border-green-400 text-green-600 hover:bg-green-50 hover:text-green-700 w-full sm:w-auto">
                        Confirm Payment Received <CircleCheck className="ml-2 h-3 w-3" />
                    </Button>
                );
              } else if (activeSettlementWithPerson?.status === 'pending' && activeSettlementWithPerson.type === 'owed') {
                 statusText = <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">Awaiting payment from {debtorName}</Badge>;
                 // Optionally, can add a "Remind" button here in future
              } else { // No active settlement, or it's not one current user needs to act on yet (e.g. other party owes current user but hasn't paid)
                 actionContent = (
                    <Button size="sm" variant="outline" onClick={() => onCreditorRequestsPayment(debtorName, currentUserDisplayName, amountOwedToCurrentUser)} className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700 w-full sm:w-auto">
                        Request Payment
                    </Button>
                );
              }
            }
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

