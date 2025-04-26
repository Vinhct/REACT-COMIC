import React, { useEffect, useState } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { BsBookmark, BsBookmarkFill } from 'react-icons/bs';
import "../styles/ComicCard.css";

// Component hiển thị truyện
const ComicCard = ({ comic }) => {
  const [bookmarked, setBookmarked] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Xử lý đường dẫn ảnh
  const getImageUrl = () => {
    if (!comic.thumbnail) return "/fallback-image.jpg";
    
    // Kiểm tra nếu thumbnail đã là URL đầy đủ
    if (comic.thumbnail.startsWith('http')) {
      return comic.thumbnail;
    }
    
    // Nếu không, thêm prefix đúng
    return `https://img.otruyenapi.com/uploads/comics/${comic.thumbnail}`;
  };

  useEffect(() => {
    // Kiểm tra xem truyện có trong danh sách bookmark không
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    setBookmarked(favorites.some(item => item.id === comic.id));
  }, [comic.id]);

  const toggleBookmark = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    const favorites = JSON.parse(localStorage.getItem("favorites") || "[]");
    
    if (bookmarked) {
      const newFavorites = favorites.filter(item => item.id !== comic.id);
      localStorage.setItem("favorites", JSON.stringify(newFavorites));
    } else {
      favorites.push(comic);
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
    
    setBookmarked(!bookmarked);
  };

  // Chọn một genre ngẫu nhiên để hiển thị nếu có
  const displayGenre = comic.genres && comic.genres.length > 0 
    ? comic.genres[Math.floor(Math.random() * comic.genres.length)]
    : null;

  return (
    <Card className="mobile-comic-card h-100">
      <Link to={`/comics/${comic.slug}`} style={{ textDecoration: "none" }}>
        <div className="comic-card-image-container">
          <Card.Img
            variant="top"
            src={imageError ? "/fallback-image.jpg" : getImageUrl()}
            alt={comic.title}
            className="comic-card-image"
            onError={() => setImageError(true)}
          />
          <div 
            className="bookmark-icon" 
            onClick={toggleBookmark}
          >
            {bookmarked ? 
              <BsBookmarkFill size={20} color="#ec4899" /> : 
              <BsBookmark size={20} color="white" />
            }
          </div>
        </div>
        <Card.Body className="p-2">
          <Card.Title className="comic-card-title">
            {comic.title || "Không có tên"}
          </Card.Title>
          <div className="comic-card-genres">
            {comic.genres && comic.genres.length > 0 ? (
              comic.genres.slice(0, 2).map((genre, idx) => (
                <Badge
                  bg="primary"
                  key={idx}
                  className="me-1 comic-card-badge"
                >
                  {genre.name || genre}
                </Badge>
              ))
            ) : null}
          </div>
          <div className="comic-card-footer">
            <small className="text-muted">
              {comic.updated_at ? `Cập nhật: ${new Date(comic.updated_at).toLocaleDateString()}` : ""}
            </small>
            <small className={`status-badge ${comic.status === "Đang cập nhật" ? "ongoing" : "completed"}`}>
              {comic.status || "N/A"}
            </small>
          </div>
        </Card.Body>
      </Link>
    </Card>
  );
};

export default ComicCard; 