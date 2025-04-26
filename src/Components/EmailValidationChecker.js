import React, { useState } from 'react';
import { Container, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { supabase } from '../supabaseClient';

const EmailValidationChecker = () => {
  const [email, setEmail] = useState('');
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // Danh sách domain email để thử
  const commonDomains = [
    'gmail.com',
    'outlook.com',
    'hotmail.com',
    'yahoo.com',
    'protonmail.com',
    'aol.com',
    'icloud.com',
    'mail.com',
    'zoho.com',
    'yandex.com'
  ];

  const checkEmail = async (e) => {
    e.preventDefault();
    setLoading(true);
    setTestResult(null);
    
    try {
      // Kiểm tra xem email này có hợp lệ với Supabase không
      // Thay vì đăng ký thực sự, chúng ta sẽ kiểm tra xem có lỗi "Email is invalid" không
      const testPassword = 'Password123!'; // Mật khẩu tạm thời
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password: testPassword,
        options: {
          data: {
            test_validation: true
          }
        }
      });
      
      if (error) {
        if (error.message.includes('invalid')) {
          setTestResult({
            valid: false,
            message: `Email "${email}" không được chấp nhận: ${error.message}`,
            details: error
          });
        } else if (error.message.includes('already registered')) {
          setTestResult({
            valid: true,
            message: `Email "${email}" hợp lệ với Supabase nhưng đã được đăng ký.`,
            details: error
          });
        } else {
          setTestResult({
            valid: false,
            message: `Lỗi khác: ${error.message}`,
            details: error
          });
        }
      } else {
        setTestResult({
          valid: true,
          message: `Email "${email}" hợp lệ với Supabase!`,
          details: data
        });
      }
    } catch (err) {
      setTestResult({
        valid: false,
        message: `Lỗi không xác định: ${err.message}`,
        details: err
      });
    } finally {
      setLoading(false);
    }
  };

  const selectDomain = (domain) => {
    const username = email.split('@')[0] || '';
    setEmail(`${username}@${domain}`);
  };

  return (
    <Container className="py-5">
      <Card className="shadow-sm">
        <Card.Header as="h5" className="bg-primary text-white">
          Công cụ kiểm tra tương thích email với Supabase
        </Card.Header>
        <Card.Body>
          <p>Sử dụng công cụ này để kiểm tra xem domain email của bạn có được Supabase chấp nhận không.</p>
          
          <Form onSubmit={checkEmail}>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Nhập email để kiểm tra"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Form.Group>
            
            <div className="mb-3">
              <p className="mb-2">Thử với các domain phổ biến:</p>
              <div className="d-flex flex-wrap gap-2">
                {commonDomains.map(domain => (
                  <Button
                    key={domain}
                    variant="outline-secondary"
                    size="sm"
                    onClick={() => selectDomain(domain)}
                  >
                    @{domain}
                  </Button>
                ))}
              </div>
            </div>
            
            <Button type="submit" variant="primary" disabled={loading}>
              {loading ? (
                <>
                  <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" />
                  <span className="ms-2">Đang kiểm tra...</span>
                </>
              ) : (
                'Kiểm tra'
              )}
            </Button>
          </Form>
          
          {testResult && (
            <Alert 
              variant={testResult.valid ? 'success' : 'danger'} 
              className="mt-4"
            >
              <p className="mb-1">{testResult.message}</p>
              <hr />
              <details>
                <summary>Chi tiết kỹ thuật</summary>
                <pre className="mt-2" style={{ maxHeight: '200px', overflow: 'auto' }}>
                  {JSON.stringify(testResult.details, null, 2)}
                </pre>
              </details>
            </Alert>
          )}
          
          <div className="mt-4">
            <h6>Gợi ý khắc phục vấn đề:</h6>
            <ul>
              <li>Thử sử dụng email với domain khác như Outlook, ProtonMail hoặc Zoho</li>
              <li>Kiểm tra cấu hình Supabase của bạn và đảm bảo đã bật đăng ký email</li>
              <li>Liên hệ với Supabase Support nếu bạn gặp vấn đề với domain nổi tiếng</li>
              <li>Thử sử dụng <a href="https://temp-mail.org" target="_blank" rel="noopener noreferrer">email tạm thời</a> để kiểm tra</li>
            </ul>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default EmailValidationChecker; 