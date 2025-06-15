
-- Enable RLS on shopping_lists table
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;

-- Enable RLS on shopping_list_items table  
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Enable RLS on products table
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Policy for shopping_lists: All authenticated users can view all shopping lists
CREATE POLICY "All users can view shopping lists" 
  ON public.shopping_lists 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Policy for shopping_lists: All authenticated users can create shopping lists
CREATE POLICY "All users can create shopping lists" 
  ON public.shopping_lists 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for shopping_lists: All authenticated users can update shopping lists
CREATE POLICY "All users can update shopping lists" 
  ON public.shopping_lists 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Policy for shopping_list_items: All authenticated users can view all shopping list items
CREATE POLICY "All users can view shopping list items" 
  ON public.shopping_list_items 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Policy for shopping_list_items: All authenticated users can add items to shopping lists
CREATE POLICY "All users can add shopping list items" 
  ON public.shopping_list_items 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for shopping_list_items: All authenticated users can update shopping list items
CREATE POLICY "All users can update shopping list items" 
  ON public.shopping_list_items 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Policy for shopping_list_items: All authenticated users can delete shopping list items
CREATE POLICY "All users can delete shopping list items" 
  ON public.shopping_list_items 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);

-- Policy for products: All authenticated users can view all products
CREATE POLICY "All users can view products" 
  ON public.products 
  FOR SELECT 
  USING (auth.uid() IS NOT NULL);

-- Policy for products: All authenticated users can create products
CREATE POLICY "All users can create products" 
  ON public.products 
  FOR INSERT 
  WITH CHECK (auth.uid() IS NOT NULL);

-- Policy for products: All authenticated users can update products
CREATE POLICY "All users can update products" 
  ON public.products 
  FOR UPDATE 
  USING (auth.uid() IS NOT NULL);

-- Policy for products: All authenticated users can delete products
CREATE POLICY "All users can delete products" 
  ON public.products 
  FOR DELETE 
  USING (auth.uid() IS NOT NULL);
