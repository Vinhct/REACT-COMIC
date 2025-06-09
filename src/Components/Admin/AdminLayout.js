import React from 'react';
import { Helmet } from 'react-helmet';
import AdminSidebar from './Sidebar/AdminSidebar';
import AdminNotification from './Notification/AdminNotification';
import './AdminLayout.css';

const AdminLayout = ({ children, title }) => {
  return (
    <>
      <Helmet>
        <title>{title ? `${title} - Admin Panel` : 'Admin Panel'}</title>
      </Helmet>
      <div className="admin-layout">
        <AdminSidebar />
        <main className="admin-main-content">
          {children}
        </main>
        <AdminNotification />
      </div>
    </>
  );
};

export default AdminLayout; 