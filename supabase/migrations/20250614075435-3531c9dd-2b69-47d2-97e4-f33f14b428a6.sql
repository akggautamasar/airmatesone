
-- Migration to add 'sharers' column to the 'expenses' table
ALTER TABLE public.expenses
ADD COLUMN sharers TEXT[] NULL;

-- Optional: Add a comment to describe the new column
COMMENT ON COLUMN public.expenses.sharers IS 'Array of names/identifiers of individuals who share this expense.';

