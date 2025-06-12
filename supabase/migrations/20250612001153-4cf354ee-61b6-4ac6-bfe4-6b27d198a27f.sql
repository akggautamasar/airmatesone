
-- Update the profiles table to include name and upi_id
ALTER TABLE public.profiles 
ADD COLUMN name text,
ADD COLUMN upi_id text;

-- Update the handle_new_user function to include name from metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, name)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data ->> 'full_name',
    new.raw_user_meta_data ->> 'name'
  );
  RETURN new;
END;
$$;

-- Insert your profile data (you'll need to replace the user_id with your actual user ID)
-- This will be done programmatically after we confirm the migration
