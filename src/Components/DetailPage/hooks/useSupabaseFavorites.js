import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

/**
 * Hook để quản lý tính năng yêu thích sử dụng Supabase
 * 
 * @param {string} slug Slug của truyện
 * @param {Object} user Thông tin người dùng hiện tại
 * @param {string} comicName Tên truyện
 * @param {string} thumb_url URL ảnh thumbnail của truyện
 * @returns {Object} Các state và hàm xử lý cho tính năng yêu thích
 */
const useSupabaseFavorites = (slug, user, comicName, thumb_url) => {
  const [favorites, setFavorites] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);

  // Hàm kiểm tra truyện đã được yêu thích chưa
  const checkFavoriteStatus = async () => {
    if (!user?.id || !slug) {
      setIsFavorite(false);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('favorites')
        .select('id')
        .eq('user_id', user.id)
        .eq('slug', slug)
        .single();

      if (error && error.code !== 'PGRST116') {
        // PGRST116 là lỗi "không tìm thấy", không phải lỗi thực sự
        console.error('Lỗi khi kiểm tra yêu thích:', error);
      }

      setIsFavorite(!!data);
    } catch (err) {
      console.error('Lỗi khi kiểm tra trạng thái yêu thích:', err);
    } finally {
      setLoading(false);
    }
  };

  // Kiểm tra trạng thái yêu thích khi component mount hoặc khi slug hoặc user thay đổi
  useEffect(() => {
    checkFavoriteStatus();
  }, [slug, user]);

  // Lắng nghe thay đổi danh sách yêu thích (realtime)
  useEffect(() => {
    if (!user?.id) return;

    // Lấy danh sách yêu thích hiện tại
    const fetchFavorites = async () => {
      try {
        const { data, error } = await supabase
          .from('favorites')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          throw error;
        }

        setFavorites(data || []);
      } catch (err) {
        console.error('Lỗi khi lấy danh sách yêu thích:', err);
      }
    };

    fetchFavorites();

    // Thiết lập subscription realtime
    const subscription = supabase
      .channel('favorites_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'favorites',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchFavorites();
        checkFavoriteStatus();
      })
      .subscribe();

    // Cleanup subscription
    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  // Xử lý thêm/xóa yêu thích
  const handleToggleFavorite = async () => {
    if (!user?.id) {
      alert("Vui lòng đăng nhập để thêm vào yêu thích!");
      return;
    }

    try {
      setLoading(true);
      
      if (isFavorite) {
        // Xóa khỏi yêu thích
        const { error } = await supabase
          .from('favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('slug', slug);

        if (error) {
          throw error;
        }

        setIsFavorite(false);
        alert("Đã xóa khỏi yêu thích!");
      } else {
        // Kiểm tra và thêm truyện vào bảng comics nếu chưa tồn tại
        const { data: existingComic, error: checkError } = await supabase
          .from('comics')
          .select('slug')
          .eq('slug', slug)
          .single();

        if (!existingComic) {
          // Thêm truyện vào bảng comics
          const { error: insertError } = await supabase
            .from('comics')
            .insert([
              {
                slug: slug,
                name: comicName || slug,
                status: 'Đang tiến hành',
                description: '',
                thumbnail: `https://img.otruyenapi.com/uploads/comics/${thumb_url}`
              }
            ]);

          if (insertError) {
            console.error("Lỗi khi thêm truyện vào cơ sở dữ liệu:", insertError);
            throw new Error('Không thể thêm truyện vào cơ sở dữ liệu!');
          }
        }

        // Thêm vào yêu thích
        const { error } = await supabase
          .from('favorites')
          .insert([
            {
              user_id: user.id,
              slug: slug
            }
          ]);

        if (error) {
          throw error;
        }

        setIsFavorite(true);
        alert("Đã thêm vào yêu thích!");
      }
    } catch (error) {
      console.error("Lỗi khi cập nhật yêu thích:", error);
      alert(error.message || "Có lỗi xảy ra. Vui lòng thử lại!");
    } finally {
      setLoading(false);
    }
  };

  return {
    favorites,
    isFavorite,
    loading,
    handleToggleFavorite
  };
};

export default useSupabaseFavorites; 