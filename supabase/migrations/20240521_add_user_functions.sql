-- Tạo hàm RPC để lấy danh sách tất cả người dùng từ auth.users
CREATE OR REPLACE FUNCTION public.get_all_users()
RETURNS TABLE (
  id uuid,
  email text,
  display_name text
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(up.display_name, au.email) as display_name
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON au.id = up.id
  ORDER BY COALESCE(up.display_name, au.email);
END;
$$;

-- Tạo hàm RPC để lấy danh sách người dùng theo mảng ID
CREATE OR REPLACE FUNCTION public.get_users_by_ids(user_ids uuid[])
RETURNS TABLE (
  id uuid,
  email text,
  display_name text
) 
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    au.id,
    au.email,
    COALESCE(up.display_name, au.email) as display_name
  FROM auth.users au
  LEFT JOIN public.user_profiles up ON au.id = up.id
  WHERE au.id = ANY(user_ids)
  ORDER BY COALESCE(up.display_name, au.email);
END;
$$; 