-- Fix settlement creation to use the person who PAID, not who added the expense
CREATE OR REPLACE FUNCTION public.create_settlements_for_expense()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
DECLARE
  sharer_email text;
  sharer_user_id uuid;
  payer_user_id uuid;
  payer_profile_record RECORD;
  split_amount numeric;
  num_sharers integer;
BEGIN
  -- Get the payer's user_id from the paid_by email field
  SELECT id INTO payer_user_id
  FROM auth.users
  WHERE email = NEW.paid_by;
  
  -- If payer not found, don't create settlements
  IF payer_user_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Get payer's profile information (name and UPI ID)
  SELECT name, upi_id INTO payer_profile_record
  FROM public.profiles 
  WHERE id = payer_user_id;
  
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
        -- Create settlement for the PAYER (showing who owes them)
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
          sharer_user_id,  -- The sharer is the debtor
          payer_user_id,   -- The payer is the creditor
          split_amount,
          payer_user_id,   -- This settlement belongs to the payer's view
          (SELECT name FROM public.profiles WHERE id = sharer_user_id), -- Sharer's name
          sharer_email,    -- Sharer's email
          payer_profile_record.upi_id, -- Payer's UPI ID (where money should be sent)
          'owed'          -- Payer is owed money
        );
        
        -- Create settlement for the SHARER (showing who they owe)
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
          sharer_user_id,  -- The sharer is the debtor
          payer_user_id,   -- The payer is the creditor
          split_amount,
          sharer_user_id,  -- This settlement belongs to the sharer's view
          payer_profile_record.name, -- Payer's name
          NEW.paid_by, -- Payer's email
          payer_profile_record.upi_id, -- Payer's UPI ID (where money should be sent)
          'owes'          -- Sharer owes money
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;