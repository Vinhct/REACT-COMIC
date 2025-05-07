-- Function để thêm/cập nhật lượt quay cho user
CREATE OR REPLACE FUNCTION add_spin_tickets(
    p_user_id UUID,
    p_amount INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.spin_tickets (user_id, amount)
    VALUES (p_user_id, p_amount)
    ON CONFLICT (user_id)
    DO UPDATE SET amount = spin_tickets.amount + p_amount;
END;
$$ LANGUAGE plpgsql;

-- Function để nhận thưởng nhiệm vụ
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
    
    -- Cập nhật trạng thái đã nhận thưởng
    UPDATE public.user_missions
    SET rewarded = TRUE
    WHERE id = v_user_mission_record.id;
    
    -- Nếu nhiệm vụ lặp lại, reset tiến độ
    IF v_mission_record.is_repeatable THEN
        UPDATE public.user_missions
        SET progress = 0,
            completed = FALSE,
            completed_at = NULL,
            reset_at = NOW()
        WHERE id = v_user_mission_record.id;
    END IF;
    
    -- Thêm lượt quay cho user
    PERFORM add_spin_tickets(p_user_id, v_reward_amount);
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Function để thực hiện quay vòng quay may mắn
CREATE OR REPLACE FUNCTION spin_wheel(
    p_user_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_spin_tickets INTEGER;
    v_rewards RECORD;
    v_selected_reward_id UUID;
    v_result JSONB;
    v_total_probability NUMERIC;
    v_random_number NUMERIC;
    v_accumulated_probability NUMERIC := 0;
BEGIN
    -- Kiểm tra số lượt quay hiện có
    SELECT amount INTO v_spin_tickets
    FROM public.spin_tickets
    WHERE user_id = p_user_id;
    
    IF NOT FOUND OR v_spin_tickets <= 0 THEN
        RAISE EXCEPTION 'Không đủ lượt quay';
    END IF;
    
    -- Lấy tổng xác suất
    SELECT SUM(probability) INTO v_total_probability
    FROM public.spin_rewards
    WHERE is_active = TRUE;
    
    -- Tạo số ngẫu nhiên trong khoảng 0-100
    v_random_number := random() * v_total_probability;
    
    -- Lựa chọn phần thưởng dựa trên xác suất
    FOR v_rewards IN
        SELECT id, name, description, type, value, probability
        FROM public.spin_rewards
        WHERE is_active = TRUE
        ORDER BY probability ASC
    LOOP
        v_accumulated_probability := v_accumulated_probability + v_rewards.probability;
        
        IF v_random_number <= v_accumulated_probability THEN
            v_selected_reward_id := v_rewards.id;
            EXIT;
        END IF;
    END LOOP;
    
    -- Nếu không có phần thưởng nào được chọn (không thỏa điều kiện ngẫu nhiên)
    IF v_selected_reward_id IS NULL THEN
        -- Chọn phần thưởng có xác suất cao nhất
        SELECT id INTO v_selected_reward_id
        FROM public.spin_rewards
        WHERE is_active = TRUE
        ORDER BY probability DESC
        LIMIT 1;
    END IF;
    
    -- Giảm số lượt quay
    UPDATE public.spin_tickets
    SET amount = amount - 1
    WHERE user_id = p_user_id;
    
    -- Thêm vào lịch sử quay thưởng
    INSERT INTO public.spin_history (user_id, reward_id)
    VALUES (p_user_id, v_selected_reward_id);
    
    -- Lấy thông tin phần thưởng đã chọn
    SELECT jsonb_build_object(
        'id', id,
        'name', name,
        'description', description,
        'type', type,
        'value', value
    ) INTO v_result
    FROM public.spin_rewards
    WHERE id = v_selected_reward_id;
    
    -- Xử lý phần thưởng tùy theo loại
    CASE
        WHEN (SELECT type FROM public.spin_rewards WHERE id = v_selected_reward_id) = 'bonus_spin' THEN
            -- Nếu là lượt quay thêm, cộng thêm lượt quay
            PERFORM add_spin_tickets(
                p_user_id, 
                (SELECT value FROM public.spin_rewards WHERE id = v_selected_reward_id)
            );
            
        -- Có thể thêm các loại phần thưởng khác ở đây
        -- WHEN 'coin' THEN
        --     -- Xử lý thưởng xu
        -- WHEN 'free_chapter' THEN
        --     -- Xử lý thưởng đọc miễn phí
        
        ELSE
            -- Các loại phần thưởng khác - có thể xử lý sau
            NULL;
    END CASE;
    
    RETURN v_result;
EXCEPTION
    WHEN OTHERS THEN
        RAISE;
END;
$$ LANGUAGE plpgsql;

-- Function để theo dõi thời gian đọc truyện
CREATE OR REPLACE FUNCTION track_reading_time(
    p_user_id UUID,
    p_slug TEXT,
    p_minutes INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
    v_mission_id UUID;
BEGIN
    -- Lấy id của nhiệm vụ đọc theo thời gian
    SELECT id INTO v_mission_id
    FROM public.missions
    WHERE type = 'read_time' AND is_repeatable = TRUE
    LIMIT 1;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Kiểm tra và cập nhật tiến độ
    INSERT INTO public.user_missions (user_id, mission_id, progress)
    VALUES (p_user_id, v_mission_id, p_minutes)
    ON CONFLICT (user_id, mission_id)
    DO UPDATE SET 
        progress = 
            CASE WHEN user_missions.rewarded = TRUE 
                 THEN p_minutes
                 ELSE GREATEST(user_missions.progress, p_minutes)
            END,
        completed = 
            CASE WHEN GREATEST(user_missions.progress, p_minutes) >= 
                      (SELECT target_value FROM public.missions WHERE id = v_mission_id)
                 THEN TRUE
                 ELSE user_missions.completed
            END,
        completed_at = 
            CASE WHEN GREATEST(user_missions.progress, p_minutes) >= 
                      (SELECT target_value FROM public.missions WHERE id = v_mission_id) 
                      AND user_missions.completed = FALSE
                 THEN NOW()
                 ELSE user_missions.completed_at
            END;
            
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql; 