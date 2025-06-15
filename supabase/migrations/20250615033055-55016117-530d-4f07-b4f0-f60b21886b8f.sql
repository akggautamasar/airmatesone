
-- Drop the existing trigger and function first
DROP TRIGGER IF EXISTS create_settlements_trigger ON public.expenses;
DROP FUNCTION IF EXISTS public.create_settlements_for_expense();

-- Check existing settlements table structure and update it to match our needs
-- The existing table uses different column names, so let's add the missing columns

-- Add missing columns to settlements table
ALTER TABLE public.settlements 
ADD COLUMN IF NOT EXISTS expense_id uuid REFERENCES public.expenses(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS debtor_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS creditor_user_id uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS marked_by_debtor boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS marked_by_creditor boolean DEFAULT false;

-- Update RLS policies for the new columns
DROP POLICY IF EXISTS "Users can view settlements they are involved in" ON public.settlements;
DROP POLICY IF EXISTS "Users can update settlements they are involved in" ON public.settlements;
DROP POLICY IF EXISTS "System can create settlements" ON public.settlements;

CREATE POLICY "Users can view settlements they are involved in" ON public.settlements
  FOR SELECT USING (
    auth.uid() = debtor_user_id OR 
    auth.uid() = creditor_user_id OR
    auth.uid() = user_id
  );

CREATE POLICY "Users can update settlements they are involved in" ON public.settlements
  FOR UPDATE USING (
    auth.uid() = debtor_user_id OR 
    auth.uid() = creditor_user_id OR
    auth.uid() = user_id
  );

CREATE POLICY "System can create settlements" ON public.settlements
  FOR INSERT WITH CHECK (true);

-- Create function to automatically create settlements when expense is created
CREATE OR REPLACE FUNCTION public.create_settlements_for_expense()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  sharer_email text;
  sharer_user_id uuid;
  payer_user_id uuid;
  split_amount numeric;
  num_sharers integer;
BEGIN
  -- Get the payer's user_id
  payer_user_id := NEW.user_id;
  
  -- If no sharers specified, don't create settlements
  IF NEW.sharers IS NULL OR array_length(NEW.sharers, 1) IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate split amount
  num_sharers := array_length(NEW.sharers, 1);
  IF num_sharers > 0 THEN
    split_amount := NEW.amount / num_sharers;
    
    -- Create settlement entries for each sharer (except the payer unless they're in sharers list)
    FOREACH sharer_email IN ARRAY NEW.sharers
    LOOP
      -- Find user_id for this sharer email
      SELECT id INTO sharer_user_id 
      FROM auth.users 
      WHERE email = sharer_email;
      
      -- Only create settlement if sharer is not the payer
      IF sharer_user_id IS NOT NULL AND sharer_user_id != payer_user_id THEN
        INSERT INTO public.settlements (
          expense_id,
          debtor_user_id,
          creditor_user_id,
          amount,
          user_id,
          name,
          email,
          upi_id,
          type
        ) VALUES (
          NEW.id,
          sharer_user_id,
          payer_user_id,
          split_amount,
          payer_user_id,
          (SELECT email FROM auth.users WHERE id = sharer_user_id),
          (SELECT email FROM auth.users WHERE id = sharer_user_id),
          (SELECT upi_id FROM public.profiles WHERE id = payer_user_id),
          'owed'
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger to automatically create settlements
CREATE TRIGGER create_settlements_trigger
  AFTER INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.create_settlements_for_expense();
