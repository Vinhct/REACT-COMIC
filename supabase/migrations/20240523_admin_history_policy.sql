-- Thêm policy để admin có thể xem tất cả lịch sử đọc
DROP POLICY IF EXISTS "Admins can view all reading history" ON public.reading_history;

-- Tạo policy cho phép admin xem tất cả lịch sử đọc
CREATE POLICY "Admins can view all reading history" 
ON public.reading_history FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
);

-- Thêm policy để admin có thể xóa bất kỳ lịch sử đọc nào
DROP POLICY IF EXISTS "Admins can delete any reading history" ON public.reading_history;

CREATE POLICY "Admins can delete any reading history" 
ON public.reading_history FOR DELETE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
); 