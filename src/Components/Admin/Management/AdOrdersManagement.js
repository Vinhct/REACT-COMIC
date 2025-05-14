import React, { useEffect, useState } from 'react';
import { Table, Button, Spinner, Alert, Badge, Image, Modal, Form } from 'react-bootstrap';
import { supabase } from '../../../supabaseClient';
import AdminLayout from '../AdminLayout';

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
  const [bannerUrl, setBannerUrl] = useState('');
  const [link, setLink] = useState('');

  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    const [{ data: users, error: userErr }, { data: orders, error: orderErr }, { data: packages, error: pkgErr }] = await Promise.all([
      supabase.from('user_profiles').select('id, display_name, email'),
      supabase.from('ad_orders').select('*, ad_packages(*)').order('created_at', { ascending: false }),
      supabase.from('ad_packages').select('*').order('price', { ascending: true })
    ]);
    if (userErr || orderErr || pkgErr) setError(userErr?.message || orderErr?.message || pkgErr?.message);
    else {
      setUsers(users);
      setOrders(orders);
      setPackages(packages);
    }
    setLoading(false);
  };

  // Lấy gói quảng cáo active hiện tại của user (nếu có)
  const getActiveOrder = (userId) => {
    const now = new Date();
    return orders.find(o => o.user_id === userId && o.status === 'active' && new Date(o.end_time) > now);
  };

  // Kích hoạt gói quảng cáo cho user
  const handleActivate = (user) => {
    setSelectedUser(user);
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedPackage) return;
    setActionLoading(true);
    const pkg = packages.find(p => p.id === selectedPackage);
    const now = new Date();
    const end = new Date(now.getTime() + (pkg.duration_days || 7) * 24 * 60 * 60 * 1000);
    const { error } = await supabase.from('ad_orders').insert([
      {
        user_id: selectedUser.id,
        package_id: pkg.id,
        status: 'active',
        start_time: now.toISOString(),
        end_time: end.toISOString()
      }
    ]);
    if (error) alert('Lỗi kích hoạt: ' + error.message);
    setShowModal(false);
    setSelectedUser(null);
    setSelectedPackage('');
    await fetchAll();
    setActionLoading(false);
  };

  return (
    <AdminLayout title="Quản lý gói quảng cáo theo tài khoản">
      <div className="p-4">
        <h2>Quản lý gói quảng cáo theo tài khoản</h2>
        {error && <Alert variant="danger">{error}</Alert>}
        {loading ? <Spinner animation="border" /> : (
          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Gói hiện tại</th>
                <th>Hết hạn</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => {
                const activeOrder = getActiveOrder(user.id);
                return (
                  <tr key={user.id}>
                    <td>{user.display_name || user.email || user.id}</td>
                    <td>{user.email}</td>
                    <td>{activeOrder ? activeOrder.ad_packages?.name : '-'}</td>
                    <td>{activeOrder ? new Date(activeOrder.end_time).toLocaleString() : '-'}</td>
                    <td>{activeOrder ? <Badge bg="success">Đang chạy</Badge> : <Badge bg="secondary">Chưa có</Badge>}</td>
                    <td>
                      {activeOrder ? (
                        <span>Đang chạy</span>
                      ) : (
                        <Button size="sm" variant="primary" onClick={() => handleActivate(user)}>Kích hoạt</Button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )}
        {/* Modal kích hoạt gói */}
        <Modal show={showModal} onHide={() => setShowModal(false)} centered>
          <Modal.Header closeButton>
            <Modal.Title>Kích hoạt gói quảng cáo cho {selectedUser?.display_name || selectedUser?.email}</Modal.Title>
          </Modal.Header>
          <Form onSubmit={handleSubmit}>
            <Modal.Body>
              <Form.Group className="mb-3">
                <Form.Label>Chọn gói quảng cáo</Form.Label>
                <Form.Select value={selectedPackage} onChange={e => setSelectedPackage(e.target.value)} required>
                  <option value="">-- Chọn gói --</option>
                  {packages.map(pkg => (
                    <option key={pkg.id} value={pkg.id}>{pkg.name} ({pkg.price.toLocaleString()} VNĐ, {pkg.duration_days} ngày)</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowModal(false)}>Hủy</Button>
              <Button type="submit" variant="primary" disabled={actionLoading}>Kích hoạt</Button>
            </Modal.Footer>
          </Form>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default AdOrdersManagement; 