import { useState, useEffect } from 'react';
import axios from 'axios';
import { serverTimestamp } from 'firebase/firestore';

/**
 * Hook để lấy và quản lý dữ liệu truyện
 * 
 * @param {string} slug Slug của truyện
 * @param {function} saveHistory Hàm lưu lịch sử đọc truyện
 * @returns {Object} Dữ liệu truyện và trạng thái
 */
const useComicData = (slug, saveHistory) => {
  const [comicData, setComicData] = useState(null);
  const [relatedComics, setRelatedComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://otruyenapi.com/v1/api/truyen-tranh/${slug}`
        );
        setComicData(response.data);
        setLoading(false);
        
        if (saveHistory) {
          saveHistory({
            slug: slug,
            name: response.data.data.data.item.name || "Unknown",
            timestamp: serverTimestamp(),
          });
        }

        // Lấy thể loại đầu tiên của truyện để gọi API truyện liên quan
        const categorySlug = response.data.data.data.item.category?.[0]?.slug;
        if (categorySlug) {
          try {
            const relatedResponse = await axios.get(
              `https://otruyenapi.com/v1/api/the-loai/${categorySlug}?page=1`
            );
            setRelatedComics(relatedResponse.data.data.items);
          } catch (relatedError) {
            console.error("Error fetching related comics:", relatedError);
          }
        }
      } catch (error) {
        setLoading(false);
        setError(error.message || "Có lỗi xảy ra khi tải dữ liệu truyện");
        console.error("Error fetching comic data:", error);
      }
    };

    if (slug) {
      fetchData();
    }
  }, [slug, saveHistory]);

  return {
    comicData,
    relatedComics,
    loading,
    error,
    item: comicData?.data?.data?.item || null,
    seoData: comicData?.data?.data?.seoOnPage || null
  };
};

export default useComicData; 