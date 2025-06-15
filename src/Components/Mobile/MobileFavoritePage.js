import React, { useState, useEffect } from "react";
import { Container, Card, Button, Spinner, Alert } from "react-bootstrap";
import { Link } from "react-router-dom";
import { supabase } from '../../supabaseClient';
import { useAuth } from '../Include/Authentication/SupabaseAuth';
import MobileMenu from "./Common/MobileMenu";
import PageHeader from "./components/PageHeader";
import ErrorMessage from "./components/ErrorMessage";
import "./styles/MobileFavorite.css";
import { BsTrash, BsStar, BsStarFill } from 'react-icons/bs';

const MobileFavoritePage = () => {
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

        const { data, error } = await supabase
          .from('favorites')
          .select(`
            id,
            created_at,
            comics:slug (
              slug,
              name,
              author,
              status,
              thumbnail,
              description
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

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
        }).filter(Boolean);

        setFavorites(transformedData);
      } catch (err) {
        console.error("Error fetching favorites:", err);
        setError("Không thể tải danh sách yêu thích. Vui lòng thử lại sau.");
      } finally {
        setLoading(false);
      }
    };

    fetchFavorites();

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

  const handleRemoveFavorite = async (id) => {
    if (!user) return;

    try {
      setError(null);
      const { error } = await supabase
        .from('favorites')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setFavorites(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      console.error("Error removing favorite:", err);
      setError("Không thể xóa khỏi danh sách yêu thích. Vui lòng thử lại sau.");
    }
  };

  if (!user) {
    return (
      <>
        <MobileMenu />
        <PageHeader title="Truyện yêu thích" />
        <Container className="mt-3">
          <Alert variant="info" className="text-center">
            Vui lòng <Link to="/login" className="alert-link">đăng nhập</Link> để xem danh sách truyện yêu thích.
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <MobileMenu />
      <PageHeader title="Truyện yêu thích" />
      
      <Container className="mobile-favorite-container">
        {loading ? (
          <div className="text-center my-4">
            <Spinner animation="border" variant="primary" size="sm" />
            <p className="mt-2 small">Đang tải...</p>
          </div>
        ) : error ? (
          <ErrorMessage message={error} onRetry={() => window.location.reload()} />
        ) : favorites.length === 0 ? (
          <Alert variant="warning" className="text-center mt-3">
            Bạn chưa có truyện yêu thích nào.
          </Alert>
        ) : (
          <div className="mobile-favorite-list">
            {favorites.map((item) => (
              <Card key={item.id} className="mobile-favorite-card">
                <div className="mobile-favorite-content">
                  <div className="mobile-favorite-thumb">
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
                  <div className="mobile-favorite-info">
                    <Link to={`/comics/${item.slug}`} className="comic-title">
                      {item.name}
                    </Link>
                    <div className="comic-author">
                      {item.author || "Chưa cập nhật"}
                    </div>
                    <div className="comic-status">
                      Trạng thái: {item.status === 'Completed' ? 'Hoàn thành' : 'Đang tiến hành'}
                    </div>
                    <div className="comic-meta">
                      <span className="favorite-icon">
                        <BsStarFill className="text-warning" />
                      </span>
                      <Button
                        variant="link"
                        className="delete-btn"
                        onClick={() => handleRemoveFavorite(item.id)}
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

export default MobileFavoritePage; 