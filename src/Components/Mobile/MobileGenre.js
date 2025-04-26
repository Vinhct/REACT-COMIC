import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Row, Col, Button, Spinner } from "react-bootstrap";
import { Link, useParams } from "react-router-dom";
import { Helmet } from "react-helmet";
import MobileMenu from "./Common/MobileMenu";
import PageHeader from "./components/PageHeader";
import ComicCard from "./components/ComicCard";
import ErrorMessage from "./components/ErrorMessage";
import "./styles/MobileGenre.css";

// Component cho trang Mobile Genre
const MobileGenre = () => {
  const { slug } = useParams();
  const [genreComics, setGenreComics] = useState([]);
  const [genreInfo, setGenreInfo] = useState({
    title: "",
    description: ""
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Fetch dữ liệu thể loại
  const fetchGenreComics = async (page = 1) => {
    try {
      setLoading(true);
      setError(null);
      
      // Lấy đúng API endpoint giống giao diện máy tính
      const apiUrl = `https://otruyenapi.com/v1/api/the-loai/${slug}?page=${page}`;
      
      try {
        const response = await axios.get(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          timeout: 8000
        });
        
        console.log("Dữ liệu thể loại:", response.data);
        
        if (response.data?.data?.items && response.data.data.items.length > 0) {
          // Format lại dữ liệu
          const formattedComics = response.data.data.items.map(comic => {
            return {
              id: comic.id,
              title: comic.name,
              slug: comic.slug,
              thumbnail: comic.thumb_url ? `https://img.otruyenapi.com/uploads/comics/${comic.thumb_url}` : null,
              status: comic.status,
              updated_at: comic.updatedAt,
              genres: comic.category ? comic.category.map(cat => cat.name) : []
            };
          });
          
          setGenreComics(formattedComics);
          
          // Lưu thông tin thể loại
          if (response.data?.data?.seoOnPage) {
            setGenreInfo({
              title: response.data.data.seoOnPage.titleHead || `Thể loại: ${slug}`,
              description: response.data.data.seoOnPage.descriptionHead || "Danh sách truyện tranh"
            });
          }
          
          // Lưu thông tin phân trang
          if (response.data?.data?.params?.pagination) {
            const pagination = response.data.data.params.pagination;
            const total = pagination.totalItems || 0;
            const itemsPerPage = pagination.itemsPerPage || 24;
            setTotalPages(Math.ceil(total / itemsPerPage));
          }
          
          setError(null);
        } else {
          throw new Error("API không trả về dữ liệu hợp lệ");
        }
      } catch (error) {
        console.error("Error fetching genre comics:", error.message);
        setError("Không thể tải dữ liệu thể loại. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    } catch (error) {
      console.error("Critical error in fetchGenreComics:", error.message);
      setLoading(false);
      setError("Lỗi không xác định. Vui lòng thử lại sau.");
    }
  };
  
  // Tải lại dữ liệu khi thể loại hoặc trang thay đổi
  useEffect(() => {
    fetchGenreComics(currentPage);
  }, [slug, currentPage]);
  
  // Chức năng tải trang tiếp theo
  const loadMoreComics = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };
  
  // Chức năng tải lại dữ liệu
  const handleRetry = () => {
    fetchGenreComics(currentPage);
  };
  
  // Render danh sách truyện
  const renderComicsList = () => {
    if (loading && currentPage === 1) {
      return (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-3">Đang tải truyện...</p>
        </div>
      );
    }

    if (error && genreComics.length === 0) {
      return (
        <ErrorMessage 
          message={error} 
          onRetry={handleRetry} 
        />
      );
    }

    if (!genreComics || genreComics.length === 0) {
      return (
        <div className="text-center my-5">
          <p>Không tìm thấy truyện nào thuộc thể loại này.</p>
        </div>
      );
    }

    return (
      <>
        <Row className="comic-grid">
          {genreComics.map((comic, index) => (
            <Col xs={6} key={index} className="mb-3">
              <ComicCard comic={comic} />
            </Col>
          ))}
        </Row>
        
        {currentPage < totalPages && (
          <div className="text-center my-4">
            <Button 
              variant="primary"
              onClick={loadMoreComics}
              disabled={loading}
              className="load-more-btn"
            >
              {loading ? (
                <>
                  <Spinner animation="border" size="sm" className="me-2" />
                  Đang tải...
                </>
              ) : "Xem thêm truyện"}
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <div className="mobile-genre">
      <Helmet>
        <title>{genreInfo.title || `Thể loại: ${slug}`}</title>
        <meta name="description" content={genreInfo.description} />
      </Helmet>
      
      <MobileMenu />
      
      <Container className="mobile-container">
        {/* Header thể loại */}
        <PageHeader title={genreInfo.title || `Thể loại: ${slug}`} />
        
        {/* Mô tả thể loại */}
        <div className="genre-description mb-4">
          <p>{genreInfo.description}</p>
        </div>
        
        {/* Danh sách truyện */}
        {renderComicsList()}
      </Container>
    </div>
  );
};

export default MobileGenre; 