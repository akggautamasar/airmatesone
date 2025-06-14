import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, CreditCard, Send, CircleCheck } from "lucide-react";
import { Settlement } from "@/components/SettlementHistory";

interface Roommate {
  id: string;
  name: string;
  email: string;
  upi_id: string;
  user_id: string;
}

interface BalanceListItemProps {
  person: { name: string; balance: number },
  currentUserDisplayName: string,
  roommates: Roommate[],
  settlements: Settlement[],
  currentUserId: string | undefined,
  onDebtorMarksAsPaid: (debtorName: string, creditorName: string, amountToSettle: number) => Promise<void>,
  onCreditorConfirmsReceipt: (transactionGroupId: string, newStatus: "settled") => Promise<void>,
  onCreditorRequestsPayment: (debtorName: string, creditorName: string, amountToSettle: number) => Promise<void>,
  onPayViaUpi: (upiId: string, amount: number) => void,
}

export const BalanceListItem: React.FC<BalanceListItemProps> = ({
  person,
  currentUserDisplayName,
  roommates,
  settlements,
  currentUserId,
  onDebtorMarksAsPaid,
  onCreditorConfirmsReceipt,
  onCreditorRequestsPayment,
  onPayViaUpi,
}) => {
  const isViewingOwnBalance = person.name === currentUserDisplayName;

  let actionContent = null;
  let statusText = null;
  
  if (!isViewingOwnBalance) {
    const otherPartyName = person.name;
    const amount = person.balance;
    const otherPartyRoommateInfo = roommates.find(r => r.name === otherPartyName);
    const otherPartyUserId = otherPartyRoommateInfo?.user_id; 
    const iAmDebtor = amount > 0.005;
    const iAmCreditor = amount < -0.005;

    // Find all settlements between these two users (both directions)
    const relevantPairSettlements = settlements.filter(
      s =>
        (s.user_id === currentUserId && s.name === otherPartyName) ||
        (s.user_id === otherPartyUserId && s.name === currentUserDisplayName)
    );

    // Group by transaction_group_id
    const txGroups = Array.from(
      new Set(
        relevantPairSettlements.map(s => s.transaction_group_id).filter(Boolean)
      )
    );
    const groupViews = txGroups.map(groupId => {
      const members = relevantPairSettlements.filter(
        s => s.transaction_group_id === groupId
      );
      return {
        groupId,
        statuses: members.map(g => g.status),
        pairs: members,
      };
    });

    // Locate first active group with key statuses
    // ALTER: We want to show "Mark as Received" for CREDITOR if *ANY* member in group has status 'debtor_paid'
    const groupWithDebtorPaid = groupViews.find(g =>
      g.statuses.some(status => status === 'debtor_paid')
    );
    const groupWithPending = groupViews.find(g =>
      g.statuses.some(status => status === 'pending')
    );

    // Add logging for debugging
    if (iAmCreditor) {
      console.log(`[BalanceListItem] Creditor view for ${currentUserDisplayName} vs ${otherPartyName}`);
      console.log('groupViews:', groupViews);
      console.log('groupWithDebtorPaid:', groupWithDebtorPaid);
    }

    if (iAmDebtor) {
      // DEBTOR VIEW
      if (groupWithDebtorPaid) {
        statusText = (
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
            Payment marked, awaiting {otherPartyName}'s confirmation
          </Badge>
        );
        actionContent = null;
      } else {
        const isPending = Boolean(groupWithPending);
        statusText = isPending ? (
          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
            Payment pending to {otherPartyName}
          </Badge>
        ) : null;
        actionContent = (
          <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 mt-1 w-full sm:w-auto justify-end">
            {otherPartyRoommateInfo?.upi_id && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onPayViaUpi(otherPartyRoommateInfo.upi_id, amount)}
                className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 w-full sm:w-auto"
              >
                Pay via UPI <CreditCard className="ml-2 h-3 w-3" />
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onDebtorMarksAsPaid(currentUserDisplayName, otherPartyName, amount)}
              className="border-blue-400 text-blue-600 hover:bg-blue-50 hover:text-blue-700 w-full sm:w-auto"
            >
              I've Paid <Send className="ml-2 h-3 w-3" />
            </Button>
          </div>
        );
      }
    } else if (iAmCreditor) {
      // CREDITOR VIEW
      if (groupWithDebtorPaid) {
        const groupId = groupWithDebtorPaid.groupId;
        statusText = (
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
            Debtor marked as paid
          </Badge>
        );
        actionContent = (
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              // The creditor is confirming receipt and settling the group
              if (groupId) {
                onCreditorConfirmsReceipt(groupId, 'settled');
              }
            }}
            className="border-green-400 text-green-600 hover:bg-green-50 hover:text-green-700 w-full sm:w-auto"
          >
            Mark as Received <CircleCheck className="ml-2 h-3 w-3" />
          </Button>
        );
      } else {
        // No request payment button here
        const isPending = Boolean(groupWithPending);
        statusText = isPending ? (
          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
            Awaiting payment from {otherPartyName}
          </Badge>
        ) : null;
        actionContent = null;
      }
    }
  }

  return (
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg bg-gray-50 space-y-2 sm:space-y-0">
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
};
