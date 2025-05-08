// src/Components/Home.js
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
  Image,
  Spinner,
} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Menu } from "./Include/Dau-trang_Chan-trang/Menu";
import { auth } from "./Include/Authentication/Firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { Dropdown } from "react-bootstrap";
import "./Include/responsive.css";
import { BsArrowUp } from "react-icons/bs"; // Icon cho nút Back to Top

const HT = () => {
  const [getdata, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState(null);
  const itemsPerPage = 24;
  const [showBackToTop, setShowBackToTop] = useState(false); // Trạng thái hiển thị nút Back to Top

  // Ảnh mặc định
  const defaultAvatar =
    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `https://otruyenapi.com/v1/api/danh-sach/hoan-thanh?page=${currentPage}`
        );
        setData(response.data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };
    fetchData();

    

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [currentPage]);

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

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const items = getdata?.data?.items;
  const totalItems = getdata?.data?.params?.pagination?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  

  return (
    <>
      <Helmet>
        <title>{getdata.data?.seoOnPage?.titleHead}</title>
      </Helmet>
      <Menu />
      <Container className="py-4">
        {/* Tiêu đề và mô tả */}
        <Row className="mb-5">
          <Col>
            <Card
              className="shadow border-0"
              style={{
                background: "linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)",
                borderBottom: "3px solid #007bff",
                marginTop: "15px",
              }}
            >
              <CardBody>
                <Card.Title className="text-primary fw-bold display-5">
                  Truyện Hoàn Thành
                </Card.Title>
                <Card.Text className="text-muted lead">
                  {getdata.data?.seoOnPage?.descriptionHead}
                </Card.Text>
              </CardBody>
            </Card>
          </Col>
        </Row>

        {/* Danh sách truyện */}
        {loading ? (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải dữ liệu...</p>
          </div>
        ) : (
          <>
            <Row className="g-4">
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <Col lg={3} md={4} sm={6} xs={12} key={index}>
                    <Card
                      className="shadow-sm border-0 h-100 card-hover"
                      style={{ transition: "all 0.3s ease" }}
                    >
                      <Card.Img
                        variant="top"
                        src={`https://img.otruyenapi.com/uploads/comics/${item.thumb_url}`}
                        alt={item.name}
                        className="rounded-top"
                        style={{ height: "200px", objectFit: "cover" }}
                        loading="lazy" // Thêm lazy loading cho hình ảnh
                      />
                      <Card.Body className="d-flex flex-column">
                        <Card.Title
                          className="text-dark fw-bold text-truncate"
                          as={Link}
                          to={`/comics/${item.slug}`}
                          style={{ textDecoration: "none" }}
                        >
                          {item.name || "No name"}
                        </Card.Title>
                        <Card.Text className="text-muted small">
                          {item.updatedAt || "Không có"}
                        </Card.Text>
                        <Card.Text>
                          {item.category && item.category.length > 0 ? (
                            item.category.map((category, index) => (
                              <Link
                                to={`/genre/${category.slug}`}
                                key={index}
                                style={{ textDecoration: "none" }}
                              >
                                <Badge
                                  bg="primary" // Thay bg="info" thành bg="primary" để đồng bộ màu
                                  className="me-2 mb-1"
                                  style={{ cursor: "pointer" }}
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
                            className="w-100"
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
                  <CardBody className="text-center text-muted">
                    Không có truyện nào để hiển thị.
                  </CardBody>
                </Col>
              )}
            </Row>

            {/* Phân trang */}
            {totalPages > 1 && (
              <div className="pagination-wrapper mt-5">
                <Pagination className="justify-content-center">
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
                <div className="text-center mt-2 text-muted">
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
            className="back-to-top"
            onClick={scrollToTop}
            style={{
              position: "fixed",
              bottom: "20px",
              right: "20px",
              borderRadius: "50%",
              width: "50px",
              height: "50px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
            }}
          >
            <BsArrowUp size={24} />
          </Button>
        )}
      </Container>
    </>
  );
};

export default HT;
