-- Tạo bảng lưu trữ danh sách các nhiệm vụ
CREATE TABLE IF NOT EXISTS public.missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL, -- "read_chap", "read_time"
    title TEXT NOT NULL, -- "Đọc 5 chương", "Đọc truyện trong 20 phút"
    description TEXT,
    target_value INTEGER NOT NULL, -- 5, 10, 15 (chương) hoặc 20 (phút)
    reward_type TEXT DEFAULT 'spin_ticket',
    reward_amount INTEGER DEFAULT 1, -- Số lượt quay được thưởng
    is_repeatable BOOLEAN DEFAULT FALSE, -- Nhiệm vụ có lặp lại được không (hàng ngày)
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo bảng lưu trữ tiến độ nhiệm vụ của người dùng
CREATE TABLE IF NOT EXISTS public.user_missions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mission_id UUID NOT NULL REFERENCES public.missions(id) ON DELETE CASCADE,
    progress INTEGER DEFAULT 0,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    rewarded BOOLEAN DEFAULT FALSE, -- Đã nhận thưởng hay chưa
    reset_at TIMESTAMPTZ, -- Thời điểm reset tiến độ (cho nhiệm vụ lặp lại hàng ngày)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, mission_id) -- Mỗi user chỉ có 1 tiến độ cho mỗi nhiệm vụ
);

-- Tạo bảng lưu trữ lượt quay cho người dùng
CREATE TABLE IF NOT EXISTS public.spin_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id) -- Mỗi user chỉ có 1 bản ghi lượt quay
);

-- Tạo bảng lưu trữ các phần thưởng có thể nhận được từ vòng quay
CREATE TABLE IF NOT EXISTS public.spin_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- "coin", "free_chapter", "discount_code", "bonus_spin"
    value INTEGER, -- Giá trị của phần thưởng (ví dụ: số xu, % giảm giá)
    probability NUMERIC DEFAULT 0, -- Xác suất trúng (từ 0-100)
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo bảng lưu trữ lịch sử quay thưởng
CREATE TABLE IF NOT EXISTS public.spin_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    reward_id UUID NOT NULL REFERENCES public.spin_rewards(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo index để tối ưu truy vấn
CREATE INDEX IF NOT EXISTS user_missions_user_id_idx ON public.user_missions(user_id);
CREATE INDEX IF NOT EXISTS user_missions_mission_id_idx ON public.user_missions(mission_id);
CREATE INDEX IF NOT EXISTS spin_tickets_user_id_idx ON public.spin_tickets(user_id);
CREATE INDEX IF NOT EXISTS spin_history_user_id_idx ON public.spin_history(user_id);

-- Thiết lập RLS (Row Level Security)
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spin_history ENABLE ROW LEVEL SECURITY;

-- Chính sách cho bảng missions - Ai cũng xem được, chỉ admin thêm/sửa/xóa
CREATE POLICY "Anyone can view missions" 
ON public.missions FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert missions" 
ON public.missions FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.admin_users
));

CREATE POLICY "Only admins can update missions" 
ON public.missions FOR UPDATE
TO authenticated
USING (auth.uid() IN (
    SELECT user_id FROM public.admin_users
));

CREATE POLICY "Only admins can delete missions" 
ON public.missions FOR DELETE 
TO authenticated
USING (auth.uid() IN (
    SELECT user_id FROM public.admin_users
));

-- Chính sách cho bảng user_missions - User chỉ xem/sửa tiến độ của mình
CREATE POLICY "Users can view own missions" 
ON public.user_missions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own missions" 
ON public.user_missions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own missions" 
ON public.user_missions FOR UPDATE
USING (auth.uid() = user_id);

-- Chính sách cho bảng spin_tickets - User chỉ xem/sửa lượt quay của mình
CREATE POLICY "Users can view own spin tickets" 
ON public.spin_tickets FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spin tickets" 
ON public.spin_tickets FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own spin tickets" 
ON public.spin_tickets FOR UPDATE
USING (auth.uid() = user_id);

-- Chính sách cho bảng spin_rewards - Ai cũng xem được, chỉ admin thêm/sửa/xóa
CREATE POLICY "Anyone can view spin rewards" 
ON public.spin_rewards FOR SELECT 
USING (true);

CREATE POLICY "Only admins can insert spin rewards" 
ON public.spin_rewards FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IN (
    SELECT user_id FROM public.admin_users
));

CREATE POLICY "Only admins can update spin rewards" 
ON public.spin_rewards FOR UPDATE
TO authenticated
USING (auth.uid() IN (
    SELECT user_id FROM public.admin_users
));

CREATE POLICY "Only admins can delete spin rewards" 
ON public.spin_rewards FOR DELETE 
TO authenticated
USING (auth.uid() IN (
    SELECT user_id FROM public.admin_users
));

-- Chính sách cho bảng spin_history - User chỉ xem lịch sử quay của mình
CREATE POLICY "Users can view own spin history" 
ON public.spin_history FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own spin history" 
ON public.spin_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Thêm dữ liệu mẫu cho bảng missions
INSERT INTO public.missions (type, title, description, target_value, reward_amount, is_repeatable)
VALUES 
('read_chap', 'Đọc 5 chương', 'Đọc 5 chương truyện để nhận 1 lượt quay', 5, 1, true),
('read_chap', 'Đọc 10 chương', 'Đọc 10 chương truyện để nhận 2 lượt quay', 10, 2, true),
('read_chap', 'Đọc 15 chương', 'Đọc 15 chương truyện để nhận 3 lượt quay', 15, 3, true),
('read_time', 'Đọc truyện 20 phút', 'Đọc truyện liên tục trong 20 phút để nhận 1 lượt quay', 20, 1, true);

-- Thêm dữ liệu mẫu cho bảng spin_rewards
INSERT INTO public.spin_rewards (name, description, type, value, probability, is_active)
VALUES 
('10 xu', 'Nhận 10 xu vào tài khoản', 'coin', 10, 35, true),
('50 xu', 'Nhận 50 xu vào tài khoản', 'coin', 50, 25, true),
('100 xu', 'Nhận 100 xu vào tài khoản', 'coin', 100, 15, true),
('Đọc miễn phí 1 chương', 'Đọc miễn phí 1 chương bất kỳ', 'free_chapter', 1, 10, true),
('Đọc miễn phí 3 chương', 'Đọc miễn phí 3 chương bất kỳ', 'free_chapter', 3, 5, true),
('Giảm 10% nạp xu', 'Giảm 10% khi nạp xu', 'discount_code', 10, 7, true),
('Lượt quay thêm', 'Nhận thêm 1 lượt quay', 'bonus_spin', 1, 3, true);

-- Tạo function để tự động cập nhật trường updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tạo trigger cho bảng user_missions
CREATE TRIGGER user_missions_update_timestamp
BEFORE UPDATE ON public.user_missions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Tạo trigger cho bảng spin_tickets
CREATE TRIGGER spin_tickets_update_timestamp
BEFORE UPDATE ON public.spin_tickets
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Function để thêm/cập nhật tiến độ nhiệm vụ đọc chương
CREATE OR REPLACE FUNCTION update_read_chapter_mission()
RETURNS TRIGGER AS $$
DECLARE
    mission_rec RECORD;
BEGIN
    -- Với mỗi nhiệm vụ đọc chương
    FOR mission_rec IN
        SELECT * FROM public.missions 
        WHERE type = 'read_chap' AND is_repeatable = true
    LOOP
        -- Tạo hoặc cập nhật tiến độ nhiệm vụ cho user
        INSERT INTO public.user_missions (user_id, mission_id, progress)
        VALUES (NEW.user_id, mission_rec.id, 1)
        ON CONFLICT (user_id, mission_id)
        DO UPDATE SET 
            progress = 
                -- Nếu nhiệm vụ đã hoàn thành và đã nhận thưởng, reset lại tiến độ
                CASE WHEN user_missions.completed = true AND user_missions.rewarded = true 
                     THEN 1
                     ELSE user_missions.progress + 1
                END,
            -- Đánh dấu hoàn thành nếu tiến độ đạt mục tiêu
            completed = 
                CASE WHEN (user_missions.progress + 1) >= mission_rec.target_value 
                     THEN true
                     ELSE user_missions.completed
                END,
            -- Cập nhật thời gian hoàn thành
            completed_at = 
                CASE WHEN (user_missions.progress + 1) >= mission_rec.target_value AND user_missions.completed = false
                     THEN NOW()
                     ELSE user_missions.completed_at
                END;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger để cập nhật tiến độ nhiệm vụ khi đọc chương mới
CREATE TRIGGER update_mission_on_read_chapter
AFTER INSERT OR UPDATE ON public.reading_history
FOR EACH ROW
EXECUTE FUNCTION update_read_chapter_mission(); 