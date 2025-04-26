import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Home from './Home';
import MobileHome from './Mobile/MobileHome';
import DetailPage from './DetailPage';
import MobileDetailPageContainer from './Mobile/MobileDetailPage/MobileDetailPageContainer';
import { Genre } from './Genre';
import MobileGenre from './Mobile/MobileGenre';

// Component Detector phát hiện thiết bị và render component phù hợp
const DeviceDetector = () => {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  
  useEffect(() => {
    // Hàm kiểm tra thiết bị di động
    const isMobileDevice = () => {
      const ua = navigator.userAgent;
      return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth < 768;
    };
    
    // Kiểm tra kích thước màn hình và user agent
    const checkDevice = () => {
      const mobile = isMobileDevice();
      setIsMobile(mobile);
      
      // Thêm class vào body để áp dụng styles phù hợp
      if (mobile) {
        document.body.classList.add('is-mobile');
      } else {
        document.body.classList.remove('is-mobile');
      }
    };
    
    // Kiểm tra ban đầu
    checkDevice();
    
    // Lắng nghe sự kiện thay đổi kích thước
    window.addEventListener('resize', checkDevice);
    
    // Lưu lại loại thiết bị để sử dụng trong các route khác
    localStorage.setItem('deviceType', isMobile ? 'mobile' : 'desktop');
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, [isMobile]);
  
  // Kiểm tra nếu đang ở trang chi tiết truyện
  const isComicDetailPage = location.pathname.startsWith('/comics/');
  
  // Kiểm tra nếu đang ở trang thể loại
  const isGenrePage = location.pathname.startsWith('/genres/');
  
  // Render component phù hợp với thiết bị và trang
  if (isComicDetailPage) {
    // No need to extract slug here as it will be handled by the respective components
    return isMobile ? <MobileDetailPageContainer /> : <DetailPage />;
  }
  
  if (isGenrePage) {
    // No need to extract slug here as it will be handled by the respective components
    return isMobile ? <MobileGenre slug={location.pathname.replace('/genres/', '')} /> : <Genre />;
  }
  
  // Render trang chủ phù hợp với thiết bị
  return isMobile ? <MobileHome /> : <Home />;
};

export default DeviceDetector; 