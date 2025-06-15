
-- Create notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users,
  title text NOT NULL,
  message text NOT NULL,
  type text NOT NULL DEFAULT 'expense',
  expense_id uuid REFERENCES public.expenses,
  settlement_id uuid REFERENCES public.settlements,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create notification_reminders table to track reminder scheduling
CREATE TABLE public.notification_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id uuid NOT NULL REFERENCES public.expenses,
  debtor_user_id uuid NOT NULL REFERENCES auth.users,
  creditor_user_id uuid NOT NULL REFERENCES auth.users,
  settlement_id uuid REFERENCES public.settlements,
  reminder_sent_at timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Add RLS policies for notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications" 
  ON public.notifications 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Add RLS policies for notification_reminders
ALTER TABLE public.notification_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view reminders related to them" 
  ON public.notification_reminders 
  FOR SELECT 
  USING (auth.uid() = debtor_user_id OR auth.uid() = creditor_user_id);

-- Function to create notifications when expense is added
CREATE OR REPLACE FUNCTION public.create_expense_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  sharer_email text;
  sharer_user_id uuid;
  payer_user_id uuid;
  payer_name text;
  split_amount numeric;
  num_sharers integer;
BEGIN
  -- Get the payer's user_id and name
  payer_user_id := NEW.user_id;
  
  -- Get payer's name
  SELECT name INTO payer_name
  FROM public.profiles 
  WHERE id = payer_user_id;
  
  -- If no sharers specified, don't create notifications
  IF NEW.sharers IS NULL OR array_length(NEW.sharers, 1) IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate split amount
  num_sharers := array_length(NEW.sharers, 1);
  IF num_sharers > 0 THEN
    split_amount := NEW.amount / num_sharers;
    
    -- Create notifications for each sharer (except the payer)
    FOREACH sharer_email IN ARRAY NEW.sharers
    LOOP
      -- Find user_id for this sharer email
      SELECT id INTO sharer_user_id 
      FROM auth.users 
      WHERE email = sharer_email;
      
      -- Only create notification if sharer is not the payer and is a registered user
      IF sharer_user_id IS NOT NULL AND sharer_user_id != payer_user_id THEN
        -- Create notification for the debtor
        INSERT INTO public.notifications (
          user_id,
          title,
          message,
          type,
          expense_id
        ) VALUES (
          sharer_user_id,
          'New Expense Added',
          '📢 New Expense Added: ' || NEW.description || ' of ₹' || NEW.amount::text || ' paid by ' || COALESCE(payer_name, 'Unknown') || '. You owe ₹' || split_amount::text || '. Please pay and mark as paid.',
          'expense_created',
          NEW.id
        );
        
        -- Create reminder tracker
        INSERT INTO public.notification_reminders (
          expense_id,
          debtor_user_id,
          creditor_user_id
        ) VALUES (
          NEW.id,
          sharer_user_id,
          payer_user_id
        );
      END IF;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for expense notifications
DROP TRIGGER IF EXISTS on_expense_created ON public.expenses;
CREATE TRIGGER on_expense_created
  AFTER INSERT ON public.expenses
  FOR EACH ROW EXECUTE FUNCTION public.create_expense_notifications();

-- Function to deactivate reminders when settlement is marked as paid/received
CREATE OR REPLACE FUNCTION public.deactivate_expense_reminders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
BEGIN
  -- Deactivate reminders when settlement is marked as settled
  IF NEW.status = 'settled' AND OLD.status != 'settled' THEN
    UPDATE public.notification_reminders
    SET is_active = false,
        updated_at = now()
    WHERE expense_id = NEW.expense_id
      AND (debtor_user_id = NEW.debtor_user_id OR creditor_user_id = NEW.creditor_user_id)
      AND is_active = true;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger for settlement updates
DROP TRIGGER IF EXISTS on_settlement_updated ON public.settlements;
CREATE TRIGGER on_settlement_updated
  AFTER UPDATE ON public.settlements
  FOR EACH ROW EXECUTE FUNCTION public.deactivate_expense_reminders();
