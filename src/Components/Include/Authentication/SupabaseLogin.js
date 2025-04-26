import React, { useState } from "react";
import { Button, Form, Container, Card, Spinner, Alert } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useSupabaseAuth } from "./SupabaseAuthContext";

const SupabaseLogin = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  
  const { signIn, user, loading } = useSupabaseAuth();

  // Chỉ chuyển hướng khi đã đăng nhập thành công
  if (user && !loading) {
    navigate("/");
    return null;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      console.log("Đang đăng nhập với email:", email);
      const { success, error: signInError } = await signIn(email, password);
      
      if (!success) {
        console.error("Chi tiết lỗi đăng nhập:", signInError);
        
        if (signInError.includes("Invalid login")) {
          setError("Email hoặc mật khẩu không đúng.");
        } else if (signInError.includes("Email not confirmed")) {
          setError("Email chưa được xác nhận. Vui lòng kiểm tra hộp thư để xác nhận email.");
        } else {
          setError(signInError || "Đăng nhập thất bại. Vui lòng thử lại.");
        }
        return;
      }
    } catch (err) {
      console.error("Lỗi không xác định:", err);
      setError("Đã xảy ra lỗi không mong muốn. Vui lòng thử lại sau.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Container
      className="d-flex justify-content-center align-items-center"
      style={{ minHeight: "100vh" }}
    >
      <Card style={{ width: "400px" }} className="shadow-sm">
        <Card.Body>
          <h2 className="text-center mb-4">Đăng nhập</h2>
          
          {error && <Alert variant="danger">{error}</Alert>}
          
          {loading ? (
            <div className="text-center">
              <Spinner animation="border" role="status" variant="primary" />
            </div>
          ) : (
            <Form onSubmit={handleLogin}>
              <Form.Group className="mb-3" controlId="formEmail">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Nhập email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </Form.Group>

              <Form.Group className="mb-3" controlId="formPassword">
                <Form.Label>Mật khẩu</Form.Label>
                <Form.Control
                  type="password"
                  placeholder="Nhập mật khẩu"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={isSubmitting}
                />
              </Form.Group>

              <Button 
                variant="primary" 
                type="submit" 
                className="w-100"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner
                      as="span"
                      animation="border"
                      size="sm"
                      role="status"
                      aria-hidden="true"
                    />
                    <span className="ms-2">Đang đăng nhập...</span>
                  </>
                ) : (
                  "Đăng nhập"
                )}
              </Button>
            </Form>
          )}
          
          <div className="text-center mt-3">
            Chưa có tài khoản? <Link to="/register">Đăng ký ngay</Link>
          </div>
          
          <div className="mt-3">
            <Button 
              variant="link" 
              className="p-0 text-decoration-none" 
              onClick={() => navigate("/email-checker")}
              size="sm"
            >
              Gặp vấn đề khi đăng nhập?
            </Button>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SupabaseLogin; 