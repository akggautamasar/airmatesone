
-- Re-create the function to get user details for a list of user IDs.
-- This version casts u.email to text to fix a type mismatch error.
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
    u.email::text -- Cast to text
  FROM auth.users AS u
  LEFT JOIN public.profiles AS p ON u.id = p.id
  WHERE u.id = ANY(p_user_ids);
END;
$$;
