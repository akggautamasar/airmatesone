
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, BadgeCheck } from "lucide-react";
import { Settlement as DetailedSettlement } from "@/components/SettlementHistory"; // Assuming this type is needed and exported

interface Roommate {
  id: string;
  name: string;
  email: string;
  upi_id: string;
  user_id: string;
  // Add other fields if necessary from useRoommates hook
}

interface BalanceListProps {
  finalBalances: Array<{ name: string; balance: number }>;
  currentUserDisplayName: string;
  roommates: Roommate[];
  settlements: DetailedSettlement[];
  currentUserId: string | undefined;
  onInitiateSettlement: (debtorName: string, creditorName: string, amountToSettle: number, settleImmediately?: boolean) => Promise<void>;
  onPayViaUpi: (upiId: string, amount: number) => void;
}

export const BalanceList: React.FC<BalanceListProps> = ({
  finalBalances,
  currentUserDisplayName,
  roommates,
  settlements,
  currentUserId,
  onInitiateSettlement,
  onPayViaUpi,
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Balances</CardTitle>
        <CardDescription>Who owes what, reflecting shared expenses and settled transactions. Manage pending settlements in the 'Settlements' tab.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {finalBalances.map((person, index) => {
          const isViewingOwnBalance = person.name === currentUserDisplayName;
          const roommateInfo = roommates.find(r => r.name === person.name);

          const activeSettlementWithPerson = settlements.find(s => 
              s.status !== 'settled' &&
              ((s.name === person.name && s.user_id === currentUserId) || 
               (s.name === currentUserDisplayName && person.name === (roommates.find(r => r.user_id === s.user_id)?.name || s.user_id)))
          );

          let actionContent = null;
          let additionalInfoBadge = null;

          if (!isViewingOwnBalance) {
              if (person.balance > 0.005) { // Current user owes this person (person.name)
                  const payButton = roommateInfo?.upi_id ? (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => onPayViaUpi(roommateInfo.upi_id, person.balance)}
                        className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:text-orange-700 w-full sm:w-auto"
                      >
                        Pay via UPI
                        <CreditCard className="ml-2 h-3 w-3" />
                      </Button>
                  ) : null;

                  const markAsPaidButton = (
                      <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => onInitiateSettlement(currentUserDisplayName, person.name, person.balance, true)} 
                          className="border-green-400 text-green-600 hover:bg-green-50 hover:text-green-700 w-full sm:w-auto"
                      >
                          Mark as Paid
                          <BadgeCheck className="ml-2 h-3 w-3" />
                      </Button>
                  );
                  
                  actionContent = (
                      <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 mt-1 w-full sm:w-auto justify-end">
                          {payButton}
                          {markAsPaidButton}
                      </div>
                  );

                  if (activeSettlementWithPerson) {
                      additionalInfoBadge = <Badge variant="outline" className="text-xs mt-1 sm:mt-0 sm:ml-2 self-center sm:self-auto">Note: A settlement is also pending</Badge>;
                  }

              } else if (person.balance < -0.005) { // Current user is owed by this person (person.name)
                  if (!activeSettlementWithPerson) {
                      actionContent = (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => onInitiateSettlement(person.name, currentUserDisplayName, person.balance, false)} 
                            className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700 w-full sm:w-auto"
                          >
                            Request Payment
                          </Button>
                      );
                  } else {
                      actionContent = <Badge variant="outline" className="text-xs">Settlement in progress</Badge>;
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
                </div>
              </div>
              <div className="flex flex-col sm:flex-row items-end sm:items-center sm:space-x-2 space-y-2 sm:space-y-0 self-end sm:self-center w-full sm:w-auto justify-end">
                <Badge variant={person.balance > 0.005 ? "default" : person.balance < -0.005 ? "destructive" : "secondary"} className={`${person.balance > 0.005 ? 'bg-green-500 hover:bg-green-600' : ''} whitespace-nowrap`}>
                  {person.balance === 0 || (person.balance < 0.005 && person.balance > -0.005) ? "Settled Up" : 
                   person.balance > 0 ? `Is Owed ₹${person.balance.toFixed(2)}` : 
                   `Owes ₹${Math.abs(person.balance).toFixed(2)}`}
                </Badge>
                {actionContent}
                {additionalInfoBadge}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
