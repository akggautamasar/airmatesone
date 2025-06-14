
-- Function to get the email of the currently authenticated user
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$;

-- Function to get the email of any user by their ID
CREATE OR REPLACE FUNCTION public.get_user_email_by_id(user_id_param uuid)
RETURNS TEXT
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = ''
AS $$
  SELECT email FROM auth.users WHERE id = user_id_param;
$$;

-- Drop the existing SELECT policy for roommates
DROP POLICY IF EXISTS "Users can view roommates they created or where they are listed" ON public.roommates;

-- Recreate SELECT policy for roommates using the new function
CREATE POLICY "Users can view roommates they created or where they are listed"
ON public.roommates
FOR SELECT
USING (
  auth.uid() = user_id OR -- User created this roommate entry
  roommates.email = public.get_current_user_email() -- Or, user is listed as a roommate by email
);

-- Drop the existing SELECT policy for expenses
DROP POLICY IF EXISTS "Users can view expenses they created or are involved in" ON public.expenses;

-- Recreate SELECT policy for expenses using the new functions
CREATE POLICY "Users can view expenses they created or are involved in"
ON public.expenses
FOR SELECT
USING (
  auth.uid() = expenses.user_id OR -- User created the expense
  EXISTS ( -- Expense user is a roommate of the current user (current user added them)
    SELECT 1
    FROM public.roommates r
    WHERE r.user_id = auth.uid()
      AND r.email = public.get_user_email_by_id(expenses.user_id)
  ) OR
  EXISTS ( -- Current user is a roommate of the expense user (expense user added current user)
    SELECT 1
    FROM public.roommates r
    WHERE r.user_id = expenses.user_id
      AND r.email = public.get_current_user_email()
  )
);
