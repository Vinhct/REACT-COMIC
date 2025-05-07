import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Table } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import useMissionSystem from '../../utils/useMissionSystem';
import './LuckyWheelPage.css';

const LuckyWheelPage = () => {
  const {
    spinTickets,
    spinRewards,
    spinHistory,
    loading,
    error,
    spinWheel
  } = useMissionSystem();
  
  const canvasRef = useRef(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [resultMessage, setResultMessage] = useState(null);
  const [wheelRotation, setWheelRotation] = useState(0);
  
  // Khởi tạo vòng quay
  useEffect(() => {
    drawWheel();
  }, [spinRewards, loading.spinRewards, wheelRotation]);
  
  // Vẽ vòng quay
  const drawWheel = () => {
    if (!canvasRef.current || spinRewards.length === 0 || loading.spinRewards) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Thiết lập kích thước
    const size = Math.min(window.innerWidth * 0.8, 500);
    canvas.width = size;
    canvas.height = size;
    
    const centerX = size / 2;
    const centerY = size / 2;
    const radius = size / 2 - 10;
    
    // Xóa canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Vẽ từng phần của vòng quay
    const segmentCount = spinRewards.length;
    const anglePerSegment = (Math.PI * 2) / segmentCount;
    
    // Màu sắc xen kẽ
    const colors = ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#4BBFFF', '#FFA5A5'];
    
    // Lưu trạng thái
    ctx.save();
    
    // Di chuyển đến tâm và xoay
    ctx.translate(centerX, centerY);
    ctx.rotate((wheelRotation * Math.PI) / 180);
    
    // Vẽ từng phần
    spinRewards.forEach((reward, index) => {
      // Vị trí ban đầu mũi tên ở góc 12h, tương ứng -90 độ hoặc -PI/2
      const startAngle = -Math.PI/2 + index * anglePerSegment;
      const endAngle = -Math.PI/2 + (index + 1) * anglePerSegment;
      
      // Vẽ phần
      ctx.beginPath();
      ctx.moveTo(0, 0); // Đã di chuyển đến tâm nên điểm bắt đầu là (0,0)
      ctx.arc(0, 0, radius, startAngle, endAngle);
      ctx.closePath();
      
      // Tô màu
      ctx.fillStyle = colors[index % colors.length];
      ctx.fill();
      
      // Vẽ viền
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#FFFFFF';
      ctx.stroke();
      
      // Vẽ text
      const textAngle = startAngle + anglePerSegment / 2;
      const textRadius = radius * 0.65;
      const textX = textRadius * Math.cos(textAngle);
      const textY = textRadius * Math.sin(textAngle);
      
      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(textAngle + Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 14px Arial';
      
      // Hiển thị tên phần thưởng
      ctx.fillText(reward.name, 0, 0);
      
      ctx.restore();
    });
    
    // Vẽ trung tâm
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#000000';
    ctx.stroke();
    
    // Khôi phục trạng thái
    ctx.restore();
    
    // Vẽ mũi tên (không xoay theo)
    ctx.beginPath();
    ctx.moveTo(centerX, centerY - radius - 10);
    ctx.lineTo(centerX - 10, centerY - radius + 10);
    ctx.lineTo(centerX + 10, centerY - radius + 10);
    ctx.closePath();
    ctx.fillStyle = '#E74C3C';
    ctx.fill();
  };
  
  // Xoay vòng quay
  const rotateWheel = (targetDegree) => {
    if (!canvasRef.current) return;
    
    // Tính toán các tham số quay
    const duration = 5000; // 5 giây
    const startTime = Date.now();
    const startRotation = wheelRotation;
    
    // Thêm 5 vòng quay + góc đến phần thưởng
    const additionalRotation = 5 * 360 + targetDegree;
    
    const animate = () => {
      const now = Date.now();
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Hàm easing để tạo hiệu ứng chậm dần
      const easeOut = (t) => 1 - Math.pow(1 - t, 3);
      const easedProgress = easeOut(progress);
      
      // Tính góc hiện tại
      const currentRotation = startRotation + additionalRotation * easedProgress;
      setWheelRotation(currentRotation);
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Hoàn thành quay
        setIsSpinning(false);
        
        // Hiển thị kết quả
        if (spinResult) {
          setResultMessage({
            title: `Chúc mừng bạn đã nhận được: ${spinResult.name}`,
            message: spinResult.description
          });
        }
      }
    };
    
    requestAnimationFrame(animate);
  };
  
  // Xử lý khi người dùng quay
  const handleSpin = async () => {
    if (isSpinning || spinTickets <= 0) return;
    
    setIsSpinning(true);
    setResultMessage(null);
    
    try {
      const result = await spinWheel();
      
      if (result.success) {
        setSpinResult(result.reward);
        
        // Tính toán góc để dừng ở phần thưởng
        const segmentAngle = 360 / spinRewards.length;
        const rewardIndex = spinRewards.findIndex(r => r.id === result.reward.id);
        
        // Cần quay vòng quay sao cho phần thưởng được chọn dừng lại ở vị trí mũi tên (12h)
        const targetDegree = -(rewardIndex * segmentAngle);
        
        // Xoay đến phần thưởng
        rotateWheel(targetDegree);
      } else {
        setIsSpinning(false);
        setResultMessage({
          title: 'Lỗi khi quay thưởng',
          message: result.error,
          type: 'danger'
        });
      }
    } catch (error) {
      console.error('Lỗi khi quay thưởng:', error);
      setIsSpinning(false);
      setResultMessage({
        title: 'Lỗi không xác định',
        message: 'Đã xảy ra lỗi khi quay thưởng. Vui lòng thử lại.',
        type: 'danger'
      });
    }
  };
  
  // Format thời gian
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleString('vi-VN');
  };
  
  return (
    <Container className="lucky-wheel-page py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="wheel-title text-center">Vòng Quay May Mắn</h1>
          <p className="text-center text-muted">Sử dụng lượt quay để nhận những phần thưởng hấp dẫn!</p>
        </Col>
      </Row>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {resultMessage && (
        <Alert variant={resultMessage.type || 'success'} className="mb-4 text-center">
          <Alert.Heading>{resultMessage.title}</Alert.Heading>
          <p>{resultMessage.message}</p>
        </Alert>
      )}
      
      <Row>
        <Col lg={8} className="mb-4">
          <Card className="wheel-card">
            <Card.Body className="text-center">
              <div className="wheel-container">
                <canvas ref={canvasRef} className="wheel-canvas"></canvas>
                <div className="wheel-pointer"></div>
              </div>
              
              <div className="mt-4">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleSpin}
                  disabled={isSpinning || spinTickets <= 0 || loading.spinTickets}
                  className="spin-button"
                >
                  {isSpinning ? (
                    <>
                      <Spinner animation="border" size="sm" />
                      <span className="ms-2">Đang quay...</span>
                    </>
                  ) : (
                    <>
                      Quay Ngay
                      {!loading.spinTickets && (
                        <span className="ms-2">({spinTickets} lượt)</span>
                      )}
                    </>
                  )}
                </Button>
                
                <div className="mt-3">
                  <Link to="/missions" className="btn btn-outline-primary">
                    <i className="fas fa-tasks me-1"></i> Làm nhiệm vụ để nhận thêm lượt quay
                  </Link>
                </div>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col lg={4}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">Phần thưởng có thể nhận</h5>
            </Card.Header>
            <Card.Body>
              {loading.spinRewards ? (
                <div className="text-center py-3">
                  <Spinner animation="border" />
                </div>
              ) : (
                <ul className="reward-list">
                  {spinRewards.map(reward => (
                    <li key={reward.id} className="reward-item">
                      <div className="reward-name">{reward.name}</div>
                      <div className="reward-probability">{reward.probability}%</div>
                    </li>
                  ))}
                </ul>
              )}
            </Card.Body>
          </Card>
          
          <Card>
            <Card.Header>
              <h5 className="mb-0">Lịch sử quay thưởng</h5>
            </Card.Header>
            <Card.Body>
              {loading.spinHistory ? (
                <div className="text-center py-3">
                  <Spinner animation="border" />
                </div>
              ) : spinHistory.length === 0 ? (
                <p className="text-center text-muted">Bạn chưa quay thưởng lần nào.</p>
              ) : (
                <Table responsive size="sm">
                  <thead>
                    <tr>
                      <th>Phần thưởng</th>
                      <th>Thời gian</th>
                    </tr>
                  </thead>
                  <tbody>
                    {spinHistory.slice(0, 5).map(item => (
                      <tr key={item.id}>
                        <td>{item.reward.name}</td>
                        <td>{formatDate(item.created_at)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
              
              {spinHistory.length > 5 && (
                <div className="text-center mt-2">
                  <Button variant="link" size="sm">Xem thêm</Button>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row className="mt-4">
        <Col className="text-center">
          <Link to="/" className="btn btn-outline-secondary me-2">
            <i className="fas fa-home me-1"></i> Trang chủ
          </Link>
          <Link to="/missions" className="btn btn-outline-primary">
            <i className="fas fa-tasks me-1"></i> Nhiệm vụ
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default LuckyWheelPage; 