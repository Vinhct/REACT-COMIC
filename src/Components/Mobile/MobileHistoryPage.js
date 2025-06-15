import React, { useState, useEffect } from "react";
import { Container, Card, Button, Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { supabase } from '../../supabaseClient';
import { useAuth } from '../Include/Authentication/SupabaseAuth';
import MobileMenu from "./Common/MobileMenu";
import PageHeader from "./components/PageHeader";
import ErrorMessage from "./components/ErrorMessage";
import "./styles/MobileHistory.css";
import { BsTrash } from 'react-icons/bs';

const MobileHistoryPage = () => {
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

        if (error) throw error;

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

      setHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Error removing history:", err);
      setError("Không thể xóa lịch sử. Vui lòng thử lại sau.");
    }
  };

  if (!user) {
    return (
      <>
        <MobileMenu />
        <PageHeader title="Lịch sử đọc" />
        <Container className="mt-3">
          <Alert variant="info" className="text-center">
            Vui lòng <Link to="/login" className="alert-link">đăng nhập</Link> để xem lịch sử đọc truyện.
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <MobileMenu />
      <PageHeader title="Lịch sử đọc" />
      
      <Container className="mobile-history-container">
        {loading ? (
          <div className="text-center my-4">
            <Spinner animation="border" variant="primary" size="sm" />
            <p className="mt-2 small">Đang tải...</p>
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => window.location.reload()} />
        ) : history.length === 0 ? (
          <Alert variant="warning" className="text-center mt-3">
            Bạn chưa có lịch sử đọc truyện nào.
          </Alert>
        ) : (
          <div className="mobile-history-list">
            {history.map((item) => (
              <Card key={item.id} className="mobile-history-card">
                <div className="mobile-history-content">
                  <div className="mobile-history-thumb">
                    <img
                      src={
                        item.thumbnail
                          ? (item.thumbnail.startsWith('http')
                            ? item.thumbnail
                            : `https://img.otruyenapi.com/uploads/comics/${item.thumbnail}`)
                          : '/fallback-image.jpg'
                      }
                      alt={item.name}
                      onError={e => { e.target.src = '/fallback-image.jpg'; }}
                    />
                  </div>
                  <div className="mobile-history-info">
                    <Link 
                      to={`/comics/${item.slug}?highlight_chapter=${encodeURIComponent(item.chapter_name || item.chapter || "")}`} 
                      className="comic-title"
                    >
                      {item.name}
                    </Link>
                    <div className="comic-chapter">
                      Chapter: {item.chapter_name || item.chapter}
                    </div>
                    <div className="comic-meta">
                      <span className="time-read">
                        {new Date(item.last_read).toLocaleDateString("vi-VN")}
                      </span>
                      <Button
                        variant="link"
                        className="delete-btn"
                        onClick={() => handleRemoveHistory(item.id)}
                      >
                        <BsTrash />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </Container>
    </>
  );
};

export default MobileHistoryPage; 