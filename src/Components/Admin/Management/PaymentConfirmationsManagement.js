import React, { useEffect, useState } from 'react';
import { Table, Spinner, Alert, Badge, Button, Modal, Form, Row, Col, Card } from 'react-bootstrap';
import { supabase } from '../../../supabaseClient';
import AdminLayout from '../AdminLayout';
import { toast } from 'react-toastify';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const PaymentConfirmationsManagement = () => {
  const [confirmations, setConfirmations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedConfirmation, setSelectedConfirmation] = useState(null);
  const [showManualConfirm, setShowManualConfirm] = useState(false);
  const [manualConfirmLoading, setManualConfirmLoading] = useState(false);
  const [pendingOrders, setPendingOrders] = useState([]);
  const [revenueStats, setRevenueStats] = useState({
    today: 0,
    thisWeek: 0,
    thisMonth: 0,
    total: 0,
    dailyData: [],
    monthlyData: []
  });
  const [dateRange, setDateRange] = useState('thisMonth'); // thisMonth, last3Months, thisYear, all

  useEffect(() => {
    fetchConfirmations();
    fetchPendingOrders();
  }, []);

  useEffect(() => {
    calculateRevenueStats();
  }, [confirmations, dateRange]);

  const calculateRevenueStats = () => {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Lọc theo range
    let filteredConfirmations = [...confirmations];
    if (dateRange === 'thisMonth') {
      filteredConfirmations = confirmations.filter(c => 
        new Date(c.confirmed_at) >= startOfMonth
      );
    } else if (dateRange === 'last3Months') {
      const startOf3Months = new Date(now);
      startOf3Months.setMonth(now.getMonth() - 3);
      filteredConfirmations = confirmations.filter(c =>
        new Date(c.confirmed_at) >= startOf3Months
      );
    } else if (dateRange === 'thisYear') {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      filteredConfirmations = confirmations.filter(c =>
        new Date(c.confirmed_at) >= startOfYear
      );
    }

    // Tính toán các thống kê
    const todayRevenue = confirmations
      .filter(c => new Date(c.confirmed_at) >= startOfToday)
      .reduce((sum, c) => sum + c.confirmed_amount, 0);

    const weekRevenue = confirmations
      .filter(c => new Date(c.confirmed_at) >= startOfWeek)
      .reduce((sum, c) => sum + c.confirmed_amount, 0);

    const monthRevenue = confirmations
      .filter(c => new Date(c.confirmed_at) >= startOfMonth)
      .reduce((sum, c) => sum + c.confirmed_amount, 0);

    const totalRevenue = filteredConfirmations
      .reduce((sum, c) => sum + c.confirmed_amount, 0);

    // Tính dữ liệu cho biểu đồ theo ngày
    const dailyData = {};
    filteredConfirmations.forEach(c => {
      const date = new Date(c.confirmed_at).toLocaleDateString();
      dailyData[date] = (dailyData[date] || 0) + c.confirmed_amount;
    });

    // Tính dữ liệu cho biểu đồ theo tháng
    const monthlyData = {};
    filteredConfirmations.forEach(c => {
      const date = new Date(c.confirmed_at);
      const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
      monthlyData[monthKey] = (monthlyData[monthKey] || 0) + c.confirmed_amount;
    });

    setRevenueStats({
      today: todayRevenue,
      thisWeek: weekRevenue,
      thisMonth: monthRevenue,
      total: totalRevenue,
      dailyData: Object.entries(dailyData)
        .sort(([dateA], [dateB]) => new Date(dateA) - new Date(dateB))
        .slice(-30),
      monthlyData: Object.entries(monthlyData)
        .sort(([monthA], [monthB]) => monthA.localeCompare(monthB))
    });
  };

  const fetchConfirmations = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('payment_confirmations')
        .select(`
          *,
          ad_orders (
            *,
            ad_packages (*),
            user_profiles (
              id,
              display_name,
              email
            )
          )
        `)
        .order('confirmed_at', { ascending: false });

      if (error) throw error;
      setConfirmations(data || []);
    } catch (err) {
      console.error('Error fetching confirmations:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingOrders = async () => {
    try {
      const { data, error } = await supabase
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
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const ordersWithoutConfirmation = data?.filter(
        order => !order.payment_confirmations?.length
      ) || [];
      
      setPendingOrders(ordersWithoutConfirmation);
    } catch (err) {
      console.error('Error fetching pending orders:', err);
      toast.error('Lỗi tải đơn hàng chờ xác nhận: ' + err.message);
    }
  };

  const handleShowDetails = (confirmation) => {
    setSelectedConfirmation(confirmation);
    setShowDetails(true);
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

  const handleManualConfirm = async (order) => {
    if (!order) return;
    
    setManualConfirmLoading(true);
    try {
      const { error: confirmError } = await supabase
        .from('payment_confirmations')
        .insert([{
          ad_order_id: order.id,
          vietqr_order_id: order.vietqr_order_id,
          confirmed_amount: order.payment_amount || order.ad_packages.price,
          confirmation_source: 'manual',
          bank_transaction_id: null,
          raw_response: {
            manual_confirmation: true,
            confirmed_by: 'admin',
            confirmed_at: new Date().toISOString()
          }
        }]);

      if (confirmError) throw confirmError;

      toast.success('Xác nhận thanh toán thành công!');
      setShowManualConfirm(false);
      await Promise.all([
        fetchConfirmations(),
        fetchPendingOrders()
      ]);
    } catch (err) {
      console.error('Error confirming payment:', err);
      toast.error('Lỗi xác nhận thanh toán: ' + err.message);
    } finally {
      setManualConfirmLoading(false);
    }
  };

  return (
    <AdminLayout title="Quản lý xác nhận thanh toán">
      <div className="p-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Quản lý xác nhận thanh toán</h2>
          <div>
            <Button 
              variant="outline-success"
              onClick={() => setShowManualConfirm(true)}
              className="me-2"
            >
              ✓ Xác nhận thủ công
            </Button>
            <Button 
              variant="outline-primary" 
              onClick={() => {
                fetchConfirmations();
                fetchPendingOrders();
              }}
            >
              🔄 Làm mới
            </Button>
          </div>
        </div>

        {error && <Alert variant="danger">{error}</Alert>}

        {/* Revenue Statistics Section */}
        <div className="mb-5">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h3>Thống kê doanh thu</h3>
            <Form.Select 
              style={{ width: 'auto' }}
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
            >
              <option value="thisMonth">Tháng này</option>
              <option value="last3Months">3 tháng gần đây</option>
              <option value="thisYear">Năm nay</option>
              <option value="all">Tất cả</option>
            </Form.Select>
          </div>

          <Row className="g-4 mb-4">
            <Col md={3}>
              <Card className="bg-primary text-white h-100">
                <Card.Body>
                  <h6 className="card-title">Hôm nay</h6>
                  <h3 className="card-text mb-0">
                    {formatMoney(revenueStats.today)}
                  </h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="bg-success text-white h-100">
                <Card.Body>
                  <h6 className="card-title">Tuần này</h6>
                  <h3 className="card-text mb-0">
                    {formatMoney(revenueStats.thisWeek)}
                  </h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="bg-info text-white h-100">
                <Card.Body>
                  <h6 className="card-title">Tháng này</h6>
                  <h3 className="card-text mb-0">
                    {formatMoney(revenueStats.thisMonth)}
                  </h3>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="bg-secondary text-white h-100">
                <Card.Body>
                  <h6 className="card-title">Tổng doanh thu</h6>
                  <h3 className="card-text mb-0">
                    {formatMoney(revenueStats.total)}
                  </h3>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <Row className="g-4">
            <Col md={8}>
              <Card>
                <Card.Body>
                  <h5 className="card-title">Biểu đồ doanh thu theo ngày</h5>
                  <div style={{ height: '300px' }}>
                    <Line
                      data={{
                        labels: revenueStats.dailyData.map(([date]) => date),
                        datasets: [
                          {
                            label: 'Doanh thu',
                            data: revenueStats.dailyData.map(([, value]) => value),
                            fill: true,
                            borderColor: 'rgb(75, 192, 192)',
                            backgroundColor: 'rgba(75, 192, 192, 0.2)',
                            tension: 0.1
                          }
                        ]
                      }}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: {
                          legend: {
                            position: 'top',
                          },
                          title: {
                            display: false
                          }
                        },
                        scales: {
                          y: {
                            beginAtZero: true,
                            ticks: {
                              callback: (value) => formatMoney(value)
                            }
                          }
                        }
                      }}
                    />
                  </div>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card>
                <Card.Body>
                  <h5 className="card-title">Thống kê chi tiết</h5>
                  <Table striped bordered>
                    <tbody>
                      <tr>
                        <td>Số đơn hàng</td>
                        <td className="text-end">
                          <strong>{confirmations.length}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td>Đơn hàng chờ xác nhận</td>
                        <td className="text-end">
                          <strong>{pendingOrders.length}</strong>
                        </td>
                      </tr>
                      <tr>
                        <td>Giá trị trung bình/đơn</td>
                        <td className="text-end">
                          <strong>
                            {formatMoney(
                              confirmations.length
                                ? revenueStats.total / confirmations.length
                                : 0
                            )}
                          </strong>
                        </td>
                      </tr>
                      <tr>
                        <td>Xác nhận tự động</td>
                        <td className="text-end">
                          <strong>
                            {confirmations.filter(c => c.confirmation_source === 'vietqr_api').length}
                          </strong>
                        </td>
                      </tr>
                      <tr>
                        <td>Xác nhận thủ công</td>
                        <td className="text-end">
                          <strong>
                            {confirmations.filter(c => c.confirmation_source === 'manual').length}
                          </strong>
                        </td>
                      </tr>
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </div>

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
                <th>Nguồn xác nhận</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {confirmations.map(confirmation => (
                <tr key={confirmation.id}>
                  <td>{formatDateTime(confirmation.confirmed_at)}</td>
                  <td>
                    <code>{confirmation.vietqr_order_id}</code>
                  </td>
                  <td>
                    {confirmation.ad_orders?.user_profiles?.display_name || 
                     confirmation.ad_orders?.user_profiles?.email}
                  </td>
                  <td>
                    {confirmation.ad_orders?.ad_packages?.name}
                  </td>
                  <td>
                    {formatMoney(confirmation.confirmed_amount)}
                  </td>
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
                  <td>
                    <Button
                      size="sm"
                      variant="outline-info"
                      onClick={() => handleShowDetails(confirmation)}
                    >
                      Chi tiết
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}

        {/* Modal xác nhận thủ công */}
        <Modal
          show={showManualConfirm}
          onHide={() => setShowManualConfirm(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Xác nhận thanh toán thủ công</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {pendingOrders.length === 0 ? (
              <Alert variant="info">
                Không có đơn hàng nào đang chờ xác nhận thanh toán.
              </Alert>
            ) : (
              <Table striped bordered hover>
                <thead>
                  <tr>
                    <th>Thời gian</th>
                    <th>Mã đơn hàng</th>
                    <th>Người dùng</th>
                    <th>Gói quảng cáo</th>
                    <th>Số tiền</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingOrders.map(order => (
                    <tr key={order.id}>
                      <td>{formatDateTime(order.created_at)}</td>
                      <td>
                        <code>{order.vietqr_order_id || '---'}</code>
                      </td>
                      <td>
                        {order.user_profiles?.display_name || 
                         order.user_profiles?.email}
                      </td>
                      <td>
                        {order.ad_packages?.name}
                      </td>
                      <td>
                        {formatMoney(order.payment_amount || order.ad_packages?.price)}
                      </td>
                      <td>
                        <Button
                          size="sm"
                          variant="success"
                          disabled={manualConfirmLoading}
                          onClick={() => handleManualConfirm(order)}
                        >
                          {manualConfirmLoading ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-1" />
                              Đang xử lý...
                            </>
                          ) : (
                            'Xác nhận'
                          )}
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowManualConfirm(false)}>
              Đóng
            </Button>
          </Modal.Footer>
        </Modal>

        {/* Modal hiển thị chi tiết */}
        <Modal
          show={showDetails}
          onHide={() => setShowDetails(false)}
          size="lg"
        >
          <Modal.Header closeButton>
            <Modal.Title>Chi tiết xác nhận thanh toán</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            {selectedConfirmation && (
              <div>
                <h5>Thông tin xác nhận</h5>
                <Table bordered>
                  <tbody>
                    <tr>
                      <td><strong>Thời gian xác nhận</strong></td>
                      <td>{formatDateTime(selectedConfirmation.confirmed_at)}</td>
                    </tr>
                    <tr>
                      <td><strong>Mã đơn hàng VietQR</strong></td>
                      <td><code>{selectedConfirmation.vietqr_order_id}</code></td>
                    </tr>
                    <tr>
                      <td><strong>Mã giao dịch ngân hàng</strong></td>
                      <td><code>{selectedConfirmation.bank_transaction_id || '---'}</code></td>
                    </tr>
                    <tr>
                      <td><strong>Số tiền xác nhận</strong></td>
                      <td>{formatMoney(selectedConfirmation.confirmed_amount)}</td>
                    </tr>
                    <tr>
                      <td><strong>Nguồn xác nhận</strong></td>
                      <td>
                        <Badge bg={
                          selectedConfirmation.confirmation_source === 'vietqr_api' 
                            ? 'success' 
                            : selectedConfirmation.confirmation_source === 'manual'
                            ? 'warning'
                            : 'info'
                        }>
                          {selectedConfirmation.confirmation_source}
                        </Badge>
                      </td>
                    </tr>
                  </tbody>
                </Table>

                <h5 className="mt-4">Thông tin đơn hàng</h5>
                <Table bordered>
                  <tbody>
                    <tr>
                      <td><strong>Người dùng</strong></td>
                      <td>
                        {selectedConfirmation.ad_orders?.user_profiles?.display_name}<br/>
                        <small className="text-muted">
                          {selectedConfirmation.ad_orders?.user_profiles?.email}
                        </small>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Gói quảng cáo</strong></td>
                      <td>
                        {selectedConfirmation.ad_orders?.ad_packages?.name}<br/>
                        <small className="text-muted">
                          {selectedConfirmation.ad_orders?.ad_packages?.description}
                        </small>
                      </td>
                    </tr>
                    <tr>
                      <td><strong>Thời hạn</strong></td>
                      <td>
                        {selectedConfirmation.ad_orders?.ad_packages?.duration_days} ngày<br/>
                        <small className="text-muted">
                          {formatDateTime(selectedConfirmation.ad_orders?.start_time)} - {formatDateTime(selectedConfirmation.ad_orders?.end_time)}
                        </small>
                      </td>
                    </tr>
                  </tbody>
                </Table>

                {selectedConfirmation.raw_response && (
                  <>
                    <h5 className="mt-4">Response từ VietQR API</h5>
                    <pre className="bg-light p-3 rounded">
                      {JSON.stringify(selectedConfirmation.raw_response, null, 2)}
                    </pre>
                  </>
                )}
              </div>
            )}
          </Modal.Body>
          <Modal.Footer>
            <Button variant="secondary" onClick={() => setShowDetails(false)}>
              Đóng
            </Button>
          </Modal.Footer>
        </Modal>
      </div>
    </AdminLayout>
  );
};

export default PaymentConfirmationsManagement; 