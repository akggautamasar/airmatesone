
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Settlement } from '@/components/SettlementHistory'; // Assuming Settlement type is exported
import { v4 as uuidv4 } from 'uuid';

export const useSettlements = () => {
  const [settlements, setSettlements] = useState<Settlement[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchSettlements = useCallback(async () => {
    if (!user) {
      setSettlements([]);
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching settlements:', error);
        toast({ title: "Error", description: "Failed to fetch settlements.", variant: "destructive" });
        setSettlements([]);
      } else {
        setSettlements(data || []);
      }
    } catch (error) {
      console.error('Catch error fetching settlements:', error);
      toast({ title: "Error", description: "An unexpected error occurred while fetching settlements.", variant: "destructive" });
      setSettlements([]);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchSettlements();
  }, [fetchSettlements]);

  const addSettlementPair = async (
    currentUserInvolves: { name: string; email: string; upi_id: string; type: 'owes' | 'owed' },
    otherPartyInvolves: { name: string; email: string; upi_id: string; type: 'owes' | 'owed' },
    amount: number
  ) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return null;
    }

    const transactionGroupId = uuidv4();
    const commonData = {
      amount,
      status: 'pending' as const,
      transaction_group_id: transactionGroupId,
    };

    const settlementForCurrentUser = {
      ...commonData,
      user_id: user.id, // User ID for whom this record is
      name: otherPartyInvolves.name, // Name of the other person
      email: otherPartyInvolves.email,
      upi_id: currentUserInvolves.type === 'owes' ? otherPartyInvolves.upi_id : currentUserInvolves.upi_id, // if current user owes, they need other's UPI
      type: currentUserInvolves.type,
    };

    const settlementForOtherParty = {
      ...commonData,
      // We need a way to associate this with the other user if they are also in the system.
      // For now, we'll assume this record is primarily for the current user's view,
      // and a similar record would be created for the other user if they interact.
      // However, to properly link them for status updates, both records need to exist and be updatable.
      // This simplified version might need expansion for a full P2P system.
      // For this iteration, we'll only insert the current user's perspective.
      // A more robust solution would involve inserting both if the other user exists or an invitation system.
      // Let's assume for now we create two records in the settlements table, one for each user involved if possible.
      // This means we'd need the other user's `user_id`. This is a simplification for now.
      // The prompt implies a P2P interaction. A single table `settlements` with `user_id` needs careful handling.
      // The provided `settlements` table has `user_id`. So each user has their own record of the settlement.

      // Simplified: we're adding to the current user's settlements list.
      // To make it truly P2P with shared status, we'd need a different table structure or more complex logic.
      // Let's proceed with creating two entries linked by transaction_group_id, assuming we can find/create the other user's entry.
      // This is tricky without knowing the other user's `user_id`.
      // The current DB schema has user_id per settlement. This means each user has their own view.
      // So, `addSettlementPair` implies adding a settlement to the current user's list.
      // The prompt "when one roommate clicks on mark as paid it must show to other roommate" implies shared state.
      // This requires updating records associated with *both* users.

      // Let's refine: `addSettlementPair` should aim to insert two records into `settlements` table.
      // One for `user.id` (current user) and one for the `otherParty` (identified by email perhaps).
      // This is beyond simple `addSettlement` for current user only.
      // The prompt suggests we're building towards this.
      // For now, let's focus on the current user's record and its status updates.
      // The `transaction_group_id` will be crucial for later linking.

      // This hook is for the *current user's* settlements.
      // When a settlement is created (e.g. User A owes User B), User A gets a record (type: owes, name: User B),
      // and User B should get a record (type: owed, name: User A). Both share transaction_group_id.

      // For this iteration, we'll create a single settlement record for the current user perspective.
      // The `createSettlement` in ExpenseOverview should call this.
    };

    // This function will be called from ExpenseOverview's `createSettlement`
    // `debtorName`, `creditorName`, amount
    // `currentUserIsDebtor`
    // It needs to create TWO settlement records.

    const debtorSettlement = {
      user_id: currentUserInvolves.type === 'owes' ? user.id : otherPartyInvolves.email, // placeholder for other user's ID lookup
      name: currentUserInvolves.type === 'owes' ? otherPartyInvolves.name : currentUserInvolves.name,
      email: currentUserInvolves.type === 'owes' ? otherPartyInvolves.email : currentUserInvolves.email,
      upi_id: currentUserInvolves.type === 'owes' ? otherPartyInvolves.upi_id : currentUserInvolves.upi_id,
      type: 'owes' as const,
      amount,
      status: 'pending' as const,
      transaction_group_id: transactionGroupId,
    };

    const creditorSettlement = {
      user_id: currentUserInvolves.type === 'owed' ? user.id : otherPartyInvolves.email, // placeholder
      name: currentUserInvolves.type === 'owed' ? otherPartyInvolves.name : currentUserInvolves.name,
      email: currentUserInvolves.type === 'owed' ? otherPartyInvolves.email : currentUserInvolves.email,
      upi_id: currentUserInvolves.type === 'owed' ? currentUserInvolves.upi_id : otherPartyInvolves.upi_id,
      type: 'owed' as const,
      amount,
      status: 'pending' as const,
      transaction_group_id: transactionGroupId,
    };
    
    // This part is tricky because we don't have otherParty's user_id directly.
    // We'll assume for now that the settlements table is primarily for the current user's view,
    // and the `transaction_group_id` is for future linking if we implement a system to find other users by email.
    // The prompt "show to other roommate" means we need to update *their* record.
    // This implies that `settlements` table rows are NOT unique to `user_id` + `transaction_group_id` but potentially
    // unique on `id` and `transaction_group_id` might link two separate `id`s each with a different `user_id`.

    // Correct approach: Insert two rows into the settlements table if two users are involved.
    // The `user_id` in each row will be the `user_id` of the person *owning* that record.
    // This means the current `useSettlements` hook will only fetch records for `auth.uid()`.
    // When `addSettlementPair` is called, it needs to insert:
    // 1. A record for the current user.
    // 2. A record for the other user (this is where it gets complex without their actual user_id).
    //    We can insert it with the other user's email, and rely on RLS on their side to pick it up.
    //    This assumes the other user's `user_id` can be resolved or the RLS is based on email if `user_id` is not the primary link for them.
    //    The `settlements` table in schema has `user_id: uuid` NOT NULL and `email: text` (of other party).

    // Let's assume `addSettlementPair` creates ONE record for the *current user*.
    // The `updateSettlementStatusByGroupId` will update ALL records with that group ID.

    const newSettlementEntry = {
        user_id: user.id,
        name: currentUserInvolves.type === 'owes' ? otherPartyInvolves.name : currentUserInvolves.name, // The other party's name
        email: currentUserInvolves.type === 'owes' ? otherPartyInvolves.email : currentUserInvolves.email, // Other party's email
        upi_id: currentUserInvolves.type === 'owes' ? otherPartyInvolves.upi_id : currentUserInvolves.upi_id, // UPI for payment
        type: currentUserInvolves.type, // 'owes' or 'owed' from current user's perspective
        amount,
        status: 'pending' as const,
        transaction_group_id: transactionGroupId,
    };

    try {
        // Insert record for current user
        const { data: currentUserData, error: currentUserError } = await supabase
            .from('settlements')
            .insert(newSettlementEntry)
            .select()
            .single();

        if (currentUserError) throw currentUserError;

        // Now, attempt to insert a corresponding record for the other user.
        // This assumes we can find the other user's user_id based on their email,
        // or that an RLS policy on their side might pick up a record keyed by their email.
        // The current `profiles` table has `email` and `id` (which is user_id).
        // Let's try to find the other user's ID.
        let otherUserId: string | null = null;
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', otherPartyInvolves.email)
            .single();

        if (profileData && !profileError) {
            otherUserId = profileData.id;
        } else {
            console.warn("Could not find profile for other user by email:", otherPartyInvolves.email, "settlement will only be one-sided for now or rely on email matching if other user's RLS allows.");
            // If other user not found, we might skip creating their record or create it with a placeholder user_id/null if allowed.
            // The `settlements.user_id` is NOT NULL. This makes P2P hard without knowing other user's UUID.
            // For this iteration, we'll only robustly create the current user's record.
            // The spirit of the request "show to other roommate" needs a way to link them.
            // `transaction_group_id` is the key. When updating status, we update all with that group ID.
        }
        
        // If other user's ID found, create their settlement record.
        if (otherUserId) {
            const otherPartySettlementEntry = {
                user_id: otherUserId,
                name: currentUserInvolves.name, // Current user's name from other party's perspective
                email: user.email || '', // Current user's email
                upi_id: otherPartyInvolves.type === 'owes' ? currentUserInvolves.upi_id : otherPartyInvolves.upi_id, // UPI for payment
                type: otherPartyInvolves.type, // 'owes' or 'owed' from other party's perspective
                amount,
                status: 'pending' as const,
                transaction_group_id: transactionGroupId,
            };
            const { error: otherUserError } = await supabase
                .from('settlements')
                .insert(otherPartySettlementEntry);
            if (otherUserError) {
                 console.error("Failed to create settlement record for other party:", otherUserError);
                 // Not throwing here, primary record for current user is more important for this hook.
            }
        }


      await fetchSettlements();
      toast({ title: "Settlement Initiated", description: "The settlement has been recorded." });
      return currentUserData;
    } catch (error: any) {
      console.error('Error adding settlement pair:', error);
      toast({ title: "Error", description: `Failed to add settlement: ${error.message}`, variant: "destructive" });
      return null;
    }
  };
  
  const updateSettlementStatusByGroupId = async (transaction_group_id: string, newStatus: "pending" | "debtor_paid" | "settled") => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    try {
      const updatePayload: Partial<Settlement> = { status: newStatus };
      if (newStatus === 'settled') {
        updatePayload.settled_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('settlements')
        .update(updatePayload)
        .eq('transaction_group_id', transaction_group_id);

      if (error) {
        console.error('Error updating settlement status by group:', error);
        throw error;
      }
      
      await fetchSettlements(); // Refetch to update local state for current user
      toast({ title: "Settlement Updated", description: `Settlement status changed to ${newStatus}.` });
    } catch (error: any) {
      console.error('Catch error updating settlement status by group:', error);
      toast({ title: "Error", description: `Failed to update settlement: ${error.message}`, variant: "destructive" });
    }
  };

  // We might also need a way to get a specific settlement if SettlementHistory needs to act on one not in the local list.
  // For now, fetchSettlements covers the current user's list.

  return { settlements, loading, addSettlementPair, updateSettlementStatusByGroupId, refetchSettlements: fetchSettlements };
};
