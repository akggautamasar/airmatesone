
-- Ensure Row Level Security is enabled for the settlements table
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;

-- Drop the policy if it already exists to avoid errors on re-run
DROP POLICY IF EXISTS "Users can delete settlement groups they participate in" ON public.settlements;

-- Create a policy that allows a user to delete all settlement entries
-- belonging to a transaction_group_id if they are the user_id for at least one
-- entry within that group. This allows a participant to remove the entire paired settlement.
CREATE POLICY "Users can delete settlement groups they participate in"
ON public.settlements
FOR DELETE
USING (
  EXISTS (
    SELECT 1
    FROM public.settlements s_check
    WHERE s_check.transaction_group_id = settlements.transaction_group_id
      AND s_check.user_id = auth.uid()
  )
);
