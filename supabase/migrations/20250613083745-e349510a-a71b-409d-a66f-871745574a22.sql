
-- Update RLS policies for expenses to allow roommates to see shared expenses
-- First, drop existing policies
DROP POLICY IF EXISTS "Users can view their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can create their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can update their own expenses" ON public.expenses;
DROP POLICY IF EXISTS "Users can delete their own expenses" ON public.expenses;

-- Create new policies that allow roommates to see each other's expenses
CREATE POLICY "Users can view expenses they created or are involved in" 
ON public.expenses 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  EXISTS (
    SELECT 1 FROM public.roommates 
    WHERE roommates.user_id = auth.uid() 
    AND roommates.email = (
      SELECT email FROM auth.users WHERE id = expenses.user_id
    )
  ) OR
  EXISTS (
    SELECT 1 FROM public.roommates 
    WHERE roommates.email = (
      SELECT email FROM auth.users WHERE id = auth.uid()
    )
    AND roommates.user_id = expenses.user_id
  )
);

CREATE POLICY "Users can create their own expenses" 
ON public.expenses 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update expenses they created" 
ON public.expenses 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete expenses they created" 
ON public.expenses 
FOR DELETE 
USING (auth.uid() = user_id);

-- Also update roommates policies to allow cross-visibility
DROP POLICY IF EXISTS "Users can view their own roommates" ON public.roommates;
DROP POLICY IF EXISTS "Users can create their own roommates" ON public.roommates;
DROP POLICY IF EXISTS "Users can update their own roommates" ON public.roommates;
DROP POLICY IF EXISTS "Users can delete their own roommates" ON public.roommates;

-- Allow users to see roommates where they are either the creator or are listed as a roommate
CREATE POLICY "Users can view roommates they created or where they are listed" 
ON public.roommates 
FOR SELECT 
USING (
  auth.uid() = user_id OR 
  email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Users can create their own roommates" 
ON public.roommates 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update roommates they created" 
ON public.roommates 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete roommates they created" 
ON public.roommates 
FOR DELETE 
USING (auth.uid() = user_id);
