import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import { FaBook, FaUsers, FaHeart, FaHistory, FaComments } from 'react-icons/fa';
import { withAdminAuth } from './AdminContext';
import { supabase } from '../../supabaseClient';
import axios from 'axios';
import AdminLayout from './AdminLayout';

const Dashboard = () => {
  const [stats, setStats] = useState({
    comics: 0,
    users: 0,
    favorites: 0,
    history: 0,
    comments: 0
  });
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // Fetch từ Supabase
        const [usersResult, favoritesResult, historyResult, commentsResult] = await Promise.all([
          supabase.from('auth.users').select('id', { count: 'exact', head: true }),
          supabase.from('favorites').select('id', { count: 'exact', head: true }),
          supabase.from('reading_history').select('id', { count: 'exact', head: true }),
          supabase.from('comments').select('id', { count: 'exact', head: true })
        ]);
        
        // Fetch từ API bên ngoài
        let comicsCount = 0;
        try {
          const response = await axios.get("https://otruyenapi.com/v1/api/danh-sach/truyen-moi?page=1");
          comicsCount = response.data?.data?.totalItems || 0;
        } catch (error) {
          console.error('Error fetching comics:', error);
          comicsCount = 0;
        }
        
        setStats({
          comics: comicsCount,
          users: usersResult.count || 0,
          favorites: favoritesResult.count || 0,
          history: historyResult.count || 0,
          comments: commentsResult.count || 0
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
    { title: 'Tổng số truyện', value: stats.comics, icon: <FaBook />, color: '#ff6384' },
    { title: 'Người dùng', value: stats.users, icon: <FaUsers />, color: '#36a2eb' },
    { title: 'Lượt yêu thích', value: stats.favorites, icon: <FaHeart />, color: '#4bc0c0' },
    { title: 'Lượt đọc', value: stats.history, icon: <FaHistory />, color: '#ffcd56' },
    { title: 'Bình luận', value: stats.comments, icon: <FaComments />, color: '#9966ff' }
  ];

  return (
    <AdminLayout>
      <Container fluid>
        <h2 className="mb-4">Dashboard</h2>
        
        {/* Stats Cards */}
        <Row className="mb-4">
          {statsItems.map((item, index) => (
            <Col key={index} lg={true} md={4} sm={6} className="mb-3">
              <Card>
                <Card.Body className="d-flex justify-content-between align-items-center">
                  <div>
                    <h3 className="mb-0">{loading ? '-' : item.value}</h3>
                    <Card.Text>{item.title}</Card.Text>
                  </div>
                  <div style={{ 
                    fontSize: '2.5rem', 
                    color: item.color,
                    opacity: 0.8
                  }}>
                    {item.icon}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </AdminLayout>
  );
};

export default withAdminAuth(Dashboard); 