import React, { useState } from 'react';
import { Container, Row, Col, Card, ProgressBar, Button, Badge, Alert, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BsArrowLeft, BsFillTrophyFill, BsTicketPerforated, BsGift } from 'react-icons/bs';
import useMissionSystem from '../../../utils/useMissionSystem';
import MobileMenu from '../Common/MobileMenu';
import './MobileMissions.css';

const MobileMissionsPage = () => {
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

  // Hiển thị loading state
  if (loading.missions || loading.userMissions) {
    return (
      <div className="mobile-missions-page">
        <MobileMenu />
        <Container className="mobile-container pt-5">
          <div className="text-center my-5 py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Đang tải danh sách nhiệm vụ...</p>
          </div>
        </Container>
      </div>
    );
  }

  return (
    <div className="mobile-missions-page">
      <MobileMenu />
      <Container className="mobile-container">
        <div className="d-flex align-items-center my-3">
          <Button as={Link} to="/" variant="link" className="p-0 me-2">
            <BsArrowLeft size={24} />
          </Button>
          <h4 className="m-0">Nhiệm Vụ Hàng Ngày</h4>
        </div>
        
        <div className="reset-timer mb-3">
          <small className="text-muted">
            <i className="fas fa-clock me-1"></i>
            Làm mới sau: <strong>{formatTimeUntilReset()}</strong>
          </small>
        </div>
      
        {error && (
          <Alert variant="danger" className="mb-3">
            {error}
          </Alert>
        )}
        
        {alertMessage && (
          <Alert 
            variant={alertMessage.type || 'success'} 
            className="mb-3"
            onClose={() => setAlertMessage(null)} 
            dismissible
          >
            {alertMessage.message}
          </Alert>
        )}
        
        <Row className="info-cards-container mb-3">
          <Col xs={6} className="mb-2">
            <Card className="stats-card">
              <Card.Body className="d-flex align-items-center">
                <div className="stats-icon me-2">
                  <BsFillTrophyFill />
                </div>
                <div>
                  <small>Đã hoàn thành</small>
                  <p className="stats-value mb-0">
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
          <Col xs={6} className="mb-2">
            <Card className="stats-card">
              <Card.Body className="d-flex align-items-center">
                <div className="stats-icon me-2">
                  <BsTicketPerforated />
                </div>
                <div>
                  <small>Lượt quay may mắn</small>
                  <p className="stats-value mb-0">
                    {loading.spinTickets ? (
                      <Spinner animation="border" size="sm" />
                    ) : (
                      `${spinTickets} lượt`
                    )}
                  </p>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Button 
          as={Link} 
          to="/mobile/lucky-wheel" 
          variant="primary"
          className="spin-wheel-btn mb-3 w-100"
        >
          <BsTicketPerforated className="me-2" /> Đi đến vòng quay may mắn
        </Button>
        
        <div className="missions-list">
          <h5 className="mb-3">Danh sách nhiệm vụ:</h5>
          
          {missions.length === 0 ? (
            <Alert variant="info">
              Hiện tại chưa có nhiệm vụ nào được tạo. Vui lòng quay lại sau!
            </Alert>
          ) : (
            missions.map(mission => {
              const userMission = findUserMission(mission.id);
              const progress = calculateProgress(userMission, mission);
              const isCompleted = userMission && userMission.completed;
              const canClaimReward = isCompleted && !userMission.rewarded;
              
              return (
                <Card className={`mission-card mb-3 ${isCompleted ? 'completed' : ''}`} key={mission.id}>
                  <Card.Body>
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <h5 className="mission-title mb-0">
                        {mission.title}
                      </h5>
                      {isCompleted && (
                        <Badge bg="success" pill>Hoàn thành</Badge>
                      )}
                    </div>
                    
                    <p className="mission-description small text-muted">{mission.description}</p>
                    
                    <div className="mission-progress-container mb-3">
                      <div className="d-flex justify-content-between mb-1">
                        <small>Tiến độ</small>
                        <small>
                          {userMission ? userMission.progress : 0} / {mission.target_value}
                          {mission.type === 'read_chap' ? ' chương' : ' phút'}
                        </small>
                      </div>
                      <ProgressBar 
                        now={progress} 
                        variant={isCompleted ? "success" : "primary"}
                        className="mission-progress"
                      />
                    </div>
                    
                    <div className="d-flex justify-content-between align-items-center">
                      <div className="mission-reward d-flex align-items-center">
                        <BsGift className="reward-icon me-2" />
                        <div>
                          <small>Phần thưởng</small>
                          <p className="mb-0">{mission.reward_amount} lượt quay</p>
                        </div>
                      </div>
                      
                      {canClaimReward ? (
                        <Button 
                          variant="primary" 
                          size="sm"
                          disabled={claimingMission === mission.id}
                          onClick={() => handleClaimReward(mission.id)}
                          className="claim-button"
                        >
                          {claimingMission === mission.id ? (
                            <>
                              <Spinner animation="border" size="sm" className="me-1" />
                              Đang nhận...
                            </>
                          ) : 'Nhận thưởng'}
                        </Button>
                      ) : userMission && userMission.rewarded ? (
                        <Badge bg="secondary" className="claimed-badge">Đã nhận</Badge>
                      ) : null}
                    </div>
                  </Card.Body>
                </Card>
              );
            })
          )}
        </div>
      </Container>
    </div>
  );
};

export default MobileMissionsPage; 