
-- Update the deactivate_expense_reminders function to also create notifications
CREATE OR REPLACE FUNCTION public.deactivate_expense_reminders()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $function$
DECLARE
  debtor_name text;
  creditor_name text;
  expense_description text;
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
  
  -- Create notifications when settlement status changes
  IF NEW.status != OLD.status THEN
    -- Get names and expense details
    SELECT name INTO debtor_name
    FROM public.profiles 
    WHERE id = NEW.debtor_user_id;
    
    SELECT name INTO creditor_name
    FROM public.profiles 
    WHERE id = NEW.creditor_user_id;
    
    SELECT description INTO expense_description
    FROM public.expenses 
    WHERE id = NEW.expense_id;
    
    -- When debtor marks as paid
    IF NEW.status = 'debtor_paid' AND OLD.status = 'pending' THEN
      -- Notify the creditor that payment has been marked as sent
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        settlement_id,
        expense_id
      ) VALUES (
        NEW.creditor_user_id,
        'Payment Marked as Sent',
        '💰 ' || COALESCE(debtor_name, 'Someone') || ' has marked their payment of ₹' || NEW.amount::text || ' as sent for "' || COALESCE(expense_description, 'expense') || '". Please verify and mark as received.',
        'payment_sent',
        NEW.id,
        NEW.expense_id
      );
    END IF;
    
    -- When creditor marks as received (settlement becomes settled)
    IF NEW.status = 'settled' AND OLD.status = 'debtor_paid' THEN
      -- Notify the debtor that payment has been confirmed as received
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        settlement_id,
        expense_id
      ) VALUES (
        NEW.debtor_user_id,
        'Payment Confirmed',
        '✅ ' || COALESCE(creditor_name, 'The recipient') || ' has confirmed receiving your payment of ₹' || NEW.amount::text || ' for "' || COALESCE(expense_description, 'expense') || '". Settlement complete!',
        'payment_received',
        NEW.id,
        NEW.expense_id
      );
    END IF;
    
    -- When settlement is directly marked as settled (both paid and received at once)
    IF NEW.status = 'settled' AND OLD.status = 'pending' THEN
      -- Notify both parties about the settlement
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type,
        settlement_id,
        expense_id
      ) VALUES (
        NEW.debtor_user_id,
        'Settlement Complete',
        '✅ Settlement of ₹' || NEW.amount::text || ' for "' || COALESCE(expense_description, 'expense') || '" has been marked as complete.',
        'settlement_complete',
        NEW.id,
        NEW.expense_id
      ), (
        NEW.creditor_user_id,
        'Settlement Complete',
        '✅ Settlement of ₹' || NEW.amount::text || ' for "' || COALESCE(expense_description, 'expense') || '" has been marked as complete.',
        'settlement_complete',
        NEW.id,
        NEW.expense_id
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;
