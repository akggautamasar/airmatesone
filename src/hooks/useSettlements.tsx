import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Settlement } from '@/components/SettlementHistory';
import { v4 as uuidv4 } from 'uuid';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';

// Helper function to map Supabase row to frontend Settlement type
const mapSupabaseToSettlement = (row: Tables<'settlements'>): Settlement => {
  return {
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
};

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
      console.log(`[useSettlements] Fetching settlements for user: ${user.id}`);
      const { data, error } = await supabase
        .from('settlements')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error(`[useSettlements] Error fetching settlements for user ${user.id}:`, error);
        toast({ title: "Error", description: "Failed to fetch settlements.", variant: "destructive" });
        setSettlements([]);
      } else {
        const mappedSettlements = data.map(mapSupabaseToSettlement);
        setSettlements(mappedSettlements || []);
        console.log(`[useSettlements] Successfully fetched ${mappedSettlements.length} settlements for user ${user.id}.`);
      }
    } catch (error) {
      console.error(`[useSettlements] Catch error fetching settlements for user ${user.id}:`, error);
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
  ): Promise<Settlement | null> => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return null;
    }

    const transactionGroupId = uuidv4();
    
    // For the current user's settlement record:
    // 'name', 'email', 'upi_id' should pertain to the otherParty.
    // 'type' describes the current user's relation to the otherParty.
    const newSettlementEntryForDb: TablesInsert<'settlements'> = {
        user_id: user.id,
        name: otherPartyInvolves.name, // Name of the person current user is transacting with
        email: otherPartyInvolves.email, // Email of the other party
        // upi_id is the creditor's UPI. 
        // If current user owes, it's otherParty's UPI. If current user is owed, it's current user's UPI.
        upi_id: currentUserInvolves.type === 'owes' ? otherPartyInvolves.upi_id : currentUserInvolves.upi_id,
        type: currentUserInvolves.type, // e.g. 'owes' means current user owes otherParty
        amount,
        status: 'pending',
        transaction_group_id: transactionGroupId,
    };
    console.log("Attempting to add settlement for current user (useSettlements):", JSON.stringify(newSettlementEntryForDb));

    try {
        const { data: currentUserData, error: currentUserError } = await supabase
            .from('settlements')
            .insert(newSettlementEntryForDb)
            .select()
            .single();

        if (currentUserError) {
            console.error("Error inserting current user settlement (useSettlements):", currentUserError, "Payload:", JSON.stringify(newSettlementEntryForDb));
            throw currentUserError;
        }
        if (!currentUserData) throw new Error("Failed to create settlement for current user, no data returned.");

        let otherUserId: string | null = null;
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id')
            .eq('email', otherPartyInvolves.email)
            .single();

        if (profileData && !profileError) {
            otherUserId = profileData.id;
        } else {
            console.warn("Could not find profile for other user by email (useSettlements):", otherPartyInvolves.email, "settlement will only be one-sided for now.");
        }
        
        if (otherUserId) {
            // For the other party's settlement record:
            // 'name', 'email', 'upi_id' should pertain to the currentUser.
            // 'type' describes the otherParty's relation to the currentUser.
            const otherPartySettlementEntryForDb: TablesInsert<'settlements'> = {
                user_id: otherUserId,
                name: currentUserInvolves.name, // Name of the current user (who is the other party for otherUserId)
                email: currentUserInvolves.email, // Email of the current user
                // upi_id is the creditor's UPI.
                // If otherParty owes (type 'owes'), it's currentUser's UPI. If otherParty is owed (type 'owed'), it's otherParty's UPI.
                upi_id: otherPartyInvolves.type === 'owes' ? currentUserInvolves.upi_id : otherPartyInvolves.upi_id,
                type: otherPartyInvolves.type, // e.g. 'owes' means otherParty owes currentUser
                amount,
                status: 'pending',
                transaction_group_id: transactionGroupId,
            };
            console.log("Attempting to add settlement for other party (useSettlements):", JSON.stringify(otherPartySettlementEntryForDb));
            const { error: otherUserError } = await supabase
                .from('settlements')
                .insert(otherPartySettlementEntryForDb);
            if (otherUserError) {
                 console.error("Failed to create settlement record for other party (useSettlements):", otherUserError, "Payload:", JSON.stringify(otherPartySettlementEntryForDb));
            }
        }

      await fetchSettlements();
      toast({ title: "Settlement Initiated", description: "The settlement has been recorded." });
      
      return mapSupabaseToSettlement(currentUserData);
    } catch (error: any) {
      console.error('Error adding settlement pair (useSettlements):', error);
      toast({ title: "Error", description: `Failed to add settlement: ${error.message}`, variant: "destructive" });
      return null;
    }
  };
  
  const updateSettlementStatusByGroupId = async (transaction_group_id: string, newStatus: "pending" | "debtor_paid" | "settled") => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      console.warn("[useSettlements] updateSettlementStatusByGroupId called while user is not logged in.");
      return;
    }

    if (!['pending', 'debtor_paid', 'settled'].includes(newStatus)) {
        console.error(`[useSettlements] CRITICAL: Invalid status value ('${newStatus}') passed to updateSettlementStatusByGroupId for transaction_group_id: ${transaction_group_id}. User: ${user.id}`);
        toast({ title: "Critical Error", description: "Invalid status value for update.", variant: "destructive" });
        return;
    }

    console.log(`[useSettlements] User ${user.id} initiating update for transaction_group_id: ${transaction_group_id} to newStatus: ${newStatus}`);

    try {
      const updatePayloadForDb: TablesUpdate<'settlements'> = { 
        status: newStatus,
        settled_date: newStatus === 'settled' ? new Date().toISOString() : null,
      };
      
      console.log(`[useSettlements] Update payload for DB for transaction_group_id ${transaction_group_id}:`, JSON.stringify(updatePayloadForDb));

      // Perform the update
      const { data: updatedRecords, error: updateError } = await supabase
        .from('settlements')
        .update(updatePayloadForDb)
        .eq('transaction_group_id', transaction_group_id)
        .select(); // Crucially, .select() to get back the records that were updated AND user has RLS SELECT permission for

      if (updateError) {
        console.error(`[useSettlements] Supabase Error updating settlement status for group ${transaction_group_id} to status '${newStatus}'. User: ${user.id}. Error:`, updateError);
        toast({ title: "Update Error", description: `Failed to update settlement: ${updateError.message}`, variant: "destructive" });
        return; // Stop if update failed
      }
      
      console.log(`[useSettlements] Supabase update successful for transaction_group_id ${transaction_group_id}. Records returned by .select() (should be current user's record(s) affected by the update):`, updatedRecords);

      if (updatedRecords && updatedRecords.length > 0) {
          const currentUserRecord = updatedRecords.find(r => r.user_id === user.id && r.transaction_group_id === transaction_group_id);
          if (currentUserRecord) {
              console.log(`[useSettlements] Current user's (${user.id}) record post-update for transaction_group_id ${transaction_group_id}: status is ${currentUserRecord.status}`);
              if (currentUserRecord.status !== newStatus) {
                  console.warn(`[useSettlements] DISCREPANCY! Current user's record status in DB (${currentUserRecord.status}) does not match intended newStatus (${newStatus}) for transaction_group_id ${transaction_group_id}. This could indicate RLS issues preventing the update on the user's own record or an issue with the .select() clause reflecting the change immediately for this user's view.`);
              }
          } else {
              console.warn(`[useSettlements] Current user's record for transaction_group_id ${transaction_group_id} not found in updatedRecords array. Length of updatedRecords: ${updatedRecords.length}. This is unexpected if the current user was part of the transaction group and their record was intended to be updated.`);
          }
      } else {
          console.warn(`[useSettlements] No records returned by .select() after update for transaction_group_id ${transaction_group_id}. This might happen if RLS SELECT policy filtered them out (e.g., user has no record in this group or SELECT RLS is too restrictive), or if no records matched the update condition (unlikely if TGID exists and was part of the update).`);
      }
      
      console.log(`[useSettlements] Calling fetchSettlements() for user ${user.id} after update of transaction_group_id ${transaction_group_id}.`);
      await fetchSettlements(); // Refetch settlements for the current user to update local state
      
      toast({ title: "Settlement Updated", description: `The settlement status has been changed to ${newStatus}.` });
    } catch (error: any) {
      console.error(`[useSettlements] Catch block error during update settlement status for group ${transaction_group_id} to status '${newStatus}'. User: ${user.id}. Error:`, error);
      toast({ title: "Error", description: `An unexpected error occurred while updating settlement: ${error.message}`, variant: "destructive" });
    }
  };

  const deleteSettlementGroup = async (transaction_group_id: string) => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!transaction_group_id) {
      toast({ title: "Error", description: "Cannot delete settlement without a group ID.", variant: "destructive" });
      return;
    }

    try {
      console.log(`Attempting to delete settlement group ${transaction_group_id} (useSettlements).`);
      const { error } = await supabase
        .from('settlements')
        .delete()
        .eq('transaction_group_id', transaction_group_id);

      if (error) {
        console.error(`Error deleting settlement group (useSettlements) ${transaction_group_id}:`, error);
        throw error;
      }

      await fetchSettlements();
      toast({ title: "Settlement Deleted", description: "The settlement group has been removed." });
    } catch (error: any) {
      console.error(`Catch error deleting settlement group (useSettlements) ${transaction_group_id}:`, error);
      toast({ title: "Error", description: `Failed to delete settlement: ${error.message}`, variant: "destructive" });
    }
  };

  return { settlements, loading, addSettlementPair, updateSettlementStatusByGroupId, deleteSettlementGroup, refetchSettlements: fetchSettlements };
};
