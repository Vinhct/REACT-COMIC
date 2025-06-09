import React, { useState, useEffect } from 'react';
import { Button, Badge } from 'react-bootstrap';
import { FaBell } from 'react-icons/fa';
import { supabase } from '../../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import './AdminNotification.css';

const AdminNotification = () => {
  const [newOrdersCount, setNewOrdersCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotifications, setUnreadNotifications] = useState(new Set());
  const navigate = useNavigate();

  // Tạo audio element cho âm thanh thông báo
  const notificationSound = new Audio('/notification.mp3');

  useEffect(() => {
    // Lấy danh sách đơn hàng chưa xác nhận khi component mount
    const fetchUnconfirmedOrders = async () => {
      const { data, error } = await supabase
        .from('ad_orders')
        .select(`
          *,
          ad_packages (
            name,
            price
          ),
          payment_confirmations (*)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (!error && data) {
        // Lọc ra các đơn hàng chưa có payment confirmation
        const unconfirmedOrders = data.filter(order => !order.payment_confirmations?.length);
        setNotifications(unconfirmedOrders.map(order => ({
          id: order.id,
          message: `Đơn hàng mới #${order.id} - ${(order.payment_amount || order.ad_packages?.price).toLocaleString()}đ`,
          time: new Date(order.created_at),
          type: 'order',
          packageName: order.ad_packages?.name
        })));
        // Đánh dấu tất cả là đã đọc khi load lần đầu
        setUnreadNotifications(new Set());
        setNewOrdersCount(0);
      }
    };

    fetchUnconfirmedOrders();

    // Subscribe to realtime changes
    const subscription = supabase
      .channel('ad-orders-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'ad_orders'
      }, async (payload) => {
        console.log('New order received:', payload);
        
        // Play notification sound
        try {
          await notificationSound.play();
        } catch (error) {
          console.log('Error playing sound:', error);
        }

        // Fetch full order details including package info
        const { data: orderDetails, error } = await supabase
          .from('ad_orders')
          .select(`
            *,
            ad_packages (
              name,
              price
            )
          `)
          .eq('id', payload.new.id)
          .single();

        if (!error && orderDetails) {
          const newNotification = {
            id: orderDetails.id,
            message: `Đơn hàng mới #${orderDetails.id} - ${(orderDetails.payment_amount || orderDetails.ad_packages?.price).toLocaleString()}đ`,
            time: new Date(orderDetails.created_at),
            type: 'order',
            packageName: orderDetails.ad_packages?.name
          };

          // Update notifications list
          setNotifications(prev => [newNotification, ...prev]);

          // Đánh dấu là chưa đọc
          setUnreadNotifications(prev => new Set([...prev, orderDetails.id]));

          // Update count
          setNewOrdersCount(prev => prev + 1);
        }
      })
      .subscribe();

    // Also subscribe to payment_confirmations to decrease count when payment is confirmed
    const paymentSubscription = supabase
      .channel('payment-confirmations-channel')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'payment_confirmations'
      }, (payload) => {
        // Remove the notification for this order and decrease count
        setNotifications(prev => prev.filter(n => n.id !== payload.new.ad_order_id));
        setUnreadNotifications(prev => {
          const newSet = new Set(prev);
          newSet.delete(payload.new.ad_order_id);
          return newSet;
        });
        setNewOrdersCount(prev => Math.max(0, prev - 1));
      })
      .subscribe();

    // Cleanup subscriptions
    return () => {
      subscription.unsubscribe();
      paymentSubscription.unsubscribe();
    };
  }, []);

  const handleClick = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      // Đánh dấu tất cả là đã đọc khi mở panel
      setUnreadNotifications(new Set());
      setNewOrdersCount(0);
    }
  };

  const handleNotificationClick = (notification) => {
    if (notification.type === 'order') {
      navigate('/admin/payment-confirmations');
      setIsOpen(false);
      // Đánh dấu thông báo này là đã đọc
      setUnreadNotifications(prev => {
        const newSet = new Set(prev);
        newSet.delete(notification.id);
        return newSet;
      });
      setNewOrdersCount(prev => Math.max(0, prev - 1));
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - date;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    if (minutes > 0) return `${minutes} phút trước`;
    return 'Vừa xong';
  };

  return (
    <div className="notification-container">
      <Button 
        className="notification-button"
        onClick={handleClick}
        aria-label="Notifications"
      >
        <FaBell size={24} />
        {unreadNotifications.size > 0 && (
          <Badge 
            bg="danger" 
            className="notification-badge"
          >
            {unreadNotifications.size}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <div className="notification-panel">
          <div className="notification-header">
            <h5>Thông báo</h5>
            {unreadNotifications.size > 0 && (
              <Badge bg="danger">{unreadNotifications.size} mới</Badge>
            )}
          </div>
          <div className="notification-content">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <div 
                  key={notification.id}
                  className={`notification-item ${unreadNotifications.has(notification.id) ? 'unread' : ''}`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <FaBell className="notification-icon" />
                  <div className="notification-text">
                    <p>{notification.message}</p>
                    <small>
                      {notification.packageName && `Gói: ${notification.packageName}`}
                      <span className="notification-time">{formatTime(notification.time)}</span>
                    </small>
                  </div>
                </div>
              ))
            ) : (
              <div className="notification-empty">
                <p>Không có thông báo mới</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminNotification; 