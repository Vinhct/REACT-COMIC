import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  Form,
  Nav,
  Navbar,
  NavDropdown,
  Image,
  Dropdown,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { BsSearch, BsPersonCircle } from "react-icons/bs"; // Thêm biểu tượng người dùng
import { useSupabaseAuth } from "../Authentication/SupabaseAuthContext";
import logo from "../Logo/logo3.jpg";
import "./Menu.css";
import NotificationBell from '../NotificationBell';

export const Menu = () => {
  const navigate = useNavigate();
  const [getdata, setData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const items = getdata?.data?.items;
  const defaultAvatar =
    "https://via.placeholder.com/30/cccccc/ffffff?text=User"; // Thay đổi ảnh mặc định để kiểm tra

  // Lấy thông tin người dùng từ Supabase context
  const { user: supabaseUser, loading: authLoading, signOut } = useSupabaseAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log("Fetching genres...");
        const response = await axios.get(
          "https://otruyenapi.com/v1/api/the-loai"
        );
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

  // Cập nhật user state khi supabaseUser thay đổi
  useEffect(() => {
    if (!authLoading) {
      setUser(supabaseUser);
      if (supabaseUser) {
        console.log("Supabase user logged in:", {
          id: supabaseUser.id,
          email: supabaseUser.email,
          user_metadata: supabaseUser.user_metadata
        });
      } else {
        console.log("No Supabase user logged in");
      }
    }
  }, [supabaseUser, authLoading]);

  const handleSearch = (event) => {
    event.preventDefault();
    console.log("Search triggered with query:", searchQuery);
    if (!searchQuery.trim()) {
      console.log("Empty query, no navigation");
      return;
    }
    const searchUrl = `/tim-kiem?query=${encodeURIComponent(searchQuery)}`;
    console.log("Attempting to navigate to:", searchUrl);
    try {
      navigate(searchUrl);
      console.log("Navigation executed successfully");
      setSearchQuery("");
    } catch (error) {
      console.error("Navigation error:", error.message);
    }
  };

  const handleLogout = async () => {
    try {
      const { success, error } = await signOut();
      if (success) {
        console.log("Đăng xuất thành công");
      } else {
        console.error("Đăng xuất thất bại:", error);
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  console.log("Rendering Menu component with user:", user);

  return (
    <Navbar expand="lg" className="navbar shadow-lg mb-4" sticky="top">
      <Container>
        {/* Logo */}
        <Navbar.Brand as={Link} to="/" className="navbar-brand">
          <img
            src={logo}
            alt="Logo"
            style={{ height: "50px", width: "auto" }}
          />
        </Navbar.Brand>

        {/* Toggle Button */}
        <Navbar.Toggle aria-controls="basic-navbar-nav" />

        {/* Navbar Content */}
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto ms-auto">
            <Nav.Link
              as={Link}
              to="/dang-phat-hanh"
              className="nav-link gradient-text"
              style={{
                fontSize: "18px",
                textShadow: "0px 0px 1px rgba(255,255,255,0.2)",
              }}
            >
              Đang phát hành
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/hoan-thanh"
              className="nav-link gradient-text"
              style={{
                fontSize: "18px",
                textShadow: "0px 0px 1px rgba(255,255,255,0.2)",
              }}
            >
              Hoàn thành
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/sap-ra-mat"
              className="nav-link gradient-text"
              style={{
                fontSize: "18px",
                textShadow: "0px 0px 1px rgba(255,255,255,0.2)",
              }}
            >
              Sắp ra mắt
            </Nav.Link>

            <Nav.Link
              as={Link}
              to="/bang-xep-hang"
              className="nav-link gradient-text"
              style={{
                fontSize: "18px",
                textShadow: "0px 0px 1px rgba(255,255,255,0.2)",
              }}
            >
              Bảng Xếp Hạng
            </Nav.Link>

            <NavDropdown
              title={
                <span
                  className="gradient-text"
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    textShadow: "0px 0px 1px rgba(255,255,255,0.2)",
                  }}
                >
                  Thể loại
                </span>
              }
              id="basic-nav-dropdown"
            >
              {items && items.length > 0 ? (
                items.map((item, index) => (
                  <NavDropdown.Item
                    key={index}
                    as={Link}
                    to={`/genre/${item.slug}`}
                    className="dropdown-item-custom gradient-text"
                    style={{
                      fontSize: "16px",
                      fontWeight: "500",
                      padding: "8px 16px",
                    }}
                  >
                    {item.name}
                  </NavDropdown.Item>
                ))
              ) : (
                <NavDropdown.Item as={Link} to="/">
                  Mới Nhất
                </NavDropdown.Item>
              )}
            </NavDropdown>
          </Nav>

          <div className="d-flex align-items-center">
            {/* Search Bar */}
            <Form
              className="d-flex align-items-center position-relative search-form me-3"
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
                  e.preventDefault();
                }}
                onFocus={(e) => {
                  console.log("Focused on search input");
                  e.preventDefault();
                }}
                className="pe-4 rounded-pill search-input"
              />
              <BsSearch
                className="position-absolute top-50 end-0 translate-middle-y me-2 search-icon"
                style={{ cursor: "pointer" }}
                onClick={handleSearch}
              />
            </Form>

            {/* Login/Logout Buttons */}
            {user ? (
              <Nav.Item className="d-flex align-items-center">
                <NotificationBell />
                <Dropdown>
                  <Dropdown.Toggle
                    as="div"
                    className="d-flex align-items-center"
                    style={{ cursor: "pointer" }}
                  >
                    {user.user_metadata?.avatar_url ? (
                      <Image
                        src={user.user_metadata.avatar_url || defaultAvatar}
                        roundedCircle
                        width="30"
                        height="30"
                        className="user-avatar me-2"
                        alt="User avatar"
                        onError={(e) => {
                          e.target.src = defaultAvatar; // Fallback nếu ảnh không tải được
                          console.log(
                            "Image failed to load, using default avatar"
                          );
                        }}
                      />
                    ) : (
                      <BsPersonCircle
                        size={30}
                        className="me-2"
                        style={{ color: "#6366f1" }}
                      />
                    )}
                    <span className="gradient-text">
                      {user.user_metadata?.display_name || user.email || "Người dùng"}
                    </span>
                  </Dropdown.Toggle>
                  <Dropdown.Menu className="dropdown-menu">
                    <Dropdown.Item as={Link} to="/missions" className="dropdown-item-custom">
                      <i className="fas fa-tasks me-2"></i>Nhiệm vụ
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/lucky-wheel" className="dropdown-item-custom">
                      <i className="fas fa-dharmachakra me-2"></i>Vòng quay may mắn
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/history" className="dropdown-item-custom">
                      Lịch sử
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/favorites" className="dropdown-item-custom">
                      Yêu thích
                    </Dropdown.Item>
                    <Dropdown.Item as={Link} to="/buy-ad" className="dropdown-item-custom">
                      <i className="fas fa-ad me-2"></i>Mua gói quảng cáo
                    </Dropdown.Item>
                    <Dropdown.Item onClick={handleLogout} className="dropdown-item-custom gradient-text">
                      Đăng xuất
                    </Dropdown.Item>
                  </Dropdown.Menu>
                </Dropdown>
              </Nav.Item>
            ) : (
              <Nav.Item className="d-flex align-items-center">
                <Button
                  variant="outline-primary"
                  className="login-btn"
                  onClick={() => navigate("/login")}
                >
                  Đăng nhập
                </Button>
                <Button
                  variant="primary"
                  className="register-btn ms-2"
                  onClick={() => navigate("/register")}
                >
                  Đăng ký
                </Button>
              </Nav.Item>
            )}
          </div>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Menu;
