import React, { useState, useEffect } from "react";
import { Container, ListGroup, Button, Spinner, Alert } from "react-bootstrap";
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
              className="d-flex justify-content-between align-items-center"
            >
              <div>
                <Link
                  to={`/comics/${item.slug}?highlight_chapter=${encodeURIComponent(item.chapter_name || item.chapter || "")}`}
                  className="text-decoration-none"
                >
                  <h5 className="mb-1">{item.name}</h5>
                </Link>
                <div className="text-muted small">
                  {item.author && <div>Tác giả: {item.author}</div>}
                  {item.status && <div>Trạng thái: {item.status}</div>}
                  <div>Chapter: {item.chapter_name || item.chapter}</div>
                  <div>Đọc lúc: {new Date(item.last_read).toLocaleString("vi-VN")}</div>
                </div>
              </div>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleRemoveHistory(item.id)}
              >
                Xóa
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Container>
    </>
  );
};

export default SupabaseHistoryPage; 