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
    name: row.name,
    amount: row.amount,
    type: row.type as "owes" | "owed",
    upiId: row.upi_id,
    email: row.email,
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
        const mappedSettlements = data.map(mapSupabaseToSettlement);
        setSettlements(mappedSettlements || []);
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
  ): Promise<Settlement | null> => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return null;
    }

    const transactionGroupId = uuidv4();
    
    const newSettlementEntryForDb: TablesInsert<'settlements'> = {
        user_id: user.id,
        name: currentUserInvolves.type === 'owes' ? otherPartyInvolves.name : currentUserInvolves.name,
        email: currentUserInvolves.type === 'owes' ? otherPartyInvolves.email : currentUserInvolves.email,
        upi_id: currentUserInvolves.type === 'owes' ? otherPartyInvolves.upi_id : currentUserInvolves.upi_id,
        type: currentUserInvolves.type,
        amount,
        status: 'pending', // Explicitly 'pending'
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
            const otherPartySettlementEntryForDb: TablesInsert<'settlements'> = {
                user_id: otherUserId,
                name: currentUserInvolves.name,
                email: user.email || '',
                upi_id: otherPartyInvolves.type === 'owes' ? currentUserInvolves.upi_id : otherPartyInvolves.upi_id,
                type: otherPartyInvolves.type,
                amount,
                status: 'pending', // Explicitly 'pending'
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
      return;
    }

    // This check is mostly for runtime robustness, TypeScript handles compile-time.
    if (!['pending', 'debtor_paid', 'settled'].includes(newStatus)) {
        console.error(`CRITICAL: Invalid status value ('${newStatus}') passed to updateSettlementStatusByGroupId. This should not happen with TypeScript.`);
        toast({ title: "Critical Error", description: "Invalid status value for update.", variant: "destructive" });
        return;
    }

    try {
      const updatePayloadForDb: TablesUpdate<'settlements'> = { 
        status: newStatus,
        settled_date: newStatus === 'settled' ? new Date().toISOString() : null,
      };
      
      console.log(`Attempting to update settlement group ${transaction_group_id} to status '${newStatus}'. Payload (useSettlements):`, JSON.stringify(updatePayloadForDb));

      const { error } = await supabase
        .from('settlements')
        .update(updatePayloadForDb)
        .eq('transaction_group_id', transaction_group_id);

      if (error) {
        console.error(`Error updating settlement status by group (useSettlements) for group ${transaction_group_id} to status '${newStatus}':`, error, "Payload:", JSON.stringify(updatePayloadForDb));
        throw error;
      }
      
      await fetchSettlements(); 
      toast({ title: "Settlement Updated", description: `Settlement status changed to ${newStatus}.` });
    } catch (error: any) {
      console.error(`Catch error updating settlement status by group (useSettlements) for group ${transaction_group_id} to status '${newStatus}':`, error);
      toast({ title: "Error", description: `Failed to update settlement: ${error.message}`, variant: "destructive" });
    }
  };

  return { settlements, loading, addSettlementPair, updateSettlementStatusByGroupId, refetchSettlements: fetchSettlements };
};
