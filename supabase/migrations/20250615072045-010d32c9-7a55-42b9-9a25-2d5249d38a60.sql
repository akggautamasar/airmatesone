
-- Create shared shopping items table
CREATE TABLE public.shared_shopping_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  quantity TEXT NOT NULL,
  category TEXT,
  added_by UUID NOT NULL,
  is_purchased BOOLEAN DEFAULT false,
  purchased_by UUID,
  purchased_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE public.shared_shopping_items 
ADD CONSTRAINT shared_shopping_items_added_by_fkey 
FOREIGN KEY (added_by) REFERENCES auth.users(id) ON DELETE CASCADE;

ALTER TABLE public.shared_shopping_items 
ADD CONSTRAINT shared_shopping_items_purchased_by_fkey 
FOREIGN KEY (purchased_by) REFERENCES auth.users(id) ON DELETE SET NULL;

-- Enable Row Level Security
ALTER TABLE public.shared_shopping_items ENABLE ROW LEVEL SECURITY;

-- Create policies that allow all authenticated users to access shared shopping items
CREATE POLICY "All users can view shared shopping items" 
  ON public.shared_shopping_items 
  FOR SELECT 
  USING (auth.role() = 'authenticated');

CREATE POLICY "All users can create shared shopping items" 
  ON public.shared_shopping_items 
  FOR INSERT 
  WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = added_by);

CREATE POLICY "All users can update shared shopping items" 
  ON public.shared_shopping_items 
  FOR UPDATE 
  USING (auth.role() = 'authenticated');

CREATE POLICY "All users can delete shared shopping items" 
  ON public.shared_shopping_items 
  FOR DELETE 
  USING (auth.role() = 'authenticated');

-- Enable realtime for the shared shopping items table
ALTER TABLE public.shared_shopping_items REPLICA IDENTITY FULL;
