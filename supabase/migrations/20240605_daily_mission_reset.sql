-- Function để reset tất cả nhiệm vụ lặp lại hàng ngày
CREATE OR REPLACE FUNCTION reset_daily_missions()
RETURNS void AS $$
BEGIN
    -- Reset tiến độ cho tất cả nhiệm vụ lặp lại
    UPDATE public.user_missions
    SET progress = 0,
        completed = FALSE,
        completed_at = NULL,
        reset_at = NOW()
    WHERE mission_id IN (
        SELECT id FROM public.missions WHERE is_repeatable = TRUE
    )
    AND (
        -- Chỉ reset các nhiệm vụ đã hoàn thành và đã nhận thưởng
        (completed = TRUE AND rewarded = TRUE)
        -- Hoặc các nhiệm vụ chưa hoàn thành nhưng đã có tiến độ (không reset các nhiệm vụ vừa mới được tạo)
        OR (completed = FALSE AND progress > 0)
    );
END;
$$ LANGUAGE plpgsql;

-- Thay đổi quy trình claim_mission_reward - không reset ngay lập tức sau khi nhận thưởng nữa
CREATE OR REPLACE FUNCTION claim_mission_reward(
    p_user_id UUID,
    p_mission_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_mission_record RECORD;
    v_user_mission_record RECORD;
    v_reward_amount INTEGER;
BEGIN
    -- Kiểm tra xem nhiệm vụ có tồn tại không
    SELECT * INTO v_mission_record
    FROM public.missions
    WHERE id = p_mission_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Nhiệm vụ không tồn tại';
    END IF;
    
    -- Kiểm tra xem user có nhiệm vụ này không
    SELECT * INTO v_user_mission_record
    FROM public.user_missions
    WHERE user_id = p_user_id AND mission_id = p_mission_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Người dùng chưa có nhiệm vụ này';
    END IF;
    
    -- Kiểm tra nhiệm vụ đã hoàn thành chưa
    IF NOT v_user_mission_record.completed THEN
        RAISE EXCEPTION 'Nhiệm vụ chưa hoàn thành';
    END IF;
    
    -- Kiểm tra đã nhận thưởng chưa
    IF v_user_mission_record.rewarded THEN
        RAISE EXCEPTION 'Đã nhận thưởng trước đó';
    END IF;
    
    -- Lấy số lượng phần thưởng từ nhiệm vụ
    v_reward_amount := v_mission_record.reward_amount;
    
    -- Cập nhật trạng thái đã nhận thưởng (nhưng không reset tiến độ ngay)
    UPDATE public.user_missions
    SET rewarded = TRUE
    WHERE id = v_user_mission_record.id;
    
    -- Thêm lượt quay cho user
    PERFORM add_spin_tickets(p_user_id, v_reward_amount);
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Tạo function để kiểm tra nếu có cần reset nhiệm vụ hàng ngày không
-- Function này sẽ được gọi thủ công hoặc trong code
CREATE OR REPLACE FUNCTION check_and_reset_missions()
RETURNS boolean AS $$
DECLARE
    last_reset_date DATE;
    current_date DATE := CURRENT_DATE;
BEGIN
    -- Lấy ngày reset gần nhất từ bảng settings (nếu tồn tại)
    BEGIN
        SELECT value::DATE INTO last_reset_date
        FROM public.settings
        WHERE key = 'last_mission_reset_date';
    EXCEPTION
        WHEN OTHERS THEN
            last_reset_date := NULL;
    END;
    
    -- Nếu chưa có bản ghi hoặc ngày reset là ngày hôm qua hoặc trước đó, thực hiện reset
    IF last_reset_date IS NULL OR last_reset_date < current_date THEN
        -- Thực hiện reset
        PERFORM reset_daily_missions();
        
        -- Cập nhật ngày reset
        INSERT INTO public.settings (key, value)
        VALUES ('last_mission_reset_date', current_date::TEXT)
        ON CONFLICT (key)
        DO UPDATE SET value = current_date::TEXT;
        
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

-- Tạo trigger để tự động cập nhật trường updated_at
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER settings_update_timestamp
BEFORE UPDATE ON public.settings
FOR EACH ROW
EXECUTE FUNCTION update_settings_updated_at(); 