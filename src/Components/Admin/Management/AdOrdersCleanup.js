import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Badge, Table, Spinner } from 'react-bootstrap';
import { supabase } from '../../../supabaseClient';
import { toast } from 'react-toastify';

const AdOrdersCleanup = () => {
  const [loading, setLoading] = useState(false);
  const [expiredOrders, setExpiredOrders] = useState([]);
  const [stats, setStats] = useState({
    active: 0,
    expired: 0,
    pending: 0
  });

  useEffect(() => {
    fetchStats();
    fetchExpiredOrders();
  }, []);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase
        .from('ad_orders')
        .select('status')
        .in('status', ['active', 'expired', 'pending']);

      if (error) throw error;

      const statusCount = data.reduce((acc, order) => {
        acc[order.status] = (acc[order.status] || 0) + 1;
        return acc;
      }, {});

      setStats({
        active: statusCount.active || 0,
        expired: statusCount.expired || 0,
        pending: statusCount.pending || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchExpiredOrders = async () => {
    try {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from('ad_orders')
        .select(`
          *,
          ad_packages(*),
          user_profiles(display_name, email)
        `)
        .eq('status', 'active')
        .lt('end_time', now)
        .order('end_time', { ascending: false });

      if (error) throw error;
      setExpiredOrders(data || []);
    } catch (err) {
      console.error('Error fetching expired orders:', err);
    }
  };

  const updateExpiredOrders = async () => {
    setLoading(true);
    try {
      const now = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('ad_orders')
        .update({ status: 'expired' })
        .eq('status', 'active')
        .lt('end_time', now)
        .select();

      if (error) throw error;

      toast.success(`Đã cập nhật ${data.length} đơn hàng hết hạn`);
      
      // Refresh data
      await Promise.all([
        fetchStats(),
        fetchExpiredOrders()
      ]);
    } catch (err) {
      console.error('Error updating expired orders:', err);
      toast.error('Lỗi cập nhật đơn hàng: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const formatMoney = (amount) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h3>Cleanup đơn hàng quảng cáo</h3>
        <Button 
          variant="warning"
          onClick={updateExpiredOrders}
          disabled={loading || expiredOrders.length === 0}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Đang cập nhật...
            </>
          ) : (
            'Cập nhật đơn hàng hết hạn'
          )}
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="row mb-4">
        <div className="col-md-4">
          <Card className="text-center">
            <Card.Body>
              <h5>Đang hoạt động</h5>
              <Badge bg="success" style={{ fontSize: '1.5rem' }}>
                {stats.active}
              </Badge>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-4">
          <Card className="text-center">
            <Card.Body>
              <h5>Đã hết hạn</h5>
              <Badge bg="secondary" style={{ fontSize: '1.5rem' }}>
                {stats.expired}
              </Badge>
            </Card.Body>
          </Card>
        </div>
        <div className="col-md-4">
          <Card className="text-center">
            <Card.Body>
              <h5>Chờ thanh toán</h5>
              <Badge bg="warning" style={{ fontSize: '1.5rem' }}>
                {stats.pending}
              </Badge>
            </Card.Body>
          </Card>
        </div>
      </div>

      {/* Expired Orders Table */}
      {expiredOrders.length > 0 && (
        <Card>
          <Card.Header>
            <h5 className="mb-0">
              Đơn hàng cần cập nhật status ({expiredOrders.length})
            </h5>
          </Card.Header>
          <Card.Body>
            <Alert variant="warning">
              Các đơn hàng này đã hết hạn nhưng vẫn có status "active". 
              Click nút "Cập nhật đơn hàng hết hạn" để chuyển status thành "expired".
            </Alert>
            
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Người dùng</th>
                  <th>Gói quảng cáo</th>
                  <th>Thời gian hết hạn</th>
                  <th>Số tiền</th>
                  <th>Status hiện tại</th>
                </tr>
              </thead>
              <tbody>
                {expiredOrders.map(order => (
                  <tr key={order.id}>
                    <td><code>{order.id.slice(0, 8)}</code></td>
                    <td>
                      {order.user_profiles?.display_name || 
                       order.user_profiles?.email || 
                       'Unknown'}
                    </td>
                    <td>{order.ad_packages?.name}</td>
                    <td>
                      <span className="text-danger">
                        {formatDateTime(order.end_time)}
                      </span>
                    </td>
                    <td>
                      {formatMoney(order.payment_amount || order.ad_packages?.price)}
                    </td>
                    <td>
                      <Badge bg="success">active</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      )}

      {expiredOrders.length === 0 && (
        <Alert variant="success">
          <h5>✅ Tất cả đơn hàng đã được cập nhật đúng status</h5>
          <p>Không có đơn hàng nào cần cleanup.</p>
        </Alert>
      )}
    </div>
  );
};

export default AdOrdersCleanup; 