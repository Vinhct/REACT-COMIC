-- Migration cho VietQR.io integration
-- Cập nhật bảng ad_orders để hỗ trợ VietQR

-- Thêm các cột mới cho VietQR tracking
ALTER TABLE public.ad_orders 
ADD COLUMN IF NOT EXISTS vietqr_order_id TEXT,
ADD COLUMN IF NOT EXISTS bank_id TEXT,
ADD COLUMN IF NOT EXISTS qr_code_url TEXT,
ADD COLUMN IF NOT EXISTS payment_amount NUMERIC,
ADD COLUMN IF NOT EXISTS payment_description TEXT;

-- Thêm index cho tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS ad_orders_vietqr_order_id_idx ON public.ad_orders(vietqr_order_id);
CREATE INDEX IF NOT EXISTS ad_orders_bank_id_idx ON public.ad_orders(bank_id);

-- Cập nhật RLS policies để admin có thể query theo vietqr_order_id
CREATE POLICY "Anyone can view orders by vietqr_order_id" 
ON public.ad_orders FOR SELECT 
USING (vietqr_order_id IS NOT NULL);

-- Thêm bảng để log payment confirmations
CREATE TABLE IF NOT EXISTS public.payment_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ad_order_id UUID REFERENCES public.ad_orders(id) ON DELETE CASCADE,
    vietqr_order_id TEXT NOT NULL,
    bank_transaction_id TEXT,
    confirmed_amount NUMERIC,
    confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    confirmation_source TEXT DEFAULT 'vietqr_api', -- vietqr_api, manual, webhook
    raw_response JSONB, -- Lưu trữ response từ VietQR API
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index cho payment_confirmations
CREATE INDEX IF NOT EXISTS payment_confirmations_ad_order_id_idx ON public.payment_confirmations(ad_order_id);
CREATE INDEX IF NOT EXISTS payment_confirmations_vietqr_order_id_idx ON public.payment_confirmations(vietqr_order_id);
CREATE INDEX IF NOT EXISTS payment_confirmations_confirmed_at_idx ON public.payment_confirmations(confirmed_at);

-- RLS cho payment_confirmations
ALTER TABLE public.payment_confirmations ENABLE ROW LEVEL SECURITY;

-- Admin có thể xem tất cả confirmations
CREATE POLICY "Admins can view all payment confirmations" 
ON public.payment_confirmations FOR SELECT 
USING (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
);

-- Admin có thể thêm confirmations
CREATE POLICY "Admins can insert payment confirmations" 
ON public.payment_confirmations FOR INSERT 
WITH CHECK (
  auth.uid() IN (
    SELECT user_id FROM public.admin_users
  )
);

-- User có thể xem confirmations của đơn hàng của họ
CREATE POLICY "Users can view own payment confirmations" 
ON public.payment_confirmations FOR SELECT 
USING (
  ad_order_id IN (
    SELECT id FROM public.ad_orders WHERE user_id = auth.uid()
  )
);

-- Function để tự động kích hoạt gói quảng cáo khi có payment confirmation
CREATE OR REPLACE FUNCTION activate_ad_package_on_confirmation()
RETURNS TRIGGER AS $$
BEGIN
  -- Cập nhật trạng thái đơn hàng thành 'active'
  UPDATE public.ad_orders 
  SET 
    status = 'active',
    start_time = NOW(),
    end_time = NOW() + INTERVAL '1 day' * (
      SELECT duration_days FROM public.ad_packages 
      WHERE id = (SELECT package_id FROM public.ad_orders WHERE id = NEW.ad_order_id)
    )
  WHERE id = NEW.ad_order_id AND status = 'pending';
  
  -- Tạo thông báo cho user
  INSERT INTO public.notifications (user_id, title, message, type)
  SELECT 
    ao.user_id,
    'Gói quảng cáo đã được kích hoạt',
    'Gói "' || ap.name || '" đã được kích hoạt tự động sau khi xác nhận thanh toán.',
    'success'
  FROM public.ad_orders ao
  JOIN public.ad_packages ap ON ao.package_id = ap.id
  WHERE ao.id = NEW.ad_order_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger để tự động kích hoạt khi có payment confirmation
CREATE TRIGGER trigger_activate_ad_package_on_confirmation
AFTER INSERT ON public.payment_confirmations
FOR EACH ROW
EXECUTE FUNCTION activate_ad_package_on_confirmation();

-- Cập nhật existing ad_orders để có start_time và end_time fields
ALTER TABLE public.ad_orders 
ADD COLUMN IF NOT EXISTS start_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time TIMESTAMPTZ;

-- Update existing active orders to have proper start and end times
UPDATE public.ad_orders 
SET 
  start_time = created_at,
  end_time = created_at + INTERVAL '1 day' * (
    SELECT duration_days FROM public.ad_packages 
    WHERE id = ad_orders.package_id
  )
WHERE status = 'active' AND start_time IS NULL; 