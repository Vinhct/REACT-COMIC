import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Nav, Button } from 'react-bootstrap';
import { 
  FaTachometerAlt, 
  FaBook, 
  FaUsers, 
  FaHeart, 
  FaHistory, 
  FaComments,
  FaSignOutAlt,
  FaBars,
  FaTimes
} from 'react-icons/fa';
import { useAdmin } from '../AdminContext';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const location = useLocation();
  const { adminUser, adminSignOut } = useAdmin();
  const [collapsed, setCollapsed] = useState(false);

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const navItems = [
    {
      path: '/admin/dashboard',
      name: 'Dashboard',
      icon: <FaTachometerAlt />
    },
    {
      path: '/admin/comics',
      name: 'Quản lý Truyện',
      icon: <FaBook />
    },
    {
      path: '/admin/users',
      name: 'Quản lý Người dùng',
      icon: <FaUsers />
    },
    {
      path: '/admin/favorites',
      name: 'Quản lý Yêu thích',
      icon: <FaHeart />
    },
    {
      path: '/admin/history',
      name: 'Quản lý Lịch sử',
      icon: <FaHistory />
    },
    {
      path: '/admin/comments',
      name: 'Quản lý Bình luận',
      icon: <FaComments />
    }
  ];

  return (
    <div className={`admin-sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <h3 className={collapsed ? 'd-none' : ''}>Admin Panel</h3>
        <Button 
          variant="link" 
          className="toggle-btn" 
          onClick={toggleSidebar}
        >
          {collapsed ? <FaBars /> : <FaTimes />}
        </Button>
      </div>

      <div className="admin-profile">
        {!collapsed && (
          <>
            <div className="admin-avatar">
              {adminUser?.display_name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="admin-info">
              <h5>{adminUser?.display_name || adminUser?.email || 'Admin'}</h5>
              <p>{adminUser?.admin_role || 'Administrator'}</p>
            </div>
          </>
        )}
      </div>

      <Nav className="flex-column sidebar-nav">
        {navItems.map((item, index) => (
          <Nav.Item key={index}>
            <Nav.Link 
              as={Link} 
              to={item.path}
              className={location.pathname === item.path ? 'active' : ''}
            >
              <span className="icon">{item.icon}</span>
              <span className={`nav-text ${collapsed ? 'd-none' : ''}`}>{item.name}</span>
            </Nav.Link>
          </Nav.Item>
        ))}
      </Nav>

      <div className="sidebar-footer">
        <Button 
          variant="outline-danger" 
          className="logout-btn" 
          onClick={adminSignOut}
        >
          <FaSignOutAlt />
          <span className={collapsed ? 'd-none' : ''}>Đăng xuất</span>
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar; 