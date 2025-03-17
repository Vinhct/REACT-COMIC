import React, { useEffect, useState } from "react";
import axios from "axios";
import { Badge, Button, Card, CardBody, Col, Row } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";

const RelatedComics = ({ slug, categories }) => {
  const [relatedComics, setRelatedComics] = useState([]);
  const navigate = useNavigate(); // Sử dụng useNavigate để điều hướng

  useEffect(() => {
    const fetchRelatedComics = async () => {
      try {
        // Lấy thể loại đầu tiên để gọi API truyện liên quan
        const categorySlug = categories?.[0]?.slug;
        if (categorySlug) {
          console.log("Fetching related comics for category:", categorySlug);
          const relatedResponse = await axios.get(
            `https://otruyenapi.com/v1/api/the-loai/${categorySlug}?page=1`
          );
          console.log("Related Comics API Response:", relatedResponse.data);
          if (
            relatedResponse.data &&
            relatedResponse.data.data &&
            relatedResponse.data.data.items
          ) {
            setRelatedComics(relatedResponse.data.data.items);
          } else {
            setRelatedComics([]);
            console.warn("No items found in related comics response.");
          }
        } else {
          console.warn("No category slug found for related comics.");
          setRelatedComics([]);
        }
      } catch (relatedError) {
        console.error("Error fetching related comics:", relatedError.message);
        setRelatedComics([]);
      }
    };

    fetchRelatedComics();
  }, [categories]);

  // Hàm xử lý khi nhấp vào "Chi Tiết"
  const handleNavigate = (comicSlug) => {
    navigate(`/truyen/${comicSlug}`); // Điều hướng đến trang chi tiết
    window.scrollTo({ top: 0, behavior: "smooth" }); // Cuộn lên đầu trang
  };

  return (
    <Row className="mt-5">
      <Col>
        <h3 className="text-primary fw-bold">Truyện Liên Quan</h3>
        <Row className="g-4">
          {relatedComics && relatedComics.length > 0 ? (
            relatedComics
              .filter((comic) => comic.slug !== slug) // Loại bỏ truyện hiện tại
              .slice(0, 4) // Hiển thị tối đa 4 truyện
              .map((item, index) => (
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
                        onClick={() => handleNavigate(item.slug)} // Thêm onClick để cuộn lên đầu
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
                          onClick={() => handleNavigate(item.slug)} // Thêm onClick để cuộn lên đầu
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
                Không có truyện liên quan.
              </Card.Body>
            </Col>
          )}
        </Row>
      </Col>
    </Row>
  );
};

export default RelatedComics;
