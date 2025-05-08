import React, { useState, useEffect } from "react";
import {
  Navbar,
  Container,
  Nav,
  Button,
  Offcanvas,
  Form,
  InputGroup,
} from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import {
  BsSearch,
  BsHouseDoor,
  BsBookmark,
  BsGrid,
  BsClockHistory,
  BsPerson,
  BsTrophy,
  BsTicketPerforated,
} from "react-icons/bs";
import { useSupabaseAuth } from "../../Include/Authentication/SupabaseAuthContext";
import axios from "axios";
import "../styles/MobileMenu.css";

const MobileMenu = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [showMenu, setShowMenu] = useState(false);

  // Lấy thông tin người dùng từ Supabase context
  const {
    user: supabaseUser,
    loading: authLoading,
    signOut,
  } = useSupabaseAuth();

  // Cập nhật user state khi supabaseUser thay đổi
  useEffect(() => {
    if (!authLoading) {
      setUser(supabaseUser);
    }
  }, [supabaseUser, authLoading]);

  // Lấy danh sách thể loại
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get(
          "https://otruyenapi.com/v1/api/the-loai"
        );
        setCategories(response.data?.data?.items || []);
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    };
    fetchCategories();
  }, []);

  // Xử lý tìm kiếm
  const handleSearch = (event) => {
    event.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Chuyển hướng đến trang tìm kiếm mobile với query
    navigate(`/mobile/search?query=${encodeURIComponent(searchQuery.trim())}`);
    setSearchQuery("");
    setShowMenu(false);
  };

  // Xử lý đăng xuất
  const handleLogout = async () => {
    try {
      const { success, error } = await signOut();
      if (success) {
        console.log("Đăng xuất thành công");
        setShowMenu(false);
      } else {
        console.error("Đăng xuất thất bại:", error);
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Chuyển hướng đến trang tìm kiếm khi nhấp vào thanh tìm kiếm
  const goToSearchPage = () => {
    navigate('/mobile/search');
  };

  return (
    <>
      {/* Bottom Navigation */}
      <div className="mobile-bottom-nav">
        <Link to="/" className="mobile-nav-item">
          <BsHouseDoor />
          <span>Home</span>
        </Link>
        <Link to="/the-loai" className="mobile-nav-item">
          <BsGrid />
          <span>Thể loại</span>
        </Link>
        <Button
          onClick={() => setShowMenu(true)}
          className="mobile-nav-menu-btn"
        >
          <span className="mobile-menu-icon">☰</span>
        </Button>
        <Link to="/history" className="mobile-nav-item">
          <BsClockHistory />
          <span>Lịch sử</span>
        </Link>
        <Link to={user ? "/profile" : "/login"} className="mobile-nav-item">
          <BsPerson />
          <span>{user ? "Hồ sơ" : "Đăng nhập"}</span>
        </Link>
      </div>

      {/* Top Search Bar */}
      <Navbar className="mobile-top-nav" fixed="top">
        <Container fluid>
          <Link to="/" className="mobile-logo">
            <h1>VCT-Truyện</h1>
          </Link>
          <Form className="mobile-search-form" onSubmit={handleSearch}>
            <InputGroup className="pt-3">
              <Form.Control
                placeholder="Tìm truyện..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mobile-search-input"
                onClick={goToSearchPage}
              />
              <Button variant="outline-secondary" type="submit">
                <BsSearch />
              </Button>
            </InputGroup>
          </Form>
        </Container>
      </Navbar>

      {/* Off-canvas Menu */}
      <Offcanvas
        show={showMenu}
        onHide={() => setShowMenu(false)}
        placement="start"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Menu</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <Nav className="flex-column mobile-offcanvas-menu">
            <h5 className="menu-category">Truyện</h5>
            <Nav.Link as={Link} to="/" onClick={() => setShowMenu(false)}>
              Trang chủ
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="https://docs.otruyenapi.com/"
              onClick={() => setShowMenu(false)}
            >
              API
            </Nav.Link>

            <h5 className="menu-category mt-4">Thể loại</h5>
            <div className="mobile-category-grid">
              {categories.map((category, index) => (
                <Nav.Link
                  key={index}
                  as={Link}
                  to={`/the-loai/${category.slug}`}
                  onClick={() => setShowMenu(false)}
                  className="mobile-category-item"
                >
                  {category.name}
                </Nav.Link>
              ))}
            </div>

            <h5 className="menu-category mt-4">Đặc biệt</h5>
            <Nav.Link
              as={Link}
              to="/mobile/missions"
              onClick={() => setShowMenu(false)}
            >
              <BsTrophy className="me-2" /> Nhiệm vụ hàng ngày
            </Nav.Link>
            <Nav.Link
              as={Link}
              to="/mobile/lucky-wheel"
              onClick={() => setShowMenu(false)}
            >
              <BsTicketPerforated className="me-2" /> Vòng quay may mắn
            </Nav.Link>

            <h5 className="menu-category mt-4">Tài khoản</h5>
            {user ? (
              <>
                <div className="user-info-mobile">
                  <div className="user-avatar-container">
                    {user.user_metadata?.avatar_url ? (
                      <img
                        src={user.user_metadata.avatar_url}
                        alt="Avatar"
                        className="user-avatar-mobile"
                      />
                    ) : (
                      <BsPerson size={40} className="user-avatar-placeholder" />
                    )}
                  </div>
                  <div className="user-details-mobile">
                    <p className="user-name">
                      {user.user_metadata?.display_name || user.email}
                    </p>
                  </div>
                </div>
                <Nav.Link
                  as={Link}
                  to="/profile"
                  onClick={() => setShowMenu(false)}
                >
                  <BsPerson className="me-2" /> Hồ sơ cá nhân
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/favorites"
                  onClick={() => setShowMenu(false)}
                >
                  <BsBookmark className="me-2" /> Truyện đã lưu
                </Nav.Link>
                <Nav.Link
                  as={Link}
                  to="/history"
                  onClick={() => setShowMenu(false)}
                >
                  <BsClockHistory className="me-2" /> Lịch sử đọc
                </Nav.Link>

                <Button
                  variant="outline-danger"
                  className="mt-3"
                  onClick={handleLogout}
                >
                  Đăng xuất
                </Button>
              </>
            ) : (
              <div className="auth-buttons-mobile">
                <Button
                  as={Link}
                  to="/login"
                  variant="primary"
                  className="w-100 mb-2"
                  onClick={() => setShowMenu(false)}
                >
                  Đăng nhập
                </Button>
                <Button
                  as={Link}
                  to="/register"
                  variant="outline-primary"
                  className="w-100"
                  onClick={() => setShowMenu(false)}
                >
                  Đăng ký
                </Button>
              </div>
            )}
          </Nav>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default MobileMenu;
