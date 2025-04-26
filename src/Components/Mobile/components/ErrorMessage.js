import React from "react";
import { Button, Spinner } from "react-bootstrap";
import "../styles/ErrorMessage.css";

// Component hiển thị lỗi
const ErrorMessage = ({ message, onRetry, loading = false }) => {
  return (
    <div className="api-error-container">
      <div className="api-error-message">
        <p><strong>Không thể tải dữ liệu:</strong> {message}</p>
        <Button 
          variant="primary" 
          onClick={onRetry} 
          className="retry-button"
          disabled={loading}
        >
          {loading ? (
            <>
              <Spinner animation="border" size="sm" className="me-2" />
              Đang tải...
            </>
          ) : "Thử lại"}
        </Button>
      </div>
    </div>
  );
};

export default ErrorMessage; 