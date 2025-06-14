
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from '@/components/ui/use-toast';
import { Settlement } from '@/components/SettlementHistory';
import { 
  fetchSettlementsFromSupabase,
  addSettlementPairToSupabase,
  updateSettlementStatusInSupabase,
  deleteSettlementGroupFromSupabase 
} from '@/services/settlementService';

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
      console.log(`[useSettlements] Calling service to fetch settlements for user: ${user.id}`);
      const fetchedSettlements = await fetchSettlementsFromSupabase(supabase, user.id);
      setSettlements(fetchedSettlements);
      console.log(`[useSettlements] Successfully fetched ${fetchedSettlements.length} settlements for user ${user.id} via service.`);
    } catch (error) {
      console.error(`[useSettlements] Error fetching settlements for user ${user.id} via service:`, error);
      toast({ title: "Error", description: "Failed to fetch settlements.", variant: "destructive" });
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
    console.log(`[useSettlements] User ${user.id} initiating addSettlementPair.`);
    try {
      const newSettlement = await addSettlementPairToSupabase(
        supabase,
        currentUserInvolves,
        otherPartyInvolves,
        amount,
        user.id
      );
      await fetchSettlements(); // Refetch to update local state
      toast({ title: "Settlement Initiated", description: "The settlement has been recorded." });
      return newSettlement;
    } catch (error: any) {
      console.error(`[useSettlements] Error adding settlement pair for user ${user.id}:`, error);
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
    
    console.log(`[useSettlements] User ${user.id} initiating update for transaction_group_id: ${transaction_group_id} to newStatus: ${newStatus} via service.`);
    try {
      await updateSettlementStatusInSupabase(supabase, transaction_group_id, newStatus, user.id);
      
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
    console.log(`[useSettlements] User ${user.id} attempting to delete settlement group ${transaction_group_id} via service.`);
    try {
      await deleteSettlementGroupFromSupabase(supabase, transaction_group_id, user.id);
      await fetchSettlements();
      toast({ title: "Settlement Deleted", description: "Your settlement record has been removed." }); // Adjusted message based on new RLS
    } catch (error: any) {
      console.error(`[useSettlements] Catch error deleting settlement group ${transaction_group_id} for user ${user.id}:`, error);
      toast({ title: "Error", description: `Failed to delete settlement: ${error.message}`, variant: "destructive" });
    }
  };

  return { settlements, loading, addSettlementPair, updateSettlementStatusByGroupId, deleteSettlementGroup, refetchSettlements: fetchSettlements };
};

