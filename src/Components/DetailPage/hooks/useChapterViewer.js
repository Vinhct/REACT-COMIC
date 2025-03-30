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
        saveHistory({
          slug: comicSlug,
          name: comicName || "Unknown",
          chapter: response.data.data.item.chapter_name || "Unknown",
          timestamp: serverTimestamp(),
        });
      }
      
      setIsModalOpen(true);
    } catch (error) {
      console.error("Error loading chapter:", error);
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