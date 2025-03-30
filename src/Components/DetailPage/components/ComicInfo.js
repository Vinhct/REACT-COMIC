import React from 'react';
import { Card, Badge, Button } from 'react-bootstrap';
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

const ComicInfo = ({ 
  item, 
  isFavorite, 
  handleToggleFavorite, 
  showShareOptions, 
  setShowShareOptions,
  shareUrl,
  shareTitle,
  shareDescription,
  handleShareMessenger
}) => {
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
    <Card
      className="shadow-lg border-0"
      style={{ backgroundColor: "#fdfdfd" }}
    >
      <Card.Img
        variant="top"
        src={`https://img.otruyenapi.com/uploads/comics/${item.thumb_url}`}
        alt={item.name}
        className="rounded"
      />
      <Card.Body>
        <Card.Title className="text-dark fw-bold text-center">
          {item.name || "No name"}
        </Card.Title>
        <Card.Subtitle className="mb-2 text-muted text-center">
          {"Tên Khác: " + (item.origin_name || "Không có")}
        </Card.Subtitle>
        <Card.Subtitle className="mb-2 text-muted text-center">
          {"Tác giả: " + (item.author || "Không có")}
        </Card.Subtitle>

        <Card.Text
          className="mt-3 text-dark"
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
                  style={{ cursor: "pointer" }}
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

        <Card.Text className="text-end text-muted">
          {"Cập nhật: " + (item.updatedAt || "Không có")}
        </Card.Text>

        <div
          style={{ display: "flex", gap: "10px", marginTop: "10px" }}
          className="action-buttons"
        >
          <Button
            variant={isFavorite ? "danger" : "outline-danger"}
            onClick={handleToggleFavorite}
            className="action-button"
          >
            {isFavorite ? (
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
                  padding: "10px",
                  zIndex: 1000,
                  display: "flex",
                  flexDirection: "row",
                  gap: "5px",
                }}
              >
                <FacebookShareButton
                  url={shareUrl}
                  quote={shareDescription}
                  hashtag="#TruyenHay"
                >
                  <FacebookIcon size={24} round /> Facebook
                </FacebookShareButton>
                <TwitterShareButton
                  url={shareUrl}
                  title={shareTitle}
                  hashtags={["TruyenHay"]}
                >
                  <TwitterIcon size={24} round /> Twitter
                </TwitterShareButton>
                <FacebookMessengerShareButton>
                  <FacebookMessengerIcon
                    size={24}
                    variant="outline-success"
                    onClick={handleShareMessenger}
                    style={{ width: "100%" }}
                    round
                  />
                  Messenger
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
                  style={{
                    width: "100%",
                    padding: "1rem",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "none",
                    borderRadius: "8px",
                  }}
                  aria-label="Sao chép liên kết"
                >
                  <BsClipboard
                    size={24}
                    style={{ marginBottom: "4px" }}
                    title="Sao chép liên kết"
                  />
                  <span
                    style={{
                      fontSize: "12px",
                      color: "#2c3e50",
                      userSelect: "none",
                      fontWeight: 500,
                    }}
                  >
                    Copy
                  </span>
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