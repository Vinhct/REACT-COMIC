-- Bảng gói quảng cáo
CREATE TABLE IF NOT EXISTS public.ad_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    price NUMERIC NOT NULL,
    duration_days INTEGER NOT NULL,
    position TEXT NOT NULL, -- Vị trí hiển thị banner (top, bottom, sidebar, v.v.)
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bảng đơn mua quảng cáo
CREATE TABLE IF NOT EXISTS public.ad_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    package_id UUID NOT NULL REFERENCES public.ad_packages(id) ON DELETE CASCADE,
    banner_url TEXT NOT NULL, -- Đường dẫn ảnh banner
    link TEXT, -- Link khi click vào banner
    status TEXT NOT NULL DEFAULT 'pending', -- pending/paid/active/expired/cancelled
    start_date TIMESTAMPTZ,
    end_date TIMESTAMPTZ,
    payment_intent_id TEXT, -- Mã giao dịch từ cổng thanh toán
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index tối ưu truy vấn
CREATE INDEX IF NOT EXISTS ad_orders_user_id_idx ON public.ad_orders(user_id);
CREATE INDEX IF NOT EXISTS ad_orders_status_idx ON public.ad_orders(status);

-- RLS: User chỉ xem đơn của mình
ALTER TABLE public.ad_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own ad orders" ON public.ad_orders FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own ad orders" ON public.ad_orders FOR INSERT WITH CHECK (auth.uid() = user_id); 