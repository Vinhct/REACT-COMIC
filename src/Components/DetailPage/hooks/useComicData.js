import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { serverTimestamp } from 'firebase/firestore';

/**
 * Hook để lấy và quản lý dữ liệu truyện
 * 
 * @param {string} slug Slug của truyện
 * @param {function} saveHistory Hàm lưu lịch sử đọc truyện
 * @param {number} retryCount Số lần thử lại
 * @returns {Object} Dữ liệu truyện và trạng thái
 */
const useComicData = (slug, saveHistory, retryCount = 0) => {
  const [comicData, setComicData] = useState(null);
  const [relatedComics, setRelatedComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [item, setItem] = useState(null);
  const [seoData, setSeoData] = useState(null);

  // Tạo một hàm refetch mà component có thể gọi
  const refetch = useCallback(() => {
    setLoading(true);
    setError(null);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Reset dữ liệu khi slug thay đổi
        setComicData(null);
        setItem(null);
        setSeoData(null);
        
        const response = await axios.get(
          `https://otruyenapi.com/v1/api/truyen-tranh/${slug}`
        );
        
        console.log('API response:', response.data);
        
        // Lưu dữ liệu gốc để debug
        setComicData(response.data);
        
        // Cố gắng trích xuất dữ liệu từ bất kỳ cấu trúc nào
        let extractedItem = null;
        let extractedSeo = null;
        
        // Kiểm tra cấu trúc dữ liệu theo nhiều cách khác nhau
        if (response.data?.data?.data?.item) {
          // Cấu trúc cũ
          extractedItem = response.data.data.data.item;
          extractedSeo = response.data.data.data.seoOnPage;
        } else if (response.data?.data?.item) {
          // Cấu trúc có thể thay đổi
          extractedItem = response.data.data.item;
          extractedSeo = response.data.data.seoOnPage;
        } else if (response.data?.item) {
          // Cấu trúc đơn giản hơn
          extractedItem = response.data.item;
          extractedSeo = response.data.seoOnPage;
        } else {
          // Nếu không tìm thấy cấu trúc mong đợi, tìm kiếm đệ quy
          const findItemInData = (obj, key = 'item') => {
            if (!obj || typeof obj !== 'object') return null;
            if (obj[key] && typeof obj[key] === 'object') return obj[key];
            
            for (const prop in obj) {
              if (typeof obj[prop] === 'object') {
                const found = findItemInData(obj[prop], key);
                if (found) return found;
              }
            }
            return null;
          };
          
          extractedItem = findItemInData(response.data);
          extractedSeo = findItemInData(response.data, 'seoOnPage');
        }
        
        // Nếu không tìm thấy item, tạo một item giả từ dữ liệu có sẵn
        if (!extractedItem && typeof response.data === 'object') {
          // Thử truy cập các thuộc tính thường có trong API
          const responseObj = response.data;
          const possibleName = responseObj.title || responseObj.name || responseObj.comics_name || slug;
          const possibleContent = responseObj.description || responseObj.content || responseObj.detail || "Không có nội dung";
          
          extractedItem = {
            name: possibleName,
            content: possibleContent,
            thumb_url: responseObj.thumbnail || responseObj.image || responseObj.cover || "",
            status: responseObj.status || "Đang cập nhật",
            category: responseObj.categories || responseObj.genres || []
          };
        }
        
        // Nếu vẫn không có item, tạo dữ liệu mặc định từ slug
        if (!extractedItem) {
          extractedItem = {
            name: `Truyện: ${slug}`,
            content: "Không thể tải nội dung. Dữ liệu API không đúng cấu trúc mong đợi.",
            thumb_url: "",
            status: "Đang cập nhật",
            category: [],
            chapters: [
              {
                server_name: "Server mặc định",
                server_data: []
              }
            ]
          };
        }
        
        if (extractedItem) {
          // Đảm bảo item có thuộc tính chapters
          if (!extractedItem.chapters) {
            extractedItem.chapters = [];
          }
          
          setItem(extractedItem);
          setLoading(false);
          
          // Lưu lịch sử nếu có item
          if (saveHistory) {
            saveHistory({
              slug: slug,
              name: extractedItem.name || "Unknown",
              thumb_url: extractedItem.thumb_url || "",
              timestamp: serverTimestamp(),
            });
          }
          
          // Lấy thể loại nếu có 
          if (extractedItem.category && extractedItem.category.length > 0) {
            const categorySlug = extractedItem.category[0].slug;
            if (categorySlug) {
              try {
                const relatedResponse = await axios.get(
                  `https://otruyenapi.com/v1/api/the-loai/${categorySlug}?page=1`
                );
                
                if (relatedResponse.data?.data?.items) {
                  setRelatedComics(relatedResponse.data.data.items);
                }
              } catch (relatedError) {
                console.error("Error fetching related comics:", relatedError);
              }
            }
          }
          
          // Lưu dữ liệu SEO nếu có
          if (extractedSeo) {
            setSeoData(extractedSeo);
          } else {
            // Tạo dữ liệu SEO giả
            setSeoData({
              titleHead: extractedItem.name || slug,
              descriptionHead: extractedItem.content || "Chi tiết truyện tranh"
            });
          }
        } else {
          throw new Error("Không thể tìm thấy thông tin truyện");
        }
      } catch (error) {
        console.error("Error fetching comic data:", error);
        setLoading(false);
        setError(error.message || "Có lỗi xảy ra khi tải dữ liệu truyện");
      }
    };

    if (slug) {
      fetchData();
    } else {
      setLoading(false);
      setError("Không có thông tin truyện");
    }
    
    return () => {
      // Cleanup
    };
  }, [slug, saveHistory, retryCount]);

  return {
    comicData,
    relatedComics,
    loading,
    error,
    item,
    seoData,
    refetch
  };
};

export default useComicData; 