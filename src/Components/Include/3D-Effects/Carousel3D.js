import React, { useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, Badge, Button, Container } from "react-bootstrap";
import { FaFire, FaBookOpen } from "react-icons/fa";
import "./Carousel3D.css";

const Carousel3D = ({ comics }) => {
  // Thêm useEffect để xử lý scroll
  useEffect(() => {
    // Lưu giữ trạng thái scroll ban đầu
    const originalOverflow = document.body.style.overflow;
    
    // Tạo một hàm xử lý scroll
    const handleScroll = () => {
      const banner = document.querySelector('.banner-3d');
      if (!banner) return;
      
      const rect = banner.getBoundingClientRect();
      // Nếu banner trong viewpoint
      if (rect.top <= 0 && rect.bottom >= window.innerHeight) {
        document.body.classList.add('no-scroll');
      } else {
        document.body.classList.remove('no-scroll');
      }
    };

    // Đăng ký event listener
    window.addEventListener('scroll', handleScroll);
    
    // Cleanup
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.body.style.overflow = originalOverflow;
      document.body.classList.remove('no-scroll');
    };
  }, []);

  // Nếu không có dữ liệu, không hiện gì cả
  if (!comics || comics.length === 0) {
    return null;
  }

  // Lấy tối đa 8 truyện để hiển thị
  const displayedComics = comics.slice(0, 8);
  const quantity = displayedComics.length;

  return (
    <Container fluid className="px-0">
      {/* Tiêu đề nằm ngoài banner-3d */}
      <h2 className="carousel-title">
        <FaFire className="me-2" style={{ color: "#ec4899" }} /> TRUYỆN HOT
      </h2>
      
      <div className="banner-3d">
        <div className="slider-3d" style={{ "--quantity": quantity }}>
          {displayedComics.map((comic, index) => (
            <div 
              key={index} 
              className="item-3d" 
              style={{ "--position": index + 1 }}
            >
              <Card className="card h-100">
                <Link to={`/comics/${comic.slug}`} style={{ textDecoration: "none" }}>
                  {/* Tiêu đề trên đầu card (hiển thị khi nhìn từ xa) */}
                  <div className="comic-title-top">
                    <FaBookOpen className="book-icon" />
                    <span>{comic.name || "Không có tên"}</span>
                  </div>
                  
                  <div className="comic-image-container">
                    <Card.Img
                      variant="top"
                      src={`https://img.otruyenapi.com/uploads/comics/${comic.thumb_url}`}
                      alt={comic.name}
                      className="card-img-top"
                      loading="lazy"
                    />
                    {/* Overlay title luôn hiển thị */}
                    <div className="comic-title-overlay">
                      <h5 className="overlay-title">{comic.name || "Không có tên"}</h5>
                    </div>
                  </div>
                  <Card.Body className="p-2 d-flex flex-column">
                    <Card.Title
                      className="card-title text-dark text-truncate"
                    >
                      {comic.name || "Không có tên"}
                    </Card.Title>
                    <div className="mb-2">
                      {comic.category && comic.category.length > 0 
                        ? comic.category.slice(0, 2).map((category, idx) => (
                            <Link
                              to={`/genre/${category.slug}`}
                              key={idx}
                              style={{ textDecoration: "none" }}
                              onClick={e => e.stopPropagation()}
                            >
                              <Badge
                                className="badge me-1"
                                style={{ 
                                  background: "linear-gradient(to right, #6366f1, #ec4899)",
                                  cursor: "pointer" 
                                }}
                              >
                                {category.name}
                              </Badge>
                            </Link>
                          ))
                        : null
                      }
                    </div>
                    <small className="text-muted mb-1">
                      {comic.updatedAt ? `Cập nhật: ${comic.updatedAt.substring(0, 10)}` : ""}
                    </small>
                    <div className="mt-auto">
                      <Button
                        size="sm"
                        className="btn-detail w-100"
                        style={{
                          background: "linear-gradient(to right, #6366f1, #ec4899)",
                          border: "none",
                          boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                        }}
                      >
                        Chi Tiết
                      </Button>
                    </div>
                  </Card.Body>
                </Link>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </Container>
  );
};

export default Carousel3D; 