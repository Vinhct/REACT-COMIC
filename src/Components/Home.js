import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Badge,
  Card,
  CardBody,
  Col,
  Container,
  Row,
  Pagination,
} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";
import { Menu } from "./Include/Menu";
import "./Include/responsive.css";

const Home = () => {
  const [getdata, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 24;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `https://otruyenapi.com/v1/api/danh-sach/truyen-moi?page=${currentPage}`
        );
        setData(response.data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage]);

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
      <Menu /> {/* Sử dụng Menu trực tiếp, bao gồm logic đăng nhập/đăng xuất */}

      <Container>
        <Row className="mb-4">
          <Col>
            <Card
              className="shadow border-0"
              style={{ backgroundColor: "#f8f9fa" }}
            >
              <CardBody>
                <Card.Title className="text-primary fw-bold display-6">
                  {getdata.data?.seoOnPage?.titleHead}
                </Card.Title>
                <Card.Text className="text-muted">
                  {getdata.data?.seoOnPage?.descriptionHead}
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
                      {item.name || "No name"}
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
                No Content Available
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

export default Home;