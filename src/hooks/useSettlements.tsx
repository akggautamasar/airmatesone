
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Settlement } from '@/components/SettlementHistory'; // Assuming Settlement type is exported
import { v4 as uuidv4 } from 'uuid';
import { Tables } from '@/integrations/supabase/types'; // Import Supabase Row type

// Helper function to map Supabase row to frontend Settlement type
const mapSupabaseToSettlement = (row: Tables<'settlements'>): Settlement => {
  return {
    id: row.id,
    name: row.name,
    amount: row.amount,
    type: row.type as "owes" | "owed", // Cast because DB 'type' is generic string
    upiId: row.upi_id, // Map snake_case to camelCase
    email: row.email,
    status: row.status as "pending" | "debtor_paid" | "settled", // Cast status
    settledDate: row.settled_date || undefined, // Map snake_case to camelCase, handle null
    transaction_group_id: row.transaction_group_id || undefined,
    user_id: row.user_id,
    // created_at and updated_at are not in Settlement interface, so not mapped here
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
        // Map supabase data (snake_case) to frontend Settlement type (camelCase for specific fields)
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
    
    // Data for Supabase insertion (uses snake_case)
    const newSettlementEntryForDb = {
        user_id: user.id,
        name: currentUserInvolves.type === 'owes' ? otherPartyInvolves.name : currentUserInvolves.name,
        email: currentUserInvolves.type === 'owes' ? otherPartyInvolves.email : currentUserInvolves.email,
        upi_id: currentUserInvolves.type === 'owes' ? otherPartyInvolves.upi_id : currentUserInvolves.upi_id,
        type: currentUserInvolves.type,
        amount,
        status: 'pending' as const,
        transaction_group_id: transactionGroupId,
    };

    try {
        const { data: currentUserData, error: currentUserError } = await supabase
            .from('settlements')
            .insert(newSettlementEntryForDb)
            .select()
            .single();

        if (currentUserError) throw currentUserError;
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
            console.warn("Could not find profile for other user by email:", otherPartyInvolves.email, "settlement will only be one-sided for now.");
        }
        
        if (otherUserId) {
            const otherPartySettlementEntryForDb = {
                user_id: otherUserId, // This is the crucial part for the other user's record
                name: currentUserInvolves.name, // Name of the person they are settling with (current user)
                email: user.email || '',  // Email of the person they are settling with (current user)
                upi_id: otherPartyInvolves.type === 'owes' ? currentUserInvolves.upi_id : otherPartyInvolves.upi_id, // UPI ID for their perspective
                type: otherPartyInvolves.type, // Their perspective of the transaction ('owes' or 'owed')
                amount,
                status: 'pending' as const,
                transaction_group_id: transactionGroupId,
            };
            const { error: otherUserError } = await supabase
                .from('settlements')
                .insert(otherPartySettlementEntryForDb);
            if (otherUserError) {
                 console.error("Failed to create settlement record for other party:", otherUserError);
                 // Potentially toast an error here, but don't block the current user's settlement
            }
        }

      await fetchSettlements(); // Refetch all settlements for the current user
      toast({ title: "Settlement Initiated", description: "The settlement has been recorded." });
      
      // Map the returned Supabase row to the frontend Settlement type
      return mapSupabaseToSettlement(currentUserData);
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
      // Payload for Supabase update (uses snake_case for DB columns)
      const updatePayloadForDb: { status: string; settled_date?: string } = { status: newStatus };
      if (newStatus === 'settled') {
        updatePayloadForDb.settled_date = new Date().toISOString();
      }

      const { error } = await supabase
        .from('settlements')
        .update(updatePayloadForDb)
        .eq('transaction_group_id', transaction_group_id); // This updates ALL records with this group ID

      if (error) {
        console.error('Error updating settlement status by group:', error);
        throw error; // Re-throw to be caught by the caller or the catch block below
      }
      
      // Important: After updating, both users' local state (if they are online) should reflect this.
      // `fetchSettlements()` only updates for the current user.
      // For real-time updates for the other user, Supabase Realtime would be needed.
      // For now, this ensures the current user sees the update.
      await fetchSettlements(); 
      toast({ title: "Settlement Updated", description: `Settlement status changed to ${newStatus}.` });
    } catch (error: any) {
      console.error('Catch error updating settlement status by group:', error);
      toast({ title: "Error", description: `Failed to update settlement: ${error.message}`, variant: "destructive" });
    }
  };

  return { settlements, loading, addSettlementPair, updateSettlementStatusByGroupId, refetchSettlements: fetchSettlements };
};

