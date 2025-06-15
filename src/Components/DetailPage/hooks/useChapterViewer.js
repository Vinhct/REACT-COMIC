import { useState } from 'react';
import axios from 'axios';
import { serverTimestamp } from 'firebase/firestore';

/**
 * Hook để quản lý việc đọc chương truyện
 * 
 * @param {function} saveHistory Hàm lưu lịch sử đọc truyện
 * @param {string} comicName Tên truyện
 * @param {string} comicSlug Slug của truyện
 * @returns {Object} Các state và hàm xử lý cho việc đọc chương
 */
const useChapterViewer = (saveHistory, comicName, comicSlug) => {
  const [chapterData, setChapterData] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleClose = () => setIsModalOpen(false);

  const handleReachChapter = async (chapter_api) => {
    try {
      setLoading(true);
      const response = await axios.get(`${chapter_api}`);
      setChapterData(response.data);
      
      if (saveHistory) {
        // Xác định chapterName dựa trên định dạng dữ liệu trả về
        let chapterName = "Unknown";
        
        // Kiểm tra định dạng dữ liệu trả về
        if (response.data?.data?.item?.chapter_name) {
          // Định dạng desktop
          chapterName = response.data.data.item.chapter_name;
        } else if (response.data?.chapter_name) {
          // Định dạng mobile
          chapterName = response.data.chapter_name;
        }
        // Lấy thumb_url nếu có từ response hoặc truyền vào qua closure
        let thumb_url = "";
        if (response.data?.data?.item?.thumb_url) {
          thumb_url = response.data.data.item.thumb_url;
        } else if (response.data?.thumb_url) {
          thumb_url = response.data.thumb_url;
        }
        saveHistory({
          slug: comicSlug,
          name: comicName || "Unknown",
          chapter: chapterName,
          thumb_url,
          timestamp: serverTimestamp(),
          chapter_api: chapter_api
        });
      }
      
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error loading chapter:", error);
      // Hiển thị thông báo lỗi hoặc dữ liệu mẫu
      setChapterData({
        error: true,
        message: "Không thể tải dữ liệu chương"
      });
      setIsModalOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return {
    chapterData,
    isModalOpen,
    loading,
    handleClose,
    handleReachChapter
  };
};

export default useChapterViewer; 