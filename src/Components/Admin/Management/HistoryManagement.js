import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, InputGroup, Spinner, Alert, Badge, Row, Col, Modal } from 'react-bootstrap';
import { FaSearch, FaTrash, FaFilter, FaChartBar, FaClock } from 'react-icons/fa';
import { withAdminAuth } from '../AdminContext';
import { supabase } from '../../../supabaseClient';
import AdminLayout from '../AdminLayout';

const HistoryManagement = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  // Fetch history on component mount
  useEffect(() => {
    fetchHistory();
    fetchUsers();
  }, []);

  // Fetch users for filter
  const fetchUsers = async () => {
    try {
      // Lấy danh sách từ user_profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from('user_profiles')
        .select('id, display_name')
        .order('display_name');

      if (profilesError) throw profilesError;
      
      // Lấy danh sách từ admin_users
      const { data: adminUsersData, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id, display_name');
        
      if (adminError) {
        console.error('Error fetching admin users:', adminError);
      }

      // Tạo map từ user_profiles
      const userMap = {};
      if (profilesData) {
        profilesData.forEach(user => {
          userMap[user.id] = {
            id: user.id,
            display_name: user.display_name || `User ${user.id.substring(0, 8)}...`,
            isAdmin: false
          };
        });
      }
      
      // Bổ sung/cập nhật từ admin_users
      if (adminUsersData) {
        adminUsersData.forEach(admin => {
          userMap[admin.user_id] = {
            id: admin.user_id,
            display_name: `👑 ${admin.display_name || 'Admin'}`,
            isAdmin: true
          };
        });
      }
      
      // Chuyển map thành array
      const mergedUsers = Object.values(userMap);
      console.log('Merged users for dropdown:', mergedUsers);
      
      setUsers(mergedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setUsers([]);
    }
  };

  // Fetch all reading history with user and comic info
  const fetchHistory = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy toàn bộ lịch sử đọc
      const { data: historyData, error: historyError } = await supabase
        .from('reading_history')
        .select('id, last_read, chapter, chapter_name, user_id, slug')
        .order('last_read', { ascending: false });

      if (historyError) {
        console.error('Error fetching reading history:', historyError);
        throw historyError;
      }

      console.log('Raw history data:', historyData, 'Total:', historyData?.length || 0);

      // Nếu không có dữ liệu, return
      if (!historyData || historyData.length === 0) {
        setHistory([]);
        setLoading(false);
        return;
      }

      // Lấy thông tin comics
      const slugs = [...new Set(historyData.map(item => item.slug))];
      const { data: comicsData, error: comicsError } = await supabase
        .from('comics')
        .select('slug, name, author, status, thumbnail')
        .in('slug', slugs);

      if (comicsError) throw comicsError;

      // Tạo map để truy xuất nhanh comic
      const comicMap = {};
      comicsData.forEach(comic => {
        comicMap[comic.slug] = comic;
      });

      // Nếu chưa load users, chờ một lúc
      if (users.length === 0) {
        await fetchUsers();
      }

      // Transform data to flatten structure
      const transformedData = historyData.map(item => {
        const userInfo = users.find(user => user.id === item.user_id) || { id: item.user_id, display_name: `User ${item.user_id.substring(0, 8)}...`, isAdmin: false };
        const comic = comicMap[item.slug] || {};

        return {
          id: item.id,
          last_read: item.last_read,
          chapter: item.chapter,
          chapter_name: item.chapter_name,
          user_id: item.user_id,
          user_display_name: userInfo.display_name,
          is_admin: userInfo.isAdmin,
          comic_slug: item.slug,
          comic_name: comic.name || 'Không có tên',
          comic_author: comic.author || 'Không có',
          comic_status: comic.status || 'Đang tiến hành',
          comic_thumbnail: comic.thumbnail || ''
        };
      });

      console.log('Transformed history data:', transformedData.length);
      setHistory(transformedData);
    } catch (error) {
      console.error('Error fetching reading history:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu lịch sử đọc');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle user filter change
  const handleUserFilterChange = (e) => {
    setSelectedUser(e.target.value);
  };

  // Handle delete history entry
  const handleDeleteHistory = async (historyId) => {
    try {
      setLoading(true);

      // Delete from Supabase
      const { error } = await supabase
        .from('reading_history')
        .delete()
        .eq('id', historyId);

      if (error) throw error;

      // Update state
      setHistory(history.filter(item => item.id !== historyId));
      setSuccessMessage('Đã xóa khỏi lịch sử đọc!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error deleting history:', error);
      setError(error.message || 'Có lỗi xảy ra khi xóa khỏi lịch sử');
    } finally {
      setLoading(false);
    }
  };

  // Filter history based on search term and selected user
  const filteredHistory = history.filter(item => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (item.comic_name && item.comic_name.toLowerCase().includes(searchTermLower)) ||
      (item.user_display_name && item.user_display_name.toLowerCase().includes(searchTermLower)) ||
      (item.chapter_name && item.chapter_name.toLowerCase().includes(searchTermLower));
    
    const matchesUser = selectedUser ? item.user_id === selectedUser : true;
    
    return matchesSearch && matchesUser;
  });

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <AdminLayout title="Quản lý Lịch sử đọc">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Quản lý Lịch sử đọc</h2>
          <Button variant="primary" onClick={() => setShowStatsModal(true)}>
            <FaChartBar className="me-2" />
            Xem thống kê
          </Button>
        </div>

        {successMessage && (
          <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card className="mb-4">
          <Card.Body>
            <Row className="mb-3">
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Tìm kiếm truyện, người dùng hoặc chương..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </InputGroup>
              </Col>
              <Col md={6}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaFilter />
                  </InputGroup.Text>
                  <Form.Select
                    value={selectedUser}
                    onChange={handleUserFilterChange}
                  >
                    <option value="">Tất cả người dùng</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>
                        {user.display_name || user.id}
                      </option>
                    ))}
                  </Form.Select>
                </InputGroup>
              </Col>
            </Row>

            {loading && !history.length ? (
              <div className="text-center my-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th>Người dùng</th>
                      <th>Truyện</th>
                      <th>Chương</th>
                      <th>Thời gian đọc</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.length > 0 ? (
                      filteredHistory.map((item) => (
                        <tr key={item.id}>
                          <td>
                            <div className="d-flex flex-column">
                              <span>{item.user_display_name || 'Không có tên'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src={item.comic_thumbnail || 'https://placehold.co/40x60?text=No+Image'}
                                alt={item.comic_name}
                                width="40"
                                height="60"
                                style={{ objectFit: 'cover', marginRight: '10px' }}
                              />
                              <span>{item.comic_name}</span>
                            </div>
                          </td>
                          <td>
                            {item.chapter_name || item.chapter || 'Không xác định'}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <FaClock className="me-2 text-secondary" />
                              {formatDate(item.last_read)}
                            </div>
                          </td>
                          <td>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteHistory(item.id)}
                              disabled={loading}
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">
                          Không tìm thấy dữ liệu nào
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* Stats Modal */}
      <Modal
        show={showStatsModal}
        onHide={() => setShowStatsModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Thống kê lịch sử đọc</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mt-4">
            <h5>Tổng số lượt đọc: {history.length}</h5>
            <p>Số người dùng đã đọc: {new Set(history.map(item => item.user_id)).size}</p>
            <p>Số truyện đã được đọc: {new Set(history.map(item => item.comic_slug)).size}</p>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatsModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default withAdminAuth(HistoryManagement); 