import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col, Spinner, Alert } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import { QRCodeSVG } from 'qrcode.react';

const MOMO_LINK = 'https://me.momo.vn/3GIQTNspfeu1IEu5IXuDuq/y5eVvk6MYoDWeEP'; // Link chuyển tiền cố định

const BuyAdPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [user, setUser] = useState(null);
  const [orderId, setOrderId] = useState('');

  // Lấy danh sách gói quảng cáo từ Supabase
  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      const { data, error } = await supabase.from('ad_packages').select('*').order('price', { ascending: true });
      if (error) setError(error.message);
      else setPackages(data);
      setLoading(false);
    };
    fetchPackages();
  }, []);

  // Lấy thông tin user Supabase
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    fetchUser();
  }, []);

  // Tạo orderId động mỗi khi chọn gói
  useEffect(() => {
    if (selectedPackage && user) {
      setOrderId(`${user.id?.slice(0, 8) || 'user'}-${Date.now()}`);
    }
  }, [selectedPackage, user]);

  return (
    <Container className="py-4">
      <h2 className="mb-4 text-center">Mua gói quảng cáo</h2>
      {error && <Alert variant="danger">{error}</Alert>}
      {!selectedPackage && (
        <>
          <h4>Chọn gói quảng cáo</h4>
          {loading ? <Spinner animation="border" /> : (
            <Row>
              {packages.map(pkg => (
                <Col md={4} key={pkg.id} className="mb-3">
                  <Card className="h-100">
                    <Card.Body>
                      <Card.Title>{pkg.name}</Card.Title>
                      <Card.Text>{pkg.description}</Card.Text>
                      <div><b>Vị trí:</b> {pkg.position}</div>
                      <div><b>Thời gian:</b> {pkg.duration_days} ngày</div>
                      <div><b>Giá:</b> {pkg.price.toLocaleString()} VNĐ</div>
                      <Button className="mt-3" onClick={() => setSelectedPackage(pkg)} variant="primary">Xem chi tiết & Thanh toán</Button>
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>
          )}
        </>
      )}
      {selectedPackage && (
        <div className="text-center mt-4">
          <Card>
            <Card.Body>
              {user && (
                <div className="mb-2">
                  <b>Người mua:</b> {user.user_metadata?.display_name || user.email}
                </div>
              )}
              <h4>{selectedPackage.name}</h4>
              <p>{selectedPackage.description}</p>
              <div><b>Vị trí:</b> {selectedPackage.position}</div>
              <div><b>Thời gian:</b> {selectedPackage.duration_days} ngày</div>
              <div><b>Giá:</b> {selectedPackage.price.toLocaleString()} VNĐ</div>
              <div className="my-3">
                <QRCodeSVG value={MOMO_LINK} size={220} />
              </div>
              {orderId && (
                <div className="mb-2">
                  <b>Nội dung chuyển khoản:</b> <span style={{color:'#6366f1', fontWeight:600}}>Mua goi quang cao {orderId}</span>
                  <br/>
                  <small>Vui lòng nhập đúng nội dung này khi chuyển khoản để được duyệt nhanh!</small>
                </div>
              )}
              <a href={MOMO_LINK} target="_blank" rel="noopener noreferrer" className="btn btn-success mb-2">Chuyển tiền qua Momo</a>
              <br/>
              <Button variant="secondary" onClick={() => setSelectedPackage(null)}>Đóng</Button>
            </Card.Body>
          </Card>
        </div>
      )}
    </Container>
  );
};

export default BuyAdPage; 