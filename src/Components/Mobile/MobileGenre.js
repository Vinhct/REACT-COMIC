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
      
      console.log("Fetching comics for genre:", slug, "page:", page);
      
      // Lấy đúng API endpoint giống giao diện máy tính
      const apiUrl = `https://otruyenapi.com/v1/api/the-loai/${slug}?page=${page}`;
      
      const response = await axios.get(apiUrl);
      
      console.log("API Response:", response.data);
      
      if (response.data && response.data.status === "success") {
        const { data } = response.data;
        
        if (data && Array.isArray(data.items)) {
          // Format lại dữ liệu
          const formattedComics = data.items.map(comic => ({
            id: comic.id,
            title: comic.name,
            slug: comic.slug,
            thumbnail: comic.thumb_url 
              ? `https://img.otruyenapi.com/uploads/comics/${comic.thumb_url}` 
              : null,
            status: comic.status || "Đang cập nhật",
            updated_at: comic.updatedAt || new Date().toISOString(),
            genres: comic.categories 
              ? comic.categories.map(cat => cat.name) 
              : comic.category 
                ? comic.category.map(cat => cat.name)
                : []
          }));
          
          console.log("Formatted comics:", formattedComics);
          
          if (page === 1) {
            setGenreComics(formattedComics);
          } else {
            setGenreComics(prev => [...prev, ...formattedComics]);
          }
          
          // Lưu thông tin thể loại
          if (data.seoOnPage) {
            setGenreInfo({
              title: data.seoOnPage.titleHead || `Thể loại: ${slug}`,
              description: data.seoOnPage.descriptionHead || "Danh sách truyện tranh"
            });
          }
          
          // Lưu thông tin phân trang
          if (data.params && data.params.pagination) {
            const { totalItems = 0, itemsPerPage = 24 } = data.params.pagination;
            setTotalPages(Math.ceil(totalItems / itemsPerPage));
          }
          
          setError(null);
        } else {
          console.error("Invalid items array in response:", data);
          throw new Error("Không tìm thấy danh sách truyện");
        }
      } else {
        console.error("API response not successful:", response.data);
        throw new Error("API không trả về dữ liệu hợp lệ");
      }
    } catch (error) {
      console.error("Error fetching genre comics:", error);
      setError(error.response?.data?.message || error.message || "Không thể tải dữ liệu thể loại. Vui lòng thử lại sau.");
    } finally {
      setLoading(false);
    }
  };
  
  // Tải lại dữ liệu khi thể loại hoặc trang thay đổi
  useEffect(() => {
    console.log("Genre slug changed:", slug);
    setCurrentPage(1); // Reset về trang 1 khi đổi thể loại
    fetchGenreComics(1);
  }, [slug]);

  // Tải thêm dữ liệu khi chuyển trang
  useEffect(() => {
    if (currentPage > 1) {
      fetchGenreComics(currentPage);
    }
  }, [currentPage]);
  
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