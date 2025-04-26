import React, { useState } from 'react';
import { Container, Form, Button, Card, Alert, Spinner } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Đăng nhập với Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      // Kiểm tra xem người dùng có phải là admin không
      const { data: userData, error: userError } = await supabase
        .from('admin_users')
        .select('*')
        .eq('user_id', data.user.id)
        .single();

      if (userError) {
        if (userError.code === 'PGRST116') {
          throw new Error('Tài khoản không có quyền truy cập trang admin');
        }
        throw userError;
      }

      if (!userData) {
        throw new Error('Tài khoản không có quyền truy cập trang admin');
      }

      // Chuyển hướng đến trang dashboard
      navigate('/admin/dashboard');
    } catch (err) {
      console.error('Lỗi đăng nhập:', err);
      setError(err.message || 'Đăng nhập không thành công, vui lòng thử lại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="d-flex align-items-center justify-content-center" style={{ minHeight: '100vh' }}>
      <Helmet>
        <title>Admin Login - Comic Management System</title>
      </Helmet>
      
      <Card className="w-100" style={{ maxWidth: '450px' }}>
        <Card.Body className="p-4">
          <h2 className="text-center mb-4">Admin Login</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          <Form onSubmit={handleLogin}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Password</Form.Label>
              <Form.Control 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="********"
              />
            </Form.Group>
            
            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mt-3" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang xử lý...
                </>
              ) : (
                'Đăng nhập'
              )}
            </Button>
          </Form>
          
          <div className="text-center mt-3">
            <Button variant="link" onClick={() => navigate('/')} className="text-decoration-none">
              Quay lại trang chủ
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminLogin; 