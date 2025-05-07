import React, { useState } from 'react';
import { Table, Spinner, Badge, Button, Card, Pagination, Form, Row, Col, InputGroup, Modal, Dropdown } from 'react-bootstrap';
import { FaUser, FaGift, FaClock, FaSort, FaFilter, FaList, FaCalendarAlt, FaSearch, FaExclamationTriangle, FaEdit, FaCheckCircle, FaTimesCircle, FaCog } from 'react-icons/fa';
import { updateRewardStatus, getRewardStatusOptions, getRewardStatusInfo } from './api';

const SpinHistory = ({ 
  spinHistory, 
  historyLoading, 
  historyPage, 
  historyPerPage, 
  hasMoreHistory,
  totalItems,
  totalPages,
  handleLoadMoreHistory,
  handlePageChange,
  handlePerPageChange,
  handleFilterChange,
  filters = {},
  formatDate,
  onStatusUpdated = () => {} // Callback khi trạng thái được cập nhật
}) => {
  const [showFilters, setShowFilters] = useState(false);
  const [editingStatus, setEditingStatus] = useState(null);
  const [adminNote, setAdminNote] = useState('');
  const [submitLoading, setSubmitLoading] = useState(false);
  const statusOptions = getRewardStatusOptions();
  
  // Debug information
  console.log('Spin history data:', spinHistory);
  
  // Generate pagination items
  const renderPaginationItems = () => {
    let items = [];
    
    // If we have a lot of pages, let's limit how many we show
    const maxPagesShown = 5;
    let startPage = Math.max(1, historyPage - Math.floor(maxPagesShown / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesShown - 1);
    
    // Adjust if we're at the end
    if (endPage - startPage + 1 < maxPagesShown) {
      startPage = Math.max(1, endPage - maxPagesShown + 1);
    }
    
    // Add first page and ellipsis if needed
    if (startPage > 1) {
      items.push(
        <Pagination.Item key={1} onClick={() => handlePageChange(1)}>
          1
        </Pagination.Item>
      );
      if (startPage > 2) {
        items.push(<Pagination.Ellipsis key="ellipsis1" />);
      }
    }
    
    // Add page numbers
    for (let page = startPage; page <= endPage; page++) {
      items.push(
        <Pagination.Item 
          key={page} 
          active={page === historyPage}
          onClick={() => handlePageChange(page)}
        >
          {page}
        </Pagination.Item>
      );
    }
    
    // Add last page and ellipsis if needed
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        items.push(<Pagination.Ellipsis key="ellipsis2" />);
      }
      items.push(
        <Pagination.Item 
          key={totalPages} 
          onClick={() => handlePageChange(totalPages)}
        >
          {totalPages}
        </Pagination.Item>
      );
    }
    
    return items;
  };
  
  // Xử lý mở modal sửa trạng thái
  const handleEditStatus = (spin) => {
    setEditingStatus({
      id: spin.id,
      currentStatus: spin.status || 'pending',
      spinData: spin
    });
    setAdminNote(spin.admin_note || '');
  };
  
  // Xử lý cập nhật trạng thái
  const handleUpdateStatus = async (status) => {
    if (!editingStatus) return;
    
    setSubmitLoading(true);
    const { success, error, data, verifyData } = await updateRewardStatus(
      editingStatus.id, 
      status,
      adminNote
    );
    
    if (success) {
      console.log('Status update successful, now reloading data');
      console.log('Response data:', data);
      console.log('Verified data after update:', verifyData);
      
      // Đóng modal trước
      setEditingStatus(null);
      
      // Hiển thị thông báo thành công
      const statusInfo = getRewardStatusInfo(status);
      
      // Hiển thị hộp thoại với thông tin chi tiết
      const verifyInfo = verifyData 
        ? `\n\nĐã xác minh: ${verifyData.status || 'Không có trạng thái'}`
        : '';
        
      alert(`Đã cập nhật trạng thái thành công thành "${statusInfo.label}"${verifyInfo}`);
      
      // Gọi callback để tải lại dữ liệu với timeout ngắn
      setTimeout(() => {
        onStatusUpdated();
      }, 500);
    } else {
      console.error('Error updating status:', error);
      alert(`Lỗi khi cập nhật trạng thái: ${error}`);
    }
    setSubmitLoading(false);
  };

  // Render Badge trạng thái
  const renderStatusBadge = (status) => {
    const statusInfo = getRewardStatusInfo(status || 'pending');
    
    // Style cho các trạng thái
    let style = {};
    let bgColor = '';
    let icon = null;
    
    switch(statusInfo.value) {
      case 'pending':
        bgColor = '#FFC107'; // Màu vàng
        style = { color: '#000', fontWeight: 'bold' };
        icon = <FaClock size={12} className="me-1" />;
        break;
      case 'processing':
        bgColor = '#0DCAF0'; // Màu xanh dương nhạt
        style = { color: '#000', fontWeight: 'bold' };
        icon = <FaCog size={12} className="me-1" />;
        break;
      case 'completed':
        bgColor = '#198754'; // Màu xanh lá cây
        style = { color: '#fff', fontWeight: 'bold' };
        icon = <FaCheckCircle size={12} className="me-1" />;
        break;
      case 'cancelled':
        bgColor = '#DC3545'; // Màu đỏ
        style = { color: '#fff', fontWeight: 'bold' };
        icon = <FaTimesCircle size={12} className="me-1" />;
        break;
      default:
        bgColor = '#6C757D'; // Màu xám mặc định
        style = { color: '#fff', fontWeight: 'bold' };
        icon = <FaExclamationTriangle size={12} className="me-1" />;
    }
    
    return (
      <Badge 
        style={{
          ...style,
          backgroundColor: bgColor,
          padding: '0.35em 0.65em',
          borderRadius: '0.375rem',
          display: 'inline-block'
        }}
      >
        {icon}
        {statusInfo.label}
      </Badge>
    );
  };
  
  return (
    <>
      <Card className="shadow-sm">
        <Card.Header className="bg-white">
          <Row>
            <Col md={6}>
              <h5 className="mb-0 d-flex align-items-center">
                <FaList className="me-2" /> Lịch sử quay vòng quay
                <Button 
                  variant={showFilters ? "primary" : "outline-secondary"} 
                  size="sm" 
                  className="ms-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <FaFilter className="me-1" /> 
                  {showFilters ? "Ẩn bộ lọc" : "Hiện bộ lọc"}
                </Button>
              </h5>
            </Col>
            <Col md={6} className="d-flex justify-content-end align-items-center">
              <Badge bg="primary" className="me-2">
                Tổng số: {totalItems || 0} bản ghi
              </Badge>
              <Badge bg="info" className="me-3">
                Trang: {historyPage}/{totalPages || 1}
              </Badge>
              <Form.Group className="d-flex align-items-center mb-0">
                <Form.Label className="me-2 mb-0 text-nowrap">Hiển thị:</Form.Label>
                <Form.Select 
                  size="sm" 
                  style={{width: '80px'}}
                  value={historyPerPage}
                  onChange={(e) => handlePerPageChange(Number(e.target.value))}
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          
          {showFilters && (
            <Row className="mt-3">
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small">Từ ngày:</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaCalendarAlt />
                    </InputGroup.Text>
                    <Form.Control 
                      type="date" 
                      size="sm" 
                      value={filters.startDate || ''}
                      onChange={(e) => handleFilterChange('startDate', e.target.value || null)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small">Đến ngày:</Form.Label>
                  <InputGroup>
                    <InputGroup.Text>
                      <FaCalendarAlt />
                    </InputGroup.Text>
                    <Form.Control 
                      type="date" 
                      size="sm" 
                      value={filters.endDate || ''}
                      onChange={(e) => handleFilterChange('endDate', e.target.value || null)}
                    />
                  </InputGroup>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small">Loại phần thưởng:</Form.Label>
                  <Form.Select 
                    size="sm"
                    value={filters.prizeType || 'all'}
                    onChange={(e) => handleFilterChange('prizeType', e.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    <option value="coin">Xu</option>
                    <option value="free_chapter">Chương miễn phí</option>
                    <option value="discount_code">Mã giảm giá</option>
                    <option value="bonus_spin">Lượt quay thêm</option>
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={3}>
                <Form.Group>
                  <Form.Label className="small">Trạng thái phát thưởng:</Form.Label>
                  <Form.Select 
                    size="sm"
                    value={filters.status || 'all'}
                    onChange={(e) => handleFilterChange('status', e.target.value)}
                  >
                    <option value="all">Tất cả</option>
                    {statusOptions.map(option => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          )}
        </Card.Header>
        <Card.Body>
          <Table responsive striped bordered hover>
            <thead className="bg-light">
              <tr>
                <th width="5%">#</th>
                <th width="15%"><FaUser className="me-1" /> Người dùng</th>
                <th width="15%"><FaGift className="me-1" /> Phần thưởng</th>
                <th width="10%">Loại</th>
                <th width="10%">Giá trị</th> 
                <th width="10%">Trạng thái</th>
                <th width="15%"><FaClock className="me-1" /> Thời gian</th>
                <th width="10%">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {historyLoading && historyPage === 1 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    <Spinner animation="border" variant="primary" />
                    <p className="mt-2">Đang tải dữ liệu...</p>
                  </td>
                </tr>
              ) : spinHistory.length === 0 ? (
                <tr>
                  <td colSpan="8" className="text-center py-4">
                    Chưa có lịch sử quay nào.
                  </td>
                </tr>
              ) : (
                spinHistory.map((spin, index) => (
                  <React.Fragment key={spin.id}>
                    <tr>
                      <td>{(historyPage - 1) * historyPerPage + index + 1}</td>
                      <td>
                        <div className="d-flex align-items-center">
                          <div className="d-flex justify-content-center align-items-center me-2" 
                              style={{width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e9f5fe'}}>
                            <FaUser className="text-primary" size={12} />
                          </div>
                          <div className="d-flex flex-column">
                            {spin.users ? (
                              <>
                                <span>{spin.users.display_name || 'Không có tên'}</span>
                                <small className="text-muted">{spin.users.email || 'Không rõ email'}</small>
                              </>
                            ) : (
                              <>
                                <Badge bg="warning" text="dark">
                                  <FaExclamationTriangle className="me-1" /> Không tìm thấy thông tin
                                </Badge>
                                <small className="text-muted">User ID: {spin.user_id}</small>
                              </>
                            )}
                          </div>
                        </div>
                      </td>
                      <td>
                        {spin.rewards ? (
                          <strong>{spin.rewards.name || 'Không xác định'}</strong>
                        ) : (
                          <Badge bg="warning" text="dark">
                            <FaExclamationTriangle className="me-1" /> Không tìm thấy phần thưởng
                          </Badge>
                        )}
                      </td>
                      <td>
                        {spin.rewards?.type === 'coin' && (
                          <Badge bg="primary">Xu</Badge>
                        )}
                        {spin.rewards?.type === 'free_chapter' && (
                          <Badge bg="success">Chương miễn phí</Badge>
                        )}
                        {spin.rewards?.type === 'discount_code' && (
                          <Badge bg="info">Mã giảm giá</Badge>
                        )}
                        {spin.rewards?.type === 'bonus_spin' && (
                          <Badge bg="warning">Lượt quay thêm</Badge>
                        )}
                        {!spin.rewards?.type && (
                          <Badge bg="secondary">Không xác định</Badge>
                        )}
                      </td>
                      <td className="text-center">
                        {spin.rewards?.value || '0'}
                      </td>
                      <td>
                        {renderStatusBadge(spin.status)}
                        {spin.admin_note && (
                          <span className="d-block small text-muted" style={{whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '120px'}}>
                            {spin.admin_note}
                          </span>
                        )}
                      </td>
                      <td>
                        {formatDate(spin.created_at)}
                      </td>
                      <td>
                        <Button 
                          variant="outline-primary" 
                          size="sm"
                          onClick={() => handleEditStatus(spin)}
                        >
                          <FaEdit className="me-1" /> Cập nhật
                        </Button>
                      </td>
                    </tr>
                  </React.Fragment>
                ))
              )}
            </tbody>
          </Table>
          
          {historyLoading && historyPage > 1 && (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
              <p>Đang tải thêm dữ liệu...</p>
            </div>
          )}
          
          {!historyLoading && hasMoreHistory && (
            <div className="text-center mt-3">
              <Button 
                variant="outline-primary" 
                onClick={handleLoadMoreHistory}
              >
                Tải thêm
              </Button>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="d-flex justify-content-center mt-4">
              <Pagination>
                <Pagination.First 
                  onClick={() => handlePageChange(1)} 
                  disabled={historyPage === 1 || historyLoading}
                />
                <Pagination.Prev 
                  onClick={() => handlePageChange(historyPage - 1)} 
                  disabled={historyPage === 1 || historyLoading}
                />
                {renderPaginationItems()}
                <Pagination.Next 
                  onClick={() => handlePageChange(historyPage + 1)} 
                  disabled={historyPage === totalPages || historyLoading}
                />
                <Pagination.Last 
                  onClick={() => handlePageChange(totalPages)} 
                  disabled={historyPage === totalPages || historyLoading}
                />
              </Pagination>
            </div>
          )}
        </Card.Body>
      </Card>
      
      {/* Modal cập nhật trạng thái */}
      <Modal show={!!editingStatus} onHide={() => setEditingStatus(null)}>
        <Modal.Header closeButton>
          <Modal.Title>Cập nhật trạng thái phát thưởng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingStatus && (
            <>
              <div className="mb-3 p-3 border rounded bg-light">
                <h6>Thông tin phần thưởng:</h6>
                <div><strong>Người nhận:</strong> {editingStatus.spinData.users?.display_name || editingStatus.spinData.user_id}</div>
                <div><strong>Phần thưởng:</strong> {editingStatus.spinData.rewards?.name || 'Không xác định'}</div>
                <div><strong>Loại:</strong> {editingStatus.spinData.rewards?.type === 'coin' ? 'Xu' : 
                  editingStatus.spinData.rewards?.type === 'free_chapter' ? 'Chương miễn phí' : 
                  editingStatus.spinData.rewards?.type === 'discount_code' ? 'Mã giảm giá' : 
                  editingStatus.spinData.rewards?.type === 'bonus_spin' ? 'Lượt quay thêm' : 'Không xác định'}</div>
                <div><strong>Giá trị:</strong> {editingStatus.spinData.rewards?.value || '0'}</div>
                <div><strong>Thời gian:</strong> {formatDate(editingStatus.spinData.created_at)}</div>
                <div><strong>Trạng thái hiện tại:</strong> {renderStatusBadge(editingStatus.currentStatus)}</div>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Ghi chú admin:</Form.Label>
                <Form.Control 
                  as="textarea" 
                  rows={3} 
                  placeholder="Nhập ghi chú về việc xử lý phần thưởng (không bắt buộc)"
                  value={adminNote}
                  onChange={(e) => setAdminNote(e.target.value)}
                />
              </Form.Group>
              
              <div className="mt-4 d-flex flex-wrap gap-2">
                <strong className="w-100 mb-2">Cập nhật trạng thái:</strong>
                {statusOptions.map(option => (
                  <Button
                    key={option.value}
                    variant={option.color}
                    className="me-2 mb-2"
                    onClick={() => handleUpdateStatus(option.value)}
                    disabled={submitLoading}
                  >
                    {option.value === 'pending' && <FaClock className="me-1" />}
                    {option.value === 'processing' && <FaCog className="me-1" />}
                    {option.value === 'completed' && <FaCheckCircle className="me-1" />}
                    {option.value === 'cancelled' && <FaTimesCircle className="me-1" />}
                    {option.label}
                  </Button>
                ))}
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setEditingStatus(null)} disabled={submitLoading}>
            Hủy
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default SpinHistory; 