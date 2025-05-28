import React, { useState } from 'react';
import { Container, Card, Button, Form, Alert } from 'react-bootstrap';
import useVietQR from '../../utils/useVietQR';

const VietQRTest = () => {
  const [amount, setAmount] = useState('100000');
  const [description, setDescription] = useState('Test payment');
  const [bankId, setBankId] = useState('mbbank');
  const [generatedUrl, setGeneratedUrl] = useState('');
  const [error, setError] = useState('');

  const { banks, generateVietQRUrl, generateDeeplink, generateQuicklink } = useVietQR();

  const handleGenerate = () => {
    try {
      setError('');
      console.clear();
      console.log('=== VietQR Test Debug ===');
      console.log('Input:', { amount, description, bankId });
      
      const url = generateVietQRUrl(amount, description, bankId);
      console.log('Generated URL:', url);
      
      if (url) {
        setGeneratedUrl(url);
        
        // Test image loading
        const img = new Image();
        img.onload = () => console.log('✅ Image loaded successfully');
        img.onerror = (e) => {
          console.error('❌ Image failed to load:', e);
          setError('Image failed to load');
        };
        img.src = url;
      } else {
        setError('Failed to generate URL');
      }
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    }
  };

  return (
    <Container className="py-4">
      <Card>
        <Card.Header>
          <h4>VietQR URL Test Tool</h4>
        </Card.Header>
        <Card.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Số tiền</Form.Label>
              <Form.Control
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Nội dung</Form.Label>
              <Form.Control
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={25}
              />
              <Form.Text className="text-muted">
                Tối đa 25 ký tự (VietQR limit)
              </Form.Text>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Ngân hàng</Form.Label>
              <Form.Select value={bankId} onChange={(e) => setBankId(e.target.value)}>
                {banks.map(bank => (
                  <option key={bank.id} value={bank.id}>{bank.name}</option>
                ))}
              </Form.Select>
            </Form.Group>
            
            <Button onClick={handleGenerate} variant="primary">
              Tạo VietQR
            </Button>
          </Form>
          
          {error && (
            <Alert variant="danger" className="mt-3">
              {error}
            </Alert>
          )}
          
          {generatedUrl && (
            <div className="mt-4">
              <h5>Kết quả:</h5>
              
              <div className="mb-3">
                <strong>URL:</strong>
                <div style={{ wordBreak: 'break-all', fontSize: '12px', padding: '8px', backgroundColor: '#f8f9fa', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                  {generatedUrl}
                </div>
              </div>
              
              <div className="text-center">
                <img 
                  src={generatedUrl} 
                  alt="VietQR Test" 
                  style={{ maxWidth: '300px', width: '100%' }}
                  className="border rounded"
                  onLoad={() => console.log('✅ React img onLoad triggered')}
                  onError={(e) => {
                    console.error('❌ React img onError triggered:', e);
                    setError('React image onError triggered');
                  }}
                />
              </div>
              
              <div className="mt-3">
                <div className="mb-2">
                  <strong>Deeplink:</strong>
                  <br />
                  <a href={generateDeeplink(amount, description, bankId)} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-primary">
                    Test Deeplink
                  </a>
                </div>
                
                <div>
                  <strong>Quicklink:</strong>
                  <br />
                  <a href={generateQuicklink(amount, description, bankId)} target="_blank" rel="noopener noreferrer" className="btn btn-sm btn-outline-secondary">
                    Test Quicklink
                  </a>
                </div>
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default VietQRTest; 