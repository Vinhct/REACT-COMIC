import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Badge,
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Navbar,
  Nav,
  Pagination,
  Form,
  Image,
  Dropdown,
  Spinner,
} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import { Menu } from "./Include/Dau-trang_Chan-trang/Menu";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../Components/Include/Authentication/Firebase";
import "./Include/responsive.css";
import "./Include/Genre.css"; // Import the new Genre CSS file
import { BsArrowUp, BsBookmark, BsEye, BsGrid3X3, BsListUl, BsClock } from "react-icons/bs"; // Added more icons

export const Genre = () => {
  const { slug } = useParams();
  const [getdata, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const items = getdata?.data?.items;
  const [currentPage, setCurentPage] = useState(1);
  const itemsPerPage = 24;
  const [user, setUser] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [viewMode, setViewMode] = useState("grid"); // New state for grid/list view toggle

  const defaultAvatar =
    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://otruyenapi.com/v1/api/the-loai/${slug}?page=${currentPage}`
        );
        setData(response.data);
        setLoading(false);
      } catch (error) {
        setError("Không thể tải dữ liệu. Vui lòng thử lại sau.");
        setLoading(false);
      }
    };
    fetchData();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [slug, currentPage]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Xử lý hiển thị nút Back to Top khi cuộn
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Toggle view mode between grid and list
  const toggleViewMode = (mode) => {
    setViewMode(mode);
  };

  if (loading && !items) return (
    <div className="genre-loading">
      <Spinner animation="border" variant="primary" />
      <p>Đang tải dữ liệu...</p>
    </div>
  );
  
  if (error) return (
    <div className="genre-error">
      <p>{error}</p>
      <Button variant="primary" onClick={() => window.location.reload()}>
        Thử lại
      </Button>
    </div>
  );

  //tinh toan trang
  const totalItems = getdata?.data?.params?.pagination?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  //Lay so trang
  const paginate = (pageNumber) => {
    setCurentPage(pageNumber);
    // Scroll to top when changing page
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <Helmet>
        <title>{getdata.data?.seoOnPage?.titleHead || "Danh sách truyện tranh"}</title>
        <meta name="description" content={getdata.data?.seoOnPage?.descriptionHead || "Khám phá các truyện tranh hay"} />
      </Helmet>

      <Menu />

      <Container className="genre-container py-4">
        {/* Tiêu đề và mô tả */}
        <Row className="mb-4">
          <Col>
            <Card className="genre-header-card shadow border-0">
              <CardBody>
                <div className="d-flex justify-content-between align-items-center mb-3">
                  <Card.Title>
                    {getdata.data?.seoOnPage?.titleHead || "Danh sách truyện tranh"}
                  </Card.Title>
                  <div className="view-mode-toggle">
                    <Button 
                      variant={viewMode === "grid" ? "primary" : "light"} 
                      className="me-2 view-toggle-btn"
                      onClick={() => toggleViewMode("grid")}
                    >
                      <BsGrid3X3 />
                    </Button>
                    <Button 
                      variant={viewMode === "list" ? "primary" : "light"} 
                      className="view-toggle-btn"
                      onClick={() => toggleViewMode("list")}
                    >
                      <BsListUl />
                    </Button>
                  </div>
                </div>
                <Card.Text>
                  {getdata.data?.seoOnPage?.descriptionHead || "Khám phá danh sách truyện tranh hấp dẫn nhất phù hợp với sở thích của bạn."}
                </Card.Text>
                {totalItems > 0 && (
                  <div className="genre-stats">
                    <span className="genre-stat-item">
                      <BsBookmark className="genre-stat-icon" /> {totalItems} truyện
                    </span>
                    <span className="genre-stat-item">
                      <BsClock className="genre-stat-icon" /> Cập nhật mới nhất
                    </span>
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Danh sách truyện */}
        {loading ? (
          <div className="genre-loading">
            <Spinner animation="border" variant="primary" />
            <p>Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            {viewMode === "grid" ? (
              <Row className="g-4">
                {items && items.length > 0 ? (
                  items.map((item, index) => (
                    <Col lg={3} md={4} sm={6} xs={12} key={index}>
                      <Card className="genre-comic-card shadow-sm border-0 h-100">
                        <div className="card-img-container">
                          <Card.Img
                            variant="top"
                            className="card-img-top"
                            src={`https://img.otruyenapi.com/uploads/comics/${item.thumb_url}`}
                            alt={item.name}
                            loading="lazy"
                          />
                          {item.status && (
                            <span className="comic-status">{item.status}</span>
                          )}
                        </div>
                        <Card.Body className="d-flex flex-column">
                          <Card.Title
                            as={Link}
                            to={`/comics/${item.slug}`}
                            style={{ textDecoration: "none" }}
                          >
                            {item.name || "No name"}
                          </Card.Title>
                          <Card.Text className="card-text small d-flex align-items-center">
                            <BsClock className="me-1" /> {item.updatedAt || "Không có"}
                          </Card.Text>
                          <Card.Text>
                            {item.category && item.category.length > 0 ? (
                              item.category.slice(0, 3).map((category, index) => (
                                <Link
                                  to={`/genre/${category.slug}`}
                                  key={index}
                                  style={{ textDecoration: "none" }}
                                >
                                  <Badge
                                    bg="primary"
                                    className="badge me-2 mb-1"
                                  >
                                    {category.name}
                                  </Badge>
                                </Link>
                              ))
                            ) : (
                              <span className="text-muted">others</span>
                            )}
                          </Card.Text>
                          <div className="mt-auto">
                            <Button
                              variant="primary"
                              size="sm"
                              className="btn-primary w-100"
                              as={Link}
                              to={`/comics/${item.slug}`}
                            >
                              Chi Tiết
                            </Button>
                          </div>
                        </Card.Body>
                      </Card>
                    </Col>
                  ))
                ) : (
                  <Col>
                    <div className="genre-empty-state">
                      <p>Không có truyện nào để hiển thị.</p>
                    </div>
                  </Col>
                )}
              </Row>
            ) : (
              // List view
              <div className="list-view-container">
                {items && items.length > 0 ? (
                  items.map((item, index) => (
                    <Card className="list-comic-card shadow-sm border-0 mb-3" key={index}>
                      <Row className="g-0">
                        <Col xs={3} md={2}>
                          <Link to={`/comics/${item.slug}`}>
                            <Card.Img
                              className="list-card-img"
                              src={`https://img.otruyenapi.com/uploads/comics/${item.thumb_url}`}
                              alt={item.name}
                              loading="lazy"
                            />
                          </Link>
                        </Col>
                        <Col xs={9} md={10}>
                          <Card.Body>
                            <Card.Title
                              as={Link}
                              to={`/comics/${item.slug}`}
                              style={{ textDecoration: "none" }}
                              className="list-card-title"
                            >
                              {item.name || "No name"}
                            </Card.Title>
                            <div className="list-card-badges mb-2">
                              {item.category && item.category.length > 0 ? (
                                item.category.slice(0, 5).map((category, index) => (
                                  <Link
                                    to={`/genre/${category.slug}`}
                                    key={index}
                                    style={{ textDecoration: "none" }}
                                  >
                                    <Badge
                                      bg="primary"
                                      className="badge me-2 mb-1"
                                    >
                                      {category.name}
                                    </Badge>
                                  </Link>
                                ))
                              ) : (
                                <span className="text-muted">others</span>
                              )}
                            </div>
                            <Card.Text className="card-text small d-flex align-items-center mb-2">
                              <BsClock className="me-1" /> {item.updatedAt || "Không có"}
                              {item.status && (
                                <span className="ms-3 list-status-badge">{item.status}</span>
                              )}
                            </Card.Text>
                            <Button
                              variant="primary"
                              size="sm"
                              className="btn-primary"
                              as={Link}
                              to={`/comics/${item.slug}`}
                            >
                              Chi Tiết
                            </Button>
                          </Card.Body>
                        </Col>
                      </Row>
                    </Card>
                  ))
                ) : (
                  <div className="genre-empty-state">
                    <p>Không có truyện nào để hiển thị.</p>
                  </div>
                )}
              </div>
            )}

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="genre-pagination mt-5">
                <Pagination>
                  <Pagination.First
                    onClick={() => paginate(1)}
                    disabled={currentPage === 1}
                  />
                  <Pagination.Prev
                    onClick={() => currentPage > 1 && paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                  />
                  {Array.from({ length: totalPages }, (_, index) => {
                    const pageNumber = index + 1;
                    const rangeStart = Math.floor((currentPage - 1) / 5) * 5 + 1;
                    const rangeEnd = Math.min(rangeStart + 5 - 1, totalPages);
                    if (pageNumber >= rangeStart && pageNumber <= rangeEnd) {
                      return (
                        <Pagination.Item
                          key={pageNumber}
                          active={pageNumber === currentPage}
                          onClick={() => paginate(pageNumber)}
                        >
                          {pageNumber}
                        </Pagination.Item>
                      );
                    }
                    return null;
                  })}
                  <Pagination.Next
                    onClick={() =>
                      currentPage < totalPages && paginate(currentPage + 1)
                    }
                    disabled={currentPage === totalPages}
                  />
                  <Pagination.Last
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages}
                  />
                </Pagination>
                <div className="page-info">
                  Trang {currentPage} / {totalPages}
                </div>
              </div>
            )}
          </>
        )}

        {/* Nút Back to Top */}
        {showBackToTop && (
          <Button
            variant="primary"
            className="genre-back-to-top"
            onClick={scrollToTop}
          >
            <BsArrowUp size={24} />
          </Button>
        )}
      </Container>
    </>
  );
};
