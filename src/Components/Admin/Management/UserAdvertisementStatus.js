import React, { useEffect, useState } from 'react';
import { Table, Spinner, Alert, Badge, Button } from 'react-bootstrap';
import { supabase } from '../../../supabaseClient';
import AdminLayout from '../AdminLayout';
import { Link } from 'react-router-dom';

const UserAdvertisementStatus = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      // Lấy tất cả user và đơn hàng quảng cáo active của họ
      const { data, error } = await supabase
        .from('user_profiles')
        .select(`
          id,
          display_name,
          email,
          ad_orders (
            id,
            status,
            start_time,
            end_time,
            ad_packages (
              name,
              duration_days,
              position,
              price
            )
          )
        `)
        .order('display_name', { ascending: true });

      if (error) throw error;

      // Xử lý dữ liệu để lấy gói quảng cáo active hiện tại của mỗi user
      const now = new Date();
      const processedUsers = data.map(user => {
        const activeAd = user.ad_orders?.find(order => 
          order.status === 'active' && 
          new Date(order.end_time) > now
        );
        return {
          ...user,
          activeAdvertisement: activeAd
        };
      });

      setUsers(processedUsers);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.message);
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
    <AdminLayout title="Trạng thái quảng cáo">
      <div className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Trạng thái quảng cáo người dùng</h2>
          <div>
            <Button
              as={Link}
              to="/admin/ad-orders"
              variant="outline-primary"
              className="me-2"
            >
              📊 Quản lý đơn hàng
            </Button>
            <Button 
              variant="outline-success" 
              onClick={fetchUsers}
            >
              🔄 Làm mới
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" />
          </div>
        ) : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Người dùng</th>
                <th>Gói quảng cáo hiện tại</th>
                <th>Vị trí</th>
                <th>Thời hạn</th>
                <th>Giá gói</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user.id}>
                  <td>
                    <strong>{user.display_name || 'Chưa đặt tên'}</strong>
                    <br />
                    <small className="text-muted">{user.email}</small>
                  </td>
                  <td>
                    {user.activeAdvertisement ? (
                      <Badge bg="success">
                        {user.activeAdvertisement.ad_packages.name}
                      </Badge>
                    ) : (
                      <Badge bg="secondary">Không có gói QC</Badge>
                    )}
                  </td>
                  <td>
                    {user.activeAdvertisement?.ad_packages.position || '---'}
                  </td>
                  <td>
                    {user.activeAdvertisement ? (
                      <>
                        {user.activeAdvertisement.ad_packages.duration_days} ngày
                        <br />
                        <small className="text-muted">
                          {formatDateTime(user.activeAdvertisement.start_time)} - {formatDateTime(user.activeAdvertisement.end_time)}
                        </small>
                      </>
                    ) : (
                      '---'
                    )}
                  </td>
                  <td>
                    {user.activeAdvertisement ? (
                      formatMoney(user.activeAdvertisement.ad_packages.price)
                    ) : (
                      '---'
                    )}
                  </td>
                  <td>
                    <Button
                      as={Link}
                      to={`/admin/ad-orders?user=${user.id}`}
                      size="sm"
                      variant="outline-info"
                    >
                      Xem lịch sử
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </div>
    </AdminLayout>
  );
};

export default UserAdvertisementStatus; 