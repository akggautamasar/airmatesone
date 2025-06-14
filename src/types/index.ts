
export interface Settlement {
  id: string;
  name: string;
  amount: number;
  type: "owes" | "owed";
  upiId: string;
  email: string;
  status: "pending" | "debtor_paid" | "settled";
  settledDate?: string;
  transaction_group_id?: string;
  user_id: string;
}
