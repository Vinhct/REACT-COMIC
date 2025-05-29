import React, { useEffect, useState } from 'react';
import { Table, Button, Spinner, Alert, Badge, Modal, Form, Nav } from 'react-bootstrap';
import { supabase } from '../../../supabaseClient';
import AdminLayout from '../AdminLayout';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';

const statusColor = {
  pending: 'warning',
  active: 'success',
  expired: 'secondary',
  cancelled: 'danger',
};

const AdOrdersManagement = () => {
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [activeTab, setActiveTab] = useState('orders'); // 'orders' hoặc 'activate'

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [
        { data: users, error: userErr }, 
        { data: orders, error: orderErr }, 
        { data: packages, error: pkgErr }
      ] = await Promise.all([
        supabase.from('user_profiles').select('id, display_name, email'),
        supabase
          .from('ad_orders')
          .select(`
            *,
            ad_packages (*),
            user_profiles (
              id,
              display_name,
              email
            ),
            payment_confirmations (*)
          `)
          .order('created_at', { ascending: false }),
        supabase.from('ad_packages').select('*').order('price', { ascending: true })
      ]);

      if (userErr || orderErr || pkgErr) throw (userErr || orderErr || pkgErr);

      setUsers(users || []);
      setOrders(orders || []);
      setPackages(packages || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Lấy gói quảng cáo active hiện tại của user (nếu có)
  const getActiveOrder = (userId) => {
    const now = new Date();
    return orders.find(o => o.user_id === userId && o.status === 'active' && new Date(o.end_time) > now);
  };

  // Kích hoạt gói quảng cáo cho user
  const handleActivate = (user) => {
    setSelectedUser(user);
    setActiveTab('activate');
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedPackage) return;
    setActionLoading(true);
    try {
      const pkg = packages.find(p => p.id === selectedPackage);
      const now = new Date();
      const end = new Date(now.getTime() + (pkg.duration_days || 7) * 24 * 60 * 60 * 1000);

      // 1. Tạo đơn hàng quảng cáo
      const { error: orderError } = await supabase.from('ad_orders').insert([
        {
          user_id: selectedUser.id,
          package_id: pkg.id,
          status: 'active',
          start_time: now.toISOString(),
          end_time: end.toISOString()
        }
      ]);

      if (orderError) throw orderError;

      // 2. Tạo thông báo cho user
      const { error: notifError } = await supabase.from('notifications').insert([
        {
          user_id: selectedUser.id,
          title: 'Gói quảng cáo đã được kích hoạt',
          message: `Gói "${pkg.name}" của bạn đã được kích hoạt và sẽ hết hạn vào ${end.toLocaleString()}`,
          type: 'success'
        }
      ]);

      if (notifError) throw notifError;

      toast.success('Kích hoạt gói quảng cáo thành công!');
      setShowModal(false);
      setSelectedUser(null);
      setSelectedPackage('');
      await fetchAll();
    } catch (error) {
      console.error('Lỗi:', error);
      toast.error('Lỗi kích hoạt: ' + error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleShowDetails = (order) => {
    setSelectedOrder(order);
    setActiveTab('orders');
    setShowModal(true);
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
    <AdminLayout title="Quản lý đơn hàng quảng cáo">
      <div className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Quản lý đơn hàng quảng cáo</h2>
          <div>
            <Button 
              variant="outline-primary" 
              onClick={() => fetchAll()}
              className="me-2"
            >
              🔄 Làm mới
            </Button>
            <Button
              as={Link}
              to="/admin/payment-confirmations"
              variant="outline-success"
              className="me-2"
            >
              💰 Xem lịch sử thanh toán
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                setSelectedUser(null);
                setSelectedPackage('');
                setActiveTab('activate');
                setShowModal(true);
              }}
            >
              ✨ Kích hoạt gói mới
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
                <th>Thời gian</th>
                <th>Mã đơn hàng</th>
                <th>Người dùng</th>
                <th>Gói quảng cáo</th>
                <th>Số tiền</th>
                <th>Trạng thái</th>
                <th>Thanh toán</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id}>
                  <td>{formatDateTime(order.created_at)}</td>
                  <td>
                    <code>{order.vietqr_order_id || '---'}</code>
                  </td>
                  <td>
                    {order.user_profiles?.display_name || order.user_profiles?.email || 'Unknown'}
                  </td>
                  <td>
                    {order.ad_packages?.name}
                    <br />
                    <small className="text-muted">
                      {order.ad_packages?.duration_days} ngày
                    </small>
                  </td>
                  <td>
                    {formatMoney(order.payment_amount || order.ad_packages?.price)}
                  </td>
                  <td>
                    <Badge bg={statusColor[order.status]}>
                      {order.status}
                    </Badge>
                  </td>
                  <td>
                    {order.payment_confirmations?.length > 0 ? (
                      <Badge bg="success">Đã thanh toán</Badge>
                    ) : (
                      <Badge bg="warning">Chưa thanh toán</Badge>
                    )}
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="outline-info"
                      onClick={() => handleShowDetails(order)}
                    >
                      Chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        

        {/* Modal đa năng */}
        <Modal
          show={showModal}
          onHide={() => setShowModal(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>
              {activeTab === 'orders' ? 'Chi tiết đơn hàng' : 'Kích hoạt gói quảng cáo'}
            </Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {/* Tab điều hướng */}
            <Nav variant="tabs" className="mb-3">
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'orders'} 
                  onClick={() => selectedOrder && setActiveTab('orders')}
                  disabled={!selectedOrder}
                >
                  Chi tiết đơn hàng
                </Nav.Link>
              </Nav.Item>
              <Nav.Item>
                <Nav.Link 
                  active={activeTab === 'activate'} 
                  onClick={() => setActiveTab('activate')}
                >
                  Kích hoạt gói mới
                </Nav.Link>
              </Nav.Item>
            </Nav>

            {/* Nội dung tab */}
            {activeTab === 'orders' && selectedOrder && (
              <div>
                <h5>Thông tin cơ bản</h5>
                <Table bordered>
                  <tbody>
                    <tr>
                      <td><strong>Mã đơn hàng VietQR</strong></td>
                      <td><code>{selectedOrder.vietqr_order_id || '---'}</code></td>
                    </tr>
                    <tr>
                      <td><strong>Thời gian tạo</strong></td>
                      <td>{formatDateTime(selectedOrder.created_at)}</td>
                    </tr>
                    <tr>
                      <td><strong>Trạng thái</strong></td>
                      <td>
                        <Badge bg={statusColor[selectedOrder.status]}>
                          {selectedOrder.status}
                        </Badge>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Số tiền</strong></td>
                      <td>{formatMoney(selectedOrder.payment_amount || selectedOrder.ad_packages?.price)}</td>
                    </tr>
                    <tr>
                      <td><strong>Ngân hàng</strong></td>
                      <td>{selectedOrder.bank_id || '---'}</td>
                    </tr>
                  </tbody>
                </Table>

                <h5 className="mt-4">Thông tin gói quảng cáo</h5>
                <Table bordered>
                  <tbody>
                    <tr>
                      <td><strong>Tên gói</strong></td>
                      <td>{selectedOrder.ad_packages?.name}</td>
                    </tr>
                    <tr>
                      <td><strong>Thời hạn</strong></td>
                      <td>
                        {selectedOrder.ad_packages?.duration_days} ngày
                        {selectedOrder.start_time && selectedOrder.end_time && (
                          <div className="text-muted small">
                            {formatDateTime(selectedOrder.start_time)} - {formatDateTime(selectedOrder.end_time)}
                          </div>
                        )}
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Vị trí</strong></td>
                      <td>{selectedOrder.ad_packages?.position}</td>
                    </tr>
                  </tbody>
                </Table>

                {selectedOrder.payment_confirmations?.length > 0 && (
                  <>
                    <h5 className="mt-4">Thông tin thanh toán</h5>
                    <Table bordered>
                      <tbody>
                        {selectedOrder.payment_confirmations.map((confirmation, index) => (
                          <React.Fragment key={confirmation.id}>
                            <tr>
                              <td><strong>Thời gian xác nhận</strong></td>
                              <td>{formatDateTime(confirmation.confirmed_at)}</td>
                            </tr>
                            <tr>
                              <td><strong>Số tiền xác nhận</strong></td>
                              <td>{formatMoney(confirmation.confirmed_amount)}</td>
                            </tr>
                            <tr>
                              <td><strong>Mã giao dịch ngân hàng</strong></td>
                              <td><code>{confirmation.bank_transaction_id || '---'}</code></td>
                            </tr>
                            <tr>
                              <td><strong>Nguồn xác nhận</strong></td>
                              <td>
                                <Badge bg={
                                  confirmation.confirmation_source === 'vietqr_api' 
                                    ? 'success' 
                                    : confirmation.confirmation_source === 'manual'
                                    ? 'warning'
                                    : 'info'
                                }>
                                  {confirmation.confirmation_source}
                                </Badge>
                              </td>
                            </tr>
                            {index < selectedOrder.payment_confirmations.length - 1 && (
                              <tr>
                                <td colSpan="2" className="text-center">
                                  <hr />
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </Table>
                  </>
                )}

                {selectedOrder.qr_code_url && (
                  <div className="mt-4 text-center">
                    <h5>Mã QR</h5>
                    <img 
                      src={selectedOrder.qr_code_url} 
                      alt="VietQR Code"
                      style={{ maxWidth: '300px', width: '100%' }}
                      className="border rounded"
                    />
                  </div>
                )}
              </div>
            )}

            {activeTab === 'activate' && (
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3">
                  <Form.Label>Chọn người dùng</Form.Label>
                  <Form.Select 
                    value={selectedUser?.id || ''} 
                    onChange={e => {
                      const user = users.find(u => u.id === e.target.value);
                      setSelectedUser(user);
                    }}
                    required
                  >
                    <option value="">-- Chọn người dùng --</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.display_name || user.email}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Label>Chọn gói quảng cáo</Form.Label>
                  <Form.Select 
                    value={selectedPackage} 
                    onChange={e => setSelectedPackage(e.target.value)} 
                    required
                  >
                    <option value="">-- Chọn gói --</option>
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} ({pkg.price.toLocaleString()} VNĐ, {pkg.duration_days} ngày)
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>

                {selectedUser && (
                  <Alert variant="info">
                    <strong>Thông tin người dùng:</strong><br />
                    Email: {selectedUser.email}<br />
                    Tên hiển thị: {selectedUser.display_name || 'Chưa cập nhật'}<br />
                    {getActiveOrder(selectedUser.id) && (
                      <div className="mt-2">
                        <strong>⚠️ Lưu ý:</strong> Người dùng này đang có gói quảng cáo đang chạy
                      </div>
                    )}
                  </Alert>
                )}

                <div className="text-end mt-4">
                  <Button variant="secondary" onClick={() => setShowModal(false)} className="me-2">
                    Hủy
                  </Button>
                  <Button type="submit" variant="primary" disabled={actionLoading}>
                    {actionLoading ? (
                      <>
                        <Spinner animation="border" size="sm" className="me-2" />
                        Đang xử lý...
                      </>
                    ) : (
                      'Kích hoạt'
                    )}
                  </Button>
                </div>
              </Form>
            )}
          </Modal.Body>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdOrdersManagement; 