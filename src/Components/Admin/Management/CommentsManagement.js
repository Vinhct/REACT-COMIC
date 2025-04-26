import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, InputGroup, Spinner, Alert, Badge, Row, Col, Modal } from 'react-bootstrap';
import { FaSearch, FaTrash, FaEdit, FaEye, FaFilter, FaChartBar, FaStar } from 'react-icons/fa';
import { withAdminAuth } from '../AdminContext';
import { supabase } from '../../../supabaseClient';
import AdminLayout from '../AdminLayout';

const CommentsManagement = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedRating, setSelectedRating] = useState('');
  const [users, setUsers] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [currentComment, setCurrentComment] = useState(null);
  const [ratingCounts, setRatingCounts] = useState([0, 0, 0, 0, 0]); // For 1 to 5 stars
  
  // Fetch comments on component mount
  useEffect(() => {
    fetchComments();
    fetchUsers();
    fetchRatingStats();
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

  // Fetch all comments with user and comic info
  const fetchComments = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy danh sách comments
      const { data: commentsData, error: commentsError } = await supabase
        .from('comments')
        .select('id, comment, rating, created_at, user_id, slug')
        .order('created_at', { ascending: false });

      if (commentsError) {
        console.error('Error fetching comments:', commentsError);
        throw commentsError;
      }

      console.log('Raw comments data:', commentsData, 'Total:', commentsData?.length || 0);

      // Nếu không có dữ liệu, return
      if (!commentsData || commentsData.length === 0) {
        setComments([]);
        setLoading(false);
        return;
      }

      // Lấy thông tin comics
      const slugs = [...new Set(commentsData.map(item => item.slug))];
      const { data: comicsData, error: comicsError } = await supabase
        .from('comics')
        .select('slug, name, thumbnail')
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
      const transformedData = commentsData.map(item => {
        const userInfo = users.find(user => user.id === item.user_id) || { id: item.user_id, display_name: `User ${item.user_id.substring(0, 8)}...`, isAdmin: false };
        const comic = comicMap[item.slug] || { name: 'Không rõ truyện', thumbnail: '' };

        return {
          id: item.id,
          comment: item.comment || '',
          rating: item.rating || 0,
          created_at: item.created_at,
          user_id: item.user_id,
          user_display_name: userInfo.display_name,
          is_admin: userInfo.isAdmin,
          comic_slug: item.slug,
          comic_name: comic.name || 'Không rõ truyện',
          comic_thumbnail: comic.thumbnail || ''
        };
      });

      console.log('Transformed comments data:', transformedData.length);
      setComments(transformedData);
    } catch (error) {
      console.error('Error fetching comments:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu bình luận');
    } finally {
      setLoading(false);
    }
  };

  // Fetch rating statistics
  const fetchRatingStats = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('rating');

      if (error) throw error;

      // Count ratings
      const counts = [0, 0, 0, 0, 0]; // Index 0-4 corresponds to rating 1-5
      data.forEach(item => {
        if (item.rating >= 1 && item.rating <= 5) {
          counts[item.rating - 1]++;
        }
      });

      setRatingCounts(counts);
    } catch (error) {
      console.error('Error fetching rating stats:', error);
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

  // Handle rating filter change
  const handleRatingFilterChange = (e) => {
    setSelectedRating(e.target.value);
  };

  // Handle delete comment
  const handleDeleteComment = async (commentId) => {
    try {
      setLoading(true);

      // Delete from Supabase
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      // Update state
      setComments(comments.filter(comment => comment.id !== commentId));
      setSuccessMessage('Đã xóa bình luận thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError(error.message || 'Có lỗi xảy ra khi xóa bình luận');
    } finally {
      setLoading(false);
    }
  };

  // View comment details
  const handleViewComment = (comment) => {
    setCurrentComment(comment);
    setShowViewModal(true);
  };

  // Filter comments based on search term, selected user and rating
  const filteredComments = comments.filter(comment => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (comment.comment && comment.comment.toLowerCase().includes(searchTermLower)) || 
      (comment.user_display_name && comment.user_display_name.toLowerCase().includes(searchTermLower)) ||
      (comment.comic_name && comment.comic_name.toLowerCase().includes(searchTermLower));
    
    const matchesUser = selectedUser ? comment.user_id === selectedUser : true;
    const matchesRating = selectedRating ? comment.rating === parseInt(selectedRating) : true;
    
    return matchesSearch && matchesUser && matchesRating;
  });

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FaStar 
          key={i} 
          className={i <= rating ? 'text-warning' : 'text-secondary'} 
          style={{ marginRight: '2px' }}
        />
      );
    }
    return stars;
  };

  return (
    <AdminLayout title="Quản lý Bình luận">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Quản lý Bình luận</h2>
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
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaSearch />
                  </InputGroup.Text>
                  <Form.Control
                    placeholder="Tìm kiếm bình luận..."
                    value={searchTerm}
                    onChange={handleSearchChange}
                  />
                </InputGroup>
              </Col>
              <Col md={4}>
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
              <Col md={4}>
                <InputGroup>
                  <InputGroup.Text>
                    <FaStar />
                  </InputGroup.Text>
                  <Form.Select
                    value={selectedRating}
                    onChange={handleRatingFilterChange}
                  >
                    <option value="">Tất cả đánh giá</option>
                    <option value="1">1 sao</option>
                    <option value="2">2 sao</option>
                    <option value="3">3 sao</option>
                    <option value="4">4 sao</option>
                    <option value="5">5 sao</option>
                  </Form.Select>
                </InputGroup>
              </Col>
            </Row>

            {loading && !comments.length ? (
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
                      <th>Đánh giá</th>
                      <th>Bình luận</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComments.length > 0 ? (
                      filteredComments.map((comment) => (
                        <tr key={comment.id}>
                          <td>
                            <div className="d-flex flex-column">
                              <span>{comment.user_display_name || 'Không có tên'}</span>
                            </div>
                          </td>
                          <td>
                            {comment.comic_name}
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {renderStars(comment.rating)}
                            </div>
                          </td>
                          <td>
                            {comment.comment.length > 50 
                              ? `${comment.comment.substring(0, 50)}...` 
                              : comment.comment}
                          </td>
                          <td>{formatDate(comment.created_at)}</td>
                          <td>
                            <Button
                              variant="info"
                              size="sm"
                              className="me-2"
                              onClick={() => handleViewComment(comment)}
                            >
                              <FaEye />
                            </Button>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteComment(comment.id)}
                              disabled={loading}
                            >
                              <FaTrash />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center">
                          Không tìm thấy bình luận nào
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
          <Modal.Title>Thống kê đánh giá</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mt-4">
            <h5>Tổng số bình luận: {comments.length}</h5>
            <p>Số người dùng đã bình luận: {new Set(comments.map(c => c.user_id)).size}</p>
            <p>Số truyện đã được bình luận: {new Set(comments.map(c => c.comic_slug)).size}</p>
            
            <h5 className="mt-4">Phân bố đánh giá:</h5>
            <div className="d-flex justify-content-between mt-3">
              {ratingCounts.map((count, index) => (
                <div key={index} className="text-center">
                  <div className="d-flex justify-content-center">
                    {renderStars(index + 1)}
                  </div>
                  <p className="mt-2">{count} lượt</p>
                </div>
              ))}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatsModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>

      {/* View Comment Modal */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết bình luận</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentComment && (
            <>
              <div className="d-flex align-items-center mb-3">
                <div>
                  <img
                    src={currentComment.comic_thumbnail || 'https://placehold.co/60x80?text=No+Image'}
                    alt={currentComment.comic_name}
                    width="60"
                    height="80"
                    style={{ objectFit: 'cover', marginRight: '15px' }}
                  />
                </div>
                <div>
                  <h5 className="mb-1">{currentComment.comic_name}</h5>
                  <div className="d-flex">
                    {renderStars(currentComment.rating)}
                    <span className="ms-2">({currentComment.rating}/5)</span>
                  </div>
                </div>
              </div>
              
              <div className="mb-3">
                <p className="fw-bold mb-1">Người bình luận:</p>
                <p>{currentComment.user_display_name || 'Không có tên'}</p>
              </div>
              
              <div className="mb-3">
                <p className="fw-bold mb-1">Ngày bình luận:</p>
                <p>{formatDate(currentComment.created_at)}</p>
              </div>
              
              <div>
                <p className="fw-bold mb-1">Nội dung bình luận:</p>
                <Card className="bg-light">
                  <Card.Body>
                    {currentComment.comment}
                  </Card.Body>
                </Card>
              </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button 
            variant="danger" 
            onClick={() => {
              handleDeleteComment(currentComment.id);
              setShowViewModal(false);
            }}
          >
            <FaTrash className="me-2" />
            Xóa bình luận
          </Button>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default withAdminAuth(CommentsManagement);