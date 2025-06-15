import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Home from './Home';
import MobileHome from './Mobile/MobileHome';
import DetailPage from './DetailPage';
import MobileDetailPageContainer from './Mobile/MobileDetailPage/MobileDetailPageContainer';
import { Genre } from './Genre';
import MobileGenre from './Mobile/MobileGenre';
import Search from './Search';
import MobileSearch from './Mobile/MobileSearch';

// Component Detector phát hiện thiết bị và render component phù hợp
const DeviceDetector = () => {
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
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
    
    // Chuyển hướng các trang desktop sang mobile nếu cần
    if (isMobile) {
      const path = location.pathname;
      if (path === '/history') {
        navigate('/mobile/history');
        return;
      }
      if (path === '/favorites') {
        navigate('/mobile/favorites');
        return;
      }
    }
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', checkDevice);
    };
  }, [isMobile, location.pathname, navigate]);
  
  // Redirect search pages on initial load if needed
  useEffect(() => {
    // If on a search page and device is mobile, redirect to mobile search page
    if ((location.pathname === '/search' || location.pathname === '/tim-kiem') && isMobile) {
      const searchParams = new URLSearchParams(location.search);
      const query = searchParams.get('query') || '';
      navigate(`/mobile/search?query=${encodeURIComponent(query)}`, { replace: true });
    }
  }, [isMobile, location.pathname, location.search, navigate]);
  
  // Kiểm tra nếu đang ở trang chi tiết truyện
  const isComicDetailPage = location.pathname.startsWith('/comics/');
  
  // Kiểm tra nếu đang ở trang thể loại
  const isGenrePage = location.pathname.startsWith('/genres/');
  
  // Kiểm tra nếu đang ở trang tìm kiếm
  const isSearchPage = location.pathname === '/search' || location.pathname === '/tim-kiem';
  
  // Render component phù hợp với thiết bị và trang
  if (isComicDetailPage) {
    return isMobile ? <MobileDetailPageContainer /> : <DetailPage />;
  }
  
  if (isGenrePage) {
    return isMobile ? <MobileGenre slug={location.pathname.replace('/genres/', '')} /> : <Genre />;
  }
  
  if (isSearchPage) {
    // For search pages, redirect mobile users to the mobile search page
    if (isMobile) {
      return <MobileSearch />;
    }
    return <Search />;
  }
  
  // Render trang chủ phù hợp với thiết bị
  return isMobile ? <MobileHome /> : <Home />;
};

export default DeviceDetector; 