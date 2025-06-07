-- Function để reset tất cả nhiệm vụ cho tất cả người dùng
CREATE OR REPLACE FUNCTION reset_all_user_missions()
RETURNS void AS $$
BEGIN
    -- Reset tiến độ cho tất cả nhiệm vụ của tất cả người dùng
    UPDATE public.user_missions
    SET progress = 0,
        completed = FALSE,
        completed_at = NULL,
        rewarded = FALSE,
        reset_at = NOW(),
        updated_at = NOW();

    -- Log thông tin reset
    INSERT INTO public.admin_logs (
        action,
        description,
        affected_rows,
        additional_info
    )
    VALUES (
        'reset_all_missions',
        'Reset tất cả nhiệm vụ cho tất cả người dùng',
        (SELECT COUNT(*) FROM public.user_missions),
        jsonb_build_object(
            'timestamp', NOW(),
            'affected_missions', (SELECT COUNT(DISTINCT mission_id) FROM public.user_missions)
        )
    );
    
    RAISE NOTICE 'Đã reset % bản ghi nhiệm vụ', (SELECT COUNT(*) FROM public.user_missions);
END;
$$ LANGUAGE plpgsql;

-- Tạo bảng admin_logs nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS public.admin_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action TEXT NOT NULL,
    description TEXT,
    affected_rows INTEGER,
    additional_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Thêm RLS policy cho bảng admin_logs
ALTER TABLE public.admin_logs ENABLE ROW LEVEL SECURITY;

-- Chỉ admin mới có quyền đọc/ghi admin_logs
CREATE POLICY admin_logs_policy ON public.admin_logs 
    USING (auth.uid() IN (SELECT user_id FROM public.admin_users))
    WITH CHECK (auth.uid() IN (SELECT user_id FROM public.admin_users)); 