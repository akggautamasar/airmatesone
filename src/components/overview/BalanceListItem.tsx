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

    // Find the first group with status 'debtor_paid', 'pending', or 'settled'
    const groupWithDebtorPaid = groupViews.find(g =>
      g.statuses.some(status => status === 'debtor_paid')
    );
    const groupWithPending = groupViews.find(g =>
      g.statuses.some(status => status === 'pending')
    );
    const groupWithSettled = groupViews.find(g =>
      g.statuses.every(status => status === 'settled')
    );
    const unsettledGroup = groupViews.find(g =>
      g.statuses.some(status => status === 'pending' || status === 'debtor_paid')
    );
    // Find a groupId in order of priority: debtor_paid → pending → unsettled
    let targetGroupId: string | undefined = groupWithDebtorPaid?.groupId || groupWithPending?.groupId || unsettledGroup?.groupId;
    const hasAnyGroup = Boolean(targetGroupId);

    // Helper to initiate and settle if no group exists
    const handleCreditorMarkAsReceived = async () => {
      if (hasAnyGroup && targetGroupId) {
        // There is an existing group to settle
        await onCreditorConfirmsReceipt(targetGroupId, 'settled');
      } else {
        // No settlement exists. Instantly create and settle one for this pair.
        if (!currentUserId || !otherPartyRoommateInfo) return;
        
        const amountToSettle = -person.balance; // amount is negative for creditor, so this makes it positive
        const debtorName = person.name; // The other party is the debtor
        const creditorName = currentUserDisplayName; // The current user is the creditor
        
        // This function now correctly handles the creation and immediate settlement.
        // We pass 'settled' as the fourth argument, which will be a new parameter
        // in the handler in Index.tsx to set the initial status.
        // The handler in Index.tsx will need to be updated to accept this. For now,
        // we are assuming it's `(debtorName, creditorName, amount, initialStatus)`.
        // This is a temporary solution until the parent component can be updated.
        // We are passing `debtorName` first, then `creditorName`.
        // The handler in Index should use these to set roles correctly.
        // @ts-ignore - Temporarily ignoring since the prop signature in parent is not yet updated
        await onDebtorMarksAsPaid(debtorName, creditorName, amountToSettle, 'settled');
      }
    };

    if (iAmDebtor) {
      // DEBTOR VIEW (unchanged from previous logic)
      if (groupWithDebtorPaid) {
        statusText = (
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
            Payment marked, awaiting {otherPartyName}&apos;s confirmation
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
              I&apos;ve Paid <Send className="ml-2 h-3 w-3" />
            </Button>
          </div>
        );
      }
    } else if (iAmCreditor) {
      // CREDITOR VIEW
      // Show the Mark as Received button ALWAYS, unless fully settled up (all settlements settled and balance is 0)
      const fullySettled = (person.balance === 0 || (person.balance < 0.005 && person.balance > -0.005)) || (groupWithSettled && !unsettledGroup && !groupWithDebtorPaid && !groupWithPending);
      if (fullySettled) {
        statusText = (
          <Badge variant="outline" className="text-xs text-green-600 border-green-300">
            Fully settled
          </Badge>
        );
        actionContent = null;
      } else {
        // Show the Mark as Received button always!
        statusText = groupWithDebtorPaid ? (
          <Badge variant="outline" className="text-xs text-blue-600 border-blue-300">
            Debtor marked as paid
          </Badge>
        ) : groupWithPending ? (
          <Badge variant="outline" className="text-xs text-orange-600 border-orange-300">
            Awaiting payment from {otherPartyName}
          </Badge>
        ) : null;
        actionContent = (
          <Button
            size="sm"
            variant="outline"
            onClick={handleCreditorMarkAsReceived}
            className="border-green-400 text-green-600 hover:bg-green-50 hover:text-green-700 w-full sm:w-auto"
          >
            Mark as Received <CircleCheck className="ml-2 h-3 w-3" />
          </Button>
        );
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
