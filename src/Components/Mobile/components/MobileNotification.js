import React, { useState, useEffect } from 'react';
import { Badge, Offcanvas, ListGroup } from 'react-bootstrap';
import { FaBell, FaCircle } from 'react-icons/fa';
import { supabase } from '../../../supabaseClient';
import { useSupabaseAuth } from '../../../Components/Include/Authentication/SupabaseAuthContext';

const MobileNotification = ({ inMenu }) => {
  const [show, setShow] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const { user } = useSupabaseAuth();

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      // Subscribe to new notifications
      const channel = supabase
        .channel('custom-all-channel')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload) => {
            if (payload.new.user_id === user.id) {
              setNotifications(prev => [payload.new, ...prev]);
              setUnreadCount(prev => prev + 1);
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;

      setNotifications(data || []);
      setUnreadCount(data?.filter(n => !n.read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, read: true } : n
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) throw error;

      setNotifications(prev =>
        prev.map(n => ({ ...n, read: true }))
      );
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Nếu component được render trong menu, hiển thị chỉ phần nội dung
  if (inMenu) {
    return (
      <div className="notification-content">
        <div className="d-flex align-items-center justify-content-between mb-3">
          <div className="d-flex align-items-center">
            <FaBell size={18} className="me-2 text-primary" />
            <span className="fw-bold">Thông báo của bạn</span>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="btn btn-link text-primary p-0"
              style={{ fontSize: '0.9rem', textDecoration: 'none' }}
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        <ListGroup variant="flush">
          {notifications.length === 0 ? (
            <div className="text-center text-muted p-3">
              Không có thông báo nào
            </div>
          ) : (
            notifications.map((notification) => (
              <ListGroup.Item
                key={notification.id}
                action
                onClick={() => markAsRead(notification.id)}
                className="border-bottom"
                style={{
                  backgroundColor: notification.read ? '#fff' : 'rgba(13, 110, 253, 0.05)'
                }}
              >
                <div className="d-flex align-items-start gap-2 py-1">
                  {!notification.read && (
                    <FaCircle 
                      size={8} 
                      color="#0d6efd"
                      style={{ marginTop: 6 }}
                    />
                  )}
                  <div className="flex-grow-1">
                    <div className="fw-bold" style={{ fontSize: '0.95rem' }}>
                      {notification.title}
                    </div>
                    <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                      {notification.message}
                    </div>
                    <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                      {new Date(notification.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>
              </ListGroup.Item>
            ))
          )}
        </ListGroup>
      </div>
    );
  }

  // Nếu không, hiển thị dạng popup như cũ
  return (
    <>
      <div 
        onClick={handleShow}
        style={{ 
          position: 'relative',
          padding: '8px',
          cursor: 'pointer'
        }}
      >
        <FaBell size={24} color="#333" />
        {unreadCount > 0 && (
          <Badge 
            bg="danger" 
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              minWidth: '18px',
              height: '18px',
              borderRadius: '9px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '0.7rem',
              padding: '0 4px'
            }}
          >
            {unreadCount}
          </Badge>
        )}
      </div>

      <Offcanvas 
        show={show} 
        onHide={handleClose} 
        placement="end"
        style={{
          borderTopLeftRadius: '16px',
          borderBottomLeftRadius: '16px'
        }}
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="d-flex align-items-center justify-content-between w-100">
            <span>Thông báo</span>
            {unreadCount > 0 && (
              <button
                onClick={markAllAsRead}
                className="btn btn-link text-primary p-0"
                style={{ fontSize: '0.9rem', textDecoration: 'none' }}
              >
                Đánh dấu tất cả đã đọc
              </button>
            )}
          </Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body className="p-0">
          <ListGroup variant="flush">
            {notifications.length === 0 ? (
              <div className="text-center text-muted p-4">
                Không có thông báo nào
              </div>
            ) : (
              notifications.map((notification) => (
                <ListGroup.Item
                  key={notification.id}
                  action
                  onClick={() => markAsRead(notification.id)}
                  className="border-bottom"
                  style={{
                    backgroundColor: notification.read ? '#fff' : 'rgba(13, 110, 253, 0.05)'
                  }}
                >
                  <div className="d-flex align-items-start gap-2 py-1">
                    {!notification.read && (
                      <FaCircle 
                        size={8} 
                        color="#0d6efd"
                        style={{ marginTop: 6 }}
                      />
                    )}
                    <div className="flex-grow-1">
                      <div className="fw-bold" style={{ fontSize: '0.95rem' }}>
                        {notification.title}
                      </div>
                      <div className="text-muted" style={{ fontSize: '0.85rem' }}>
                        {notification.message}
                      </div>
                      <div className="text-muted mt-1" style={{ fontSize: '0.75rem' }}>
                        {new Date(notification.created_at).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </ListGroup.Item>
              ))
            )}
          </ListGroup>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default MobileNotification; 