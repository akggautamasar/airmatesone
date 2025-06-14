
-- Add a column to group settlement records for the same transaction
ALTER TABLE public.settlements
ADD COLUMN transaction_group_id UUID;

COMMENT ON COLUMN public.settlements.transaction_group_id IS 'Links settlement records for the same transaction, e.g., one for the debtor and one for the creditor.';

-- Also, let's ensure the status column can hold our new status values.
-- Since it's already 'text', no change is needed, but the allowed values will be:
-- 'pending': Initial state.
-- 'debtor_paid': Debtor has marked it as paid, awaiting creditor confirmation.
-- 'settled': Creditor has confirmed receipt.

-- We should also ensure RLS policies allow users to manage their settlements.
-- If these are not already in place or are too restrictive for the new flow, they might need adjustment.
-- For now, we assume basic RLS like:
-- ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY "Users can manage their own settlements" ON public.settlements
-- FOR ALL USING (auth.uid() = user_id);
-- (More granular policies might be needed for specific status transitions later)
