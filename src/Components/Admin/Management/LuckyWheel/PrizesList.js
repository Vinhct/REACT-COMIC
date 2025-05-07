import React from 'react';
import { Table, Button, Spinner, Badge } from 'react-bootstrap';
import { FaEdit, FaTrash } from 'react-icons/fa';

const PrizesList = ({ 
  prizes, 
  loading, 
  openEditModal, 
  handleDeletePrize 
}) => {
  return (
    <Table responsive striped bordered hover>
      <thead className="bg-light">
        <tr>
          <th width="5%">#</th>
          <th width="15%">Tên phần thưởng</th>
          <th width="15%">Loại</th>
          <th width="10%">Giá trị</th>
          <th width="15%">Mô tả</th>
          <th width="10%">Tỉ lệ (%)</th>
          <th width="10%">Trạng thái</th>
          <th width="10%">Thao tác</th>
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
        ) : prizes.length === 0 ? (
          <tr>
            <td colSpan="8" className="text-center py-4">
              Chưa có phần thưởng nào. Hãy thêm phần thưởng mới!
            </td>
          </tr>
        ) : (
          prizes.map((prize, index) => (
            <tr key={prize.id}>
              <td>{index + 1}</td>
              <td>{prize.name}</td>
              <td>
                <Badge bg="info">
                  {prize.type === 'coin' && 'Xu'}
                  {prize.type === 'free_chapter' && 'Chương miễn phí'}
                  {prize.type === 'discount_code' && 'Mã giảm giá'}
                  {prize.type === 'bonus_spin' && 'Lượt quay thêm'}
                  {!['coin', 'free_chapter', 'discount_code', 'bonus_spin'].includes(prize.type) && prize.type}
                </Badge>
              </td>
              <td>{prize.value}</td>
              <td>
                {prize.description ? (
                  prize.description.length > 50 
                    ? `${prize.description.substring(0, 50)}...` 
                    : prize.description
                ) : 'N/A'}
              </td>
              <td>
                <Badge bg={prize.probability > 10 ? "success" : "warning"}>
                  {prize.probability}%
                </Badge>
              </td>
              <td>
                <Badge bg={prize.is_active ? "success" : "secondary"}>
                  {prize.is_active ? "Đang hoạt động" : "Đã vô hiệu"}
                </Badge>
              </td>
              <td>
                <Button 
                  variant="warning" 
                  size="sm" 
                  className="me-1"
                  onClick={() => openEditModal(prize)}
                >
                  <FaEdit />
                </Button>
                <Button 
                  variant="danger" 
                  size="sm"
                  onClick={() => handleDeletePrize(prize.id)}
                >
                  <FaTrash />
                </Button>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
};

export default PrizesList; 