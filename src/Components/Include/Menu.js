// src/Include/Menu.js
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Button, Container, Form, Nav, Navbar, NavDropdown } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { BsSearch } from "react-icons/bs"; // Import biểu tượng kính lúp từ React Icons

export const Menu = () => {
  const navigate = useNavigate();
  const [getdata, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const items = getdata?.data?.items;

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching genres...");
        const response = await axios.get("https://otruyenapi.com/v1/api/the-loai");
        setData(response.data);
        console.log("Genres loaded:", response.data);
      } catch (error) {
        console.error("Fetch error:", error.message);
        setData({ data: { items: [] } });
      }
    };
    fetchData().catch((err) => {
      console.error("Unhandled fetch error:", err.message);
    });
  }, []);

  const handleSearch = (event) => {
    event.preventDefault();
    console.log("Search triggered with query:", searchQuery);
    if (!searchQuery.trim()) {
      console.log("Empty query, no navigation");
      return;
    }
    const searchUrl = `/search?query=${encodeURIComponent(searchQuery)}`;
    console.log("Attempting to navigate to:", searchUrl);
    try {
      navigate(searchUrl);
      console.log("Navigation executed successfully");
      setSearchQuery("");
    } catch (error) {
      console.error("Navigation error:", error.message);
    }
  };

  console.log("Rendering Menu component");

  return (
    <div>
      <Navbar expand="lg" className="bg-body-tertiary">
        <Container>
          {/* Logo */}
          <Navbar.Brand as={Link} to="/" className="me-4 fw-bold">
            Home
          </Navbar.Brand>

          {/* Toggle Button */}
          <Navbar.Toggle aria-controls="basic-navbar-nav" />

          {/* Navbar Content */}
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/dang-phat-hanh" className="mx-2">
                Đang phát hành
              </Nav.Link>
              <Nav.Link as={Link} to="/hoan-thanh" className="mx-2">
                Hoàn thành
              </Nav.Link>
              <Nav.Link as={Link} to="/sap-ra-mat" className="mx-2">
                Sắp ra mắt
              </Nav.Link>
              <Nav.Link as={Link} to="/history" className="mx-2">
                Lịch sử
              </Nav.Link>
              <NavDropdown title="Thể loại" id="basic-nav-dropdown" className="mx-2">
                {items && items.length > 0 ? (
                  items.map((item, index) => (
                    <NavDropdown.Item key={index} as={Link} to={`/genre/${item.slug}`}>
                      {item.name}
                    </NavDropdown.Item>
                  ))
                ) : (
                  <NavDropdown.Item as={Link} to="/">Mới Nhất</NavDropdown.Item>
                )}
              </NavDropdown>
            </Nav>

            {/* Search Bar */}
            <Form
              className="d-flex align-items-center position-relative me-3"
              autoComplete="off"
              onSubmit={handleSearch}
            >
              <Form.Control
                type="text"
                name="keyword"
                placeholder="Tìm truyện, tác giả..."
                value={searchQuery}
                onChange={(e) => {
                  console.log("Input changed to:", e.target.value);
                  setSearchQuery(e.target.value);
                }}
                onClick={(e) => {
                  console.log("Clicked on search input");
                  e.preventDefault(); // Ngăn hành vi mặc định khi click
                }}
                onFocus={(e) => {
                  console.log("Focused on search input");
                  e.preventDefault(); // Ngăn hành vi mặc định khi focus
                }}
                className="pe-4 rounded-pill"
                style={{ minWidth: "250px", height: "40px" }}
              />
              <BsSearch
                className="position-absolute top-50 end-0 translate-middle-y me-2"
                style={{ cursor: "pointer", color: "#aaa" }}
                onClick={handleSearch}
              />
            </Form>
          </Navbar.Collapse>
        </Container>
      </Navbar>
    </div>
  );
};