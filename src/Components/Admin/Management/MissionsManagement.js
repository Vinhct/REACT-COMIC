import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, Modal, Row, Col, Spinner, Alert, Badge } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaRedo, FaSyncAlt } from 'react-icons/fa';
import { withAdminAuth } from '../AdminContext';
import { supabase } from '../../../supabaseClient';
import AdminLayout from '../AdminLayout';

const MissionsManagement = () => {
  const [missions, setMissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [resetConfirmModal, setResetConfirmModal] = useState(false);
  const [resetting, setResetting] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    id: null,
    type: 'read_chap',
    title: '',
    description: '',
    target_value: 5,
    reward_amount: 1,
    is_repeatable: true
  });

  // State for mission stats
  const [stats, setStats] = useState({
    totalMissions: 0,
    completedToday: 0,
    rewardsGiven: 0,
    loading: true
  });

  useEffect(() => {
    fetchMissions();
    fetchMissionStats();
  }, []);

  // Fetch missions from database
  const fetchMissions = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('missions')
        .select('*')
        .order('type', { ascending: true })
        .order('target_value', { ascending: true });
      
      if (error) throw error;
      
      setMissions(data || []);
    } catch (err) {
      console.error('Error fetching missions:', err.message);
      setError(`Lỗi khi tải danh sách nhiệm vụ: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch mission stats
  const fetchMissionStats = async () => {
    try {
      setStats(prev => ({ ...prev, loading: true }));
      
      // Count total missions
      const { count: totalMissions, error: countError } = await supabase
        .from('missions')
        .select('*', { count: 'exact', head: true });
        
      if (countError) throw countError;
      
      // Missions completed today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count: completedToday, error: completedError } = await supabase
        .from('user_missions')
        .select('*', { count: 'exact', head: true })
        .eq('completed', true)
        .gte('completed_at', today.toISOString());
        
      if (completedError) throw completedError;
      
      // Count rewards given
      const { count: rewardsGiven, error: rewardsError } = await supabase
        .from('user_missions')
        .select('*', { count: 'exact', head: true })
        .eq('rewarded', true);
        
      if (rewardsError) throw rewardsError;
      
      setStats({
        totalMissions,
        completedToday,
        rewardsGiven,
        loading: false
      });
      
    } catch (err) {
      console.error('Error fetching mission stats:', err.message);
      setStats(prev => ({ 
        ...prev, 
        loading: false,
        error: `Lỗi khi tải thống kê: ${err.message}`
      }));
    }
  };

  // Reset all missions manually
  const handleResetAllMissions = async () => {
    try {
      setResetting(true);
      
      const { error } = await supabase.rpc('reset_daily_missions');
      
      if (error) throw error;
      
      setSuccessMessage('Đã làm mới toàn bộ nhiệm vụ thành công!');
      setResetConfirmModal(false);
      
      // Update stats and missions list
      fetchMissions();
      fetchMissionStats();
      
    } catch (err) {
      console.error('Error resetting missions:', err.message);
      setError(`Lỗi khi làm mới nhiệm vụ: ${err.message}`);
    } finally {
      setResetting(false);
    }
  };

  // Modal functions
  const openAddModal = () => {
    setFormData({
      id: null,
      type: 'read_chap',
      title: '',
      description: '',
      target_value: 5,
      reward_amount: 1,
      is_repeatable: true
    });
    setModalMode('add');
    setShowModal(true);
  };

  const openEditModal = (mission) => {
    setFormData({
      id: mission.id,
      type: mission.type,
      title: mission.title,
      description: mission.description || '',
      target_value: mission.target_value,
      reward_amount: mission.reward_amount,
      is_repeatable: mission.is_repeatable
    });
    setModalMode('edit');
    setShowModal(true);
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Validate form
      if (!formData.title.trim() || formData.target_value <= 0 || formData.reward_amount <= 0) {
        setError('Vui lòng điền đầy đủ thông tin hợp lệ!');
        return;
      }
      
      const payload = {
        type: formData.type,
        title: formData.title.trim(),
        description: formData.description.trim(),
        target_value: parseInt(formData.target_value),
        reward_amount: parseInt(formData.reward_amount),
        is_repeatable: formData.is_repeatable
      };
      
      let result;
      
      if (modalMode === 'add') {
        // Insert new mission
        result = await supabase.from('missions').insert(payload);
      } else {
        // Update existing mission
        result = await supabase
          .from('missions')
          .update(payload)
          .eq('id', formData.id);
      }
      
      if (result.error) throw result.error;
      
      // Show success message
      setSuccessMessage(
        modalMode === 'add' 
          ? 'Thêm nhiệm vụ mới thành công!' 
          : 'Cập nhật nhiệm vụ thành công!'
      );
      
      // Close modal and refresh data
      setShowModal(false);
      fetchMissions();
      fetchMissionStats();
      
    } catch (err) {
      console.error('Error saving mission:', err.message);
      setError(`Lỗi khi lưu nhiệm vụ: ${err.message}`);
    }
  };

  const handleDeleteMission = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa nhiệm vụ này?')) {
      return;
    }
    
    try {
      const { error } = await supabase
        .from('missions')
        .delete()
        .eq('id', id);
        
      if (error) throw error;
      
      setSuccessMessage('Xóa nhiệm vụ thành công!');
      fetchMissions();
      fetchMissionStats();
      
    } catch (err) {
      console.error('Error deleting mission:', err.message);
      setError(`Lỗi khi xóa nhiệm vụ: ${err.message}`);
    }
  };

  // Helper function to display mission type
  const getMissionTypeLabel = (type) => {
    switch (type) {
      case 'read_chap':
        return <Badge bg="primary">Đọc chương</Badge>;
      case 'read_time':
        return <Badge bg="info">Đọc theo thời gian</Badge>;
      default:
        return <Badge bg="secondary">{type}</Badge>;
    }
  };

  return (
    <AdminLayout title="Quản lý Nhiệm vụ">
      <Container fluid className="p-4">
        <Card className="mb-4 border-0 shadow-sm">
          <Card.Header className="bg-primary text-white">
            <h4 className="mb-0">Quản lý Nhiệm vụ</h4>
          </Card.Header>
          <Card.Body>
            {error && (
              <Alert variant="danger" onClose={() => setError(null)} dismissible>
                {error}
              </Alert>
            )}
            
            {successMessage && (
              <Alert variant="success" onClose={() => setSuccessMessage('')} dismissible>
                {successMessage}
              </Alert>
            )}
            
            <Row className="mb-4">
              <Col md={3}>
                <Card className="border-0 bg-light">
                  <Card.Body className="text-center">
                    <h3>{stats.loading ? <Spinner size="sm" animation="border" /> : stats.totalMissions}</h3>
                    <div className="text-muted">Tổng số nhiệm vụ</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 bg-light">
                  <Card.Body className="text-center">
                    <h3>{stats.loading ? <Spinner size="sm" animation="border" /> : stats.completedToday}</h3>
                    <div className="text-muted">Nhiệm vụ hoàn thành hôm nay</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 bg-light">
                  <Card.Body className="text-center">
                    <h3>{stats.loading ? <Spinner size="sm" animation="border" /> : stats.rewardsGiven}</h3>
                    <div className="text-muted">Phần thưởng đã phát</div>
                  </Card.Body>
                </Card>
              </Col>
              <Col md={3}>
                <Card className="border-0 bg-light">
                  <Card.Body className="d-flex justify-content-center align-items-center">
                    <Button 
                      variant="danger" 
                      className="me-2"
                      onClick={() => setResetConfirmModal(true)}
                    >
                      <FaRedo className="me-1" /> Reset Nhiệm vụ
                    </Button>
                    <Button 
                      variant="success" 
                      onClick={openAddModal}
                    >
                      <FaPlus className="me-1" /> Thêm mới
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            </Row>
            
            <Table responsive striped bordered hover>
              <thead className="bg-light">
                <tr>
                  <th>#</th>
                  <th>Loại</th>
                  <th>Tên nhiệm vụ</th>
                  <th>Mô tả</th>
                  <th>Mục tiêu</th>
                  <th>Phần thưởng</th>
                  <th>Lặp lại</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      <Spinner animation="border" variant="primary" />
                      <p className="mt-2">Đang tải dữ liệu...</p>
                    </td>
                  </tr>
                ) : missions.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="text-center py-4">
                      Chưa có nhiệm vụ nào. Hãy thêm nhiệm vụ mới!
                    </td>
                  </tr>
                ) : (
                  missions.map((mission, index) => (
                    <tr key={mission.id}>
                      <td>{index + 1}</td>
                      <td>{getMissionTypeLabel(mission.type)}</td>
                      <td>{mission.title}</td>
                      <td>
                        {mission.description ? (
                          mission.description.length > 50 
                            ? `${mission.description.substring(0, 50)}...` 
                            : mission.description
                        ) : 'N/A'}
                      </td>
                      <td>
                        {mission.target_value} {mission.type === 'read_chap' ? 'chương' : 'phút'}
                      </td>
                      <td>
                        <Badge bg="success">
                          {mission.reward_amount} lượt quay
                        </Badge>
                      </td>
                      <td>
                        {mission.is_repeatable ? (
                          <Badge bg="info">Hàng ngày</Badge>
                        ) : (
                          <Badge bg="secondary">Một lần</Badge>
                        )}
                      </td>
                      <td>
                        <Button 
                          variant="warning" 
                          size="sm" 
                          className="me-1"
                          onClick={() => openEditModal(mission)}
                        >
                          <FaEdit />
                        </Button>
                        <Button 
                          variant="danger" 
                          size="sm"
                          onClick={() => handleDeleteMission(mission.id)}
                        >
                          <FaTrash />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Container>

      {/* Add/Edit Mission Modal */}
      <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>{modalMode === 'add' ? 'Thêm Nhiệm vụ mới' : 'Chỉnh sửa Nhiệm vụ'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>Loại nhiệm vụ</Form.Label>
              <Form.Select 
                name="type"
                value={formData.type}
                onChange={handleInputChange}
                required
              >
                <option value="read_chap">Đọc chương</option>
                <option value="read_time">Đọc theo thời gian</option>
              </Form.Select>
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Tên nhiệm vụ</Form.Label>
              <Form.Control 
                type="text"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Ví dụ: Đọc 5 chương"
                required
              />
            </Form.Group>

            <Form.Group className="mb-3">
              <Form.Label>Mô tả</Form.Label>
              <Form.Control 
                as="textarea"
                rows={3}
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Mô tả chi tiết về nhiệm vụ"
              />
            </Form.Group>

            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>
                    Mục tiêu {formData.type === 'read_chap' ? '(chương)' : '(phút)'}
                  </Form.Label>
                  <Form.Control 
                    type="number"
                    name="target_value"
                    value={formData.target_value}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Số lượt quay thưởng</Form.Label>
                  <Form.Control 
                    type="number"
                    name="reward_amount"
                    value={formData.reward_amount}
                    onChange={handleInputChange}
                    min="1"
                    required
                  />
                </Form.Group>
              </Col>
            </Row>

            <Form.Group className="mb-3">
              <Form.Check 
                type="checkbox"
                label="Làm mới hàng ngày"
                name="is_repeatable"
                checked={formData.is_repeatable}
                onChange={handleInputChange}
              />
              <Form.Text className="text-muted">
                Nếu được chọn, nhiệm vụ sẽ được làm mới vào 12h đêm mỗi ngày
              </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end mt-4">
              <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
                Hủy
              </Button>
              <Button variant="primary" type="submit">
                {modalMode === 'add' ? 'Thêm nhiệm vụ' : 'Cập nhật'}
              </Button>
            </div>
          </Form>
        </Modal.Body>
      </Modal>

      {/* Reset Confirmation Modal */}
      <Modal show={resetConfirmModal} onHide={() => setResetConfirmModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Xác nhận làm mới nhiệm vụ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Bạn có chắc chắn muốn làm mới tất cả nhiệm vụ? Hành động này sẽ:</p>
          <ul>
            <li>Reset tiến độ của tất cả nhiệm vụ về 0</li>
            <li>Đánh dấu tất cả nhiệm vụ là chưa hoàn thành</li>
            <li>Cho phép người dùng làm lại tất cả nhiệm vụ</li>
          </ul>
          <p className="text-danger fw-bold">Lưu ý: Thông thường, nhiệm vụ sẽ tự động làm mới vào 12h đêm hàng ngày.</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setResetConfirmModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="danger" 
            onClick={handleResetAllMissions}
            disabled={resetting}
          >
            {resetting ? (
              <>
                <Spinner animation="border" size="sm" className="me-1" />
                Đang làm mới...
              </>
            ) : (
              'Xác nhận làm mới'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default withAdminAuth(MissionsManagement); 