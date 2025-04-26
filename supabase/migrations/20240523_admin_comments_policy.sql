-- Thêm policy để admin có thể xem tất cả bình luận
DROP POLICY IF EXISTS "Admins can view all comments" ON public.comments;

-- Tạo policy cho phép admin xem tất cả bình luận
CREATE POLICY "Admins can view all comments" 
ON public.comments FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
);

-- Thêm policy để admin có thể xóa bất kỳ bình luận nào
DROP POLICY IF EXISTS "Admins can delete any comments" ON public.comments;

CREATE POLICY "Admins can delete any comments" 
ON public.comments FOR DELETE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
); 