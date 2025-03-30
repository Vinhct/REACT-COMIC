import { useCallback } from 'react';
import { 
  collection, 
  addDoc, 
  serverTimestamp, 
  query, 
  where, 
  getDocs, 
  orderBy, 
  deleteDoc, 
  doc
} from 'firebase/firestore';
import debounce from "lodash/debounce";

/**
 * Hook để quản lý lịch sử đọc truyện
 * 
 * @param {Object} db Instance của Firestore
 * @param {Object} user Thông tin người dùng hiện tại
 * @returns {function} Hàm lưu lịch sử
 */
const useHistory = (db, user) => {
  // Hàm lưu lịch sử với debounce để tránh gọi quá nhiều lần
  const saveHistory = useCallback(
    debounce(async (historyItem) => {
      if (!user || !db) return;

      const historyRef = collection(db, `users/${user.uid}/history`);
      
      // Kiểm tra đã tồn tại trong lịch sử chưa
      const q = query(historyRef, where("slug", "==", historyItem.slug));
      const querySnapshot = await getDocs(q);

      // Nếu đã tồn tại thì không thêm mới nữa
      if (!querySnapshot.empty) return;

      // Giới hạn số lượng lịch sử là 5
      const allHistoryQuery = query(historyRef, orderBy("timestamp", "desc"));
      const allHistorySnapshot = await getDocs(allHistoryQuery);
      const historyCount = allHistorySnapshot.size;

      // Nếu đã đủ 5 thì xóa cái cũ nhất
      if (historyCount >= 5) {
        const oldestDoc = allHistorySnapshot.docs[historyCount - 1];
        await deleteDoc(doc(db, `users/${user.uid}/history`, oldestDoc.id));
      }

      // Thêm vào lịch sử
      await addDoc(historyRef, historyItem);

      // Lưu vào localStorage để sử dụng khi offline
      const localHistory = JSON.parse(localStorage.getItem("history") || "[]");
      const updatedLocal = localHistory.filter(
        (h) => h.slug !== historyItem.slug
      );
      updatedLocal.unshift(historyItem);
      localStorage.setItem("history", JSON.stringify(updatedLocal.slice(0, 5)));
    }, 1000),
    [db, user]
  );

  return saveHistory;
};

export default useHistory; 