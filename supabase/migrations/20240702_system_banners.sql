-- Bảng quản lý banner quảng cáo hệ thống
CREATE TABLE IF NOT EXISTS public.system_banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    image_url TEXT NOT NULL,
    link TEXT,
    alt TEXT,
    position TEXT NOT NULL DEFAULT 'top',
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
); 