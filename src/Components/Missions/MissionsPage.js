import React, { useState } from 'react';
import { Container, Row, Col, Card, ProgressBar, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import useMissionSystem from '../../utils/useMissionSystem';
import './MissionsPage.css';

const MissionsPage = () => {
  const {
    missions,
    userMissions,
    spinTickets,
    loading,
    error,
    claimMissionReward,
    formatTimeUntilReset
  } = useMissionSystem();
  
  const [claimingMission, setClaimingMission] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null);

  // Hàm xử lý nhận thưởng nhiệm vụ
  const handleClaimReward = async (missionId) => {
    try {
      setClaimingMission(missionId);
      
      const result = await claimMissionReward(missionId);
      
      if (result.success) {
        setAlertMessage({
          type: 'success',
          message: result.message
        });
      } else {
        setAlertMessage({
          type: 'danger',
          message: result.error
        });
      }
    } catch (error) {
      console.error('Lỗi khi nhận thưởng:', error);
      setAlertMessage({
        type: 'danger',
        message: 'Đã xảy ra lỗi khi nhận thưởng. Vui lòng thử lại sau.'
      });
    } finally {
      setClaimingMission(null);
    }
  };

  // Tìm thông tin tiến độ cho một nhiệm vụ
  const findUserMission = (missionId) => {
    return userMissions.find(um => um.mission_id === missionId);
  };

  // Hiển thị tiến trình theo phần trăm
  const calculateProgress = (userMission, mission) => {
    if (!userMission || !mission) return 0;
    const percentage = Math.min(100, Math.floor((userMission.progress / mission.target_value) * 100));
    return percentage;
  };

  return (
    <Container className="missions-page py-4">
      <Row className="mb-4">
        <Col>
          <h1 className="missions-title text-center">Nhiệm Vụ Hàng Ngày</h1>
          <p className="text-center text-muted">Hoàn thành nhiệm vụ để nhận lượt quay may mắn!</p>
        </Col>
      </Row>
      
      <Alert className="text-center" variant="info">
        <i className="fas fa-clock me-2"></i>
        Nhiệm vụ sẽ được làm mới sau: <strong>{formatTimeUntilReset()}</strong>
      </Alert>
      
      {error && (
        <Alert variant="danger" className="mb-4">
          {error}
        </Alert>
      )}
      
      {alertMessage && (
        <Alert 
          variant={alertMessage.type || 'success'} 
          className="mb-4"
          onClose={() => setAlertMessage(null)} 
          dismissible
        >
          {alertMessage.message}
        </Alert>
      )}
      
      <Row className="mb-4">
        <Col xs={12} md={6} className="mb-3 mb-md-0">
          <Card className="missions-info-card">
            <Card.Body className="d-flex align-items-center">
              <div className="mission-info-icon me-3">
                <i className="fas fa-tasks"></i>
              </div>
              <div>
                <h5 className="mb-1">Nhiệm vụ đã hoàn thành</h5>
                <p className="mb-0">
                  {loading.userMissions ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    `${userMissions.filter(um => um.completed).length} / ${missions.length}`
                  )}
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col xs={12} md={6}>
          <Card className="missions-info-card">
            <Card.Body className="d-flex align-items-center">
              <div className="mission-info-icon me-3">
                <i className="fas fa-ticket-alt"></i>
              </div>
              <div>
                <h5 className="mb-1">Lượt quay may mắn</h5>
                <p className="mb-0">
                  {loading.spinTickets ? (
                    <Spinner animation="border" size="sm" />
                  ) : (
                    <>
                      {spinTickets} lượt
                      <Link to="/lucky-wheel" className="ms-3 btn btn-sm btn-primary">
                        Đi đến vòng quay
                      </Link>
                    </>
                  )}
                </p>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        {loading.missions || loading.userMissions ? (
          <Col className="text-center py-5">
            <Spinner animation="border" />
            <p className="mt-2">Đang tải danh sách nhiệm vụ...</p>
          </Col>
        ) : missions.length === 0 ? (
          <Col>
            <Alert variant="info">
              Hiện tại chưa có nhiệm vụ nào được tạo. Vui lòng quay lại sau!
            </Alert>
          </Col>
        ) : (
          missions.map(mission => {
            const userMission = findUserMission(mission.id);
            const progress = calculateProgress(userMission, mission);
            const isCompleted = userMission && userMission.completed;
            const canClaimReward = isCompleted && !userMission.rewarded;
            
            return (
              <Col xs={12} className="mb-4" key={mission.id}>
                <Card className={`mission-card ${isCompleted ? 'completed' : ''}`}>
                  <Card.Body>
                    <Row>
                      <Col xs={12} md={8}>
                        <h4 className="mission-title">
                          {mission.title}
                          {isCompleted && (
                            <Badge bg="success" className="ms-2">Hoàn thành</Badge>
                          )}
                        </h4>
                        <p className="mission-description">{mission.description}</p>
                        
                        <div className="mission-progress-container">
                          <div className="d-flex justify-content-between mb-1">
                            <span>Tiến độ</span>
                            <span>
                              {userMission ? userMission.progress : 0} / {mission.target_value}
                              {mission.type === 'read_chap' ? ' chương' : ' phút'}
                            </span>
                          </div>
                          <ProgressBar 
                            now={progress} 
                            variant={isCompleted ? "success" : "primary"}
                            className="mission-progress"
                          />
                        </div>
                      </Col>
                      
                      <Col xs={12} md={4} className="d-flex align-items-center justify-content-md-end mt-3 mt-md-0">
                        <div className="mission-reward text-center me-3">
                          <div className="reward-icon">
                            <i className="fas fa-gift"></i>
                          </div>
                          <div className="reward-text">
                            <small>Phần thưởng</small>
                            <p className="mb-0">{mission.reward_amount} lượt quay</p>
                          </div>
                        </div>
                        
                        {canClaimReward ? (
                          <Button 
                            variant="success" 
                            onClick={() => handleClaimReward(mission.id)}
                            disabled={claimingMission === mission.id}
                          >
                            {claimingMission === mission.id ? (
                              <>
                                <Spinner animation="border" size="sm" /> 
                                <span className="ms-1">Đang nhận...</span>
                              </>
                            ) : (
                              'Nhận thưởng'
                            )}
                          </Button>
                        ) : isCompleted && userMission.rewarded ? (
                          <Badge bg="secondary" className="p-2">Đã nhận thưởng</Badge>
                        ) : (
                          <Button variant="outline-primary" disabled>
                            {mission.type === 'read_chap' ? 'Đọc tiếp' : 'Tiếp tục đọc'}
                          </Button>
                        )}
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              </Col>
            );
          })
        )}
      </Row>
      
      <Row className="mt-4">
        <Col className="text-center">
          <Link to="/" className="btn btn-outline-secondary me-2">
            <i className="fas fa-home me-1"></i> Trang chủ
          </Link>
          <Link to="/lucky-wheel" className="btn btn-primary">
            <i className="fas fa-dharmachakra me-1"></i> Vòng quay may mắn
          </Link>
        </Col>
      </Row>
    </Container>
  );
};

export default MissionsPage; 