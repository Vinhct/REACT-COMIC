-- Tạo function để cập nhật trường updated_at
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function để reset tất cả nhiệm vụ lặp lại hàng ngày
CREATE OR REPLACE FUNCTION reset_daily_missions()
RETURNS void AS $$
BEGIN
    -- Reset tiến độ cho tất cả nhiệm vụ lặp lại
    UPDATE public.user_missions
    SET progress = 0,
        completed = FALSE,
        completed_at = NULL,
        rewarded = FALSE,
        reset_at = NOW()
    WHERE mission_id IN (
        SELECT id FROM public.missions WHERE is_repeatable = TRUE
    );
END;
$$ LANGUAGE plpgsql;

-- Function để kiểm tra và reset nhiệm vụ hàng ngày
CREATE OR REPLACE FUNCTION check_and_reset_missions()
RETURNS boolean AS $$
DECLARE
    last_reset_timestamp TIMESTAMPTZ;
    current_timestamp TIMESTAMPTZ := NOW();
BEGIN
    -- Lấy thời điểm reset gần nhất
    BEGIN
        SELECT (value::TIMESTAMPTZ) INTO last_reset_timestamp
        FROM public.settings
        WHERE key = 'last_mission_reset_timestamp';
    EXCEPTION
        WHEN OTHERS THEN
            last_reset_timestamp := NULL;
    END;
    
    -- Nếu chưa có bản ghi hoặc đã qua 00:00 của ngày mới, thực hiện reset
    IF last_reset_timestamp IS NULL OR 
       DATE_TRUNC('day', current_timestamp) > DATE_TRUNC('day', last_reset_timestamp) THEN
        -- Thực hiện reset
        PERFORM reset_daily_missions();
        
        -- Cập nhật thời điểm reset
        INSERT INTO public.settings (key, value)
        VALUES ('last_mission_reset_timestamp', current_timestamp::TEXT)
        ON CONFLICT (key)
        DO UPDATE SET value = current_timestamp::TEXT;
        
        RETURN TRUE;
    END IF;
    
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- Tạo bảng settings nếu chưa tồn tại
CREATE TABLE IF NOT EXISTS public.settings (
    key TEXT PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop trigger nếu đã tồn tại
DROP TRIGGER IF EXISTS settings_update_timestamp ON public.settings;

-- Tạo trigger mới
CREATE TRIGGER settings_update_timestamp
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION update_settings_updated_at();

-- Tạo extension pgcron nếu chưa có và thiết lập cron job
DO $$
BEGIN
    -- Tạo extension nếu chưa có
    CREATE EXTENSION IF NOT EXISTS pg_cron;
    
    -- Xóa job cũ nếu tồn tại
    BEGIN
        PERFORM cron.unschedule('reset-daily-missions');
    EXCEPTION
        WHEN OTHERS THEN
            -- Bỏ qua lỗi nếu job không tồn tại
            NULL;
    END;
    
    -- Tạo job mới
    PERFORM cron.schedule(
        'reset-daily-missions',
        '0 0 * * *',
        'SELECT reset_daily_missions();'
    );
EXCEPTION
    WHEN insufficient_privilege THEN
        RAISE NOTICE 'Không đủ quyền để tạo extension pg_cron hoặc schedule job';
    WHEN undefined_function THEN
        RAISE NOTICE 'pg_cron không khả dụng';
END $$; 