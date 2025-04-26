import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Modal, Form, InputGroup, Row, Col, Card, Spinner, Badge, Alert } from 'react-bootstrap';
import { FaSearch, FaEdit, FaTrash, FaUserPlus, FaUserShield, FaUserAlt } from 'react-icons/fa';
import { withAdminAuth } from '../AdminContext';
import { supabase } from '../../../supabaseClient';
import AdminLayout from '../AdminLayout';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showEditModal, setShowEditModal] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    display_name: '',
    role: 'user',
    isAdmin: false
  });
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch users on component mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch all users
  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch users from user_profiles
      const { data: userProfiles, error: profilesError } = await supabase
        .from('user_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profilesError) throw profilesError;

      // Fetch admin users to mark admin accounts
      const { data: adminUsers, error: adminError } = await supabase
        .from('admin_users')
        .select('user_id');

      if (adminError) throw adminError;

      // Create a set of admin user IDs for quick lookup
      const adminUserIds = new Set((adminUsers || []).map(admin => admin.user_id));

      // Transform data
      const transformedUsers = userProfiles.map(user => ({
        id: user.id,
        email: user.email || '',
        display_name: user.display_name || '',
        role: user.role || 'user',
        created_at: user.created_at,
        isAdmin: adminUserIds.has(user.id)
      }));

      setUsers(transformedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      (user.email && user.email.toLowerCase().includes(searchTermLower)) ||
      (user.display_name && user.display_name.toLowerCase().includes(searchTermLower))
    );
  });

  // Handle edit user
  const handleEditUser = async () => {
    try {
      setLoading(true);
      
      // Update user in user_profiles table
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          display_name: formData.display_name,
          role: formData.role
        })
        .eq('id', currentUser.id);

      if (updateError) throw updateError;

      // Handle admin status change
      if (formData.isAdmin && !currentUser.isAdmin) {
        // Add to admin_users
        const { error: adminError } = await supabase
          .from('admin_users')
          .insert([{
            user_id: currentUser.id,
            display_name: formData.display_name,
            role: 'admin'
          }]);

        if (adminError) throw adminError;
      } else if (!formData.isAdmin && currentUser.isAdmin) {
        // Remove from admin_users
        const { error: adminError } = await supabase
          .from('admin_users')
          .delete()
          .eq('user_id', currentUser.id);

        if (adminError) throw adminError;
      }

      // Close modal
      setShowEditModal(false);
      setCurrentUser(null);
      
      setSuccessMessage('Người dùng đã được cập nhật thành công!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Refresh user list
      fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      setError(error.message || 'Có lỗi xảy ra khi cập nhật người dùng');
    } finally {
      setLoading(false);
    }
  };

  // Open edit modal with user data
  const openEditModal = (user) => {
    setCurrentUser(user);
    setFormData({
      display_name: user.display_name || '',
      role: user.role || 'user',
      isAdmin: user.isAdmin || false
    });
    setShowEditModal(true);
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  // Clear error message
  const clearError = () => {
    setError(null);
  };

  return (
    <AdminLayout title="Quản lý Người dùng">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Quản lý Người dùng</h2>
          <div>
            <Button variant="success" onClick={() => fetchUsers()}>
              <FaUserPlus className="me-2" />
              Làm mới danh sách
            </Button>
          </div>
        </div>

        {successMessage && (
          <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" dismissible onClose={clearError}>
            {error}
          </Alert>
        )}

        <Card className="mb-4">
          <Card.Body>
            <InputGroup className="mb-3">
              <InputGroup.Text>
                <FaSearch />
              </InputGroup.Text>
              <Form.Control
                placeholder="Tìm kiếm người dùng..."
                value={searchTerm}
                onChange={handleSearchChange}
              />
            </InputGroup>

            {loading && !users.length ? (
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
                      <th>Email</th>
                      <th>Tên hiển thị</th>
                      <th>Vai trò</th>
                      <th>Ngày tạo</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.length > 0 ? (
                      filteredUsers.map((user) => (
                        <tr key={user.id}>
                          <td>{user.email || '(Không có)'}</td>
                          <td>{user.display_name || '(Không có)'}</td>
                          <td>
                            {user.isAdmin ? (
                              <Badge bg="danger">
                                <FaUserShield className="me-1" />
                                Admin
                              </Badge>
                            ) : (
                              <Badge bg="secondary">
                                <FaUserAlt className="me-1" />
                                {user.role || 'User'}
                              </Badge>
                            )}
                          </td>
                          <td>{user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}</td>
                          <td>
                            <Button
                              variant="info"
                              size="sm"
                              onClick={() => openEditModal(user)}
                            >
                              <FaEdit />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">
                          Không tìm thấy người dùng nào
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

      {/* Edit User Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Chỉnh sửa người dùng</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={currentUser?.email || ''}
                disabled
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Tên hiển thị</Form.Label>
              <Form.Control
                type="text"
                name="display_name"
                value={formData.display_name}
                onChange={handleInputChange}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Vai trò</Form.Label>
              <Form.Select
                name="role"
                value={formData.role}
                onChange={handleInputChange}
              >
                <option value="user">User</option>
                <option value="editor">Editor</option>
                <option value="moderator">Moderator</option>
              </Form.Select>
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Check
                type="checkbox"
                label="Quyền Admin"
                name="isAdmin"
                checked={formData.isAdmin}
                onChange={handleInputChange}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowEditModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleEditUser} disabled={loading}>
            {loading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang xử lý...
              </>
            ) : (
              'Lưu thay đổi'
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default withAdminAuth(UsersManagement); 