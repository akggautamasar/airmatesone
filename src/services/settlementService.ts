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
  supabase,
  currentUserInvolves,
  otherPartyInvolves,
  amount,
  currentUserId,
  initialStatus = "pending"
) => {
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
  const newSettlementEntryForDb = {
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

  // Now always try to create the paired record for other user
  let otherUserId = null;
  try {
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', otherPartyInvolves.email)
      .maybeSingle();

    if (profileData && profileData.id && profileData.id !== currentUserId) {
      otherUserId = profileData.id;
    } 
  } catch (e) {
    console.error("[settlementService] Exception while looking up other party profile", e);
  }

  if (otherUserId && otherUserId !== currentUserId) {
    // Reverse type for paired entry
    const otherSettlementType = finalCurrentUserType === "owed" ? "owes" : "owed";
    const otherPartySettlementEntryForDb = {
      user_id: otherUserId,
      name: currentUserInvolves.name,
      email: currentUserInvolves.email,
      upi_id: finalCurrentUserType === 'owed' ? currentUserInvolves.upi_id : otherPartyInvolves.upi_id,
      type: otherSettlementType,
      amount,
      status: initialStatus,
      transaction_group_id: transactionGroupId,
      settled_date: initialStatus === 'settled' ? new Date().toISOString() : null,
    };
    // Only insert if does not already exist
    const { data: exist, error: existErr } = await supabase
      .from('settlements')
      .select('id')
      .eq('user_id', otherUserId)
      .eq('transaction_group_id', transactionGroupId)
      .maybeSingle();
    if (!exist) {
      const { error: pairedErr } = await supabase
        .from('settlements')
        .insert(otherPartySettlementEntryForDb);
      if (pairedErr) {
        console.error("[settlementService] Failed to create paired settlement for other party:", pairedErr, "Payload:", JSON.stringify(otherPartySettlementEntryForDb));
      }
    }
  }
  return mapSupabaseToSettlement(currentUserData);
};

// NEW: A universal function to create settlements between any two registered users.
export const createUniversalSettlementPairInSupabase = async (
  supabase: SupabaseClient,
  debtor: { name: string; email: string; },
  creditor: { name: string; email: string; upi_id: string; },
  amount: number
): Promise<void> => {
  console.log(`[settlementService] createUniversalSettlementPair. Debtor: ${debtor.name} (${debtor.email}), Creditor: ${creditor.name} (${creditor.email}), Amount: ${amount}`);
  const transactionGroupId = uuidv4();

  const debtorEmail = debtor.email.toLowerCase();
  const creditorEmail = creditor.email.toLowerCase();

  const { data: debtorProfile, error: debtorError } = await supabase.from('profiles').select('id').eq('email', debtorEmail).maybeSingle();
  if (debtorError) { console.error('Error fetching debtor profile:', debtorError); throw debtorError; }
  console.log(`[settlementService] Debtor profile lookup for email ${debtorEmail}:`, debtorProfile);

  const { data: creditorProfile, error: creditorError } = await supabase.from('profiles').select('id').eq('email', creditorEmail).maybeSingle();
  if (creditorError) { console.error('Error fetching creditor profile:', creditorError); throw creditorError; }
  console.log(`[settlementService] Creditor profile lookup for email ${creditorEmail}:`, creditorProfile);


  const debtorUserId = debtorProfile?.id;
  const creditorUserId = creditorProfile?.id;
  console.log(`[settlementService] Found UserIDs. Debtor: ${debtorUserId}, Creditor: ${creditorUserId}`);


  // Create settlement for the debtor if they are a registered user
  if (debtorUserId) {
    console.log(`[settlementService] Attempting to create 'owes' settlement for debtor user ${debtorUserId}`);
    const { error } = await supabase.from('settlements').insert({
      user_id: debtorUserId,
      name: creditor.name,
      email: debtorEmail,
      upi_id: creditor.upi_id || '',
      type: 'owes' as const,
      amount,
      status: 'pending',
      transaction_group_id: transactionGroupId,
    });
    if (error) { 
        console.error("[settlementService] Error inserting debtor settlement:", error); 
        throw error; 
    }
    console.log(`[settlementService] Successfully created 'owes' settlement for debtor user ${debtorUserId}`);
  } else {
    console.warn(`[settlementService] SKIPPED: Could not create 'owes' settlement for debtor ${debtor.name} (${debtor.email}) because they do not appear to be a registered user (profile not found).`);
  }

  // Create settlement for the creditor if they are a registered user
  if (creditorUserId) {
    console.log(`[settlementService] Attempting to create 'owed' settlement for creditor user ${creditorUserId}`);
    const { error } = await supabase.from('settlements').insert({
      user_id: creditorUserId,
      name: debtor.name,
      email: debtorEmail,
      upi_id: creditor.upi_id || '',
      type: 'owed' as const,
      amount,
      status: 'pending',
      transaction_group_id: transactionGroupId,
    });
    if (error) { 
        console.error("[settlementService] Error inserting creditor settlement:", error); 
        throw error; 
    }
    console.log(`[settlementService] Successfully created 'owed' settlement for creditor user ${creditorUserId}`);
  } else {
    console.warn(`[settlementService] SKIPPED: Could not create 'owed' settlement for creditor ${creditor.name} (${creditor.email}) because they do not appear to be a registered user (profile not found).`);
  }
};

// NEW: Fetch settled transactions for a specific month
export const fetchSettledTransactionsForMonth = async (
  supabase: SupabaseClient,
  userId: string,
  year: number,
  month: number
): Promise<Settlement[]> => {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  console.log(`[settlementService] Fetching settled transactions for user ${userId} between ${startDate.toISOString()} and ${endDate.toISOString()}`);

  const { data, error } = await supabase
    .from('settlements')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'settled')
    .gte('settled_date', startDate.toISOString())
    .lte('settled_date', endDate.toISOString())
    .order('settled_date', { ascending: false });

  if (error) {
    console.error(`[settlementService] Error fetching settled transactions:`, error);
    throw error;
  }
  if (!data) return [];

  const mappedSettlements = data.map(mapSupabaseToSettlement);
  console.log(`[settlementService] Successfully fetched ${mappedSettlements.length} settled transactions for the month.`);
  return mappedSettlements || [];
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
