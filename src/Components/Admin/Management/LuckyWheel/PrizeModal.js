import React from 'react';
import { Modal, Form, Button, Row, Col } from 'react-bootstrap';

const PrizeModal = ({ 
  showModal, 
  setShowModal, 
  modalMode, 
  formData, 
  handleInputChange, 
  handleSubmit,
  setFormData
}) => {
  return (
    <Modal show={showModal} onHide={() => setShowModal(false)} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{modalMode === 'add' ? 'Thêm phần thưởng mới' : 'Chỉnh sửa phần thưởng'}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form onSubmit={handleSubmit}>
          <Form.Group className="mb-3">
            <Form.Label>Tên phần thưởng</Form.Label>
            <Form.Control 
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Ví dụ: 10 xu"
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Loại phần thưởng</Form.Label>
            <Form.Select
              name="type"
              value={formData.type}
              onChange={handleInputChange}
              required
            >
              <option value="coin">Xu</option>
              <option value="free_chapter">Chương miễn phí</option>
              <option value="discount_code">Mã giảm giá</option>
              <option value="bonus_spin">Lượt quay thêm</option>
            </Form.Select>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Giá trị</Form.Label>
            <Form.Control 
              type="number"
              name="value"
              value={formData.value}
              onChange={handleInputChange}
              min="0"
              required
            />
            <Form.Text className="text-muted">
              Số xu, số chương miễn phí, % giảm giá, hoặc số lượt quay thêm
            </Form.Text>
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control 
              as="textarea"
              rows={2}
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Mô tả chi tiết về phần thưởng"
            />
          </Form.Group>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tỉ lệ (%)</Form.Label>
                <Form.Control 
                  type="number"
                  name="probability"
                  value={formData.probability}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  step="0.1"
                  required
                />
                <Form.Text className="text-muted">
                  Tỉ lệ xuất hiện phần thưởng (0-100%)
                </Form.Text>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Trạng thái</Form.Label>
                <Form.Check
                  type="switch"
                  id="is-active-switch"
                  name="is_active"
                  label={formData.is_active ? "Đang hoạt động" : "Vô hiệu hóa"}
                  checked={formData.is_active}
                  onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex justify-content-end mt-4">
            <Button variant="secondary" className="me-2" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button variant="primary" type="submit">
              {modalMode === 'add' ? 'Thêm phần thưởng' : 'Cập nhật'}
            </Button>
          </div>
        </Form>
      </Modal.Body>
    </Modal>
  );
};

export default PrizeModal; 