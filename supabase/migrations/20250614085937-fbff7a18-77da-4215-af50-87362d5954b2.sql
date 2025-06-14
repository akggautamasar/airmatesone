
-- Drop the existing check constraint if it exists to avoid conflicts
ALTER TABLE public.settlements
DROP CONSTRAINT IF EXISTS settlement_status_check;

-- Add a new check constraint with the correct allowed status values
ALTER TABLE public.settlements
ADD CONSTRAINT settlement_status_check
CHECK (status IN ('pending', 'debtor_paid', 'settled'));

-- Optional: Add a comment to describe the constraint
COMMENT ON CONSTRAINT settlement_status_check ON public.settlements IS 'Ensures the status column only accepts valid settlement states: pending, debtor_paid, or settled.';
