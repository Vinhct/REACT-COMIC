import React, { useEffect, useState } from "react";
import { Container, Card, ListGroup, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { auth, db } from "../Components/Include/Authentication/Firebase";

import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  deleteDoc,
} from "firebase/firestore";

const FavoritesPage = () => {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const user = auth.currentUser;

  useEffect(() => {
    if (!user) {
      setError("Vui lòng đăng nhập để xem danh sách yêu thích!");
      setLoading(false);
      return;
    }

    const favoritesRef = collection(db, `users/${user.uid}/favorites`);
    const q = query(favoritesRef);
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const favoritesData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFavorites(favoritesData);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching favorites:", error);
        setError("Không thể tải danh sách yêu thích.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  const handleRemoveFavorite = async (favoriteId) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/favorites`, favoriteId));
    } catch (error) {
      console.error("Error removing favorite:", error);
      setError("Không thể xóa khỏi yêu thích.");
    }
  };

  const handleBack = () => {
    navigate(-1); // Quay lại trang trước
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>{error}</p>;

  return (
    <Container className="my-4">
      <Button
        variant="secondary"
        onClick={handleBack}
        style={{ marginBottom: "20px" }}
      >
        Quay lại
      </Button>

      <Card
        className="shadow-sm border-0"
        style={{ backgroundColor: "#f8f9fa" }}
      >
        <Card.Body>
          <Card.Title className="text-primary fw-bold text-center">
            Danh Sách Yêu Thích
          </Card.Title>
          {favorites.length > 0 ? (
            <ListGroup>
              {favorites.map((favorite) => (
                <ListGroup.Item
                  key={favorite.id}
                  className="d-flex justify-content-between align-items-center"
                >
                  <div>
                    <strong>{favorite.name}</strong>
                    <p>Slug: {favorite.slug}</p>
                  </div>
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => handleRemoveFavorite(favorite.id)}
                  >
                    Xóa
                  </Button>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p className="text-muted text-center">
              Bạn chưa thêm truyện nào vào yêu thích.
            </p>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default FavoritesPage;
