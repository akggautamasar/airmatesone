
-- Re-create the function to get user details for a list of user IDs.
-- This version checks both `name` and `full_name` from the user's profile
-- to ensure we can display a name if one exists.
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
    COALESCE(p.name, p.full_name),
    u.email::text -- Cast to text
  FROM auth.users AS u
  LEFT JOIN public.profiles AS p ON u.id = p.id
  WHERE u.id = ANY(p_user_ids);
END;
$$;
