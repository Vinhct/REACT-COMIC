import React, { useEffect, useState } from 'react';
import { Card, Badge, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaHeart, FaRegHeart, FaShareAlt } from "react-icons/fa";
import { BsClipboard } from "react-icons/bs";
import { 
  FacebookShareButton, 
  TwitterShareButton, 
  FacebookIcon, 
  TwitterIcon, 
  FacebookMessengerIcon,
  FacebookMessengerShareButton 
} from "react-share";
import { toast } from "react-toastify";
import { supabase } from '../../../supabaseClient';

const ComicInfo = ({ 
  item, 
  isFavorite, 
  handleToggleFavorite, 
  showShareOptions, 
  setShowShareOptions,
  shareUrl,
  shareTitle,
  shareDescription,
  handleShareMessenger,
  loading
}) => {
  const [viewCount, setViewCount] = useState(0);

  // Lấy view count từ bảng comic_stats
  useEffect(() => {
    const fetchViewCount = async () => {
      if (item?.slug) {
        const { data, error } = await supabase
          .from('comic_stats')
          .select('view_count')
          .eq('comic_slug', item.slug)
          .single();
          
        if (!error && data) {
          setViewCount(data.view_count);
        }
      }
    };
    
    fetchViewCount();
  }, [item?.slug]);

  // Kiểm tra item tồn tại
  if (!item) {
    return (
      <Card className="shadow-lg border-0" style={{ backgroundColor: "#fdfdfd" }}>
        <Card.Body>
          <p>Không thể tải thông tin truyện. Vui lòng thử lại sau.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-lg border-0">
      <Card.Img
        variant="top"
        src={`https://img.otruyenapi.com/uploads/comics/${item.thumb_url}`}
        alt={item.name}
        className="rounded"
      />
      <Card.Body>
        <Card.Title className="text-center">
          {item.name || "No name"}
        </Card.Title>
        <Card.Subtitle className="mb-2 text-muted text-center">
          {"Tên Khác: " + (item.origin_name || "Không có")}
        </Card.Subtitle>
        <Card.Subtitle className="mb-2 text-muted text-center">
          {"Tác giả: " + (item.author || "Không có")}
        </Card.Subtitle>

        <Card.Text
          className="mt-3"
          dangerouslySetInnerHTML={{ __html: item.content }}
        ></Card.Text>

        <Card.Text>
          {item.category && item.category.length > 0 ? (
            item.category.map((category, index) => (
              <Link
                to={`/genre/${category.slug}`}
                key={index}
                style={{ textDecoration: "none" }}
              >
                <Badge
                  bg="info"
                  className="me-2 mb-1"
                >
                  {category.name}
                </Badge>
              </Link>
            ))
          ) : (
            <span className="text-muted">others</span>
          )}
        </Card.Text>
        <Card.Text>
          <span className="fw-bold">Trạng Thái: </span>
          <Badge bg="danger" className="text-uppercase">
            {item.status}
          </Badge>
        </Card.Text>
        <Card.Text>
          <span className="fw-bold">Lượt đọc: </span>
          <span>{viewCount || 0}</span>
        </Card.Text>

        <Card.Text className="text-end text-muted">
          {"Cập nhật: " + (item.updatedAt || "Không có")}
        </Card.Text>

        <div className="action-buttons">
          <Button
            variant={isFavorite ? "danger" : "outline-danger"}
            onClick={handleToggleFavorite}
            className="action-button"
            disabled={loading}
          >
            {loading ? (
              <Spinner
                as="span"
                animation="border"
                size="sm"
                role="status"
                aria-hidden="true"
              />
            ) : isFavorite ? (
              <FaHeart size={20} />
            ) : (
              <FaRegHeart size={20} />
            )}
          </Button>
          <div style={{ position: "relative" }}>
            <Button
              variant="outline-primary"
              onClick={() => setShowShareOptions(!showShareOptions)}
              className="action-button"
            >
              <FaShareAlt size={20} />
            </Button>
            {showShareOptions && (
              <div
                style={{
                  position: "absolute",
                  top: "100%",
                  left: 0,
                  background: "#fff",
                  border: "1px solid #ccc",
                  borderRadius: "10px",
                  padding: "15px",
                  zIndex: 1000,
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                }}
              >
                <FacebookShareButton
                  url={shareUrl}
                  quote={shareDescription}
                  hashtag="#TruyenHay"
                  className="w-100 d-flex align-items-center gap-2 p-2"
                  style={{ borderRadius: "8px" }}
                >
                  <FacebookIcon size={30} round /> 
                  <span>Facebook</span>
                </FacebookShareButton>
                <TwitterShareButton
                  url={shareUrl}
                  title={shareTitle}
                  hashtags={["TruyenHay"]}
                  className="w-100 d-flex align-items-center gap-2 p-2"
                  style={{ borderRadius: "8px" }}
                >
                  <TwitterIcon size={30} round /> 
                  <span>Twitter</span>
                </TwitterShareButton>
                <FacebookMessengerShareButton
                  className="w-100 d-flex align-items-center gap-2 p-2"
                  style={{ borderRadius: "8px" }}
                  onClick={handleShareMessenger}
                >
                  <FacebookMessengerIcon size={30} round />
                  <span>Messenger</span>
                </FacebookMessengerShareButton>
                <Button
                  variant="outline-secondary"
                  onClick={() => {
                    navigator.clipboard
                      .writeText(shareUrl)
                      .then(() => {
                        toast.success("Đã sao chép liên kết", {
                          autoClose: 1000,
                        });
                      })
                      .catch((err) => {
                        console.error("Sao chép thất bại:", err);
                        toast.error("Thử lại không thành công");
                      });
                  }}
                  className="w-100 d-flex align-items-center gap-2 p-2"
                  style={{ borderRadius: "8px" }}
                >
                  <BsClipboard size={30} />
                  <span>Sao chép liên kết</span>
                </Button>
              </div>
            )}
          </div>
        </div>
      </Card.Body>
    </Card>
  );
};

export default ComicInfo; 