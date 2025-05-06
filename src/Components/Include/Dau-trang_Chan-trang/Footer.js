// src/Components/Include/Footer.js
import React from "react";
import { Container, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { FaEnvelope, FaFacebook, FaTwitter, FaInstagram } from "react-icons/fa";
import "./../responsive.css";
import logo from "../Logo/logo3.jpg";

const Footer = () => {
  return (
    <footer className="footer bg-dark text-light py-5">
      <Container>
        <Row>
          {/* Phần Logo/Tên trang web */}
          <Col md={4} className="mb-4 mb-md-0">
          <img
            src={logo}
            alt="Logo"
            style={{ height: "200px", width: "auto" }} // Điều chỉnh kích thước logo
          />
          </Col>

          {/* Phần Liên kết nhanh */}
          <Col md={4} className="mb-4 mb-md-0">
            <h5 className="footer-heading mb-3">Liên kết nhanh</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <Link to="/truyen-moi" className="footer-link">
                  Truyện Mới
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/hoan-thanh" className="footer-link">
                  Truyện Hoàn Thành
                </Link>
              </li>
              <li className="mb-2">
                <Link to="/sap-ra-mat" className="footer-link">
                  Truyện Sắp Ra Mắt
                </Link>
              </li>
              <li className="mb-2">
                <Link to="https://docs.otruyenapi.com/" className="footer-link">
                  API truyện 
                </Link>
              </li>
            </ul>
          </Col>

          {/* Phần Liên hệ */}
          <Col md={4}>
            <h5 className="footer-heading mb-3">Liên hệ</h5>
            <ul className="list-unstyled">
              <li className="mb-2">
                <FaEnvelope className="me-2" />
                <a
                  href="mailto:support@otruyen.com"
                  className="footer-link"
                >
                  support@otruyen.com
                </a>
              </li>
              <li className="mb-2">
                <div className="d-flex gap-3">
                  <a
                    href="https://facebook.com"
                    className="footer-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaFacebook size={20} />
                  </a>
                  <a
                    href="https://twitter.com"
                    className="footer-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaTwitter size={20} />
                  </a>
                  <a
                    href="https://instagram.com"
                    className="footer-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <FaInstagram size={20} />
                  </a>
                </div>
              </li>
            </ul>
          </Col>
        </Row>

        {/* Phần bản quyền */}
        <Row className="mt-4 pt-4 border-top">
          <Col className="text-center">
            <p className="mb-0" style={{ fontSize: "0.9rem", opacity: "0.8" }}>
              © {new Date().getFullYear()} OTruyen. Mọi bản quyền truyện và API đều thuộc về {" "}
              <a 
                href="https://otruyen.cc" 
                target="_blank" 
                rel="noopener noreferrer"
                className="footer-link"
                style={{ textDecoration: "none", fontWeight: "500" }}
              >
                OTruyen.CC
              </a>
              .
            </p>
          </Col>
        </Row>
      </Container>
    </footer>
  );
};

export default Footer;