-- Tạo bảng notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info', -- 'info', 'success', 'warning', 'error'
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo index để tối ưu truy vấn
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS notifications_is_read_idx ON public.notifications(is_read);

-- Thiết lập RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Users có thể xem thông báo của mình
CREATE POLICY "Users can view own notifications" 
ON public.notifications FOR SELECT 
USING (auth.uid() = user_id);

-- Users có thể cập nhật trạng thái đã đọc
CREATE POLICY "Users can update own notifications" 
ON public.notifications FOR UPDATE 
USING (auth.uid() = user_id);

-- Admin có thể tạo thông báo cho bất kỳ ai
CREATE POLICY "Admins can insert notifications" 
ON public.notifications FOR INSERT 
WITH CHECK (
    auth.uid() IN (
        SELECT user_id FROM public.admin_users
    )
);

-- Admin có thể xem tất cả thông báo
CREATE POLICY "Admins can view all notifications" 
ON public.notifications FOR SELECT 
USING (
    auth.uid() IN (
        SELECT user_id FROM public.admin_users
    )
);

-- Tạo trigger để tự động cập nhật updated_at
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column(); 