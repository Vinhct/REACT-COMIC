import { useState, useEffect } from 'react';
import { supabase } from '../../../supabaseClient';

/**
 * Hook để quản lý bình luận và đánh giá sử dụng Supabase
 * 
 * @param {string} slug Slug của truyện
 * @param {Object} user Thông tin người dùng hiện tại
 * @returns {Object} Các state và hàm xử lý cho bình luận và đánh giá
 */
const useSupabaseComments = (slug, user) => {
  const [comments, setComments] = useState([]);
  const [rating, setRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [commentSuccess, setCommentSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lấy danh sách bình luận
  useEffect(() => {
    if (!slug) {
      console.log('No slug provided, skipping comment fetch');
      return;
    }

    console.log('Fetching comments for slug:', slug);

    const fetchComments = async () => {
      let commentsData = null;
      
      try {
        setLoading(true);
        // Đảm bảo slug là chuỗi
        const normalizedSlug = String(slug);
        
        console.log('Using normalized slug for query:', normalizedSlug);
        
        // Sử dụng cú pháp đơn giản hơn, chỉ lấy các trường cần thiết
        const { data, error } = await supabase
          .from('comments')
          .select('id, comment, rating, created_at, user_id, slug')
          .eq('slug', normalizedSlug)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Error fetching comments:', error);
          throw error;
        }

        console.log('Raw comments data:', data);
        commentsData = data;

        // Kiểm tra nếu data là null hoặc undefined
        if (!data || data.length === 0) {
          console.log('No comments found for slug:', normalizedSlug);
          setComments([]);
          return;
        }

        // Lấy thông tin người dùng từ user_id
        const userIds = [...new Set(data.map(item => item.user_id))];
        const { data: usersData, error: usersError } = await supabase
          .from('auth_users_view') // Dùng view tùy chỉnh hoặc sử dụng auth.users nếu có quyền
          .select('id, email, display_name')
          .in('id', userIds);
          
        if (usersError) {
          console.error('Error fetching users data:', usersError);
        }
        
        // Tạo map để tra cứu nhanh thông tin người dùng
        const usersMap = {};
        if (usersData) {
          usersData.forEach(user => {
            usersMap[user.id] = user;
          });
        }
        
        // Chuyển đổi dữ liệu để phù hợp với format hiện tại
        const formattedComments = data.map(item => {
          const userData = usersMap[item.user_id] || {};
          
          const comment = {
            id: item.id,
            text: item.comment,
            rating: item.rating,
            timestamp: item.created_at,
            user: {
              id: item.user_id,
              email: userData.email || 'ẩn danh',
              displayName: userData.display_name || userData.email || 'Người dùng ẩn danh'
            }
          };
          console.log('Formatted comment:', comment);
          return comment;
        });

        console.log('Setting comments state with:', formattedComments);
        setComments(formattedComments);
      } catch (err) {
        console.error('Lỗi khi lấy bình luận:', err);
        // Nếu xảy ra lỗi, vẫn hiển thị bình luận tạm mà không có thông tin người dùng
        try {
          if (commentsData) {
            const simpleComments = commentsData.map(item => ({
              id: item.id,
              text: item.comment,
              rating: item.rating,
              timestamp: item.created_at,
              user: {
                id: item.user_id,
                email: 'ẩn danh',
                displayName: 'Người dùng'
              }
            }));
            setComments(simpleComments);
          }
        } catch (formatErr) {
          console.error('Error formatting simple comments:', formatErr);
        }
      } finally {
        setLoading(false);
      }
    };

    // Gọi hàm fetch
    fetchComments();

    // Thiết lập subscription realtime
    const subscription = supabase
      .channel('comments_changes')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'comments',
        filter: `slug=eq.${slug}`
      }, (payload) => {
        console.log('Received real-time update:', payload);
        fetchComments();
      })
      .subscribe((status) => {
        console.log('Subscription status:', status);
      });

    // Cleanup subscription
    return () => {
      console.log('Unsubscribing from comments channel');
      subscription.unsubscribe();
    };
  }, [slug]);

  // Xử lý gửi bình luận và đánh giá
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    setCommentError(null);
    setCommentSuccess(false);

    console.log('Submitting comment for slug:', slug);
    console.log('User:', user);

    // Kiểm tra người dùng đã đăng nhập chưa
    if (!user) {
      setCommentError('Vui lòng đăng nhập để bình luận');
      return;
    }

    // Kiểm tra đã nhập nội dung bình luận chưa
    if (!commentText.trim()) {
      setCommentError('Vui lòng nhập nội dung bình luận');
      return;
    }

    // Kiểm tra đã đánh giá chưa
    if (!rating) {
      setCommentError('Vui lòng đánh giá truyện (1-5 sao)');
      return;
    }

    try {
      // Đảm bảo slug là chuỗi
      const normalizedSlug = String(slug);
      
      // Thêm bình luận mới
      const newComment = {
        user_id: user.id,
        slug: normalizedSlug,
        comment: commentText,
        rating: rating
      };
      
      console.log('Inserting new comment:', newComment);
      
      const { data, error } = await supabase
        .from('comments')
        .insert([newComment])
        .select();

      if (error) {
        console.error('Error adding comment:', error);
        throw error;
      }

      console.log('Comment added successfully:', data);

      // Đặt lại form
      setCommentText('');
      setRating(0);
      setCommentSuccess(true);

      // Thêm bình luận mới vào danh sách hiển thị ngay lập tức
      if (data && data.length > 0) {
        const newCommentFormatted = {
          id: data[0].id,
          text: data[0].comment,
          rating: data[0].rating,
          timestamp: data[0].created_at,
          user: {
            id: user.id,
            email: user.email,
            displayName: user.user_metadata?.display_name || user.email
          }
        };
        
        setComments(prevComments => [newCommentFormatted, ...prevComments]);
      }

      // Tự động ẩn thông báo thành công sau 3 giây
      setTimeout(() => {
        setCommentSuccess(false);
      }, 3000);
    } catch (err) {
      console.error('Lỗi khi gửi bình luận:', err);
      setCommentError('Có lỗi xảy ra. Vui lòng thử lại!');
    }
  };

  // Tính điểm đánh giá trung bình
  const calculateAverageRating = () => {
    if (!comments || comments.length === 0) return 0;
    
    const sum = comments.reduce((total, comment) => total + (comment.rating || 0), 0);
    return (sum / comments.length).toFixed(1);
  };

  return {
    comments,
    rating,
    setRating,
    commentText,
    setCommentText,
    commentError,
    commentSuccess,
    loading,
    handleSubmitComment,
    calculateAverageRating
  };
};

export default useSupabaseComments; 