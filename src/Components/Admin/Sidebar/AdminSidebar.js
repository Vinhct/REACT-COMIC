import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Nav, Button, Badge } from 'react-bootstrap';
import { 
  FaTachometerAlt, 
  FaBook, 
  FaUsers, 
  FaHeart, 
  FaHistory, 
  FaComments,
  FaSignOutAlt,
  FaBars,
  FaTimes,
  FaTasks,
  FaDharmachakra,
  FaAd,
  FaMoneyBillWave,
  FaUserTag,
  FaBell
} from 'react-icons/fa';
import { useAdmin } from '../AdminContext';
import { supabase } from '../../../supabaseClient';
import './AdminSidebar.css';

const AdminSidebar = () => {
  const location = useLocation();
  const { adminUser, adminSignOut } = useAdmin();
  const [collapsed, setCollapsed] = useState(false);
  const [newOrdersCount, setNewOrdersCount] = useState(0);

  useEffect(() => {
    // Subscribe to new payment orders
    const subscription = supabase
      .channel('payment-orders')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'payment_orders'
      }, (payload) => {
        setNewOrdersCount(prev => prev + 1);
      })
      .subscribe();

    // Get initial count of unconfirmed orders
    const getUnconfirmedOrders = async () => {
      const { count, error } = await supabase
        .from('payment_orders')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');
      
      if (!error) {
        setNewOrdersCount(count || 0);
      }
    };

    getUnconfirmedOrders();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
      path: '/admin/missions',
      name: 'Quản lý Nhiệm vụ',
      icon: <FaTasks />
    },
    {
      path: '/admin/lucky-wheel',
      name: 'Quản lý Vòng quay',
      icon: <FaDharmachakra />
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
    },
    {
      path: '/admin/ad-orders',
      name: 'Quản lý đơn gói QC',
      icon: <FaAd />
    },
    {
      path: '/admin/user-ads',
      name: 'Trạng thái QC User',
      icon: <FaUserTag />
    },
    {
      path: '/admin/system-banners',
      name: 'Quản lý Banner hệ thống',
      icon: <FaAd />
    },
    {
      path: '/admin/payment-confirmations',
      name: 'Quản lý Thanh toán',
      icon: <FaMoneyBillWave />,
      badge: newOrdersCount > 0 ? (
        <Badge 
          bg="danger" 
          className="notification-badge"
          style={{
            position: 'absolute',
            top: '-8px',
            right: '-8px',
            animation: newOrdersCount > 0 ? 'pulse 2s infinite' : 'none'
          }}
        >
          {newOrdersCount}
        </Badge>
      ) : null
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
            <Link
              to={item.path}
              className={`nav-link ${location.pathname === item.path ? 'active' : ''}`}
            >
              <div className="d-flex align-items-center">
                <span className="icon-container">
                  {item.icon}
                  {item.badge}
                </span>
                {!collapsed && <span className="nav-text ms-2">{item.name}</span>}
              </div>
            </Link>
          </Nav.Item>
        ))}
      </Nav>

      <div className="sidebar-footer">
        <Button 
          variant="outline-danger" 
          className="logout-btn w-100" 
          onClick={adminSignOut}
        >
          <FaSignOutAlt />
          {!collapsed && <span className="ms-2">Đăng xuất</span>}
        </Button>
      </div>
    </div>
  );
};

export default AdminSidebar; 