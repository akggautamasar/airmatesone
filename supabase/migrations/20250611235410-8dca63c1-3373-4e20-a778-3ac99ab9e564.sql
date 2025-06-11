
-- Create user profiles table
CREATE TABLE public.profiles (
  id uuid NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  PRIMARY KEY (id)
);

-- Create roommates table
CREATE TABLE public.roommates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  upi_id text NOT NULL,
  email text NOT NULL,
  phone text,
  balance numeric DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create expenses table
CREATE TABLE public.expenses (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  description text NOT NULL,
  amount numeric NOT NULL,
  paid_by text NOT NULL,
  category text NOT NULL,
  date timestamp with time zone NOT NULL DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create expense splits table
CREATE TABLE public.expense_splits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id uuid REFERENCES public.expenses ON DELETE CASCADE NOT NULL,
  roommate_id uuid REFERENCES public.roommates ON DELETE CASCADE NOT NULL,
  amount numeric NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create settlements table
CREATE TABLE public.settlements (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL,
  type text NOT NULL CHECK (type IN ('owes', 'owed')),
  upi_id text NOT NULL,
  email text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'settled')),
  settled_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create grocery list table
CREATE TABLE public.grocery_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users NOT NULL,
  name text NOT NULL,
  category text NOT NULL,
  quantity text,
  is_completed boolean DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.roommates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_splits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create RLS policies for roommates
CREATE POLICY "Users can view their own roommates" ON public.roommates
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own roommates" ON public.roommates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own roommates" ON public.roommates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own roommates" ON public.roommates
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for expenses
CREATE POLICY "Users can view their own expenses" ON public.expenses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own expenses" ON public.expenses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own expenses" ON public.expenses
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own expenses" ON public.expenses
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for expense splits
CREATE POLICY "Users can view expense splits for their expenses" ON public.expense_splits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.expenses 
      WHERE expenses.id = expense_splits.expense_id 
      AND expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create expense splits for their expenses" ON public.expense_splits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.expenses 
      WHERE expenses.id = expense_splits.expense_id 
      AND expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update expense splits for their expenses" ON public.expense_splits
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.expenses 
      WHERE expenses.id = expense_splits.expense_id 
      AND expenses.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete expense splits for their expenses" ON public.expense_splits
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.expenses 
      WHERE expenses.id = expense_splits.expense_id 
      AND expenses.user_id = auth.uid()
    )
  );

-- Create RLS policies for settlements
CREATE POLICY "Users can view their own settlements" ON public.settlements
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own settlements" ON public.settlements
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own settlements" ON public.settlements
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own settlements" ON public.settlements
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for grocery items
CREATE POLICY "Users can view their own grocery items" ON public.grocery_items
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own grocery items" ON public.grocery_items
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own grocery items" ON public.grocery_items
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own grocery items" ON public.grocery_items
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (new.id, new.email, new.raw_user_meta_data ->> 'full_name');
  RETURN new;
END;
$$;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
