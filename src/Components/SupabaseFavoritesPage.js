import React, { useState, useEffect } from "react";
import { Container, ListGroup, Button, Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { supabase } from '../supabaseClient';
import { useAuth } from './Include/Authentication/SupabaseAuth';
import { Menu } from "./Include/Dau-trang_Chan-trang/Menu";
import { FaTrash, FaBookOpen, FaUser, FaCheckCircle } from 'react-icons/fa';

const SupabaseFavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useAuth();

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
        
        // Join với bảng comics để lấy thêm thông tin
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
              status
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

        <ListGroup>
          {favorites.map((favorite) => (
            <ListGroup.Item 
              key={favorite.id}
              className="d-flex align-items-center justify-content-between favorite-item px-2 py-3 mb-2"
              style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1px solid #f0f0f0', background: '#fff', transition: 'box-shadow 0.2s' }}
            >
              <div className="d-flex align-items-center flex-grow-1">
                <div className="flex-grow-1">
                  <Link
                    to={`/comics/${favorite.slug}`}
                    className="text-decoration-none favorite-title"
                    style={{ fontSize: 18, fontWeight: 600, color: '#2d3a4a', lineHeight: 1.2 }}
                  >
                    {favorite.name}
                  </Link>
                  <div className="text-muted small mt-1 mb-1 d-flex flex-wrap gap-3">
                    <span><FaUser className="me-1" />{favorite.author || 'Không rõ'}</span>
                    <span><FaCheckCircle className="me-1 text-success" />{favorite.status || 'Đang cập nhật'}</span>
                  </div>
                  <div className="d-flex flex-wrap gap-3 align-items-center mt-1">
                    <span className="text-secondary small">Thêm vào: {new Date(favorite.created_at).toLocaleDateString("vi-VN")}</span>
                  </div>
                </div>
              </div>
              <Button
                variant="outline-danger"
                size="sm"
                className="btn-remove-favorite ms-2"
                onClick={() => handleRemoveFavorite(favorite.slug)}
                style={{ opacity: 0, transition: 'opacity 0.2s' }}
              >
                <FaTrash />
              </Button>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Container>
      <style>{`
        .favorite-item:hover {
          box-shadow: 0 4px 16px rgba(0,0,0,0.10);
          border-color: #e0e0e0;
        }
        .favorite-item:hover .btn-remove-favorite {
          opacity: 1 !important;
        }
        .favorite-title:hover {
          color: #007bff !important;
          text-decoration: underline;
        }
        @media (max-width: 600px) {
          .favorite-title { font-size: 15px !important; }
        }
      `}</style>
    </>
  );
};

export default SupabaseFavoritesPage; 