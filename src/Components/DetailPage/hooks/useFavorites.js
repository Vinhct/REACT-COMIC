import { useState, useEffect } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  deleteDoc, 
  onSnapshot 
} from 'firebase/firestore';

/**
 * Hook để quản lý tính năng yêu thích
 * 
 * @param {Object} db Instance của Firestore
 * @param {string} slug Slug của truyện
 * @param {Object} user Thông tin người dùng hiện tại
 * @param {string} comicName Tên truyện
 * @returns {Object} Các state và hàm xử lý cho tính năng yêu thích
 */
const useFavorites = (db, slug, user, comicName) => {
  const [favorites, setFavorites] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);

  // Kiểm tra truyện đã được yêu thích chưa và lấy danh sách yêu thích
  useEffect(() => {
    if (!user || !db || !slug) return;

    const favoritesRef = collection(db, `users/${user.uid}/favorites`);
    
    // Kiểm tra truyện này đã nằm trong mục yêu thích chưa
    const checkFavorite = async () => {
      const q = query(favoritesRef, where("slug", "==", slug));
      const snapshot = await getDocs(q);
      setIsFavorite(!snapshot.empty);
    };
    
    checkFavorite();

    // Lắng nghe thay đổi danh sách yêu thích
    const unsubscribe = onSnapshot(favoritesRef, (snapshot) => {
      const favoritesData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFavorites(favoritesData);
    });

    return () => unsubscribe();
  }, [db, slug, user]);

  // Xử lý thêm/xóa yêu thích
  const handleToggleFavorite = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để thêm vào yêu thích!");
      return;
    }

    const favoriteData = {
      slug: slug,
      name: comicName || "Unknown",
      timestamp: serverTimestamp(),
    };

    try {
      if (isFavorite) {
        // Xóa khỏi yêu thích
        const q = query(
          collection(db, `users/${user.uid}/favorites`),
          where("slug", "==", slug)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => deleteDoc(doc.ref));
        setIsFavorite(false);
        alert("Đã xóa khỏi yêu thích!");
      } else {
        // Thêm vào yêu thích
        await addDoc(
          collection(db, `users/${user.uid}/favorites`),
          favoriteData
        );
        setIsFavorite(true);
        alert("Đã thêm vào yêu thích!");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại!");
    }
  };

  return {
    favorites,
    isFavorite,
    handleToggleFavorite
  };
};

export default useFavorites; 