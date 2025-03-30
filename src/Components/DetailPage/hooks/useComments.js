import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  orderBy, 
  onSnapshot 
} from 'firebase/firestore';

/**
 * Hook để quản lý bình luận và đánh giá
 * 
 * @param {Object} db Instance của Firestore
 * @param {string} slug Slug của truyện
 * @param {Object} user Thông tin người dùng hiện tại
 * @returns {Object} Các state và hàm xử lý cho bình luận
 */
const useComments = (db, slug, user) => {
  const [comments, setComments] = useState([]);
  const [rating, setRating] = useState(0);
  const [commentText, setCommentText] = useState('');
  const [commentError, setCommentError] = useState(null);
  const [commentSuccess, setCommentSuccess] = useState(null);

  // Lấy danh sách bình luận
  useEffect(() => {
    if (!slug || !db) return;

    const q = query(
      collection(db, `comics/${slug}/comments`),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(commentsData);
      },
      (error) => {
        console.error("Error fetching comments:", error);
        setCommentError("Không thể tải bình luận.");
      }
    );

    return () => unsubscribe();
  }, [slug, db]);

  // Tính trung bình đánh giá
  const calculateAverageRating = () => {
    if (comments.length === 0) return 0;
    const totalRating = comments.reduce(
      (sum, comment) => sum + (comment.rating || 0),
      0
    );
    return Math.round((totalRating / comments.length) * 10) / 10;
  };

  // Xử lý gửi bình luận
  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      setCommentError("Vui lòng đăng nhập để bình luận và đánh giá.");
      return;
    }
    if (!commentText.trim() || rating === 0) {
      setCommentError("Vui lòng nhập bình luận và chọn đánh giá.");
      return;
    }

    try {
      await addDoc(collection(db, `comics/${slug}/comments`), {
        userId: user.uid,
        userName: user.displayName || user.email || "Ẩn danh",
        comment: commentText,
        rating: rating,
        timestamp: serverTimestamp(),
      });
      setCommentText("");
      setRating(0);
      setCommentSuccess("Bình luận và đánh giá đã được gửi!");
      setCommentError(null);
      
      // Tự động ẩn thông báo thành công sau 3 giây
      setTimeout(() => setCommentSuccess(null), 3000);
    } catch (error) {
      console.error("Error adding comment:", error);
      setCommentError("Không thể gửi bình luận. Vui lòng thử lại.");
    }
  };

  return {
    comments,
    rating,
    setRating,
    commentText,
    setCommentText,
    commentError,
    commentSuccess,
    handleSubmitComment,
    calculateAverageRating
  };
};

export default useComments; 