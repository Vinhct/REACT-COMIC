import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { supabase } from '../supabaseClient';
import { useAuth } from './Include/Authentication/SupabaseAuth';
import { Menu } from "./Include/Dau-trang_Chan-trang/Menu";

const SupabaseFavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  // Force style for title text
  useEffect(() => {
    const forceStyles = () => {
      const titleElements = document.querySelectorAll('.favorite-card-title, .favorite-card .card-title, .favorite-card a, .favorite-card .text-decoration-none');
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
  }, [favorites]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setFavorites([]);
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        setError(null);
        
        // Join với bảng comics để lấy thêm thông tin bao gồm thumbnail
        const { data, error } = await supabase
          .from('favorites')
          .select(`
            id,
            created_at,
            comics:slug (
              slug,
              name,
              description,
              author,
              status,
              thumbnail
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error("Database error:", error);
          throw new Error("Không thể tải danh sách yêu thích từ cơ sở dữ liệu");
        }

        if (!data) {
          throw new Error("Không nhận được dữ liệu từ cơ sở dữ liệu");
        }

        // Transform data to include comic info
        const transformedData = data.map(favorite => {
          if (!favorite.comics) {
            console.warn(`Missing comic data for favorite ID: ${favorite.id}`);
            return null;
          }
          return {
            id: favorite.id,
            created_at: favorite.created_at,
            ...favorite.comics
          };
        }).filter(Boolean); // Remove null entries

        setFavorites(transformedData);
      } catch (err) {
        console.error("Error in fetchFavorites:", err);
        setError(err.message || "Không thể tải danh sách yêu thích. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();

    // Thiết lập realtime listener
    if (user) {
      const subscription = supabase
        .channel('favorites_changes')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'favorites',
          filter: `user_id=eq.${user.id}`
        }, () => {
          console.log('Favorites changed, refreshing...');
          fetchFavorites();
        })
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const handleRemoveFavorite = async (slug) => {
    if (!user) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('slug', slug);

      if (error) {
        console.error("Delete error:", error);
        throw new Error("Không thể xóa khỏi danh sách yêu thích");
      }

      // Optimistic update
      setFavorites(prev => prev.filter(item => item.slug !== slug));
    } catch (err) {
      console.error("Error in handleRemoveFavorite:", err);
      setError(err.message || "Không thể xóa khỏi danh sách yêu thích. Vui lòng thử lại sau.");
    }
  };

  return (
    <>
      <Menu />
      <Container className="my-5">
        <h1 className="mb-4">Truyện yêu thích</h1>

        {!user && (
          <Alert variant="info">
            Vui lòng <Link to="/login">đăng nhập</Link> để xem danh sách truyện yêu thích của bạn.
          </Alert>
        )}

        {loading && (
          <div className="text-center my-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-2">Đang tải danh sách yêu thích...</p>
          </div>
        )}

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {!loading && user && favorites.length === 0 && !error && (
          <Alert variant="warning">
            Bạn chưa có truyện yêu thích nào. Hãy khám phá và thêm truyện vào danh sách yêu thích của bạn!
          </Alert>
        )}

        <Row className="g-3">
          {favorites.map((favorite) => (
            <Col key={favorite.id} xs={12} sm={6} md={4} lg={3}>
              <Card className="favorite-card shadow-sm border-0 h-100 p-2 d-flex flex-column justify-content-between">
                <div>
                  <div className="favorite-card-img-wrap mb-2">
                    <Card.Img
                      src={
                        favorite.thumbnail
                          ? (favorite.thumbnail.startsWith('http')
                            ? favorite.thumbnail
                            : `https://img.otruyenapi.com/uploads/comics/${favorite.thumbnail}`)
                          : '/fallback-image.jpg'
                      }
                      alt={favorite.name}
                      className="favorite-card-img"
                      onError={e => { e.target.src = '/fallback-image.jpg'; }}
                    />
                  </div>
                  <Card.Body className="p-0">
                    <Link
                      to={`/comics/${favorite.slug}`}
                      className="text-decoration-none"
                      style={{ 
                        color: '#1a202c', 
                        textDecoration: 'none',
                        display: 'block'
                      }}
                    >
                      <Card.Title 
                        className="favorite-card-title mb-1 text-truncate"
                        style={{ 
                          color: '#1a202c', 
                          fontWeight: '700', 
                          fontSize: '1.1rem',
                          textDecoration: 'none',
                          margin: '0',
                          padding: '0'
                        }}
                      >
                        {favorite.name}
                      </Card.Title>
                    </Link>
                    <div className="text-muted small mb-1">
                      {favorite.author && <span className="me-2">Tác giả: {favorite.author}</span>}
                      {favorite.status && <span className="me-2">Trạng thái: {favorite.status}</span>}
                    </div>
                    <div className="text-secondary small mb-2">
                      <span>Thêm vào: {new Date(favorite.created_at).toLocaleDateString("vi-VN")}</span>
                    </div>
                  </Card.Body>
                </div>
                <Button
                  variant="outline-danger"
                  size="sm"
                  className="w-100 rounded-pill mt-2"
                  style={{ fontWeight: 500 }}
                  onClick={() => handleRemoveFavorite(favorite.slug)}
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

export default SupabaseFavoritesPage; 