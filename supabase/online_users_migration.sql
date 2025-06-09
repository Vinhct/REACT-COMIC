-- Migration cho hệ thống tracking user online
-- File: online_users_migration.sql

-- Bảng theo dõi người dùng online
CREATE TABLE IF NOT EXISTS public.online_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    last_seen TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    page_url TEXT,
    is_mobile BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Tạo ràng buộc unique để đảm bảo mỗi session chỉ có một record
    UNIQUE(session_id)
);

-- Tạo index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS online_users_user_id_idx ON public.online_users(user_id);
CREATE INDEX IF NOT EXISTS online_users_last_seen_idx ON public.online_users(last_seen);
CREATE INDEX IF NOT EXISTS online_users_session_id_idx ON public.online_users(session_id);

-- Thiết lập RLS
ALTER TABLE public.online_users ENABLE ROW LEVEL SECURITY;

-- Admin có thể xem tất cả
CREATE POLICY "Admins can view all online users" 
ON public.online_users FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid()
    )
);

-- Người dùng có thể insert/update session của chính họ
CREATE POLICY "Users can manage own sessions" 
ON public.online_users FOR ALL
TO authenticated
USING (user_id = auth.uid() OR user_id IS NULL);

-- Function để cleanup user offline (offline > 5 phút)
CREATE OR REPLACE FUNCTION cleanup_offline_users()
RETURNS void AS $$
BEGIN
    DELETE FROM public.online_users 
    WHERE last_seen < NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Function để update user online status
CREATE OR REPLACE FUNCTION update_user_online(
    p_user_id UUID DEFAULT NULL,
    p_session_id TEXT DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL,
    p_page_url TEXT DEFAULT NULL,
    p_is_mobile BOOLEAN DEFAULT false
)
RETURNS void AS $$
BEGIN
    -- Cleanup offline users trước
    PERFORM cleanup_offline_users();
    
    -- Insert hoặc update user online
    INSERT INTO public.online_users (
        user_id, session_id, last_seen, ip_address, user_agent, page_url, is_mobile
    ) VALUES (
        p_user_id, p_session_id, NOW(), p_ip_address, p_user_agent, p_page_url, p_is_mobile
    )
    ON CONFLICT (session_id) 
    DO UPDATE SET
        user_id = EXCLUDED.user_id,
        last_seen = NOW(),
        ip_address = EXCLUDED.ip_address,
        user_agent = EXCLUDED.user_agent,
        page_url = EXCLUDED.page_url,
        is_mobile = EXCLUDED.is_mobile;
END;
$$ LANGUAGE plpgsql;

-- Function để lấy số user online
CREATE OR REPLACE FUNCTION get_online_users_count()
RETURNS TABLE(
    total_online INTEGER,
    authenticated_online INTEGER,
    guest_online INTEGER,
    mobile_online INTEGER,
    desktop_online INTEGER
) AS $$
BEGIN
    -- Cleanup trước khi đếm
    PERFORM cleanup_offline_users();
    
    RETURN QUERY
    SELECT 
        COUNT(*)::INTEGER as total_online,
        COUNT(*) FILTER (WHERE user_id IS NOT NULL)::INTEGER as authenticated_online,
        COUNT(*) FILTER (WHERE user_id IS NULL)::INTEGER as guest_online,
        COUNT(*) FILTER (WHERE is_mobile = true)::INTEGER as mobile_online,
        COUNT(*) FILTER (WHERE is_mobile = false)::INTEGER as desktop_online
    FROM public.online_users
    WHERE last_seen > NOW() - INTERVAL '5 minutes';
END;
$$ LANGUAGE plpgsql;

-- Bảng lưu thống kê online users theo thời gian (optional - cho analytics)
CREATE TABLE IF NOT EXISTS public.online_stats_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    total_online INTEGER DEFAULT 0,
    authenticated_online INTEGER DEFAULT 0,
    guest_online INTEGER DEFAULT 0,
    mobile_online INTEGER DEFAULT 0,
    desktop_online INTEGER DEFAULT 0
);

-- Index cho bảng thống kê
CREATE INDEX IF NOT EXISTS online_stats_recorded_at_idx ON public.online_stats_history(recorded_at);

-- RLS cho bảng thống kê
ALTER TABLE public.online_stats_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view online stats" 
ON public.online_stats_history FOR SELECT 
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM admin_users 
        WHERE user_id = auth.uid()
    )
);

-- Function để lưu thống kê định kỳ (có thể chạy bằng cron job)
CREATE OR REPLACE FUNCTION save_online_stats()
RETURNS void AS $$
DECLARE
    stats_record RECORD;
BEGIN
    -- Lấy thống kê hiện tại
    SELECT * INTO stats_record FROM get_online_users_count();
    
    -- Lưu vào bảng history
    INSERT INTO public.online_stats_history (
        total_online, authenticated_online, guest_online, mobile_online, desktop_online
    ) VALUES (
        stats_record.total_online,
        stats_record.authenticated_online, 
        stats_record.guest_online,
        stats_record.mobile_online,
        stats_record.desktop_online
    );
END;
$$ LANGUAGE plpgsql; 