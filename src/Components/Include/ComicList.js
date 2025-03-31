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
  Container,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import "./Home.css";

const ComicList = ({
  items,
  loading,
  sectionTitle,
  limit,
  viewMoreLink,
}) => {
  const displayedItems = limit ? items?.slice(0, limit) : items;

  return (
    <Container className="px-1">
      {sectionTitle && (
        <h2 className="section-title">
          🔥 {sectionTitle}
        </h2>
      )}

      {loading ? (
        <div className="loading-spinner">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      ) : (
        <>
          <div className="row mx-n1">
            {displayedItems && displayedItems.length > 0 ? (
              displayedItems.map((item, index) => (
                <div className="col-lg-3 col-md-4 col-6 px-1 mb-2" key={index}>
                  <Card
                    className="comic-card shadow-sm border-0 h-100"
                  >
                    <Card.Img
                      variant="top"
                      src={`https://img.otruyenapi.com/uploads/comics/${item.thumb_url}`}
                      alt={item.name}
                      className="card-img-top rounded-top"
                      style={{ height: "200px", objectFit: "cover" }}
                      loading="lazy"
                    />
                    <Card.Body className="d-flex flex-column">
                      <Card.Title
                        className="card-title text-dark fw-bold text-truncate"
                        as={Link}
                        to={`/comics/${item.slug}`}
                        style={{ textDecoration: "none" }}
                      >
                        {item.name || "No name"}
                      </Card.Title>
                      <Card.Text className="card-text-muted small">
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
                                className="badge me-2 mb-1"
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
                          size="sm"
                          className="btn-detail w-100"
                          as={Link}
                          to={`/comics/${item.slug}`}
                        >
                          Chi Tiết
                        </Button>
                      </div>
                    </Card.Body>
                  </Card>
                </div>
              ))
            ) : (
              <div className="col-12">
                <CardBody className="text-center text-muted">
                  Không có truyện nào để hiển thị.
                </CardBody>
              </div>
            )}
          </div>

          {viewMoreLink && items && items.length > 0 && (
            <div className="text-center mt-4">
              <Button
                as={Link}
                to={viewMoreLink}
                className="view-more-btn"
              >
                Xem Thêm
              </Button>
            </div>
          )}
        </>
      )}
    </Container>
  );
};

export default ComicList;