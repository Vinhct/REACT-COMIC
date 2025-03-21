// src/Components/Include/ComicList.js
import React from "react";
import {
  Badge,
  Card,
  CardBody,
  Col,
  Row,
  Spinner,
  Button,
} from "react-bootstrap";
import { Link } from "react-router-dom";

const ComicList = ({
  items,
  loading,
  sectionTitle,
  limit,
  viewMoreLink,
}) => {
  const displayedItems = limit ? items?.slice(0, limit) : items;

  return (
    <>
      {sectionTitle && (
        <h2 className="section-title">
          🔥 {sectionTitle}
        </h2>
      )}

      {loading ? (
        <div className="text-center my-5">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          <Row className="g-4">
            {displayedItems && displayedItems.length > 0 ? (
              displayedItems.map((item, index) => (
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
                      loading="lazy"
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
                                bg="primary"
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

          {viewMoreLink && items && items.length > 0 && (
            <div className="text-center mt-4">
              <Button
                variant="outline-primary"
                as={Link}
                to={viewMoreLink}
                className="px-4 py-2"
              >
                Xem Thêm
              </Button>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default ComicList;