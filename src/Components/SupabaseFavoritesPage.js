import React, { useState, useEffect } from "react";
import { Container, ListGroup, Button, Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { supabase } from '../supabaseClient';
import { useAuth } from './Include/Authentication/SupabaseAuth';
import { Menu } from "./Include/Dau-trang_Chan-trang/Menu";

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
              className="d-flex justify-content-between align-items-center"
            >
              <div>
                <Link
                  to={`/comics/${favorite.slug}`}
                  className="text-decoration-none"
                >
                  <h5 className="mb-1">{favorite.name}</h5>
                </Link>
                <div className="text-muted small">
                  {favorite.author && <div>Tác giả: {favorite.author}</div>}
                  {favorite.status && <div>Trạng thái: {favorite.status}</div>}
                  <div>Thêm vào: {new Date(favorite.created_at).toLocaleDateString("vi-VN")}</div>
                </div>
              </div>
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => handleRemoveFavorite(favorite.slug)}
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

export default SupabaseFavoritesPage; 