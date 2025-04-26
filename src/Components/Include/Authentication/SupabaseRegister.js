import React, { useState } from "react";
import { Button, Form, Container, Card, Spinner, Alert, Row, Col } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "./SupabaseAuth";
import { supabase } from "../../../supabaseClient";

const SupabaseRegister = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showEmailHelp, setShowEmailHelp] = useState(false);
  
  const navigate = useNavigate();
  const { signUp } = useAuth();

  // Hàm kiểm tra email hợp lệ
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);

    // Kiểm tra mật khẩu nhập lại
    if (password !== confirmPassword) {
      setError("Mật khẩu nhập lại không khớp");
      setIsSubmitting(false);
      return;
    }

    // Kiểm tra email hợp lệ trước khi gửi
    if (!isValidEmail(email)) {
      setError("Email không hợp lệ. Vui lòng kiểm tra lại.");
      setIsSubmitting(false);
      return;
    }

    try {
      console.log("Đang đăng ký với email:", email);
      
      // Gọi trực tiếp API để nhận thông tin lỗi chi tiết hơn
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          data: {
            display_name: displayName
          },
          emailRedirectTo: window.location.origin
        }
      });
      
      if (error) {
        // Hiển thị lỗi chi tiết
        console.error("Chi tiết lỗi:", JSON.stringify(error, null, 2));
        
        if (error.message.includes("registered")) {
          setError(`Email "${email}" đã được đăng ký trước đó. Vui lòng sử dụng email khác hoặc đăng nhập.`);
        } else if (error.message.includes("invalid")) {
          setError(`Email "${email}" không hợp lệ. Vui lòng thử email khác.`);
          setShowEmailHelp(true);
        } else {
          setError(error.message || "Đăng ký thất bại. Vui lòng thử lại.");
        }
        setIsSubmitting(false);
        return;
      }
      
      // Đăng ký thành công
      console.log("Đăng ký thành công:", JSON.stringify(data, null, 2));
      setSuccess(true);
      setTimeout(() => {
        navigate("/login");
      }, 3000);
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
          <h2 className="text-center mb-4">Đăng ký</h2>
          
          {error && (
            <div className="alert alert-danger" role="alert">
              {error}
            </div>
          )}
          
          {success && (
            <div className="alert alert-success" role="alert">
              Đăng ký thành công! Vui lòng kiểm tra email để xác nhận tài khoản. Đang chuyển hướng...
            </div>
          )}
          
          {showEmailHelp && (
            <Alert variant="info" dismissible onClose={() => setShowEmailHelp(false)}>
              <Alert.Heading>Gợi ý về email</Alert.Heading>
              <p>Một số email cá nhân (như Gmail, Yahoo) có thể không được chấp nhận bởi Supabase trong môi trường thử nghiệm.</p>
              <p>Thử sử dụng:</p>
              <ul>
                <li>Email công ty hoặc trường học</li>
                <li>Email tạm thời như <a href="https://temp-mail.org" target="_blank" rel="noopener noreferrer">temp-mail.org</a></li>
                <li>Hoặc thử đổi domain email (ví dụ: outlook.com, protonmail.com)</li>
              </ul>
              <div className="mt-2">
                <Link to="/email-checker" className="btn btn-sm btn-outline-primary">
                  Kiểm tra email hợp lệ
                </Link>
              </div>
            </Alert>
          )}
          
          <Form onSubmit={handleRegister}>
            <Form.Group className="mb-3" controlId="formDisplayName">
              <Form.Label>Tên hiển thị</Form.Label>
              <Form.Control
                type="text"
                placeholder="Nhập tên hiển thị"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                disabled={isSubmitting || success}
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Nhập email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubmitting || success}
                className={error && error.includes("Email") ? "is-invalid" : ""}
              />
              <Form.Text className="text-muted">
                Sử dụng email thật để có thể xác thực tài khoản.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formPassword">
              <Form.Label>Mật khẩu</Form.Label>
              <Form.Control
                type="password"
                placeholder="Nhập mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isSubmitting || success}
                minLength="6"
              />
              <Form.Text className="text-muted">
                Mật khẩu cần tối thiểu 6 ký tự.
              </Form.Text>
            </Form.Group>

            <Form.Group className="mb-3" controlId="formConfirmPassword">
              <Form.Label>Nhập lại mật khẩu</Form.Label>
              <Form.Control
                type="password"
                placeholder="Nhập lại mật khẩu"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting || success}
              />
            </Form.Group>

            <Button 
              variant="primary" 
              type="submit" 
              className="w-100 mb-3"
              disabled={isSubmitting || success}
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
                  <span className="ms-2">Đang đăng ký...</span>
                </>
              ) : (
                "Đăng ký"
              )}
            </Button>
            
            <Row className="mt-3">
              <Col className="text-center">
                <Button 
                  variant="link" 
                  className="p-0" 
                  onClick={() => setShowEmailHelp(!showEmailHelp)}
                >
                  Gặp vấn đề khi đăng ký?
                </Button>
              </Col>
            </Row>
          </Form>
          
          <div className="text-center mt-3">
            Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default SupabaseRegister; 