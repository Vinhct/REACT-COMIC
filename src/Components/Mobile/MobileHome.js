import React, { useState, useEffect } from "react";
import axios from "axios";
import { Container, Button, Spinner, Tabs, Tab, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet";
import { BsArrowRight, BsInfoCircle } from "react-icons/bs";
import MobileMenu from "./Common/MobileMenu";
import ComicCard from "./components/ComicCard";
import ErrorMessage from "./components/ErrorMessage";
import "./styles/MobileHome.css";
import { FaHeart } from 'react-icons/fa';

// Component cho trang Mobile Home
const MobileHome = () => {
  const [activeTab, setActiveTab] = useState("newest");
  const [newestComics, setNewestComics] = useState([]);
  const [trendingComics, setTrendingComics] = useState([]);
  const [completedComics, setCompletedComics] = useState([]);
  const [loading, setLoading] = useState({
    newest: true,
    trending: true,
    completed: true
  });
  const [errors, setErrors] = useState({
    newest: null,
    trending: null,
    completed: null
  });
  
  // Lấy dữ liệu truyện mới
  const fetchNewestComics = async () => {
    try {
      console.log("Đang gọi API truyện mới trên mobile...");
      setLoading(prev => ({ ...prev, newest: true }));
      
      // Lấy đúng API endpoint giống giao diện máy tính
      const apiUrl = `https://otruyenapi.com/v1/api/danh-sach/truyen-moi?page=1`;
      
      try {
        const response = await axios.get(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          timeout: 8000
        });
        
        console.log("Dữ liệu trả về từ API mới nhất:", response.data);
        
        if (response.data?.data?.items && response.data.data.items.length > 0) {
          // Lấy dữ liệu và xử lý giống như trên desktop
          const newestItems = response.data.data.items.map(comic => {
            return {
              id: comic.id,
              title: comic.name,
              slug: comic.slug,
              thumbnail: comic.thumb_url,
              status: comic.status || "Đang cập nhật",
              updated_at: comic.updatedAt,
              genres: comic.category ? comic.category.map(cat => ({
                name: cat.name,
                slug: cat.slug
              })) : []
            };
          });
          setNewestComics(newestItems);
          setErrors(prev => ({ ...prev, newest: null }));
        } else {
          throw new Error("API không trả về dữ liệu hợp lệ");
        }
      } catch (error) {
        console.error("Error fetching newest comics:", error.message);
        
        // Dữ liệu mẫu tốt hơn
        const betterSampleData = [
          {
            id: "sample1",
            title: "Vua Hải Tặc",
            slug: "vua-hai-tac",
            thumbnail: "https://i.imgur.com/PNVtQgY.jpg",
            status: "Đang cập nhật",
            updated_at: new Date().toISOString(),
            genres: ["Action", "Adventure", "Fantasy", "Shounen"]
          },
          {
            id: "sample2",
            title: "Ma Đạo Tổ Sư",
            slug: "ma-dao-to-su",
            thumbnail: "https://i.imgur.com/s2IjgFm.jpg",
            status: "Đang cập nhật",
            updated_at: new Date().toISOString(),
            genres: ["Action", "Adventure", "Fantasy", "Đam Mỹ"]
          },
          {
            id: "sample3",
            title: "Naruto",
            slug: "naruto",
            thumbnail: "https://i.imgur.com/uT95Kqa.jpg",
            status: "Đang cập nhật",
            updated_at: new Date().toISOString(),
            genres: ["Action", "Adventure", "Martial Arts", "Shounen"]
          },
          {
            id: "sample4",
            title: "Bleach",
            slug: "bleach",
            thumbnail: "https://i.imgur.com/fhjg8xN.jpg",
            status: "Đang cập nhật",
            updated_at: new Date().toISOString(),
            genres: ["Action", "Adventure", "Supernatural", "Shounen"]
          }
        ];
        setNewestComics(betterSampleData);
        setErrors(prev => ({ ...prev, newest: "Dùng dữ liệu mẫu - Không kết nối được API." }));
      } finally {
        setLoading(prev => ({ ...prev, newest: false }));
      }
    } catch (error) {
      console.error("Critical error in fetchNewestComics:", error.message);
      setLoading(prev => ({ ...prev, newest: false }));
      setErrors(prev => ({ ...prev, newest: "Lỗi không xác định. Vui lòng thử lại sau." }));
    }
  };

  // Lấy dữ liệu truyện xu hướng
  const fetchTrendingComics = async () => {
    try {
      console.log("Đang gọi API truyện xu hướng trên mobile...");
      setLoading(prev => ({ ...prev, trending: true }));
      
      // Sử dụng cùng API endpoint như desktop nhưng trang phát hành mới nhất
      const apiUrl = `https://otruyenapi.com/v1/api/danh-sach/truyen-moi?page=1`;
      
      try {
        const response = await axios.get(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          timeout: 8000
        });
        
        if (response.data?.data?.items && response.data.data.items.length > 0) {
          // Giả lập xu hướng bằng cách lấy các truyện và random
          const items = response.data.data.items;
          
          // Chọn một số truyện ngẫu nhiên
          const getRandomComics = (comics, count) => {
            const shuffled = [...comics];
            for (let i = shuffled.length - 1; i > 0; i--) {
              const j = Math.floor(Math.random() * (i + 1));
              [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
            }
            return shuffled.slice(0, Math.min(count, shuffled.length));
          };
          
          const randomComics = getRandomComics(items, 8);
          
          // Format lại dữ liệu giống như Desktop
          const trendingItems = randomComics.map(comic => {
            return {
              id: comic.id,
              title: comic.name,
              slug: comic.slug,
              thumbnail: comic.thumb_url,
              status: "Hot", // Đánh dấu là hot
              updated_at: comic.updatedAt,
              genres: comic.category ? comic.category.map(cat => ({
                name: cat.name,
                slug: cat.slug
              })) : []
            };
          });
          
          setTrendingComics(trendingItems);
          setErrors(prev => ({ ...prev, trending: null }));
        } else {
          throw new Error("API không trả về dữ liệu hợp lệ");
        }
      } catch (error) {
        console.error("Error fetching trending comics:", error.message);
        
        // Dữ liệu mẫu tốt hơn
        const betterSampleData = [
          {
            id: "trending1",
            title: "Attack on Titan",
            slug: "attack-on-titan",
            thumbnail: "https://i.imgur.com/QbPXnrV.jpg",
            status: "Hot",
            updated_at: new Date().toISOString(),
            genres: ["Action", "Fantasy", "Horror"]
          },
          {
            id: "trending2",
            title: "Thám Tử Lừng Danh Conan",
            slug: "tham-tu-lung-danh-conan",
            thumbnail: "https://i.imgur.com/9yHjzMN.jpg",
            status: "Hot",
            updated_at: new Date().toISOString(),
            genres: ["Mystery", "Detective", "School Life"]
          },
          {
            id: "trending3",
            title: "My Hero Academia",
            slug: "my-hero-academia",
            thumbnail: "https://i.imgur.com/HvCPUpa.jpg",
            status: "Hot",
            updated_at: new Date().toISOString(),
            genres: ["Action", "Superhero", "School Life"]
          },
          {
            id: "trending4",
            title: "Jujutsu Kaisen",
            slug: "jujutsu-kaisen",
            thumbnail: "https://i.imgur.com/gWIzuC2.jpg", 
            status: "Hot",
            updated_at: new Date().toISOString(),
            genres: ["Action", "Supernatural", "School Life"]
          }
        ];
        setTrendingComics(betterSampleData);
        setErrors(prev => ({ ...prev, trending: "Dùng dữ liệu mẫu - Không kết nối được API." }));
      } finally {
        setLoading(prev => ({ ...prev, trending: false }));
      }
    } catch (error) {
      console.error("Critical error in fetchTrendingComics:", error.message);
      setLoading(prev => ({ ...prev, trending: false }));
      setErrors(prev => ({ ...prev, trending: "Lỗi không xác định. Vui lòng thử lại sau." }));
    }
  };

  // Lấy dữ liệu truyện đã hoàn thành
  const fetchCompletedComics = async () => {
    try {
      console.log("Đang gọi API truyện hoàn thành trên mobile...");
      setLoading(prev => ({ ...prev, completed: true }));
      
      // Sử dụng endpoint hoàn thành
      const apiUrl = `https://otruyenapi.com/v1/api/danh-sach/da-hoan-thanh?page=1`;
      
      try {
        const response = await axios.get(apiUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36', 
            'Accept': 'application/json',
            'Cache-Control': 'no-cache'
          },
          timeout: 8000
        });
        
        if (response.data?.data?.items && response.data.data.items.length > 0) {
          // Format lại dữ liệu giống như Desktop
          const completedItems = response.data.data.items.map(comic => {
            return {
              id: comic.id,
              title: comic.name,
              slug: comic.slug,
              thumbnail: comic.thumb_url,
              status: "Hoàn thành",
              updated_at: comic.updatedAt,
              genres: comic.category ? comic.category.map(cat => ({
                name: cat.name,
                slug: cat.slug
              })) : []
            };
          });
          
          setCompletedComics(completedItems);
          setErrors(prev => ({ ...prev, completed: null }));
        } else {
          throw new Error("API không trả về dữ liệu hợp lệ");
        }
      } catch (error) {
        console.error("Error fetching completed comics:", error.message);
        
        // Dữ liệu mẫu tốt hơn
        const betterSampleData = [
          {
            id: "completed1",
            title: "Naruto",
            slug: "naruto",
            thumbnail: "https://i.imgur.com/uT95Kqa.jpg",
            status: "Hoàn thành",
            updated_at: new Date().toISOString(),
            genres: ["Action", "Adventure", "Martial Arts"]
          },
          {
            id: "completed2",
            title: "Death Note",
            slug: "death-note",
            thumbnail: "https://i.imgur.com/MVsgypD.jpg",
            status: "Hoàn thành",
            updated_at: new Date().toISOString(),
            genres: ["Mystery", "Psychological", "Thriller"]
          },
          {
            id: "completed3",
            title: "Fullmetal Alchemist",
            slug: "fullmetal-alchemist",
            thumbnail: "https://i.imgur.com/7F8cjTR.jpg",
            status: "Hoàn thành",
            updated_at: new Date().toISOString(),
            genres: ["Action", "Adventure", "Fantasy"]
          },
          {
            id: "completed4",
            title: "Slam Dunk",
            slug: "slam-dunk",
            thumbnail: "https://i.imgur.com/WkGnNHG.jpg",
            status: "Hoàn thành",
            updated_at: new Date().toISOString(),
            genres: ["Sports", "Comedy", "School Life"]
          }
        ];
        setCompletedComics(betterSampleData);
        setErrors(prev => ({ ...prev, completed: "Dùng dữ liệu mẫu - Không kết nối được API." }));
      } finally {
        setLoading(prev => ({ ...prev, completed: false }));
      }
    } catch (error) {
      console.error("Critical error in fetchCompletedComics:", error.message);
      setLoading(prev => ({ ...prev, completed: false }));
      setErrors(prev => ({ ...prev, completed: "Lỗi không xác định. Vui lòng thử lại sau." }));
    }
  };
  
  // Hàm tải lại các truyện khi gặp lỗi
  const retryFetchComics = (category) => {
    if (category === 'newest') {
      setLoading(prev => ({ ...prev, newest: true }));
      setErrors(prev => ({ ...prev, newest: null }));
      fetchNewestComics();
    } else if (category === 'trending') {
      setLoading(prev => ({ ...prev, trending: true }));
      setErrors(prev => ({ ...prev, trending: null }));
      fetchTrendingComics();
    } else if (category === 'completed') {
      setLoading(prev => ({ ...prev, completed: true }));
      setErrors(prev => ({ ...prev, completed: null }));
      fetchCompletedComics();
    }
  };
  
  // Chạy fetchNewestComics khi component được tạo
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        await fetchNewestComics();
      } catch (error) {
        console.error("Lỗi khi tải dữ liệu ban đầu:", error);
        // Đảm bảo có dữ liệu mẫu được hiển thị ngay cả khi gặp lỗi không mong muốn
        const fallbackData = [
          {
            id: "emergency1",
            title: "Vua Hải Tặc",
            slug: "vua-hai-tac",
            thumbnail: "https://i.imgur.com/PNVtQgY.jpg",
            status: "Đang cập nhật",
            updated_at: new Date().toISOString(),
            genres: ["Action", "Adventure"]
          },
          {
            id: "emergency2",
            title: "Ma Đạo Tổ Sư",
            slug: "ma-dao-to-su",
            thumbnail: "https://i.imgur.com/s2IjgFm.jpg",
            status: "Đang cập nhật",
            updated_at: new Date().toISOString(),
            genres: ["Fantasy", "Đam Mỹ"]
          }
        ];
        setNewestComics(fallbackData);
        setLoading(prev => ({ ...prev, newest: false }));
        setErrors(prev => ({ ...prev, newest: "Dùng dữ liệu khẩn cấp - Lỗi không xác định" }));
      }
    };
    
    loadInitialData();
  }, []);

  // Chạy fetchTrendingComics khi chuyển sang tab trending
  useEffect(() => {
    if (activeTab === "trending") {
      if (trendingComics.length === 0) {
        setLoading(prev => ({ ...prev, trending: true }));
      }
      fetchTrendingComics();
    }
  }, [activeTab, trendingComics.length]);

  // Chạy fetchCompletedComics khi chuyển sang tab completed
  useEffect(() => {
    if (activeTab === "completed") {
      if (completedComics.length === 0) {
        setLoading(prev => ({ ...prev, completed: true }));
      }
      fetchCompletedComics();
    }
  }, [activeTab, completedComics.length]);

  // Render danh sách truyện
  const renderComicsList = (comics, loadingState, errorMessage, retryCategory) => {
    if (loadingState) {
      return (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
        </div>
      );
    }

    if (errorMessage) {
      return (
        <ErrorMessage 
          message={errorMessage} 
          onRetry={() => retryFetchComics(retryCategory)} 
        />
      );
    }

    if (!comics || comics.length === 0) {
      return (
        <div className="text-center my-5">
          <p>Không có truyện nào.</p>
        </div>
      );
    }

    return (
      <Row className="comic-grid">
        {comics.map((comic, index) => (
          <Col xs={6} key={index} className="mb-3">
            <ComicCard comic={comic} />
          </Col>
        ))}
      </Row>
    );
  };

  return (
    <div className="mobile-home">
      <Helmet>
        <title>VCT-Truyện - Đọc truyện tranh online</title>
        <meta name="description" content="Đọc truyện tranh online, cập nhật nhanh nhất" />
      </Helmet>
      
      <MobileMenu />
      
      {/* Marquee thông báo bản quyền - moved to directly below the menu */}
      <div className="copyright-marquee-container">
        <div className="copyright-marquee">
          <span className="welcome-section">
            <FaHeart className="welcome-icon" /> <p className="mb-0" style={{ fontSize: "0.9rem", opacity: "0.8" }}>
              © {new Date().getFullYear()} OTruyen. Mọi bản quyền truyện và API đều thuộc về {" "}
              <a 
                href="https://otruyen.cc" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
                style={{ textDecoration: "none", fontWeight: "500" }}
              >
                OTruyen.CC
              </a>
              .
            </p>
          </span>
        </div>
      </div>
      
      <Container className="mobile-container">
        {/* Banner slider phổ biến */}
        <div className="mobile-banner">
          <h2>VCT-Truyện</h2>
          <p>Đọc truyện tranh online mới nhất</p>
        </div>
        
        {/* Tabs chuyển đổi giữa các loại truyện */}
        <Tabs
          activeKey={activeTab}
          onSelect={(k) => setActiveTab(k)}
          className="mobile-tabs mb-3"
        >
          <Tab eventKey="newest" title="Mới nhất">
            {renderComicsList(newestComics, loading.newest, errors.newest, 'newest')}
            <div className="text-center my-3">
              <Button 
                as={Link} 
                to="/dang-phat-hanh" 
                variant="outline-primary" 
                className="view-more-btn"
              >
                Xem thêm <BsArrowRight />
              </Button>
            </div>
          </Tab>
          
          <Tab eventKey="trending" title="Xu hướng">
            {renderComicsList(trendingComics, loading.trending, errors.trending, 'trending')}
            <div className="text-center my-3">
              <Button 
                as={Link} 
                to="/xu-huong" 
                variant="outline-primary" 
                className="view-more-btn"
              >
                Xem thêm <BsArrowRight />
              </Button>
            </div>
          </Tab>
          
          <Tab eventKey="completed" title="Hoàn thành">
            {renderComicsList(completedComics, loading.completed, errors.completed, 'completed')}
            <div className="text-center my-3">
              <Button 
                as={Link} 
                to="/hoan-thanh" 
                variant="outline-primary" 
                className="view-more-btn"
              >
                Xem thêm <BsArrowRight />
              </Button>
            </div>
          </Tab>
        </Tabs>
      </Container>
    </div>
  );
};

export default MobileHome; 