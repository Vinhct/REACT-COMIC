// src/Components/RecommendedComics.js
import React, { useEffect, useState } from "react";
import { Card, Col, Row } from "react-bootstrap";
import { Link } from "react-router-dom";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import "../Include/responsive.css";

const RecommendedComics = ({ comics }) => {
  // Hàm chọn ngẫu nhiên 10 truyện từ danh sách
  const getRandomComics = (comicsList, count) => {
    if (!comicsList || comicsList.length === 0) return [];

    // Tạo một bản sao của danh sách để không làm thay đổi danh sách gốc
    const shuffled = [...comicsList];
    const len = shuffled.length;

    // Thuật toán Fisher-Yates để xáo trộn danh sách
    for (let i = len - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]; // Swap
    }

    // Trả về 10 truyện đầu tiên từ danh sách đã xáo trộn (hoặc ít hơn nếu danh sách không đủ 10 truyện)
    return shuffled.slice(0, Math.min(count, len));
  };

  // Chọn ngẫu nhiên 10 truyện
  const randomComics = getRandomComics(comics, 10);

  // Cấu hình responsive cho slider
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 1000,
    slidesToShow: 5,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    arrows: true,
    pauseOnHover: true,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 3,
          slidesToScroll: 1,
          arrows: false,
        },
      },
      {
        breakpoint: 768,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          arrows: false,
        },
      },
      {
        breakpoint: 576,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
          arrows: false,
        },
      },
    ],
  };

  return (
    <Row className="mb-5">
      <Col>
        <h2
          className="fw-bold mb-4 text-uppercase"
          style={{
            background: "linear-gradient(to right, #ff416c, rgb(255, 128, 43))",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            fontSize: "20px",
            textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
            paddingTop: "20px",
            marginBottom: "30px",
          }}
        >
          🔥 Truyện Đề Cử
        </h2>

        {randomComics && randomComics.length > 0 ? (
          <Slider {...sliderSettings}>
            {randomComics.map((item, index) => (
              <div key={index} className="px-3">
                <Card className="shadow-sm border-0 card-hover">
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
                      className="fw-bold text-truncate"
                      as={Link}
                      to={`/comics/${item.slug}`}
                      style={{
                        textDecoration: "none",
                        background:
                          "linear-gradient(to right, #ff416c, rgb(255, 128, 43))",
                        WebkitBackgroundClip: "text",
                        WebkitTextFillColor: "transparent",
                        fontSize: "15px",
                        textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
                      }}
                    >
                      {item.name || "No name"}
                    </Card.Title>
                  </Card.Body>
                </Card>
              </div>
            ))}
          </Slider>
        ) : (
          <div className="text-center text-muted">
            Không có truyện đề cử để hiển thị.
          </div>
        )}
      </Col>
    </Row>
  );
};

export default RecommendedComics;
