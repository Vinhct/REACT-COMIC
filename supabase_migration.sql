-- Bảng users sẽ được tự động tạo bởi Supabase Auth
-- Tuy nhiên, chúng ta có thể thêm các trường bổ sung cho người dùng
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS photo_url text;
ALTER TABLE auth.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user' CHECK (role IN ('user', 'admin'));

-- Bảng lưu trữ thông tin truyện
CREATE TABLE IF NOT EXISTS public.comics (
    slug TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    thumbnail TEXT,
    description TEXT,
    author TEXT,
    status TEXT CHECK (status IN ('Đang tiến hành', 'Đã hoàn thành', 'Tạm ngưng')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS comics_name_idx ON public.comics(name);
CREATE INDEX IF NOT EXISTS comics_author_idx ON public.comics(author);
CREATE INDEX IF NOT EXISTS comics_status_idx ON public.comics(status);

-- Thiết lập RLS
ALTER TABLE public.comics ENABLE ROW LEVEL SECURITY;

-- Mọi người có thể xem thông tin truyện
CREATE POLICY "Anyone can view comics" 
ON public.comics FOR SELECT 
USING (true);

-- Chỉ admin mới có thể thêm/sửa/xóa truyện
CREATE POLICY "Only admins can insert comics" 
ON public.comics FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() IN (
    SELECT id FROM auth.users WHERE role = 'admin'
));

CREATE POLICY "Only admins can update comics" 
ON public.comics FOR UPDATE
TO authenticated
USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE role = 'admin'
));

CREATE POLICY "Only admins can delete comics" 
ON public.comics FOR DELETE 
TO authenticated
USING (auth.uid() IN (
    SELECT id FROM auth.users WHERE role = 'admin'
));

-- Trigger để tự động cập nhật updated_at
CREATE TRIGGER comics_update_timestamp
BEFORE UPDATE ON public.comics
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column();

-- Bảng lưu trữ truyện yêu thích
DROP TABLE IF EXISTS public.favorites;
CREATE TABLE IF NOT EXISTS public.favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL REFERENCES public.comics(slug) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Tạo ràng buộc unique để đảm bảo người dùng không thể yêu thích cùng một truyện nhiều lần
    UNIQUE(user_id, slug)
);

-- Tạo index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS favorites_user_id_idx ON public.favorites(user_id);
CREATE INDEX IF NOT EXISTS favorites_slug_idx ON public.favorites(slug);
CREATE INDEX IF NOT EXISTS favorites_created_at_idx ON public.favorites(created_at);

-- Thiết lập RLS (Row Level Security) để bảo vệ dữ liệu
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;

-- Chính sách để người dùng chỉ có thể xem các mục yêu thích của chính họ
CREATE POLICY "Users can view own favorites" 
ON public.favorites FOR SELECT 
USING (auth.uid() = user_id);

-- Chính sách để người dùng chỉ có thể thêm mục yêu thích của chính họ
CREATE POLICY "Users can insert own favorites" 
ON public.favorites FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Chính sách để người dùng chỉ có thể xóa mục yêu thích của chính họ
CREATE POLICY "Users can delete own favorites" 
ON public.favorites FOR DELETE 
USING (auth.uid() = user_id);

-- Đổi tên bảng history thành reading_history để đồng bộ với code
DROP TABLE IF EXISTS public.history;
CREATE TABLE IF NOT EXISTS public.reading_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL REFERENCES public.comics(slug) ON DELETE CASCADE,
    chapter TEXT,
    chapter_name TEXT,
    last_read TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Tạo ràng buộc unique để đảm bảo mỗi truyện chỉ xuất hiện một lần trong lịch sử
    UNIQUE(user_id, slug)
);

-- Tạo index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS reading_history_user_id_idx ON public.reading_history(user_id);
CREATE INDEX IF NOT EXISTS reading_history_slug_idx ON public.reading_history(slug);
CREATE INDEX IF NOT EXISTS reading_history_last_read_idx ON public.reading_history(last_read);

-- Thiết lập RLS
ALTER TABLE public.reading_history ENABLE ROW LEVEL SECURITY;

-- Chính sách để người dùng chỉ có thể xem lịch sử của chính họ
CREATE POLICY "Users can view own reading history" 
ON public.reading_history FOR SELECT 
USING (auth.uid() = user_id);

-- Chính sách để người dùng chỉ có thể thêm vào lịch sử của chính họ
CREATE POLICY "Users can insert own reading history" 
ON public.reading_history FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Chính sách để người dùng chỉ có thể cập nhật lịch sử của chính họ
CREATE POLICY "Users can update own reading history" 
ON public.reading_history FOR UPDATE
USING (auth.uid() = user_id);

-- Chính sách để người dùng chỉ có thể xóa lịch sử của chính họ
CREATE POLICY "Users can delete own reading history" 
ON public.reading_history FOR DELETE 
USING (auth.uid() = user_id);

-- Bảng lưu trữ bình luận và đánh giá
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    slug TEXT NOT NULL,
    comment TEXT NOT NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tạo index để tìm kiếm nhanh
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON public.comments(user_id);
CREATE INDEX IF NOT EXISTS comments_slug_idx ON public.comments(slug);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON public.comments(created_at);

-- Thiết lập RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Mọi người có thể xem tất cả bình luận
CREATE POLICY "Anyone can view comments" 
ON public.comments FOR SELECT 
USING (true);

-- Người dùng chỉ có thể thêm bình luận của chính họ
CREATE POLICY "Users can insert own comments" 
ON public.comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Người dùng chỉ có thể cập nhật bình luận của chính họ
CREATE POLICY "Users can update own comments" 
ON public.comments FOR UPDATE
USING (auth.uid() = user_id);

-- Người dùng chỉ có thể xóa bình luận của chính họ
CREATE POLICY "Users can delete own comments" 
ON public.comments FOR DELETE 
USING (auth.uid() = user_id);

-- Function để tự động cập nhật thời gian khi sửa bình luận
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.created_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger để cập nhật thời gian khi sửa lịch sử
CREATE TRIGGER reading_history_update_timestamp
BEFORE UPDATE ON public.reading_history
FOR EACH ROW
EXECUTE PROCEDURE update_modified_column(); 