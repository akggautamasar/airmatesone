
-- Create products table for master product list
CREATE TABLE public.products (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT,
  unit TEXT,
  created_by UUID REFERENCES auth.users NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create shopping_lists table for date-based lists
CREATE TABLE public.shopping_lists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  created_by UUID REFERENCES auth.users NOT NULL,
  is_market_notification_sent BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(date) -- One list per date
);

-- Create shopping_list_items table
CREATE TABLE public.shopping_list_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shopping_list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  custom_product_name TEXT, -- For custom products not in master list
  quantity TEXT NOT NULL,
  added_by UUID REFERENCES auth.users NOT NULL,
  is_purchased BOOLEAN DEFAULT FALSE,
  purchased_by UUID REFERENCES auth.users,
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  -- Either product_id OR custom_product_name should be set
  CONSTRAINT check_product_reference CHECK (
    (product_id IS NOT NULL AND custom_product_name IS NULL) OR
    (product_id IS NULL AND custom_product_name IS NOT NULL)
  )
);

-- Add Row Level Security (RLS) policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Products policies - all authenticated users can read, only creator can modify
CREATE POLICY "Anyone can view products" ON public.products FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create products" ON public.products FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update their own products" ON public.products FOR UPDATE TO authenticated USING (auth.uid() = created_by);
CREATE POLICY "Users can delete their own products" ON public.products FOR DELETE TO authenticated USING (auth.uid() = created_by);

-- Shopping lists policies - all authenticated users can access
CREATE POLICY "Anyone can view shopping lists" ON public.shopping_lists FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create shopping lists" ON public.shopping_lists FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Users can update shopping lists" ON public.shopping_lists FOR UPDATE TO authenticated USING (true);

-- Shopping list items policies - all authenticated users can access
CREATE POLICY "Anyone can view shopping list items" ON public.shopping_list_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can create shopping list items" ON public.shopping_list_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = added_by);
CREATE POLICY "Users can update shopping list items" ON public.shopping_list_items FOR UPDATE TO authenticated USING (true);
CREATE POLICY "Users can delete their own shopping list items" ON public.shopping_list_items FOR DELETE TO authenticated USING (auth.uid() = added_by);

-- Create indexes for better performance
CREATE INDEX idx_products_name ON public.products(name);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_shopping_lists_date ON public.shopping_lists(date);
CREATE INDEX idx_shopping_list_items_list_id ON public.shopping_list_items(shopping_list_id);
CREATE INDEX idx_shopping_list_items_added_by ON public.shopping_list_items(added_by);

-- Function to create notifications for market trips and purchases
CREATE OR REPLACE FUNCTION public.create_shopping_notifications()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_name text;
  product_display_name text;
  all_users RECORD;
BEGIN
  -- Get user name
  SELECT name INTO user_name
  FROM public.profiles 
  WHERE id = CASE 
    WHEN TG_OP = 'UPDATE' THEN NEW.purchased_by
    ELSE NEW.added_by
  END;
  
  -- Handle purchase notifications
  IF TG_OP = 'UPDATE' AND NEW.is_purchased = true AND OLD.is_purchased = false THEN
    -- Determine product name
    IF NEW.product_id IS NOT NULL THEN
      SELECT name INTO product_display_name FROM public.products WHERE id = NEW.product_id;
    ELSE
      product_display_name := NEW.custom_product_name;
    END IF;
    
    -- Create notification for all users
    FOR all_users IN 
      SELECT DISTINCT id FROM auth.users WHERE id != NEW.purchased_by
    LOOP
      INSERT INTO public.notifications (
        user_id,
        title,
        message,
        type
      ) VALUES (
        all_users.id,
        'Item Purchased',
        '✅ ' || COALESCE(product_display_name, 'Item') || ' (' || NEW.quantity || ') has been purchased by ' || COALESCE(user_name, 'someone') || '.',
        'shopping_purchase'
      );
    END LOOP;
  END IF;
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create trigger for shopping notifications
CREATE TRIGGER shopping_notifications_trigger
  AFTER UPDATE ON public.shopping_list_items
  FOR EACH ROW
  EXECUTE FUNCTION public.create_shopping_notifications();

-- Function to send market notification
CREATE OR REPLACE FUNCTION public.send_market_notification(shopping_list_id_param UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_name text;
  list_date date;
  all_users RECORD;
BEGIN
  -- Get user name and list date
  SELECT 
    p.name,
    sl.date
  INTO user_name, list_date
  FROM public.shopping_lists sl
  JOIN public.profiles p ON p.id = auth.uid()
  WHERE sl.id = shopping_list_id_param;
  
  -- Create notification for all users except the one going to market
  FOR all_users IN 
    SELECT DISTINCT id FROM auth.users WHERE id != auth.uid()
  LOOP
    INSERT INTO public.notifications (
      user_id,
      title,
      message,
      type
    ) VALUES (
      all_users.id,
      'Market Trip',
      '🛍️ ' || COALESCE(user_name, 'Someone') || ' is going to market. Add your items to today''s shopping list.',
      'market_trip'
    );
  END LOOP;
  
  -- Mark notification as sent
  UPDATE public.shopping_lists 
  SET is_market_notification_sent = true
  WHERE id = shopping_list_id_param;
END;
$$;
