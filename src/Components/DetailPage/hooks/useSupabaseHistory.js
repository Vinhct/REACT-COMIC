import { useCallback, useState } from 'react';
import { supabase } from '../../../supabaseClient';
import debounce from "lodash/debounce";

/**
 * Hook để quản lý lịch sử đọc truyện sử dụng Supabase
 * 
 * @param {Object} user Thông tin người dùng hiện tại
 * @returns {Object} Hàm lưu lịch sử và trạng thái loading
 */
const useSupabaseHistory = (user) => {
  const [loading, setLoading] = useState(false);

  // Hàm xử lý URL thumbnail
  const getImageUrl = (thumbUrl) => {
    if (!thumbUrl) return "";
    
    // Kiểm tra nếu thumbnail đã là URL đầy đủ
    if (thumbUrl.startsWith('http')) {
      return thumbUrl;
    }
    
    // Thêm prefix đúng
    return `https://img.otruyenapi.com/uploads/comics/${thumbUrl}`;
  };

  // Hàm lưu lịch sử với debounce để tránh gọi quá nhiều lần
  const saveHistory = useCallback(
    debounce(async (historyItem) => {
      if (!user?.id) {
        // Nếu không đăng nhập, chỉ lưu vào localStorage
        const localHistory = JSON.parse(localStorage.getItem("history") || "[]");
        const updatedLocal = localHistory.filter(
          (h) => h.slug !== historyItem.slug
        );
        updatedLocal.unshift({
          ...historyItem,
          created_at: new Date().toISOString()
        });
        localStorage.setItem("history", JSON.stringify(updatedLocal.slice(0, 5)));
        return;
      }

      try {
        setLoading(true);

        // Kiểm tra và thêm truyện vào bảng comics nếu chưa tồn tại
        const { data: existingComic, error: checkError } = await supabase
          .from('comics')
          .select('slug')
          .eq('slug', historyItem.slug)
          .single();

        if (!existingComic) {
          // Thêm truyện vào bảng comics
          const { error: insertError } = await supabase
            .from('comics')
            .insert([
              {
                slug: historyItem.slug,
                name: historyItem.name || historyItem.slug,
                status: 'Đang tiến hành',
                description: '',
                thumbnail: `https://img.otruyenapi.com/uploads/comics/${historyItem.thumb_url}`
              }
            ]);

          if (insertError) {
            console.error("Lỗi khi thêm truyện vào cơ sở dữ liệu:", insertError);
            throw new Error('Không thể thêm truyện vào cơ sở dữ liệu!');
          }
        }

        // Kiểm tra xem đã có mục này trong lịch sử chưa
        const { data: existingItem } = await supabase
          .from('reading_history')
          .select('id')
          .eq('user_id', user.id)
          .eq('slug', historyItem.slug)
          .single();

        if (existingItem) {
          // Nếu đã tồn tại, cập nhật thông tin mới nhất
          const { error: updateError } = await supabase
            .from('reading_history')
            .update({
              chapter: historyItem.chapter,
              chapter_name: historyItem.chapter_name,
              last_read: new Date().toISOString()
            })
            .eq('id', existingItem.id);

          if (updateError) {
            throw updateError;
          }
        } else {
          // Kiểm tra số lượng lịch sử hiện tại
          const { data: historyCount, error: countError } = await supabase
            .from('reading_history')
            .select('id', { count: 'exact' })
            .eq('user_id', user.id);

          if (countError) {
            throw countError;
          }

          // Nếu đã đủ 5 mục, xóa mục cũ nhất
          if (historyCount && historyCount.length >= 5) {
            const { data: oldestItem, error: oldestError } = await supabase
              .from('reading_history')
              .select('id')
              .eq('user_id', user.id)
              .order('last_read', { ascending: true })
              .limit(1)
              .single();

            if (oldestError && oldestError.code !== 'PGRST116') {
              throw oldestError;
            }

            if (oldestItem) {
              const { error: deleteError } = await supabase
                .from('reading_history')
                .delete()
                .eq('id', oldestItem.id);

              if (deleteError) {
                throw deleteError;
              }
            }
          }

          // Thêm mục mới vào lịch sử
          const { error: insertError } = await supabase
            .from('reading_history')
            .insert([
              {
                user_id: user.id,
                slug: historyItem.slug,
                chapter: historyItem.chapter,
                chapter_name: historyItem.chapter_name,
                last_read: new Date().toISOString()
              }
            ]);

          if (insertError) {
            throw insertError;
          }
        }

        // Lưu vào localStorage để sử dụng khi offline
        const localHistory = JSON.parse(localStorage.getItem("history") || "[]");
        const updatedLocal = localHistory.filter(
          (h) => h.slug !== historyItem.slug
        );
        updatedLocal.unshift({
          ...historyItem,
          created_at: new Date().toISOString()
        });
        localStorage.setItem("history", JSON.stringify(updatedLocal.slice(0, 5)));
      } catch (error) {
        console.error("Lỗi khi lưu lịch sử:", error.message);
      } finally {
        setLoading(false);
      }
    }, 1000),
    [user]
  );

  return {
    saveHistory,
    loading
  };
};

export default useSupabaseHistory; 