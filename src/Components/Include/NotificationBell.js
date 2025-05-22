import React, { useState, useEffect } from 'react';
import { Dropdown, Badge, Spinner } from 'react-bootstrap';
import { BsBell, BsBellFill } from 'react-icons/bs';
import { supabase } from '../../supabaseClient';
import { format as formatDate } from 'date-fns';
import vi from 'date-fns/locale/vi';
import './NotificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch notifications
  useEffect(() => {
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;

        setNotifications(data);
        setUnreadCount(data.filter(n => !n.is_read).length);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // Subscribe to new notifications
    const subscription = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
      }, payload => {
        setNotifications(current => [payload.new, ...current]);
        setUnreadCount(count => count + 1);
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Mark notification as read
  const handleRead = async (notification) => {
    if (notification.is_read) return;

    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notification.id);

      if (error) throw error;

      setNotifications(current =>
        current.map(n =>
          n.id === notification.id ? { ...n, is_read: true } : n
        )
      );
      setUnreadCount(count => count - 1);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all as read
  const handleMarkAllRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('is_read', false);

      if (error) throw error;

      setNotifications(current =>
        current.map(n => ({ ...n, is_read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'success':
        return '✅';
      case 'warning':
        return '⚠️';
      case 'error':
        return '❌';
      default:
        return 'ℹ️';
    }
  };

  return (
    <Dropdown align="end" className="notification-bell">
      <Dropdown.Toggle variant="link" className="nav-link position-relative notification-toggle">
        {unreadCount > 0 ? <BsBellFill size={20} /> : <BsBell size={20} />}
        {unreadCount > 0 && (
          <Badge 
            bg="danger" 
            className="notification-badge"
          >
            {unreadCount}
          </Badge>
        )}
      </Dropdown.Toggle>

      <Dropdown.Menu className="notification-menu">
        <div className="notification-header">
          <h6 className="mb-0">Thông báo</h6>
          {unreadCount > 0 && (
            <button 
              className="mark-all-read"
              onClick={handleMarkAllRead}
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>
        <div className="notification-divider"></div>
        
        <div className="notification-list">
          {loading ? (
            <div className="notification-loading">
              <Spinner animation="border" variant="primary" size="sm" />
              <span>Đang tải thông báo...</span>
            </div>
          ) : notifications.length === 0 ? (
            <div className="notification-empty">
              <span>Không có thông báo nào</span>
            </div>
          ) : (
            notifications.map(notification => (
              <Dropdown.Item
                key={notification.id}
                onClick={() => handleRead(notification)}
                className={`notification-item ${notification.is_read ? 'read' : 'unread'}`}
              >
                <div className="notification-icon">
                  {getNotificationIcon(notification.type)}
                </div>
                <div className="notification-content">
                  <div className="notification-title">{notification.title}</div>
                  <div className="notification-message">{notification.message}</div>
                  <div className="notification-time">
                    {formatDate(new Date(notification.created_at), 'HH:mm, dd/MM/yyyy', { locale: vi })}
                  </div>
                </div>
              </Dropdown.Item>
            ))
          )}
        </div>
      </Dropdown.Menu>
    </Dropdown>
  );
};

export default NotificationBell; 