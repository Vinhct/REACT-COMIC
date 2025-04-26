-- Sửa lỗi bảng admin_users không hiển thị đủ dữ liệu
-- Thêm policy mới cho phép tất cả người dùng có thể xem bảng admin_users

-- Xóa các policy cũ nếu tồn tại
DROP POLICY IF EXISTS "admin_users_select_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_insert_policy" ON public.admin_users;
DROP POLICY IF EXISTS "admin_users_delete_policy" ON public.admin_users;

-- Thêm policy mới - Cho phép tất cả mọi người đều có thể xem bảng admin_users
CREATE POLICY "Public can view admin_users" ON public.admin_users
FOR SELECT USING (true);

-- Chỉ admin mới có thể thêm vào bảng admin_users
CREATE POLICY "Only admins can insert admin_users" ON public.admin_users
FOR INSERT TO authenticated 
WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Chỉ admin mới có thể xóa khỏi bảng admin_users
CREATE POLICY "Only admins can delete admin_users" ON public.admin_users
FOR DELETE TO authenticated 
USING (auth.uid() IN (SELECT user_id FROM public.admin_users));

-- Chỉ admin mới có thể cập nhật bảng admin_users
CREATE POLICY "Only admins can update admin_users" ON public.admin_users
FOR UPDATE TO authenticated 
USING (auth.uid() IN (SELECT user_id FROM public.admin_users)); 