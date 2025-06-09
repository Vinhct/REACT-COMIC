import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, ListGroup, Badge, Alert } from 'react-bootstrap';
import { FaBook, FaUsers, FaHeart, FaHistory, FaComments, FaStar, FaUserPlus, FaBell, FaCircle, FaMobile, FaDesktop } from 'react-icons/fa';
import { withAdminAuth } from './AdminContext';
import { supabase } from '../../supabaseClient';
import axios from 'axios';
import AdminLayout from './AdminLayout';
import { Bar, Pie } from 'react-chartjs-2';
import { Chart, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from 'chart.js';
import { Link } from 'react-router-dom';
import { useOnlineUsersCount } from '../../utils/useOnlineTracker';
import './Dashboard.css';

Chart.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const Dashboard = () => {
  const [stats, setStats] = useState({
    comics: 0,
    totalComicsAPI: 0,
    users: 0,
    favorites: 0,
    history: 0,
    comments: 0
  });
  const [topComics, setTopComics] = useState([]);
  const [newUsers, setNewUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const { stats: onlineStats, error: onlineError } = useOnlineUsersCount();

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        // Fetch tổng số truyện từ API
        let totalComicsAPI = 0;
        try {
          const response = await axios.get('https://otruyenapi.com/v1/api/home');
          if (response.data?.data?.params) {
            totalComicsAPI = response.data.data.params.pagination?.totalItems || 0;
          }
        } catch (error) {
          console.error('Error fetching API comics:', error);
        }
        // Fetch từ Supabase
        const [
          { count: comicsCount }, 
          { count: usersCount }, 
          { count: favoritesCount }, 
          { count: historyCount }, 
          { count: commentsCount },
          { data: usersData },
          { data: notificationsData },
          { data: statsData }
        ] = await Promise.all([
          supabase.from('comics').select('*', { count: 'exact', head: true }),
          supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
          supabase.from('favorites').select('*', { count: 'exact', head: true }),
          supabase.from('reading_history').select('*', { count: 'exact', head: true }),
          supabase.from('comments').select('*', { count: 'exact', head: true }),
          supabase.from('user_profiles').select('display_name,email,created_at').order('created_at', { ascending: false }).limit(5),
          supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(5),
          supabase.from('comic_stats').select('*').order('view_count', { ascending: false }).limit(5)
        ]);
        // Lấy thông tin truyện từ API dựa trên comic_slug
        const comicsData = [];
        for (const stat of statsData) {
          try {
            const searchResponse = await axios.get(`https://otruyenapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(stat.comic_slug)}`);
            const searchResults = searchResponse.data?.data?.items || [];
            const matchedComic = searchResults.find(comic => comic.slug === stat.comic_slug);
            if (matchedComic) {
              comicsData.push({
                ...stat,
                comic: {
                  name: matchedComic.name,
                  slug: matchedComic.slug,
                  thumb_url: matchedComic.thumb_url,
                  status: matchedComic.status,
                  category: matchedComic.category || []
                }
              });
            }
          } catch (apiError) {
            console.error(`Error fetching comic data for slug ${stat.comic_slug}:`, apiError);
          }
        }
        setStats({
          comics: comicsCount || 0,
          totalComicsAPI,
          users: usersCount || 0,
          favorites: favoritesCount || 0,
          history: historyCount || 0,
          comments: commentsCount || 0
        });
        setTopComics(comicsData || []);
        setNewUsers(usersData || []);
        setNotifications(notificationsData || []);
        // Chart data: giả lập số truyện mới theo tháng
        setChartData({
          labels: ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
          datasets: [
            {
              label: 'Truyện mới',
              data: [12, 19, 10, 15, 22, 30, 25],
              backgroundColor: '#36a2eb',
              borderRadius: 8
            }
          ]
        });
      } catch (error) {
        console.error('Error fetching stats:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const statsItems = [
    { 
      title: 'Đang online', 
      value: onlineStats.total_online || 0, 
      subValue: `${onlineStats.authenticated_online || 0} đã đăng nhập, ${onlineStats.guest_online || 0} khách`,
      icon: <FaCircle />, 
      color: '#28a745',
      gradient: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
      pulse: true
    },
    { 
      title: 'Tổng số truyện', 
      value: stats.comics, 
      subValue: stats.totalComicsAPI > 0 ? `${((stats.comics / stats.totalComicsAPI) * 100).toFixed(1)}% của API` : null,
      icon: <FaBook />, 
      color: '#ff6384',
      gradient: 'linear-gradient(135deg, #ff6384 0%, #ff9f40 100%)'
    },
    { 
      title: 'Người dùng', 
      value: stats.users, 
      icon: <FaUsers />, 
      color: '#36a2eb',
      gradient: 'linear-gradient(135deg, #36a2eb 0%, #4bc0c0 100%)'
    },
    { 
      title: 'Lượt yêu thích', 
      value: stats.favorites, 
      subValue: stats.users > 0 ? `${((stats.favorites / stats.users)).toFixed(1)} / người dùng` : null,
      icon: <FaHeart />, 
      color: '#4bc0c0',
      gradient: 'linear-gradient(135deg, #4bc0c0 0%, #36a2eb 100%)'
    },
    { 
      title: 'Lượt đọc', 
      value: stats.history, 
      subValue: stats.users > 0 ? `${((stats.history / stats.users)).toFixed(1)} / người dùng` : null,
      icon: <FaHistory />, 
      color: '#ffcd56',
      gradient: 'linear-gradient(135deg, #ffcd56 0%, #ff9f40 100%)'
    },
    { 
      title: 'Bình luận', 
      value: stats.comments, 
      subValue: stats.users > 0 ? `${((stats.comments / stats.users)).toFixed(1)} / người dùng` : null,
      icon: <FaComments />, 
      color: '#9966ff',
      gradient: 'linear-gradient(135deg, #9966ff 0%, #cc65fe 100%)'
    }
  ];

  return (
    <AdminLayout>
      <Container fluid className="p-4">
        <h2 className="mb-4">Dashboard</h2>
        <Row className="g-3 mb-4">
          {statsItems.map((item, index) => (
            <Col key={index} xxl={2} xl={3} lg={4} md={6} sm={12}>
              <Card
                className={`h-100 border-0 shadow-sm stat-card ${item.pulse ? 'online-pulse' : ''}`}
                style={{
                  borderRadius: 18,
                  background: item.gradient || 'linear-gradient(135deg, #6a82fb 0%, #21d4fd 100%)',
                  minHeight: 120,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                  cursor: 'pointer',
                }}
              >
                <Card.Body className="d-flex justify-content-between align-items-center p-3 position-relative">
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 28, color: '#fff', marginBottom: 2 }}>
                      {loading ? <Spinner animation="border" size="sm" /> : item.value.toLocaleString()}
                      {item.pulse && (
                        <FaCircle 
                          className="ms-2 text-white" 
                          style={{ 
                            fontSize: 8, 
                            animation: 'pulse 2s infinite',
                            filter: 'drop-shadow(0 0 4px rgba(255,255,255,0.8))'
                          }} 
                        />
                      )}
                    </div>
                    <div style={{ color: '#fff', fontSize: 15, fontWeight: 500 }}>{item.title}</div>
                    {item.subValue && (
                      <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: 13 }}>{item.subValue}</div>
                    )}
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      right: 18,
                      bottom: 16,
                      fontSize: 38,
                      color: 'rgba(255,255,255,0.18)',
                      pointerEvents: 'none',
                      zIndex: 0,
                    }}
                  >
                    {item.icon}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
        <Row className="mb-4">
          <Col lg={8} md={12} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-white fw-bold">Biểu đồ truyện mới theo tháng</Card.Header>
              <Card.Body>
                {chartData ? (
                  <Bar data={chartData} options={{
                    responsive: true,
                    plugins: { legend: { display: false } },
                    scales: { y: { beginAtZero: true } }
                  }} />
                ) : (
                  <Spinner animation="border" />
                )}
              </Card.Body>
            </Card>
          </Col>
          <Col lg={4} md={12} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-white fw-bold">Top truyện nổi bật</Card.Header>
              <ListGroup variant="flush">
                {topComics.length === 0 && <ListGroup.Item>Không có dữ liệu</ListGroup.Item>}
                {topComics.map((item, idx) => (
                  <ListGroup.Item key={item.comic_slug} className="d-flex align-items-center">
                    <img src={`https://img.otruyenapi.com/uploads/comics/${item.comic.thumb_url}`} alt={item.comic.name} style={{ width: 40, height: 56, objectFit: 'cover', borderRadius: 6, marginRight: 12 }} />
                    <div className="flex-grow-1">
                      <Link to={`/truyen/${item.comic.slug}`} className="fw-bold text-decoration-none text-dark">{item.comic.name}</Link>
                      <div className="text-muted" style={{ fontSize: 12 }}>Lượt xem: {item.view_count?.toLocaleString() || 0}</div>
                    </div>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          </Col>
        </Row>
        <Row>
          <Col lg={4} md={12} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-white fw-bold d-flex justify-content-between align-items-center">
                <span>Người dùng online</span>
                <Badge bg="success" className="d-flex align-items-center">
                  <FaCircle className="me-1" style={{ fontSize: 8 }} />
                  {onlineStats.total_online || 0}
                </Badge>
              </Card.Header>
              <ListGroup variant="flush">
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <FaUsers className="me-2 text-primary" />
                    <span>Đã đăng nhập</span>
                  </div>
                  <Badge bg="primary">{onlineStats.authenticated_online || 0}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <FaUserPlus className="me-2 text-secondary" />
                    <span>Khách</span>
                  </div>
                  <Badge bg="secondary">{onlineStats.guest_online || 0}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <FaMobile className="me-2 text-info" />
                    <span>Mobile</span>
                  </div>
                  <Badge bg="info">{onlineStats.mobile_online || 0}</Badge>
                </ListGroup.Item>
                <ListGroup.Item className="d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center">
                    <FaDesktop className="me-2 text-warning" />
                    <span>Desktop</span>
                  </div>
                  <Badge bg="warning">{onlineStats.desktop_online || 0}</Badge>
                </ListGroup.Item>
                {onlineError && (
                  <ListGroup.Item>
                    <Alert variant="danger" className="mb-0 py-2">
                      Lỗi tải dữ liệu online: {onlineError.message}
                    </Alert>
                  </ListGroup.Item>
                )}
              </ListGroup>
            </Card>
          </Col>
          <Col lg={4} md={12} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-white fw-bold">Người dùng mới</Card.Header>
              <ListGroup variant="flush">
                {newUsers.length === 0 && <ListGroup.Item>Không có dữ liệu</ListGroup.Item>}
                {newUsers.map((user, idx) => (
                  <ListGroup.Item key={user.email} className="d-flex align-items-center">
                    <FaUserPlus className="me-2 text-success" />
                    <div className="flex-grow-1">
                      <span className="fw-bold">{user.display_name || 'Ẩn danh'}</span>
                      <div className="text-muted" style={{ fontSize: 12 }}>{user.email}</div>
                    </div>
                    <Badge bg="light" text="dark">{new Date(user.created_at).toLocaleDateString()}</Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          </Col>
          <Col lg={4} md={12} className="mb-4">
            <Card className="h-100 shadow-sm">
              <Card.Header className="bg-white fw-bold">Thông báo hệ thống</Card.Header>
              <ListGroup variant="flush">
                {notifications.length === 0 && <ListGroup.Item>Không có thông báo</ListGroup.Item>}
                {notifications.slice(0, 4).map((noti, idx) => (
                  <ListGroup.Item key={noti.id} className="d-flex align-items-center">
                    <FaBell className="me-2 text-primary" />
                    <div className="flex-grow-1">
                      <span className="fw-bold" style={{ fontSize: 14 }}>{noti.title || 'Thông báo'}</span>
                      <div className="text-muted" style={{ fontSize: 12 }}>{noti.message}</div>
                    </div>
                    <Badge bg="light" text="dark" style={{ fontSize: 10 }}>{new Date(noti.created_at).toLocaleDateString()}</Badge>
                  </ListGroup.Item>
                ))}
              </ListGroup>
            </Card>
          </Col>
        </Row>
      </Container>
    </AdminLayout>
  );
};

export default withAdminAuth(Dashboard); 