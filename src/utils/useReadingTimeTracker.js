import { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabaseClient';

/**
 * Hook theo dõi thời gian đọc truyện để hoàn thành nhiệm vụ
 * @param {string} slug - Slug của truyện đang đọc
 * @returns {Object} Trạng thái và hàm xử lý thời gian đọc
 */
const useReadingTimeTracker = (slug) => {
  const [isReading, setIsReading] = useState(false);
  const [readingTime, setReadingTime] = useState(0); // Thời gian đọc tính bằng giây
  const [error, setError] = useState(null);
  const timerRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const readingStartTimeRef = useRef(null);

  // Hàm bắt đầu theo dõi thời gian đọc
  const startTracking = () => {
    if (isReading) return;
    
    setIsReading(true);
    readingStartTimeRef.current = Date.now();
    lastActivityRef.current = Date.now();
    
    // Bắt đầu đếm thời gian
    timerRef.current = setInterval(() => {
      const currentTime = Date.now();
      const timeSinceLastActivity = currentTime - lastActivityRef.current;
      
      // Nếu không có hoạt động trong 1 phút, coi như người dùng không đọc nữa
      if (timeSinceLastActivity > 60000) {
        pauseTracking();
        return;
      }
      
      // Cập nhật thời gian đọc
      const elapsedTime = Math.floor((currentTime - readingStartTimeRef.current) / 1000);
      setReadingTime(elapsedTime);
      
      // Nếu đã đọc được 20 phút (1200 giây), cập nhật lên server
      if (elapsedTime % 300 === 0) { // Cập nhật mỗi 5 phút
        updateReadingTimeOnServer(Math.floor(elapsedTime / 60));
      }
    }, 1000);
  };

  // Hàm tạm dừng theo dõi thời gian đọc
  const pauseTracking = () => {
    if (!isReading) return;
    
    setIsReading(false);
    clearInterval(timerRef.current);
    
    // Lưu thời gian đọc lên server
    if (readingStartTimeRef.current) {
      const elapsedMinutes = Math.floor((Date.now() - readingStartTimeRef.current) / 60000);
      if (elapsedMinutes > 0) {
        updateReadingTimeOnServer(elapsedMinutes);
      }
    }
  };

  // Hàm ghi nhận hoạt động của người dùng
  const recordActivity = () => {
    lastActivityRef.current = Date.now();
    
    // Nếu đang tạm dừng, bắt đầu lại
    if (!isReading) {
      startTracking();
    }
  };

  // Hàm cập nhật thời gian đọc lên server
  const updateReadingTimeOnServer = async (minutes) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      
      // Gọi function của Supabase để cập nhật thời gian đọc
      const { data, error } = await supabase.rpc('track_reading_time', {
        p_user_id: session.user.id,
        p_slug: slug,
        p_minutes: minutes
      });
      
      if (error) throw error;
    } catch (err) {
      console.error('Lỗi khi cập nhật thời gian đọc:', err.message);
      setError(err.message);
    }
  };

  // Đảm bảo dừng theo dõi khi component unmount
  useEffect(() => {
    // Bắt đầu theo dõi khi component mount
    startTracking();
    
    // Thiết lập các event listener để theo dõi hoạt động
    const handleActivity = () => recordActivity();
    
    // Các sự kiện chuột/bàn phím để phát hiện người dùng đang đọc
    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keypress', handleActivity);
    window.addEventListener('scroll', handleActivity);
    window.addEventListener('touchstart', handleActivity);
    
    // Cleanup khi unmount
    return () => {
      pauseTracking();
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keypress', handleActivity);
      window.removeEventListener('scroll', handleActivity);
      window.removeEventListener('touchstart', handleActivity);
    };
  }, [slug]);

  return {
    isReading,
    readingTimeSeconds: readingTime,
    readingTimeMinutes: Math.floor(readingTime / 60),
    error,
    recordActivity,
    startTracking,
    pauseTracking
  };
};

export default useReadingTimeTracker; 