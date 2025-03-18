// src/Components/Search.js
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
  Dropdown,
} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { Helmet } from "react-helmet";
import { Link, useSearchParams } from "react-router-dom";
import { Menu } from "./Include/Menu";
import { auth } from "./Include/Firebase";
import { signOut, onAuthStateChanged } from "firebase/auth";
import "./Include/responsive.css";

const Search = () => {
  const [searchParams] = useSearchParams();
  const query = searchParams.get("query");
  const [getdata, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [user, setUser] = useState(null);
  const itemsPerPage = 24;

  const defaultAvatar =
    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log(
          "Fetching search results for query:",
          query,
          "page:",
          currentPage
        );
        setLoading(true);
        const response = await axios.get(
          `https://otruyenapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(
            query
          )}&page=${currentPage}`,
          {
            headers: {
              Accept: "application/json",
            },
          }
        );
        console.log("API response:", response.data);
        setData(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Search error:", error.message);
        setError(error.message);
        setLoading(false);
      }
    };
    if (query) {
      fetchData();
    } else {
      setLoading(false);
      setError("Vui lòng nhập từ khóa tìm kiếm");
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, [query, currentPage]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;

  const items = getdata?.data?.items || [];
  const totalItems = getdata?.data?.params?.pagination?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const paginate = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  return (
    <>
      <Helmet>
        <title>{`Kết quả tìm kiếm: ${query || "Không có từ khóa"}`}</title>
      </Helmet>
      <Menu />

      <Container>
        <Row className="mb-4">
          <Col>
            <Card
              className="shadow border-0"
              style={{ backgroundColor: "#f8f9fa", marginTop: "15px" }}
            >
              <CardBody>
                <Card.Title className="text-primary fw-bold display-6">
                  Kết quả tìm kiếm: {query || "Không có từ khóa"}
                </Card.Title>
                <Card.Text className="text-muted">
                  {items.length > 0
                    ? `Tìm thấy ${totalItems} kết quả`
                    : "Không tìm thấy kết quả nào"}
                </Card.Text>
              </CardBody>
            </Card>
          </Col>
        </Row>
        <Row className="g-4">
          {items && items.length > 0 ? (
            items.map((item, index) => (
              <Col lg={3} md={4} sm={6} xs={12} key={index}>
                <Card className="shadow-sm border-0 h-100">
                  <Card.Img
                    variant="top"
                    src={`https://img.otruyenapi.com/uploads/comics/${item.thumb_url}`}
                    alt={item.name}
                    className="rounded-top"
                    style={{ height: "200px", objectFit: "cover" }}
                  />
                  <Card.Body className="d-flex flex-column">
                    <Card.Title
                      className="text-dark fw-bold text-truncate"
                      as={Link}
                      to={`/comics/${item.slug}`}
                      style={{ textDecoration: "none" }}
                    >
                      {item.name}
                    </Card.Title>
                    <Card.Text className="text-muted small">
                      {item.updatedAt || "Không có"}
                    </Card.Text>
                    <Card.Text>
                      {item.category && item.category.length > 0 ? (
                        item.category.map((category, index) => (
                          <Link
                            to={`/genre/${category.slug}`} // Liên kết đến trang thể loại
                            key={index}
                            style={{ textDecoration: "none" }}
                          >
                            <Badge
                              bg="info"
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
                Không tìm thấy nội dung nào
              </CardBody>
            </Col>
          )}
        </Row>
        {totalPages > 1 && (
          <Pagination className="justify-content-center mt-4">
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
          </Pagination>
        )}
      </Container>
    </>
  );
};

export default Search;
