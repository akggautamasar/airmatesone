
-- Create a custom type to hold user details
-- This type will be used as the return type for our new function.
CREATE TYPE public.user_details AS (
  id uuid,
  name text,
  email text
);

-- Create a function to get user details for a list of user IDs.
-- It fetches the name from the public.profiles table if available,
-- and the email from the auth.users table as a fallback.
-- This helps display user information even for users who might not have a profile entry.
CREATE OR REPLACE FUNCTION public.get_users_details(p_user_ids uuid[])
RETURNS SETOF public.user_details
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    p.name,
    u.email
  FROM auth.users AS u
  LEFT JOIN public.profiles AS p ON u.id = p.id
  WHERE u.id = ANY(p_user_ids);
END;
$$;
