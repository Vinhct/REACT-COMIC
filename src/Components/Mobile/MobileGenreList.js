import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Row, Col, Card, Button, Spinner } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { BsGrid } from "react-icons/bs";
import MobileMenu from "./Common/MobileMenu";
import PageHeader from "./components/PageHeader";
import ErrorMessage from "./components/ErrorMessage";
import "./styles/MobileGenreList.css";

// Component cho trang danh sách thể loại trên mobile
const MobileGenreList = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch danh sách thể loại
  const fetchGenres = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const apiUrl = "https://otruyenapi.com/v1/api/the-loai";
      
      try {
        const response = await axios.get(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          timeout: 8000
        });
        
        console.log("Danh sách thể loại:", response.data);
        
        if (response.data?.data?.items && response.data.data.items.length > 0) {
          setGenres(response.data.data.items);
          setError(null);
        } else {
          throw new Error("API không trả về danh sách thể loại");
        }
      } catch (error) {
        console.error("Error fetching genres:", error.message);
        setError("Không thể tải danh sách thể loại. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error("Critical error in fetchGenres:", error.message);
      setLoading(false);
      setError("Lỗi không xác định. Vui lòng thử lại sau.");
    }
  };
  
  // Tải danh sách thể loại khi component mount
  useEffect(() => {
    fetchGenres();
  }, []);
  
  // Gợi ý một số thể loại phổ biến
  const popularGenres = [
    { name: "Action", slug: "action", color: "#6366f1" },
    { name: "Romance", slug: "romance", color: "#ec4899" },
    { name: "Fantasy", slug: "fantasy", color: "#10b981" },
    { name: "Adventure", slug: "adventure", color: "#f59e0b" },
    { name: "Comedy", slug: "comedy", color: "#8b5cf6" },
    { name: "Drama", slug: "drama", color: "#ef4444" }
  ];
  
  // Chức năng tải lại dữ liệu
  const handleRetry = () => {
    fetchGenres();
  };
  
  // Render danh sách thể loại
  const renderGenresList = () => {
    if (loading) {
      return (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải thể loại...</p>
        </div>
      );
    }

    if (error) {
      return (
        <ErrorMessage 
          message={error} 
          onRetry={handleRetry} 
        />
      );
    }

    if (!genres || genres.length === 0) {
      return (
        <div className="text-center my-5">
          <p>Không tìm thấy thể loại nào.</p>
          <div className="popular-genres-container">
            <h4>Thể loại phổ biến</h4>
            <Row className="g-2">
              {popularGenres.map((genre, index) => (
                <Col xs={6} key={index}>
                  <Link to={`/the-loai/${genre.slug}`} className="text-decoration-none">
                    <Card 
                      className="genre-card" 
                      style={{ backgroundColor: genre.color }}
                    >
                      <Card.Body className="d-flex align-items-center justify-content-center">
                        <BsGrid className="me-2" />
                        <span>{genre.name}</span>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
              ))}
            </Row>
          </div>
        </div>
      );
    }

    return (
      <Row className="g-2">
        {genres.map((genre, index) => (
          <Col xs={6} key={index}>
            <Link to={`/the-loai/${genre.slug}`} className="text-decoration-none">
              <Card className="genre-card">
                <Card.Body className="d-flex align-items-center justify-content-center">
                  <BsGrid className="me-2" />
                  <span>{genre.name}</span>
                </Card.Body>
              </Card>
            </Link>
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className="mobile-genre-list">
      <Helmet>
        <title>Danh sách thể loại - VCT-Truyện</title>
        <meta name="description" content="Tìm truyện tranh theo thể loại yêu thích của bạn" />
      </Helmet>
      
      <MobileMenu />
      
      <Container className="mobile-container">
        {/* Header */}
        <PageHeader title="Thể loại truyện" />
        
        {/* Danh sách thể loại */}
        <div className="genres-container">
          {renderGenresList()}
        </div>
      </Container>
    </div>
  );
};

export default MobileGenreList; 