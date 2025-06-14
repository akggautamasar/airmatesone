import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { Settlement } from '@/components/SettlementHistory'; // Assuming Settlement type is here
import { mapSupabaseToSettlement } from '@/utils/settlementUtils';

interface UserDetails {
  name: string;
  email: string;
  upi_id: string;
}

export const fetchSettlementsFromSupabase = async (
  supabase: SupabaseClient,
  userId: string
): Promise<Settlement[]> => {
  console.log(`[settlementService] Fetching settlements for user: ${userId}`);
  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`[settlementService] Error fetching settlements for user ${userId}:`, error);
    throw error;
  }
  const mappedSettlements = data.map(mapSupabaseToSettlement);
  console.log(`[settlementService] Successfully fetched ${mappedSettlements.length} settlements for user ${userId}.`);
  return mappedSettlements || [];
};

export const addSettlementPairToSupabase = async (
  supabase: SupabaseClient,
  currentUserInvolves: { name: string; email: string; upi_id: string; type: 'owes' | 'owed' },
  otherPartyInvolves: { name: string; email: string; upi_id: string; type: 'owes' | 'owed' },
  amount: number,
  currentUserId: string,
  initialStatus: 'pending' | 'debtor_paid' | 'settled' = 'pending'
): Promise<Settlement> => {
  console.log('[settlementService] addSettlementPair called with initialStatus:', initialStatus, 'and currentUser type:', currentUserInvolves.type);

  const transactionGroupId = uuidv4();

  let finalCurrentUserType: 'owes' | 'owed' = currentUserInvolves.type;
  let finalOtherPartyType: 'owes' | 'owed' = otherPartyInvolves.type;

  // When "Mark as Received" is clicked, it creates a settled transaction.
  // The calling user is the creditor. We must enforce this to prevent role mix-ups.
  if (initialStatus === 'settled') {
    console.warn('[settlementService] Enforcing creditor role for current user for direct-to-settled creation.');
    finalCurrentUserType = 'owed';
    finalOtherPartyType = 'owes';
  }

  const newSettlementEntryForDb: TablesInsert<'settlements'> = {
    user_id: currentUserId,
    name: otherPartyInvolves.name,
    email: otherPartyInvolves.email,
    // The UPI ID should always belong to the creditor (the 'owed' party).
    upi_id: finalCurrentUserType === 'owed' ? currentUserInvolves.upi_id : otherPartyInvolves.upi_id,
    type: finalCurrentUserType,
    amount,
    status: initialStatus,
    transaction_group_id: transactionGroupId,
    settled_date: initialStatus === 'settled' ? new Date().toISOString() : null,
  };
  console.log("[settlementService] Attempting to add settlement for current user:", JSON.stringify(newSettlementEntryForDb));

  const { data: currentUserData, error: currentUserError } = await supabase
    .from('settlements')
    .insert(newSettlementEntryForDb)
    .select()
    .single();

  if (currentUserError) {
    console.error("[settlementService] Error inserting current user settlement:", currentUserError, "Payload:", JSON.stringify(newSettlementEntryForDb));
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
    console.warn("[settlementService] Could not find profile for other user by email:", otherPartyInvolves.email, "settlement will only be one-sided for now.");
  }
  
  // Prevent creating a duplicate settlement for the current user if otherParty info is wrong.
  if (otherUserId && otherUserId !== currentUserId) {
    const otherPartySettlementEntryForDb: TablesInsert<'settlements'> = {
      user_id: otherUserId,
      name: currentUserInvolves.name,
      email: currentUserInvolves.email,
      // The UPI ID should always belong to the creditor (the 'owed' party).
      upi_id: finalCurrentUserType === 'owed' ? currentUserInvolves.upi_id : otherPartyInvolves.upi_id,
      type: finalOtherPartyType,
      amount,
      status: initialStatus,
      transaction_group_id: transactionGroupId,
      settled_date: initialStatus === 'settled' ? new Date().toISOString() : null,
    };
    console.log("[settlementService] Attempting to add settlement for other party:", JSON.stringify(otherPartySettlementEntryForDb));
    const { error: otherUserError } = await supabase
      .from('settlements')
      .insert(otherPartySettlementEntryForDb);
    if (otherUserError) {
        console.error("[settlementService] Failed to create settlement record for other party:", otherUserError, "Payload:", JSON.stringify(otherPartySettlementEntryForDb));
        // Not throwing here, main user's settlement is still created.
    }
  } else if (otherUserId === currentUserId) {
      console.warn(`[settlementService] Aborting second insert: detected attempt to create a paired settlement for the same user (ID: ${currentUserId}).`);
  }
  return mapSupabaseToSettlement(currentUserData);
};

export const updateSettlementStatusInSupabase = async (
  supabase: SupabaseClient,
  transaction_group_id: string,
  newStatus: "pending" | "debtor_paid" | "settled",
  userIdMakingUpdate: string // For logging/context
): Promise<Tables<'settlements'>[] | null> => {
  console.log(`[settlementService] User ${userIdMakingUpdate} initiating update for transaction_group_id: ${transaction_group_id} to newStatus: ${newStatus}`);
  
  const updatePayloadForDb: TablesUpdate<'settlements'> = {
    status: newStatus,
    settled_date: newStatus === 'settled' ? new Date().toISOString() : null,
  };
  console.log(`[settlementService] Update payload for DB for transaction_group_id ${transaction_group_id}:`, JSON.stringify(updatePayloadForDb));

  const { data: updatedRecords, error: updateError } = await supabase
    .from('settlements')
    .update(updatePayloadForDb)
    .eq('transaction_group_id', transaction_group_id)
    .select();

  if (updateError) {
    console.error(`[settlementService] Supabase Error updating settlement status for group ${transaction_group_id} to status '${newStatus}'. User: ${userIdMakingUpdate}. Error:`, updateError);
    throw updateError;
  }
  
  console.log(`[settlementService] Supabase update successful for transaction_group_id ${transaction_group_id}. Records returned by .select():`, updatedRecords);
  return updatedRecords;
};

export const deleteSettlementGroupFromSupabase = async (
  supabase: SupabaseClient,
  transaction_group_id: string,
  userIdMakingDeletion: string // For logging/context
): Promise<void> => {
  console.log(`[settlementService] User ${userIdMakingDeletion} attempting to delete settlement group ${transaction_group_id}.`);
  const { error } = await supabase
    .from('settlements')
    .delete()
    .eq('transaction_group_id', transaction_group_id);

  if (error) {
    console.error(`[settlementService] Error deleting settlement records for group ${transaction_group_id} for user ${userIdMakingDeletion}:`, error);
    throw error;
  }
  console.log(`[settlementService] Successfully deleted settlement records for group ${transaction_group_id} initiated by user ${userIdMakingDeletion}.`);
};
