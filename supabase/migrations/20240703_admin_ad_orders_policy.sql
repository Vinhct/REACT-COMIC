-- Thêm policy để admin có thể xem tất cả đơn hàng quảng cáo
DROP POLICY IF EXISTS "Admins can view all ad orders" ON public.ad_orders;

-- Tạo policy cho phép admin xem tất cả đơn hàng
CREATE POLICY "Admins can view all ad orders" 
ON public.ad_orders FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
);

-- Thêm policy để admin có thể thêm đơn hàng cho bất kỳ user nào
DROP POLICY IF EXISTS "Admins can insert any ad orders" ON public.ad_orders;

CREATE POLICY "Admins can insert any ad orders" 
ON public.ad_orders FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
);

-- Thêm policy để admin có thể cập nhật bất kỳ đơn hàng nào
DROP POLICY IF EXISTS "Admins can update any ad orders" ON public.ad_orders;

CREATE POLICY "Admins can update any ad orders" 
ON public.ad_orders FOR UPDATE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
);

-- Thêm policy để admin có thể xóa bất kỳ đơn hàng nào
DROP POLICY IF EXISTS "Admins can delete any ad orders" ON public.ad_orders;

CREATE POLICY "Admins can delete any ad orders" 
ON public.ad_orders FOR DELETE 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
); 