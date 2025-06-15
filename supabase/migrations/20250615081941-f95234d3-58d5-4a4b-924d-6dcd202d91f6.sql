
-- Create a table to track who is going to market
CREATE TABLE public.market_trips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users,
  user_name TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add Row Level Security
ALTER TABLE public.market_trips ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all authenticated users to see all market trips
CREATE POLICY "Users can view all market trips" 
  ON public.market_trips 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Create policy that allows users to insert their own market trips
CREATE POLICY "Users can create their own market trips" 
  ON public.market_trips 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Create policy that allows users to update their own market trips
CREATE POLICY "Users can update their own market trips" 
  ON public.market_trips 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- Create policy that allows users to delete their own market trips
CREATE POLICY "Users can delete their own market trips" 
  ON public.market_trips 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- Create function to send market notifications
CREATE OR REPLACE FUNCTION public.create_market_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  all_users RECORD;
BEGIN
  -- Only send notifications when a new market trip is created (INSERT)
  IF TG_OP = 'INSERT' AND NEW.is_active = true THEN
    -- Create notification for all users except the one going to market
    FOR all_users IN 
      SELECT DISTINCT id FROM auth.users WHERE id != NEW.user_id
    LOOP
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type
      ) VALUES (
        all_users.id,
        'Market Trip',
        '🛍️ ' || NEW.user_name || ' is going to market. Add your items to the shared shopping list.',
        'market_trip'
      );
    END LOOP;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for market notifications
CREATE TRIGGER market_notifications_trigger
  AFTER INSERT OR UPDATE ON public.market_trips
  FOR EACH ROW EXECUTE FUNCTION public.create_market_notifications();
