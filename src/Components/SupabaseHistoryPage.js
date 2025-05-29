import React, { useState, useEffect } from "react";
import { Container, ListGroup, Button, Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { supabase } from '../supabaseClient';
import { useAuth } from './Include/Authentication/SupabaseAuth';
import { Menu } from "./Include/Dau-trang_Chan-trang/Menu";
import { FaClock, FaTrash, FaBookOpen, FaUser, FaCheckCircle } from 'react-icons/fa';

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
              status
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

        <ListGroup>
          {history.map((item) => (
            <ListGroup.Item 
              key={item.id}
              className="d-flex align-items-center justify-content-between history-item px-2 py-3 mb-2"
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', background: '#fff', transition: 'box-shadow 0.2s' }}
            >
              <div className="d-flex align-items-center flex-grow-1">
                <div className="flex-grow-1">
                  <Link
                    to={`/comics/${item.slug}?highlight_chapter=${encodeURIComponent(item.chapter_name || item.chapter || "")}`}
                    className="text-decoration-none history-title"
                    style={{ fontSize: 18, fontWeight: 600, color: '#2d3a4a', lineHeight: 1.2 }}
                  >
                    {item.name}
                  </Link>
                  <div className="text-muted small mt-1 mb-1 d-flex flex-wrap gap-3">
                    <span><FaUser className="me-1" />{item.author || 'Không rõ'}</span>
                    <span><FaCheckCircle className="me-1 text-success" />{item.status || 'Đang cập nhật'}</span>
                  </div>
                  <div className="d-flex flex-wrap gap-3 align-items-center mt-1">
                    <span className="badge bg-info text-dark"><FaBookOpen className="me-1" />{item.chapter_name || item.chapter}</span>
                    <span className="text-secondary small"><FaClock className="me-1" />{new Date(item.last_read).toLocaleString("vi-VN")}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline-danger"
                size="sm"
                className="btn-remove-history ms-2"
                onClick={() => handleRemoveHistory(item.id)}
                style={{ opacity: 0, transition: 'opacity 0.2s' }}
              >
                <FaTrash />
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Container>
      <style>{`
        .history-item:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.10);
          border-color: #e0e0e0;
        }
        .history-item:hover .btn-remove-history {
          opacity: 1 !important;
        }
        .history-title:hover {
          color: #007bff !important;
          text-decoration: underline;
        }
        @media (max-width: 600px) {
          .history-item img { width: 36px !important; height: 48px !important; margin-right: 10px !important; }
          .history-title { font-size: 15px !important; }
        }
      `}</style>
    </>
  );
};

export default SupabaseHistoryPage; 