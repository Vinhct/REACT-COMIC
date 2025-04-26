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
import { BsArrowUp } from "react-icons/bs"; // Icon cho nút Back to Top

export const Genre = () => {
  const { slug } = useParams();
  const [getdata, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const items = getdata?.data?.items;
  const [currentPage, setCurentPage] = useState(1);
  const itemsPerPage = 24;
  const [user, setUser] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false); // Trạng thái hiển thị nút Back to Top

  const defaultAvatar =
    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y"; // Ảnh mặc định

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `https://otruyenapi.com/v1/api/the-loai/${slug}?page=${currentPage}`
        );
        setData(response.data);
        setLoading(false);
        console.log(response);
      } catch (error) {
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

  if (loading) return (
    <div className="genre-loading">
      <Spinner animation="border" variant="primary" />
      <p>Đang tải dữ liệu...</p>
    </div>
  );
  if (error) return <p>Error : {error}</p>;

  //tinh toan trang
  const totalItems = getdata?.data?.params?.pagination?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  //Lay so trang
  const paginate = (pageNumber) => {
    setCurentPage(pageNumber);
  };

  return (
    <>
      <Helmet>
        <title>{getdata.data?.seoOnPage?.titleHead}</title>
      </Helmet>

      <Menu />

      <Container className="genre-container py-4">
        {/* Tiêu đề và mô tả */}
        <Row className="mb-5">
          <Col>
            <Card className="genre-header-card shadow border-0">
              <CardBody>
                <Card.Title>
                  {getdata.data?.seoOnPage?.titleHead}
                </Card.Title>
                <Card.Text>
                  {getdata.data?.seoOnPage?.descriptionHead}
                </Card.Text>
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
            <Row className="g-4">
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <Col lg={3} md={4} sm={6} xs={12} key={index}>
                    <Card className="genre-comic-card shadow-sm border-0 h-100">
                      <Card.Img
                        variant="top"
                        className="card-img-top"
                        src={`https://img.otruyenapi.com/uploads/comics/${item.thumb_url}`}
                        alt={item.name}
                        loading="lazy"
                      />
                      <Card.Body className="d-flex flex-column">
                        <Card.Title
                          as={Link}
                          to={`/comics/${item.slug}`}
                          style={{ textDecoration: "none" }}
                        >
                          {item.name || "No name"}
                        </Card.Title>
                        <Card.Text className="card-text small">
                          {item.updatedAt || "Không có"}
                        </Card.Text>
                        <Card.Text>
                          {item.category && item.category.length > 0 ? (
                            item.category.slice(0, 2).map((category, index) => (
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
