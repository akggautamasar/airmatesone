
import { Settlement } from '@/types';
import { Tables } from '@/integrations/supabase/types';

// Helper function to map Supabase row to frontend Settlement type
export const mapSupabaseToSettlement = (row: Tables<'settlements'>): Settlement => {
  console.log(`[settlementUtils] Mapping Supabase row to Settlement:`, row);
  const mapped = {
    id: row.id,
    name: row.name, // Name of the other party
    amount: row.amount,
    type: row.type as "owes" | "owed",
    upiId: row.upi_id, // UPI ID of the creditor
    email: row.email, // Email of the other party
    status: row.status as "pending" | "debtor_paid" | "settled",
    settledDate: row.settled_date || undefined,
    transaction_group_id: row.transaction_group_id || undefined,
    user_id: row.user_id,
  };
  console.log(`[settlementUtils] Mapped settlement:`, mapped);
  return mapped;
};
