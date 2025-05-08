import React, { useState, useEffect } from "react";
import { Container, Card, Button, Form, Alert, Spinner, Image, Tab, Tabs, Row, Col } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import { BsArrowLeft, BsPersonCircle, BsBookmark, BsClockHistory, BsGear, BsBell } from "react-icons/bs";
import { supabase } from "../../supabaseClient";
import { useSupabaseAuth } from "../Include/Authentication/SupabaseAuthContext";
import MobileMenu from "./Common/MobileMenu";
import "./styles/MobileProfile.css";

const MobileProfile = () => {
  const navigate = useNavigate();
  const { user, signOut, loading: authLoading } = useSupabaseAuth();
  const [profile, setProfile] = useState(null);
  const [activeKey, setActiveKey] = useState("profile");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [formData, setFormData] = useState({
    display_name: "",
    avatar_url: "",
    email: "",
  });
  const [favoriteStats, setFavoriteStats] = useState({
    count: 0,
    loading: true
  });
  const [historyStats, setHistoryStats] = useState({
    count: 0,
    loading: true
  });
  
  // Chuyển hướng nếu chưa đăng nhập
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);
  
  // Lấy thông tin profile khi component mount
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        setLoading(true);
        
        // Lấy dữ liệu từ bảng user_profiles
        const { data, error } = await supabase
          .from("user_profiles")
          .select("*")
          .eq("id", user.id)
          .single();
        
        if (error) {
          console.error("Error fetching profile:", error);
          // Nếu không có dữ liệu trong user_profiles, sử dụng dữ liệu từ user
          setProfile({
            id: user.id,
            display_name: user.user_metadata?.display_name || user.email?.split("@")[0],
            avatar_url: user.user_metadata?.avatar_url || null,
            email: user.email,
            created_at: user.created_at
          });
          
          setFormData({
            display_name: user.user_metadata?.display_name || user.email?.split("@")[0],
            avatar_url: user.user_metadata?.avatar_url || "",
            email: user.email
          });
        } else {
          setProfile(data);
          setFormData({
            display_name: data.display_name || "",
            avatar_url: data.avatar_url || "",
            email: data.email || ""
          });
        }
      } catch (err) {
        console.error("Unexpected error fetching profile:", err);
        setError("Không thể tải thông tin hồ sơ. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [user]);
  
  // Lấy số lượng truyện yêu thích
  useEffect(() => {
    const fetchFavoriteStats = async () => {
      if (!user) return;
      
      try {
        setFavoriteStats(prev => ({ ...prev, loading: true }));
        
        const { count, error } = await supabase
          .from("favorites")
          .select("*", { count: "exact" })
          .eq("user_id", user.id);
        
        if (error) throw error;
        
        setFavoriteStats({
          count: count || 0,
          loading: false
        });
      } catch (err) {
        console.error("Error fetching favorite stats:", err);
        setFavoriteStats({
          count: 0,
          loading: false
        });
      }
    };
    
    fetchFavoriteStats();
  }, [user]);
  
  // Lấy số lượng lịch sử đọc truyện
  useEffect(() => {
    const fetchHistoryStats = async () => {
      if (!user) return;
      
      try {
        setHistoryStats(prev => ({ ...prev, loading: true }));
        
        const { count, error } = await supabase
          .from("history")
          .select("*", { count: "exact" })
          .eq("user_id", user.id);
        
        if (error) throw error;
        
        setHistoryStats({
          count: count || 0,
          loading: false
        });
      } catch (err) {
        console.error("Error fetching history stats:", err);
        setHistoryStats({
          count: 0,
          loading: false
        });
      }
    };
    
    fetchHistoryStats();
  }, [user]);
  
  // Xử lý form thay đổi
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Cập nhật profile
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setUpdating(true);
      setError(null);
      setSuccess(null);
      
      // Cập nhật dữ liệu trong user_profiles
      const { error: profileError } = await supabase
        .from("user_profiles")
        .upsert({
          id: user.id,
          display_name: formData.display_name,
          avatar_url: formData.avatar_url,
          email: formData.email,
          updated_at: new Date()
        });
      
      if (profileError) throw profileError;
      
      // Cập nhật user_metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          display_name: formData.display_name,
          avatar_url: formData.avatar_url
        }
      });
      
      if (updateError) throw updateError;
      
      // Cập nhật state
      setProfile(prev => ({
        ...prev,
        display_name: formData.display_name,
        avatar_url: formData.avatar_url
      }));
      
      setSuccess("Thông tin hồ sơ đã được cập nhật thành công!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Error updating profile:", err);
      setError(err.message || "Không thể cập nhật hồ sơ. Vui lòng thử lại sau.");
    } finally {
      setUpdating(false);
    }
  };
  
  // Xử lý đăng xuất
  const handleLogout = async () => {
    try {
      const { success, error } = await signOut();
      if (success) {
        navigate("/login");
      } else {
        console.error("Sign out failed:", error);
        setError("Đăng xuất không thành công. Vui lòng thử lại.");
      }
    } catch (err) {
      console.error("Logout error:", err);
      setError("Đã xảy ra lỗi. Vui lòng thử lại sau.");
    }
  };
  
  // Nếu đang loading
  if (authLoading || loading) {
    return (
      <div className="mobile-profile">
        <MobileMenu />
        <Container className="mobile-container">
          <div className="text-center my-5 py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Đang tải thông tin...</p>
          </div>
        </Container>
      </div>
    );
  }
  
  // Render thông tin profile
  const renderProfileTab = () => {
    return (
      <div className="profile-info-container">
        <div className="text-center mb-4">
          {profile?.avatar_url ? (
            <Image 
              src={profile.avatar_url}
              alt="Avatar" 
              className="profile-avatar"
              roundedCircle
            />
          ) : (
            <BsPersonCircle size={80} className="profile-avatar-placeholder" />
          )}
          <h4 className="mt-3">{profile?.display_name || "Người dùng"}</h4>
          <p className="text-muted">{profile?.email}</p>
        </div>
        
        <Row className="profile-stats">
          <Col xs={6}>
            <Card className="stat-card">
              <Card.Body className="text-center">
                <BsBookmark className="stat-icon" />
                <h3>{favoriteStats.loading ? <Spinner animation="border" size="sm" /> : favoriteStats.count}</h3>
                <p>Truyện đã lưu</p>
                <Button 
                  as={Link} 
                  to="/favorites" 
                  variant="outline-primary" 
                  className="mt-2 w-100"
                  size="sm"
                >
                  Xem danh sách
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col xs={6}>
            <Card className="stat-card">
              <Card.Body className="text-center">
                <BsClockHistory className="stat-icon" />
                <h3>{historyStats.loading ? <Spinner animation="border" size="sm" /> : historyStats.count}</h3>
                <p>Lịch sử đọc</p>
                <Button 
                  as={Link} 
                  to="/history" 
                  variant="outline-primary" 
                  className="mt-2 w-100"
                  size="sm"
                >
                  Xem lịch sử
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <div className="mt-4">
          <Button 
            variant="danger" 
            className="w-100"
            onClick={handleLogout}
          >
            Đăng xuất
          </Button>
        </div>
      </div>
    );
  };
  
  // Render form chỉnh sửa
  const renderEditTab = () => {
    return (
      <>
        {error && (
          <Alert variant="danger" onClose={() => setError(null)} dismissible>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" onClose={() => setSuccess(null)} dismissible>
            {success}
          </Alert>
        )}
        
        <Form onSubmit={handleUpdateProfile}>
          <Form.Group className="mb-3">
            <Form.Label>Tên hiển thị</Form.Label>
            <Form.Control
              type="text"
              name="display_name"
              value={formData.display_name}
              onChange={handleChange}
              placeholder="Nhập tên hiển thị của bạn"
            />
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>URL Ảnh đại diện</Form.Label>
            <Form.Control
              type="text"
              name="avatar_url"
              value={formData.avatar_url}
              onChange={handleChange}
              placeholder="Nhập URL ảnh đại diện"
            />
            {formData.avatar_url && (
              <div className="my-2 text-center">
                <small>Xem trước:</small>
                <img 
                  src={formData.avatar_url} 
                  alt="Avatar Preview" 
                  className="avatar-preview"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://via.placeholder.com/100?text=Error";
                  }}
                />
              </div>
            )}
          </Form.Group>
          
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <Form.Control
              type="email"
              name="email"
              value={formData.email}
              disabled
              readOnly
            />
            <Form.Text className="text-muted">
              Email không thể thay đổi
            </Form.Text>
          </Form.Group>
          
          <Button 
            variant="primary" 
            type="submit" 
            className="w-100 mt-3"
            disabled={updating}
          >
            {updating ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang cập nhật...
              </>
            ) : "Cập nhật hồ sơ"}
          </Button>
        </Form>
      </>
    );
  };
  
  // Render tab cài đặt
  const renderSettingsTab = () => {
    return (
      <div className="settings-container">
        <Alert variant="info">
          Tính năng cài đặt đang được phát triển
        </Alert>
        
        <div className="setting-group">
          <h5>Giao diện ứng dụng</h5>
          <Form.Check
            type="switch"
            id="dark-mode-switch"
            label="Chế độ tối"
            className="mb-2"
          />
          <Form.Check
            type="switch"
            id="save-position-switch"
            label="Lưu vị trí đọc truyện"
            defaultChecked
            className="mb-2"
          />
        </div>
        
        <div className="setting-group">
          <h5>Thông báo</h5>
          <Form.Check
            type="switch"
            id="notification-new-chapter"
            label="Thông báo chương mới"
            className="mb-2"
          />
          <Form.Check
            type="switch"
            id="notification-updates"
            label="Thông báo cập nhật"
            className="mb-2"
          />
        </div>
      </div>
    );
  };
  
  return (
    <div className="mobile-profile">
      <MobileMenu />
      <Container className="mobile-container">
        <div className="d-flex align-items-center my-3">
          <Button as={Link} to="/" variant="link" className="p-0 me-2">
            <BsArrowLeft size={24} />
          </Button>
          <h4 className="m-0">Hồ sơ cá nhân</h4>
        </div>
        
        <Tabs
          activeKey={activeKey}
          onSelect={(k) => setActiveKey(k)}
          className="profile-tabs"
        >
          <Tab 
            eventKey="profile" 
            title={
              <span>
                <BsPersonCircle className="tab-icon" />
                <span className="tab-text">Hồ sơ</span>
              </span>
            }
          >
            {renderProfileTab()}
          </Tab>
          <Tab 
            eventKey="edit" 
            title={
              <span>
                <BsGear className="tab-icon" />
                <span className="tab-text">Chỉnh sửa</span>
              </span>
            }
          >
            {renderEditTab()}
          </Tab>
          <Tab 
            eventKey="settings" 
            title={
              <span>
                <BsBell className="tab-icon" />
                <span className="tab-text">Cài đặt</span>
              </span>
            }
          >
            {renderSettingsTab()}
          </Tab>
        </Tabs>
      </Container>
    </div>
  );
};

export default MobileProfile; 