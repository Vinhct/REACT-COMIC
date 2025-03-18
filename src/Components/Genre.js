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
} from "react-bootstrap";
import Button from "react-bootstrap/Button";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import { Menu } from "./Include/Menu";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../Components/Include/Firebase";
import "./Include/responsive.css";

export const Genre = () => {
  const { slug } = useParams();
  const [getdata, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const items = getdata?.data?.items;
  const [currentPage, setCurentPage] = useState(1);
  const itemsPerPage = 24;
  const [user, setUser] = useState(null);

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

  if (loading) return <p>Loading...</p>;
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

      <Container>
        <Row className="mb-4">
          <Col>
            <Card
              className="shadow border-0"
              style={{ backgroundColor: "#f8f9fa", marginTop: "15px" }}
            >
              <Card.Body>
                <Card.Title className="text-primary fw-bold display-6">
                  {getdata.data.seoOnPage.titleHead}
                </Card.Title>
                <Card.Text className="text-muted">
                  {getdata.data.seoOnPage.descriptionHead}
                </Card.Text>
              </Card.Body>
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
              <Card.Body className="text-center text-muted">
                No Content Available
              </Card.Body>
            </Col>
          )}
        </Row>
        {/*pagination Controls */}
        <Pagination className="pagination-container">
          {/* Nut nui */}
          <Pagination.Prev
            onClick={() => currentPage > 1 && paginate(currentPage - 1)}
            disabled={currentPage === 1}
          />

          {[...Array(totalPages)].map((_, index) => {
            const pageNumber = index + 1;

            const rangeStart = Math.floor((currentPage - 1) / 5) * 5 + 1; // ;lam tron
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

          {/* Nut tien */}
          <Pagination.Next
            onClick={() =>
              currentPage < totalPages && paginate(currentPage + 1)
            }
            disabled={currentPage === totalPages}
          />
        </Pagination>
      </Container>
    </>
  );
};
