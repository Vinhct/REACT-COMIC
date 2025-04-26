import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, InputGroup, Spinner, Alert, Badge, Row, Col, Modal } from 'react-bootstrap';
import { FaSearch, FaTrash, FaEye, FaFilter, FaChartBar } from 'react-icons/fa';
import { withAdminAuth } from '../AdminContext';
import { supabase } from '../../../supabaseClient';
import AdminLayout from '../AdminLayout';

const FavoritesManagement = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState('');
  const [users, setUsers] = useState([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [showStatsModal, setShowStatsModal] = useState(false);
  
  // Fetch favorites on component mount
  useEffect(() => {
    fetchFavorites();
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

  // Fetch all favorites with user and comic info
  const fetchFavorites = async () => {
    try {
      setLoading(true);
      setError(null);

      // Lấy toàn bộ danh sách favorites mà không có filter
      const { data: favoritesData, error: favoritesError } = await supabase
        .from('favorites')
        .select('*')
        .order('created_at', { ascending: false });

      if (favoritesError) {
        console.error('Error fetching favorites:', favoritesError);
        throw favoritesError;
      }

      console.log('Raw favorites data:', favoritesData, 'Total favorites:', favoritesData?.length || 0);

      // Nếu không có dữ liệu, return
      if (!favoritesData || favoritesData.length === 0) {
        setFavorites([]);
        setLoading(false);
        return;
      }

      // Lấy danh sách unique user_id
      const userIds = [...new Set(favoritesData.map(fav => fav.user_id))];
      console.log('Unique user_ids from favorites:', userIds);
      console.log('Total unique users:', userIds.length);

      // Lấy thông tin comics
      const slugs = [...new Set(favoritesData.map(fav => fav.slug))];
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
      const transformedData = favoritesData.map(favorite => {
        const userInfo = users.find(user => user.id === favorite.user_id) || { id: favorite.user_id, display_name: `User ${favorite.user_id.substring(0, 8)}...`, isAdmin: false };
        const comic = comicMap[favorite.slug] || {};

        return {
          id: favorite.id,
          created_at: favorite.created_at,
          user_id: favorite.user_id,
          user_display_name: userInfo.display_name,
          is_admin: userInfo.isAdmin,
          comic_slug: favorite.slug,
          comic_name: comic.name || 'Không có tên',
          comic_author: comic.author || 'Không có',
          comic_status: comic.status || 'Đang tiến hành',
          comic_thumbnail: comic.thumbnail || ''
        };
      });

      console.log('Transformed favorites data:', transformedData.length);
      setFavorites(transformedData);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu yêu thích');
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

  // Handle delete favorite
  const handleDeleteFavorite = async (favoriteId) => {
    try {
      setLoading(true);

      // Delete from Supabase
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', favoriteId);

      if (error) throw error;

      // Update state
      setFavorites(favorites.filter(fav => fav.id !== favoriteId));
      setSuccessMessage('Đã xóa khỏi danh sách yêu thích!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
    } catch (error) {
      console.error('Error deleting favorite:', error);
      setError(error.message || 'Có lỗi xảy ra khi xóa khỏi yêu thích');
    } finally {
      setLoading(false);
    }
  };

  // Filter favorites based on search term and selected user
  const filteredFavorites = favorites.filter(favorite => {
    const searchTermLower = searchTerm.toLowerCase();
    const matchesSearch = 
      (favorite.comic_name && favorite.comic_name.toLowerCase().includes(searchTermLower)) || 
      (favorite.user_display_name && favorite.user_display_name.toLowerCase().includes(searchTermLower));
    
    const matchesUser = selectedUser ? favorite.user_id === selectedUser : true;
    
    return matchesSearch && matchesUser;
  });

  return (
    <AdminLayout title="Quản lý Yêu thích">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Quản lý Yêu thích</h2>
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
                    placeholder="Tìm kiếm truyện hoặc người dùng..."
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

            {loading && !favorites.length ? (
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
                      <th>Tác giả</th>
                      <th>Trạng thái</th>
                      <th>Ngày thêm</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredFavorites.length > 0 ? (
                      filteredFavorites.map((favorite) => (
                        <tr key={favorite.id}>
                          <td>
                            <div className="d-flex flex-column">
                              <span>{favorite.user_display_name || 'Không có tên'}</span>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <img
                                src={favorite.comic_thumbnail || 'https://placehold.co/40x60?text=No+Image'}
                                alt={favorite.comic_name}
                                width="40"
                                height="60"
                                style={{ objectFit: 'cover', marginRight: '10px' }}
                              />
                              <span>{favorite.comic_name}</span>
                            </div>
                          </td>
                          <td>{favorite.comic_author || 'Không có'}</td>
                          <td>
                            <Badge bg={
                              favorite.comic_status === 'Đã hoàn thành' ? 'success' :
                              favorite.comic_status === 'Tạm ngưng' ? 'warning' : 'info'
                            }>
                              {favorite.comic_status || 'Đang tiến hành'}
                            </Badge>
                          </td>
                          <td>{new Date(favorite.created_at).toLocaleDateString()}</td>
                          <td>
                            <Button
                              variant="danger"
                              size="sm"
                              onClick={() => handleDeleteFavorite(favorite.id)}
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
          <Modal.Title>Thống kê truyện yêu thích</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="mt-4">
            <h5>Tổng số lượt yêu thích: {favorites.length}</h5>
            <p>Số người dùng đã thêm vào yêu thích: {new Set(favorites.map(f => f.user_id)).size}</p>
            <p>Số truyện đã được yêu thích: {new Set(favorites.map(f => f.comic_slug)).size}</p>
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

export default withAdminAuth(FavoritesManagement); 