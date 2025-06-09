import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { AdminProvider } from './AdminContext';
import AdminLogin from './AdminLogin';
import Dashboard from './Dashboard';
import UsersManagement from './Management/UsersManagement';
import ComicsManagement from './Management/ComicsManagement';
import FavoritesManagement from './Management/FavoritesManagement';
import HistoryManagement from './Management/HistoryManagement';
import CommentsManagement from './Management/CommentsManagement';
import MissionsManagement from './Management/MissionsManagement';
import LuckyWheelManagement from './Management/LuckyWheelManagement';
import AdOrdersManagement from './Management/AdOrdersManagement';
import SystemBannersManagement from './Management/SystemBannersManagement';
import PaymentConfirmationsManagement from './Management/PaymentConfirmationsManagement';
import UserAdvertisementStatus from './Management/UserAdvertisementStatus';

const AdminRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<AdminLogin />} />
      <Route path="/login" element={<AdminLogin />} />
      <Route
        path="/*"
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
              <Route path="payment-confirmations" element={<PaymentConfirmationsManagement />} />
              <Route path="user-ads" element={<UserAdvertisementStatus />} />
            </Routes>
          </AdminProvider>
        }
      />
    </Routes>
  );
};

export default AdminRoutes; 