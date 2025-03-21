import React, { useState } from "react";
import { Button, Form, Container, Card } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { auth } from "./Firebase"; // Điều chỉnh đường dẫn nếu cần

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      navigate("/login"); // Chuyển hướng về trang đăng nhập sau khi đăng ký thành công
    } catch (err) {
      setError(err.message);
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
          {error && <p className="text-danger text-center">{error}</p>}
          <Form onSubmit={handleRegister}>
            <Form.Group className="mb-3" controlId="formEmail">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Nhập email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
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
              />
            </Form.Group>

            <Button variant="primary" type="submit" className="w-100">
              Đăng ký
            </Button>
          </Form>
          <div className="text-center mt-3">
            Đã có tài khoản? <Link to="/login">Đăng nhập ngay</Link>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Register;
