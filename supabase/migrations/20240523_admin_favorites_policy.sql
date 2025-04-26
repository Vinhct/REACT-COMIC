-- Thêm policy để admin có thể xem tất cả favorites
DROP POLICY IF EXISTS "Admins can view all favorites" ON public.favorites;

-- Tạo policy cho phép admin xem tất cả favorites
CREATE POLICY "Admins can view all favorites" 
ON public.favorites FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
);

-- Thêm policy để admin có thể xóa bất kỳ favorites nào
DROP POLICY IF EXISTS "Admins can delete any favorites" ON public.favorites;

CREATE POLICY "Admins can delete any favorites" 
ON public.favorites FOR DELETE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
); 