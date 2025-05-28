import React, { useState, useEffect } from 'react';
import { Alert, Spinner, Button } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';

/**
 * Component hiển thị trạng thái thanh toán
 * Sẽ được sử dụng khi tích hợp Payment Confirmation API
 */
const PaymentStatus = ({ orderId, onPaymentConfirmed, onCancel }) => {
  const [status, setStatus] = useState('pending'); // pending, checking, confirmed, failed
  const [message, setMessage] = useState('');
  const [checkCount, setCheckCount] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 phút
  const [order, setOrder] = useState(null);

  // Fetch order details khi component mount
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const { data, error } = await supabase
          .from('ad_orders')
          .select('*, ad_packages(*)')
          .eq('vietqr_order_id', orderId)
          .single();

        if (error) throw error;
        setOrder(data);
      } catch (err) {
        console.error('Error fetching order:', err);
        setMessage('Không tìm thấy thông tin đơn hàng');
        setStatus('failed');
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Countdown timer
  useEffect(() => {
    if (status === 'checking' && timeRemaining > 0) {
      const interval = setInterval(() => {
        setTimeRemaining(prev => prev - 1);
      }, 1000);

      return () => clearInterval(interval);
    } else if (timeRemaining === 0 && status === 'checking') {
      setStatus('failed');
      setMessage('Hết thời gian chờ thanh toán. Vui lòng thử lại.');
    }
  }, [status, timeRemaining]);

  // Start checking payment after 10 seconds
  useEffect(() => {
    if (status === 'pending' && order) {
      const timeout = setTimeout(() => {
        setStatus('checking');
        startPaymentCheck();
      }, 10000);

      return () => clearTimeout(timeout);
    }
  }, [status, order]);

  const checkPaymentConfirmation = async () => {
    try {
      // Kiểm tra trong bảng payment_confirmations
      const { data: confirmation, error } = await supabase
        .from('payment_confirmations')
        .select('*')
        .eq('vietqr_order_id', orderId)
        .eq('confirmed_amount', order?.payment_amount)
        .single();

      if (error) {
        console.error('Error checking payment confirmation:', error);
        return false;
      }

      if (confirmation) {
        return true;
      }

      // Nếu chưa có confirmation, gọi VietQR API để kiểm tra
      const response = await fetch(`https://api.vietqr.io/v2/transactions/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.REACT_APP_VIETQR_API_KEY
        },
        body: JSON.stringify({
          order_id: orderId,
          amount: order?.payment_amount
        })
      });

      const result = await response.json();

      if (result.code === '00' && result.data?.status === 'completed') {
        // Lưu confirmation vào database
        const { error: insertError } = await supabase
          .from('payment_confirmations')
          .insert([{
            ad_order_id: order.id,
            vietqr_order_id: orderId,
            bank_transaction_id: result.data.bank_transaction_id,
            confirmed_amount: result.data.amount,
            confirmation_source: 'vietqr_api',
            raw_response: result
          }]);

        if (insertError) {
          console.error('Error saving payment confirmation:', insertError);
        }

        return true;
      }

      return false;
    } catch (err) {
      console.error('Error checking payment:', err);
      return false;
    }
  };

  const startPaymentCheck = async () => {
    if (!order) return;

    setMessage('Đang kiểm tra thanh toán...');
    
    // Check mỗi 30 giây
    const interval = setInterval(async () => {
      const confirmed = await checkPaymentConfirmation();
      setCheckCount(prev => prev + 1);
      
      if (confirmed) {
        clearInterval(interval);
        setStatus('confirmed');
        setMessage('Thanh toán thành công! Gói quảng cáo đã được kích hoạt.');
        if (onPaymentConfirmed) onPaymentConfirmed();
      } else if (checkCount >= 10) { // Max 10 lần check (5 phút)
        clearInterval(interval);
        setStatus('failed');
        setMessage('Không tìm thấy giao dịch. Vui lòng liên hệ admin để được hỗ trợ.');
      }
    }, 30000);

    return () => clearInterval(interval);
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getVariant = () => {
    switch (status) {
      case 'pending': return 'info';
      case 'checking': return 'warning';
      case 'confirmed': return 'success';
      case 'failed': return 'danger';
      default: return 'info';
    }
  };

  const renderContent = () => {
    switch (status) {
      case 'pending':
        return (
          <>
            <div>⏳ Vui lòng hoàn tất thanh toán</div>
            <small>Hệ thống sẽ tự động kiểm tra sau 10 giây</small>
          </>
        );
      
      case 'checking':
        return (
          <>
            <Spinner animation="border" size="sm" className="me-2" />
            {message}
            <div className="mt-2">
              <small>Thời gian còn lại: {formatTime(timeRemaining)}</small>
              <br />
              <small>Lần kiểm tra: {checkCount}/10</small>
            </div>
          </>
        );
      
      case 'confirmed':
        return (
          <>
            <div>✅ {message}</div>
            <Button 
              variant="success" 
              size="sm" 
              className="mt-2"
              onClick={() => window.location.reload()}
            >
              Tải lại trang
            </Button>
          </>
        );
      
      case 'failed':
        return (
          <>
            <div>❌ {message}</div>
            <div className="mt-2">
              <Button 
                variant="outline-primary" 
                size="sm" 
                className="me-2"
                onClick={() => {
                  setStatus('pending');
                  setCheckCount(0);
                  setTimeRemaining(300);
                }}
              >
                Thử lại
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                onClick={onCancel}
              >
                Hủy
              </Button>
            </div>
          </>
        );
      
      default:
        return null;
    }
  };

  return (
    <Alert variant={getVariant()} className="mt-3">
      {renderContent()}
    </Alert>
  );
};

export default PaymentStatus; 