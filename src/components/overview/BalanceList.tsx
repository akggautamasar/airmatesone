
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Users, CreditCard, Send, CircleCheck } from "lucide-react";
import { Settlement as DetailedSettlement } from "@/components/SettlementHistory";
import { BalanceListItem } from "./BalanceListItem";

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
  onDebtorMarksAsPaid: (debtorName: string, creditorName: string, amountToSettle: number, initialStatus?: 'pending' | 'debtor_paid' | 'settled') => Promise<void>;
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
        {finalBalances.map((person, index) => (
          <BalanceListItem
            key={index}
            person={person}
            currentUserDisplayName={currentUserDisplayName}
            roommates={roommates}
            settlements={settlements}
            currentUserId={currentUserId}
            onDebtorMarksAsPaid={onDebtorMarksAsPaid}
            onCreditorConfirmsReceipt={onCreditorConfirmsReceipt}
            onCreditorRequestsPayment={onCreditorRequestsPayment}
            onPayViaUpi={onPayViaUpi}
          />
        ))}
      </CardContent>
    </Card>
  );
};
