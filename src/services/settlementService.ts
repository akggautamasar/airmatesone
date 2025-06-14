
import { SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuidv4 } from 'uuid';
import { Tables, TablesInsert, TablesUpdate } from '@/integrations/supabase/types';
import { Settlement } from '@/types';
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
  
  console.log(`[settlementService] Raw data from Supabase:`, data);
  const mappedSettlements = data.map(mapSupabaseToSettlement);
  console.log(`[settlementService] Mapped settlements:`, mappedSettlements);
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

  if (initialStatus === 'settled') {
    console.warn('[settlementService] Enforcing creditor role for current user for direct-to-settled creation.');
    finalCurrentUserType = 'owed';
    finalOtherPartyType = 'owes';
  }

  // Always insert for current user first
  const newSettlementEntryForDb: TablesInsert<'settlements'> = {
    user_id: currentUserId,
    name: otherPartyInvolves.name,
    email: otherPartyInvolves.email,
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

  // Now, always try to create corresponding record for the other user
  let otherUserId: string | null = null;
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', otherPartyInvolves.email)
      .maybeSingle();

    if (profileData && profileData.id) {
      otherUserId = profileData.id;
      console.log("[settlementService] Found other user id:", otherUserId, "for email:", otherPartyInvolves.email);
    } else {
      console.warn("[settlementService] No profile found for other user by email:", otherPartyInvolves.email, ". Will not create paired entry.");
    }
  } catch (e) {
    console.error("[settlementService] Exception while looking up other party profile", e);
    otherUserId = null;
  }
  
  if (otherUserId && otherUserId !== currentUserId) {
    const otherPartySettlementEntryForDb: TablesInsert<'settlements'> = {
      user_id: otherUserId,
      name: currentUserInvolves.name,
      email: currentUserInvolves.email,
      upi_id: finalCurrentUserType === 'owed' ? currentUserInvolves.upi_id : otherPartyInvolves.upi_id,
      type: finalOtherPartyType,
      amount,
      status: initialStatus,
      transaction_group_id: transactionGroupId,
      settled_date: initialStatus === 'settled' ? new Date().toISOString() : null,
    };
    console.log("[settlementService] Adding paired settlement for other user:", JSON.stringify(otherPartySettlementEntryForDb));
    const { error: otherUserError } = await supabase
      .from('settlements')
      .insert(otherPartySettlementEntryForDb);
    if (otherUserError) {
      console.error("[settlementService] Failed to create paired settlement for other party:", otherUserError, "Payload:", JSON.stringify(otherPartySettlementEntryForDb));
    }
  } else if (otherUserId === currentUserId) {
    console.warn(`[settlementService] Skipped paired entry: both parties have same user id (${currentUserId})`);
  } else {
    console.warn(`[settlementService] Could not find user id for paired settlement for email: ${otherPartyInvolves.email}`);
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
  
  // Validate status before sending to database
  if (!['pending', 'debtor_paid', 'settled'].includes(newStatus)) {
    console.error(`[settlementService] Invalid status value: ${newStatus}`);
    throw new Error(`Invalid status value: ${newStatus}. Must be one of: pending, debtor_paid, settled`);
  }
  
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
