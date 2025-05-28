import React, { useState, useEffect, useCallback } from 'react';
import { Container, Card, Button, Row, Col, Spinner, Alert, Form } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import useVietQR from '../../utils/useVietQR';

const BuyAdPage = () => {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [user, setUser] = useState(null);
  const [orderId, setOrderId] = useState('');
  const [selectedBank, setSelectedBank] = useState('');
  const [vietQRUrl, setVietQRUrl] = useState('');
  const [qrLoading, setQrLoading] = useState(false);
  const [qrError, setQrError] = useState(null);
  const [orderSaved, setOrderSaved] = useState(false);

  // Sử dụng VietQR hook
  const {
    banks,
    config,
    generateVietQRUrl,
    generateDeeplink,
    generateQuicklink,
    generateOrderId,
    fetchBanks
  } = useVietQR();

  // Lấy danh sách gói quảng cáo từ Supabase
  useEffect(() => {
    const fetchPackages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('ad_packages').select('*').order('price', { ascending: true });
        if (error) throw error;
        setPackages(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  // Lấy thông tin user Supabase
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);
      } catch (err) {
        console.error('Error fetching user:', err);
      }
    };
    fetchUser();
  }, []);

  // Set default bank và fetch banks từ API
  useEffect(() => {
    setSelectedBank(config.bankId);
    // Có thể fetch banks từ VietQR.io API
    // fetchBanks();
  }, [config.bankId]);

  // Reset orderId khi thay đổi gói
  useEffect(() => {
    if (selectedPackage) {
      console.log('Package changed, resetting order state');
      setOrderId('');
      setVietQRUrl('');
      setQrError(null);
      setQrLoading(false);
      setOrderSaved(false);
    }
  }, [selectedPackage?.id]); // Chỉ reset khi package ID thay đổi

  // Tạo orderId CHỈ MỘT LẦN khi chọn gói mới hoặc user thay đổi
  useEffect(() => {
    if (selectedPackage && user && !orderId) {
      // Đợi một chút để đảm bảo reset effect đã chạy
      const timer = setTimeout(() => {
        const newOrderId = generateOrderId('AD', user.id || '');
        setOrderId(newOrderId);
        console.log('Generated Order ID (one time):', newOrderId);
      }, 50);
      
      return () => clearTimeout(timer);
    }
  }, [selectedPackage?.id, user?.id, orderId, generateOrderId]);

  // Lưu thông tin đơn hàng vào database
  const saveOrder = async (qrUrl, vietQROrderId) => {
    if (orderSaved || !selectedPackage || !user || !vietQROrderId) return;
    
    try {
      const { data, error } = await supabase.from('ad_orders').insert([{
        user_id: user.id,
        package_id: selectedPackage.id,
        status: 'pending',
        vietqr_order_id: vietQROrderId,
        bank_id: selectedBank,
        qr_code_url: qrUrl,
        payment_amount: selectedPackage.price,
        payment_description: `Mua goi quang cao ${vietQROrderId}`
      }]).select().single();

      if (error) throw error;
      
      setOrderSaved(true);
      console.log('Order saved successfully:', data);
      return data;
    } catch (err) {
      console.error('Error saving order:', err);
      setQrError('Lỗi lưu đơn hàng: ' + err.message);
      return null;
    }
  };

  // Tạo VietQR URL khi có đầy đủ thông tin
  useEffect(() => {
    if (selectedPackage && orderId && selectedBank && !orderSaved) {
      setQrLoading(true);
      setQrError(null);
      
      try {
        const amount = selectedPackage.price;
        const description = `Mua goi quang cao ${orderId}`;
        
        console.log('Generating QR with:', { amount, description, selectedBank, orderId });
        
        const qrUrl = generateVietQRUrl(amount, description, selectedBank);
        
        if (qrUrl) {
          setVietQRUrl(qrUrl);
          console.log('QR URL generated successfully:', qrUrl);
          
          // Test if image loads
          const img = new Image();
          img.onload = async () => {
            setQrLoading(false);
            console.log('QR image loaded successfully');
            // Lưu đơn hàng sau khi QR load thành công
            await saveOrder(qrUrl, orderId);
          };
          img.onerror = () => {
            setQrLoading(false);
            setQrError('Không thể tải mã QR. Vui lòng thử lại.');
            console.error('Failed to load QR image');
          };
          img.src = qrUrl;
        } else {
          setQrLoading(false);
          setQrError('Không thể tạo mã QR. Vui lòng kiểm tra thông tin.');
        }
      } catch (err) {
        setQrLoading(false);
        setQrError('Lỗi tạo mã QR: ' + err.message);
        console.error('Error generating QR:', err);
      }
    }
  }, [selectedPackage, orderId, selectedBank, generateVietQRUrl, orderSaved]);

  const handleRetryQR = () => {
    if (selectedPackage && orderId && selectedBank) {
      setQrError(null);
      setVietQRUrl('');
      
      // Trigger regeneration
      setTimeout(() => {
        const amount = selectedPackage.price;
        const description = `Mua goi quang cao ${orderId}`;
        const qrUrl = generateVietQRUrl(amount, description, selectedBank);
        setVietQRUrl(qrUrl);
      }, 100);
    }
  };

  const handlePackageSelect = (pkg) => {
    console.log('Selecting package:', pkg.name);
    setSelectedPackage(pkg);
    // orderId sẽ được tạo tự động bởi useEffect
  };

  const handleBackToPackages = () => {
    console.log('Returning to package selection');
    setSelectedPackage(null);
    setVietQRUrl('');
    setQrError(null);
    setOrderId(''); // Reset order ID để tạo mới cho lần sau
  };

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
                      <Button 
                        className="mt-3" 
                        onClick={() => handlePackageSelect(pkg)} 
                        variant="primary"
                      >
                        Xem chi tiết & Thanh toán
                      </Button>
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
                <div className="mb-3">
                  <b>Người mua:</b> {user.user_metadata?.display_name || user.email}
                </div>
              )}
              
              <h4>{selectedPackage.name}</h4>
              <p>{selectedPackage.description}</p>
              <div><b>Vị trí:</b> {selectedPackage.position}</div>
              <div><b>Thời gian:</b> {selectedPackage.duration_days} ngày</div>
              <div><b>Giá:</b> {selectedPackage.price.toLocaleString()} VNĐ</div>
              
              {/* Chọn ngân hàng */}
              <div className="my-3">
                <Form.Group>
                  <Form.Label><b>Chọn ngân hàng để thanh toán:</b></Form.Label>
                  <Form.Select 
                    value={selectedBank} 
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="mb-3"
                  >
                    {banks.map(bank => (
                      <option key={bank.id} value={bank.id}>{bank.name}</option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </div>

              {/* Hiển thị VietQR */}
              <div className="my-3">
                {qrLoading && (
                  <div className="text-center py-4">
                    <Spinner animation="border" />
                    <div className="mt-2">Đang tạo mã QR...</div>
                  </div>
                )}
                
                {qrError && (
                  <Alert variant="warning">
                    {qrError}
                    <br />
                    <Button variant="outline-primary" size="sm" onClick={handleRetryQR} className="mt-2">
                      Thử lại
                    </Button>
                  </Alert>
                )}
                
                {vietQRUrl && !qrLoading && !qrError && (
                  <div>
                    <img 
                      src={vietQRUrl} 
                      alt="VietQR Code" 
                      style={{ maxWidth: '300px', width: '100%' }}
                      className="border rounded"
                      onError={() => {
                        setQrError('Không thể hiển thị mã QR. Vui lòng thử lại.');
                        setVietQRUrl('');
                      }}
                    />
                    <div className="mt-2">
                      <small className="text-muted">
                        Ngân hàng: {banks.find(b => b.id === selectedBank)?.name || selectedBank}
                      </small>
                    </div>
                  </div>
                )}
              </div>
              
              {orderId && (
                <div className="mb-3">
                  <Alert variant="info">
                    <b>Mã đơn hàng:</b> <span style={{color:'#6366f1', fontWeight:600}}>{orderId}</span>
                    <br/>
                    <small>Nội dung chuyển khoản sẽ tự động điền khi quét mã QR</small>
                    {process.env.NODE_ENV === 'development' && (
                      <div className="mt-2 text-muted" style={{fontSize: '11px'}}>
                        Debug: Package ID: {selectedPackage?.id} | User ID: {user?.id?.slice(0, 8)}
                      </div>
                    )}
                  </Alert>
                </div>
              )}

              {/* Buttons */}
              <div className="d-grid gap-2">
                <a 
                  href={generateDeeplink(selectedPackage.price, `Mua goi quang cao ${orderId}`, selectedBank)} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="btn btn-success btn-lg"
                >
                  📱 Mở App Banking để thanh toán
                </a>
                
                <Button 
                  variant="outline-primary" 
                  href={generateQuicklink(selectedPackage.price, `Mua goi quang cao ${orderId}`, selectedBank)}
                  target="_blank"
                >
                  🌐 Xem chi tiết thanh toán
                </Button>
              </div>

              <hr />
              
              <div className="text-muted small mb-3">
                <p>💡 <b>Hướng dẫn thanh toán:</b></p>
                <ul className="text-start">
                  <li>Quét mã QR bằng app banking của bạn</li>
                  <li>Kiểm tra thông tin và số tiền</li>
                  <li>Xác nhận chuyển khoản</li>
                  <li>Gói quảng cáo sẽ được kích hoạt tự động sau khi thanh toán thành công</li>
                </ul>
              </div>
              
              <Button 
                variant="secondary" 
                onClick={handleBackToPackages}
              >
                ← Quay lại chọn gói khác
              </Button>
            </Card.Body>
          </Card>
        </div>
      )}
    </Container>
  );
};

export default BuyAdPage; 