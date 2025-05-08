import React, { useState, useRef, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Spinner, Table, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BsArrowLeft, BsTicketPerforated, BsTrophy } from 'react-icons/bs';
import useMissionSystem from '../../../utils/useMissionSystem';
import MobileMenu from '../Common/MobileMenu';
import './MobileMissions.css';

const MobileLuckyWheelPage = () => {
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
  const [showHistory, setShowHistory] = useState(false);
  
  // Khởi tạo vòng quay
  useEffect(() => {
    drawWheel();
    
    // Responsive: Điều chỉnh kích thước canvas khi thay đổi kích thước màn hình
    const handleResize = () => {
      drawWheel();
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [spinRewards, loading.spinRewards, wheelRotation]);
  
  // Vẽ vòng quay
  const drawWheel = () => {
    if (!canvasRef.current || spinRewards.length === 0 || loading.spinRewards) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Thiết lập kích thước - nhỏ hơn cho di động
    const maxSize = 300; // Kích thước tối đa
    const containerWidth = document.querySelector('.wheel-container')?.clientWidth || window.innerWidth * 0.8;
    const size = Math.min(containerWidth, maxSize);
    
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
      
      // Vẽ text - với kích thước font nhỏ hơn cho di động
      const textAngle = startAngle + anglePerSegment / 2;
      const textRadius = radius * 0.65;
      const textX = textRadius * Math.cos(textAngle);
      const textY = textRadius * Math.sin(textAngle);
      
      ctx.save();
      ctx.translate(textX, textY);
      ctx.rotate(textAngle + Math.PI / 2);
      ctx.textAlign = 'center';
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 12px Arial';
      
      // Hiển thị tên phần thưởng - ngắn gọn hơn cho di động
      const displayName = reward.name.length > 12 ? reward.name.substring(0, 10) + '...' : reward.name;
      ctx.fillText(displayName, 0, 0);
      
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
        title: 'Đã xảy ra lỗi',
        message: 'Không thể quay thưởng lúc này. Vui lòng thử lại sau.',
        type: 'danger'
      });
    }
  };
  
  // Format ngày giờ
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { 
      day: '2-digit', 
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // Loading state
  if (loading.spinRewards) {
    return (
      <div className="mobile-lucky-wheel-page">
        <MobileMenu />
        <Container className="mobile-container pt-5">
          <div className="text-center my-5 py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Đang tải vòng quay may mắn...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="mobile-lucky-wheel-page">
      <MobileMenu />
      <Container className="mobile-container">
        <div className="d-flex align-items-center my-3">
          <Button as={Link} to="/" variant="link" className="p-0 me-2">
            <BsArrowLeft size={24} />
          </Button>
          <h4 className="m-0">Vòng Quay May Mắn</h4>
        </div>
        
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        
        {resultMessage && (
          <Alert 
            variant={resultMessage.type || 'success'} 
            className="result-alert mb-3"
            onClose={() => setResultMessage(null)} 
            dismissible
          >
            <Alert.Heading>{resultMessage.title}</Alert.Heading>
            <p>{resultMessage.message}</p>
          </Alert>
        )}
        
        <div className="tickets-display mb-3">
          <Card className="tickets-card">
            <Card.Body className="d-flex align-items-center justify-content-between">
              <div className="d-flex align-items-center">
                <BsTicketPerforated className="tickets-icon me-2" />
                <div>
                  <small>Lượt quay khả dụng</small>
                  <h5 className="mb-0">{loading.spinTickets ? <Spinner animation="border" size="sm" /> : spinTickets}</h5>
                </div>
              </div>
              <Button 
                as={Link} 
                to="/mobile/missions" 
                variant="outline-primary" 
                size="sm"
              >
                Làm nhiệm vụ
              </Button>
            </Card.Body>
          </Card>
        </div>
        
        <div className="wheel-container mb-4 text-center">
          <canvas 
            ref={canvasRef} 
            id="wheelCanvas" 
            className="wheel-canvas"
          ></canvas>
          
          <div className="spin-button-container">
            <Button 
              onClick={handleSpin}
              disabled={isSpinning || spinTickets <= 0}
              className={`spin-button ${isSpinning ? 'spinning' : ''}`}
              variant="primary"
              size="lg"
            >
              {isSpinning ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang quay...
                </>
              ) : spinTickets <= 0 ? 'Hết lượt quay' : 'Quay Ngay'}
            </Button>
          </div>
        </div>
        
        <Button 
          className="mb-3 w-100" 
          variant="outline-primary"
          onClick={() => setShowHistory(!showHistory)}
        >
          {showHistory ? 'Ẩn lịch sử quay' : 'Xem lịch sử quay'}
        </Button>
        
        {showHistory && (
          <div className="history-container">
            <h5>Lịch sử quay thưởng</h5>
            
            {loading.spinHistory ? (
              <div className="text-center py-3">
                <Spinner animation="border" size="sm" />
                <p className="mt-2">Đang tải...</p>
              </div>
            ) : spinHistory.length === 0 ? (
              <p className="text-center text-muted">Bạn chưa có lịch sử quay thưởng nào.</p>
            ) : (
              <div className="history-list">
                {spinHistory.map((item, index) => (
                  <Card key={index} className="history-item mb-2">
                    <Card.Body className="py-2 px-3">
                      <div className="d-flex justify-content-between align-items-center">
                        <div>
                          <small className="text-muted">{formatDate(item.created_at)}</small>
                          <p className="mb-0">
                            <BsTrophy className="me-1 text-warning" />
                            {item.reward?.name || 'Phần thưởng'}
                          </p>
                        </div>
                        <Badge 
                          bg={item.reward?.type === 'points' ? 'success' : 'primary'}
                          pill
                        >
                          {item.reward?.type === 'points' ? `+${item.reward?.value} điểm` : item.reward?.value}
                        </Badge>
                      </div>
                    </Card.Body>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}
      </Container>
    </div>
  );
};

export default MobileLuckyWheelPage; 