import React, { useState, useEffect } from "react";
import { Container, ListGroup, Button, Spinner, Alert, Card, Row, Col } from "react-bootstrap";
import { Link } from "react-router-dom";
import { supabase } from '../supabaseClient';
import { useAuth } from './Include/Authentication/SupabaseAuth';
import { Menu } from "./Include/Dau-trang_Chan-trang/Menu";

const SupabaseHistoryPage = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    const fetchHistory = async () => {
      if (!user) {
        setHistory([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const { data, error } = await supabase
          .from('reading_history')
          .select(`
            id,
            chapter,
            chapter_name,
            last_read,
            comics:slug (
              slug,
              name,
              author,
              status,
              thumbnail
            )
          `)
          .eq('user_id', user.id)
          .order('last_read', { ascending: false });

        if (error) {
          throw error;
        }

        // Transform data to include comic info
        const transformedData = data.map(history => {
          if (!history.comics) {
            console.warn(`Missing comic data for history ID: ${history.id}`);
            return null;
          }
          return {
            id: history.id,
            chapter: history.chapter,
            chapter_name: history.chapter_name,
            last_read: history.last_read,
            ...history.comics
          };
        }).filter(Boolean);

        setHistory(transformedData);
      } catch (err) {
        console.error("Error fetching history:", err);
        setError("Không thể tải lịch sử đọc. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();

    // Thiết lập realtime listener
    if (user) {
      const subscription = supabase
        .channel('history_changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'reading_history',
          filter: `user_id=eq.${user.id}`
        }, () => {
          console.log('History changed, refreshing...');
          fetchHistory();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  // Force style for title text
  useEffect(() => {
    const forceStyles = () => {
      const titleElements = document.querySelectorAll('.history-card-title, .history-card .card-title, .history-card a, .history-card .text-decoration-none');
      titleElements.forEach(el => {
        if (el) {
          el.style.setProperty('color', '#1a202c', 'important');
          el.style.setProperty('text-decoration', 'none', 'important');
          el.style.setProperty('font-weight', '700', 'important');
        }
      });
    };
    
    // Force styles after component renders
    setTimeout(forceStyles, 100);
    setTimeout(forceStyles, 500);
    setTimeout(forceStyles, 1000);
    
    // Also force on window load
    window.addEventListener('load', forceStyles);
    
    return () => {
      window.removeEventListener('load', forceStyles);
    };
  }, [history]);

  const handleRemoveHistory = async (id) => {
    if (!user) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('reading_history')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Optimistic update
      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Error removing history:", err);
      setError("Không thể xóa lịch sử. Vui lòng thử lại sau.");
    }
  };

  return (
    <>
      <Menu />
      <Container className="my-5">
        <h1 className="mb-4">Lịch sử đọc truyện</h1>

        {!user && (
          <Alert variant="info">
            Vui lòng <Link to="/login">đăng nhập</Link> để xem lịch sử đọc truyện của bạn.
          </Alert>
        )}

        {loading && (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải lịch sử đọc...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!loading && user && history.length === 0 && !error && (
          <Alert variant="warning">
            Bạn chưa có lịch sử đọc truyện nào.
          </Alert>
        )}

        <Row className="g-3">
          {history.map((item) => (
            <Col key={item.id} xs={12} sm={6} md={4} lg={3}>
              <Card className="history-card shadow-sm border-0 h-100 p-2 d-flex flex-column justify-content-between">
                <div>
                  <div className="history-card-img-wrap mb-2">
                    <Card.Img
                      src={
                        item.thumbnail
                          ? (item.thumbnail.startsWith('http')
                            ? item.thumbnail
                            : `https://img.otruyenapi.com/uploads/comics/${item.thumbnail}`)
                          : '/fallback-image.jpg'
                      }
                      alt={item.name}
                      className="history-card-img"
                      onError={e => { e.target.src = '/fallback-image.jpg'; }}
                    />
                  </div>
                  <Card.Body className="p-0">
                    <Link
                      to={`/comics/${item.slug}?highlight_chapter=${encodeURIComponent(item.chapter_name || item.chapter || "")}`}
                      className="text-decoration-none"
                      style={{ 
                        color: '#1a202c', 
                        textDecoration: 'none',
                        display: 'block'
                      }}
                    >
                      <Card.Title 
                        className="history-card-title mb-1 text-truncate"
                        style={{ 
                          color: '#1a202c', 
                          fontWeight: '700', 
                          fontSize: '1.1rem',
                          textDecoration: 'none',
                          margin: '0',
                          padding: '0'
                        }}
                      >
                        {item.name}
                      </Card.Title>
                    </Link>
                    <div className="text-muted small mb-1">
                      {item.author && <span className="me-2">Tác giả: {item.author}</span>}
                      {item.status && <span className="me-2">Trạng thái: {item.status}</span>}
                    </div>
                    <div className="text-secondary small mb-1">
                      <span>Chapter: {item.chapter_name || item.chapter}</span>
                    </div>
                    <div className="text-secondary small mb-2">
                      <span>Đọc lúc: {new Date(item.last_read).toLocaleString("vi-VN")}</span>
                    </div>
                  </Card.Body>
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="w-100 rounded-pill mt-2"
                  style={{ fontWeight: 500 }}
                  onClick={() => handleRemoveHistory(item.id)}
                >
                  Xóa
                </Button>
              </Card>
            </Col>
          ))}
        </Row>
      </Container>
    </>
  );
};

export default SupabaseHistoryPage; 