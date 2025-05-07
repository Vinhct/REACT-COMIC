import React from 'react';
import { Card, Row, Col, Spinner, Badge } from 'react-bootstrap';
import { FaInfoCircle, FaUser } from 'react-icons/fa';

const UserStats = ({ userStatistics }) => {
  if (!userStatistics) return null;
  
  return (
    <Row className="mb-4">
      <Col md={12}>
        <Card className="border-0 bg-light">
          <Card.Body>
            <h6 className="mb-3">
              <FaInfoCircle className="me-2" /> 
              Thống kê người dùng: 
              {userStatistics.loading ? (
                <Spinner size="sm" animation="border" className="ms-2" />
              ) : (
                <Badge bg="primary" className="ms-2">
                  <FaUser className="me-1" />
                  {userStatistics.userProfile?.display_name || 'Không xác định'}
                </Badge>
              )}
            </h6>
            <Row>
              <Col md={4}>
                <div className="d-flex align-items-center justify-content-center flex-column">
                  <div className="h4 mb-0">
                    {userStatistics.loading ? <Spinner size="sm" animation="border" /> : userStatistics.totalSpins}
                  </div>
                  <div className="text-muted">Tổng số lượt quay</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="d-flex align-items-center justify-content-center flex-column">
                  <div className="h4 mb-0">
                    {userStatistics.loading ? <Spinner size="sm" animation="border" /> : userStatistics.prizesClaimed}
                  </div>
                  <div className="text-muted">Phần thưởng đã nhận</div>
                </div>
              </Col>
              <Col md={4}>
                <div className="d-flex align-items-center justify-content-center flex-column">
                  <div className="h4 mb-0">
                    {userStatistics.loading ? <Spinner size="sm" animation="border" /> : 
                      userStatistics.mostWonPrize ? userStatistics.mostWonPrize.rewards?.name : 'Chưa có'
                    }
                  </div>
                  <div className="text-muted">Giải thưởng trúng nhiều nhất</div>
                </div>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

export default UserStats; 