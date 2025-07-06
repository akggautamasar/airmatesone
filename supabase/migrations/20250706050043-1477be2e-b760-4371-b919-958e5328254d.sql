
-- Create expense tracker tables for personal use
CREATE TABLE public.expense_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  icon TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name, type)
);

CREATE TABLE public.expense_subcategories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, name)
);

CREATE TABLE public.payment_modes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('cash', 'bank', 'wallet', 'card', 'upi')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

CREATE TABLE public.personal_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  transaction_date DATE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
  category_id UUID REFERENCES public.expense_categories(id) NOT NULL,
  subcategory_id UUID REFERENCES public.expense_subcategories(id),
  payment_mode_id UUID REFERENCES public.payment_modes(id) NOT NULL,
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  notes TEXT,
  voice_note_url TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurring_frequency TEXT CHECK (recurring_frequency IN ('daily', 'weekly', 'monthly', 'yearly')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.monthly_budgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL,
  category_id UUID REFERENCES public.expense_categories(id) NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL,
  budget_amount DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, category_id, month, year)
);

-- Add Row Level Security (RLS) policies
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_subcategories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_modes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_budgets ENABLE ROW LEVEL SECURITY;

-- RLS policies for expense_categories
CREATE POLICY "Users can manage their own expense categories" ON public.expense_categories
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for expense_subcategories
CREATE POLICY "Users can manage their own expense subcategories" ON public.expense_subcategories
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for payment_modes
CREATE POLICY "Users can manage their own payment modes" ON public.payment_modes
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for personal_transactions
CREATE POLICY "Users can manage their own transactions" ON public.personal_transactions
  FOR ALL USING (auth.uid() = user_id);

-- RLS policies for monthly_budgets
CREATE POLICY "Users can manage their own budgets" ON public.monthly_budgets
  FOR ALL USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX idx_personal_transactions_user_date ON public.personal_transactions(user_id, transaction_date DESC);
CREATE INDEX idx_personal_transactions_category ON public.personal_transactions(category_id);
CREATE INDEX idx_expense_subcategories_category ON public.expense_subcategories(category_id);
CREATE INDEX idx_monthly_budgets_user_date ON public.monthly_budgets(user_id, year, month);

-- Insert default categories and payment modes
INSERT INTO public.expense_categories (user_id, name, type, icon, color) VALUES
  -- Default expense categories
  ((SELECT id FROM auth.users LIMIT 1), 'Food & Dining', 'expense', '🍽️', '#FF6B6B'),
  ((SELECT id FROM auth.users LIMIT 1), 'Transportation', 'expense', '🚗', '#4ECDC4'),
  ((SELECT id FROM auth.users LIMIT 1), 'Shopping', 'expense', '🛍️', '#45B7D1'),
  ((SELECT id FROM auth.users LIMIT 1), 'Entertainment', 'expense', '🎬', '#96CEB4'),
  ((SELECT id FROM auth.users LIMIT 1), 'Bills & Utilities', 'expense', '💡', '#FFEAA7'),
  ((SELECT id FROM auth.users LIMIT 1), 'Healthcare', 'expense', '🏥', '#DDA0DD'),
  ((SELECT id FROM auth.users LIMIT 1), 'Education', 'expense', '📚', '#98D8E8'),
  ((SELECT id FROM auth.users LIMIT 1), 'Travel', 'expense', '✈️', '#F7DC6F'),
  -- Default income categories
  ((SELECT id FROM auth.users LIMIT 1), 'Salary', 'income', '💰', '#52C41A'),
  ((SELECT id FROM auth.users LIMIT 1), 'Freelance', 'income', '💻', '#13C2C2'),
  ((SELECT id FROM auth.users LIMIT 1), 'Investment', 'income', '📈', '#722ED1'),
  ((SELECT id FROM auth.users LIMIT 1), 'Business', 'income', '🏢', '#FA8C16')
ON CONFLICT (user_id, name, type) DO NOTHING;

-- Insert default payment modes
INSERT INTO public.payment_modes (user_id, name, type) VALUES
  ((SELECT id FROM auth.users LIMIT 1), 'Cash', 'cash'),
  ((SELECT id FROM auth.users LIMIT 1), 'Debit Card', 'card'),
  ((SELECT id FROM auth.users LIMIT 1), 'Credit Card', 'card'),
  ((SELECT id FROM auth.users LIMIT 1), 'UPI', 'upi'),
  ((SELECT id FROM auth.users LIMIT 1), 'Net Banking', 'bank'),
  ((SELECT id FROM auth.users LIMIT 1), 'Paytm', 'wallet'),
  ((SELECT id FROM auth.users LIMIT 1), 'PhonePe', 'wallet'),
  ((SELECT id FROM auth.users LIMIT 1), 'Google Pay', 'wallet')
ON CONFLICT (user_id, name) DO NOTHING;

-- Create triggers for updated_at columns
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_timestamp_expense_categories
    BEFORE UPDATE ON public.expense_categories
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_expense_subcategories
    BEFORE UPDATE ON public.expense_subcategories
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_payment_modes
    BEFORE UPDATE ON public.payment_modes
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_personal_transactions
    BEFORE UPDATE ON public.personal_transactions
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();

CREATE TRIGGER set_timestamp_monthly_budgets
    BEFORE UPDATE ON public.monthly_budgets
    FOR EACH ROW
    EXECUTE PROCEDURE trigger_set_timestamp();
