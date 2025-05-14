//import logo from './logo.svg';
import './App.css';
import React, {  lazy } from 'react';
import DeviceDetector from './Components/DeviceDetector';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Genre } from './Components/Genre';
import DPH from './Components/dang-phat-hanh';
import HT from './Components/hoan-thanh';
import SRM from './Components/sap-ra-mat';
// Các component đăng nhập/đăng ký sử dụng Supabase
import SupabaseLogin from './Components/Include/Authentication/SupabaseLogin';
import SupabaseRegister from './Components/Include/Authentication/SupabaseRegister';
// Các component trang sử dụng Supabase
import SupabaseHistoryPage from './Components/SupabaseHistoryPage';
import Search from './Components/Search';
import SupabaseFavoritesPage from './Components/SupabaseFavoritesPage';
import EmailValidationChecker from './Components/EmailValidationChecker';
import { SupabaseAuthProvider } from './Components/Include/Authentication/SupabaseAuthContext';
// Import ChatbotProvider - sửa đường dẫn để import trực tiếp từ file
import ChatbotProvider from './Components/Include/Chatbot/ChatbotProvider';
import MobileGenreList from './Components/Mobile/MobileGenreList';
import MobileGenre from './Components/Mobile/MobileGenre';
import MobileProfile from './Components/Mobile/MobileProfile';
import MobileMissionsPage from './Components/Mobile/Missions/MobileMissionsPage';
import MobileLuckyWheelPage from './Components/Mobile/Missions/MobileLuckyWheelPage';
import MobileSearch from './Components/Mobile/MobileSearch';
//import GanrePageMobile from './Components/Mobile/GanrePageMobile';
//import Category from './Components/Category';
//import FollowPage from './Components/FollowPage';
import CommentsDebug from './Components/Debug/CommentsDebug';
import { BuyAdPage } from './Components/banner';

// Admin components
import { AdminProvider } from './Components/Admin/AdminContext';
import AdminLogin from './Components/Admin/AdminLogin';
import Dashboard from './Components/Admin/Dashboard';
import UsersManagement from './Components/Admin/Management/UsersManagement';
import ComicsManagement from './Components/Admin/Management/ComicsManagement';
import FavoritesManagement from './Components/Admin/Management/FavoritesManagement';
import HistoryManagement from './Components/Admin/Management/HistoryManagement';
import CommentsManagement from './Components/Admin/Management/CommentsManagement';
import MissionsManagement from './Components/Admin/Management/MissionsManagement';
import LuckyWheelManagement from './Components/Admin/Management/LuckyWheelManagement';
import AdOrdersManagement from './Components/Admin/Management/AdOrdersManagement';
import SystemBannersManagement from './Components/Admin/Management/SystemBannersManagement';

// Lazy loaded components
const MissionsPage = lazy(() => import('./Components/Missions/MissionsPage'));
const LuckyWheelPage = lazy(() => import('./Components/Missions/LuckyWheelPage'));

function App() {
  return (
    <SupabaseAuthProvider>
      <Router>
        <Routes>
          {/* Device detector will handle both mobile and desktop rendering */}
          <Route path='/' element={<DeviceDetector />}></Route>
          <Route path='/comics/:slug' element={<DeviceDetector />}></Route>
          <Route path='/genres/:slug' element={<DeviceDetector />}></Route>
          
          {/* Mobile specific routes */}
          {/* Commenting out routes with missing components */}
          {/* <Route path='/ganre/:slug' element={<GanrePageMobile />}></Route> */}
          <Route path='/the-loai' element={<MobileGenreList />}></Route>
          <Route path='/the-loai/:slug' element={<MobileGenre />}></Route>
          <Route path='/genres-mobile' element={<MobileGenreList />}></Route>
          <Route path='/profile' element={<MobileProfile />}></Route>
          <Route path='/mobile/missions' element={<MobileMissionsPage />}></Route>
          <Route path='/mobile/lucky-wheel' element={<MobileLuckyWheelPage />}></Route>
          <Route path='/mobile/search' element={<MobileSearch />}></Route>
          
          {/* Desktop specific routes */}
          <Route path='/genre/:slug' element={<Genre />}></Route>
          <Route path='/dang-phat-hanh' element={<DPH />}></Route>
          <Route path='/hoan-thanh' element={<HT />}></Route>
          <Route path='/sap-ra-mat' element={<SRM />}></Route>
          
          {/* Common routes - Sử dụng component Supabase mới */}
          <Route path='/login' element={<SupabaseLogin />}></Route>
          <Route path="/register" element={<SupabaseRegister />} />
          <Route path="/history" element={<SupabaseHistoryPage />} />
          <Route path="/search" element={<Search />} />
          <Route path="/tim-kiem" element={<Search />} />
          <Route path="/favorites" element={<SupabaseFavoritesPage />} />
          <Route path="/email-checker" element={<EmailValidationChecker />} />
          {/* <Route path="/genres" element={<Category />} /> */}
          {/* <Route path="/follow" element={<FollowPage />} /> */}
          
          {/* Debug routes */}
          <Route path="/debug/comments" element={<CommentsDebug />} />
          
          {/* Admin routes */}
          <Route path="/admin" element={<AdminLogin />} />
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/*" 
            element={
              <AdminProvider>
                <Routes>
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="users" element={<UsersManagement />} />
                  <Route path="comics" element={<ComicsManagement />} />
                  <Route path="favorites" element={<FavoritesManagement />} />
                  <Route path="history" element={<HistoryManagement />} />
                  <Route path="comments" element={<CommentsManagement />} />
                  <Route path="missions" element={<MissionsManagement />} />
                  <Route path="lucky-wheel" element={<LuckyWheelManagement />} />
                  <Route path="ad-orders" element={<AdOrdersManagement />} />
                  <Route path="system-banners" element={<SystemBannersManagement />} />
                </Routes>
              </AdminProvider>
            } 
          />

          {/* Thêm routes mới trong phần Route */}
          <Route path="/missions" element={<MissionsPage />} />
          <Route path="/lucky-wheel" element={<LuckyWheelPage />} />
          <Route path="/buy-ad" element={<BuyAdPage />} />
        </Routes>
        {/* Thêm ChatbotProvider ở đây để hiển thị trên tất cả các trang */}
        <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 9999 }}>
          <ChatbotProvider />
        </div>
      </Router>
    </SupabaseAuthProvider>
  );
}

export default App;
