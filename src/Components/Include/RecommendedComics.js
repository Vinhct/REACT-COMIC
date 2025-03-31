// src/Components/Include/RecommendedComics.js
import React from "react";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Card, Badge, Button } from "react-bootstrap";
import { FaFire } from "react-icons/fa";

const RecommendedComics = ({ comics }) => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 4,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    responsive: [
      {
        breakpoint: 1200,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  if (!comics || comics.length === 0) {
    return null;
  }

  return (
    <div className="recommended-comics mb-5">
      <h2 className="section-title mb-4">
        <FaFire className="me-2" style={{ color: "#ff416c" }} />
        Truyện Đề Cử
      </h2>
      <Slider {...settings}>
        {comics.map((comic, index) => (
          <div key={index} className="px-2">
            <Card className="comic-card shadow-sm border-0 h-100">
              <Card.Img
                variant="top"
                src={`https://img.otruyenapi.com/uploads/comics/${comic.thumb_url}`}
                alt={comic.name}
                className="card-img-top rounded-top"
                style={{ height: "200px", objectFit: "cover" }}
                loading="lazy"
              />
              <Card.Body className="d-flex flex-column">
                <Card.Title
                  className="card-title text-dark fw-bold text-truncate"
                  as={Link}
                  to={`/comics/${comic.slug}`}
                  style={{ textDecoration: "none" }}
                >
                  {comic.name || "No name"}
                </Card.Title>
                <Card.Text className="card-text-muted small">
                  {comic.updatedAt || "Không có"}
                </Card.Text>
                <Card.Text>
                  {comic.category && comic.category.length > 0 ? (
                    comic.category.slice(0, 2).map((category, idx) => (
                      <Link
                        to={`/genre/${category.slug}`}
                        key={idx}
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
                    to={`/comics/${comic.slug}`}
                  >
                    Chi Tiết
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </div>
        ))}
      </Slider>
    </div>
  );
};

export default RecommendedComics;
