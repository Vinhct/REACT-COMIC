import React, { useState } from 'react';
import AdminSidebar from './Sidebar/AdminSidebar';
import { Container } from 'react-bootstrap';
import { Helmet } from 'react-helmet';

const AdminLayout = ({ children, title }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const defaultTitle = 'Admin Panel - Comic Management';
  const pageTitle = title ? `${title} - Admin Panel` : defaultTitle;

  return (
    <>
      <Helmet>
        <title>{pageTitle}</title>
      </Helmet>
      
      <div className="admin-container">
        <AdminSidebar 
          collapsed={sidebarCollapsed} 
          toggleSidebar={toggleSidebar} 
        />
        
        <main className={`admin-main-content ${sidebarCollapsed ? 'collapsed' : ''}`}>
          {children}
        </main>
      </div>
    </>
  );
};

export default AdminLayout; 