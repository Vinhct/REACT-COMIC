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

const MobileComicInfo = ({ 
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
      <Card className="shadow-sm border-0 mb-3">
        <Card.Body>
          <p>Không thể tải thông tin truyện. Vui lòng thử lại sau.</p>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="shadow-sm border-0 mb-3">
      <Card.Body className="p-0">
        <div className="mobile-comic-header">
          <img
            src={`https://img.otruyenapi.com/uploads/comics/${item.thumb_url}`}
            alt={item.name}
            className="mobile-comic-thumb"
          />
          <div className="mobile-comic-info">
            <h4 className="comic-title">{item.name || "Không có tên"}</h4>
            <p className="comic-alt-name">{"Tên Khác: " + (item.origin_name || "Không có")}</p>
            <p className="comic-author">{"Tác giả: " + (item.author || "Không có")}</p>
            <Badge bg="danger" className="text-uppercase mobile-status-badge">
              {item.status}
            </Badge>
            <div className="d-flex mt-2">
              <Button
                variant={isFavorite ? "danger" : "outline-danger"}
                onClick={handleToggleFavorite}
                className="mobile-action-btn me-2"
                size="sm"
              >
                {isFavorite ? (
                  <><FaHeart size={16} /> <span className="ms-1">Đã thích</span></>
                ) : (
                  <><FaRegHeart size={16} /> <span className="ms-1">Thích</span></>
                )}
              </Button>
              <Button
                variant="outline-primary"
                onClick={() => setShowShareOptions(!showShareOptions)}
                className="mobile-action-btn"
                size="sm"
              >
                <FaShareAlt size={16} /> <span className="ms-1">Chia sẻ</span>
              </Button>
            </div>
          </div>
        </div>

        {/* Thể loại */}
        <div className="comic-categories mt-3">
          <h5 className="section-heading">Thể loại:</h5>
          <div className="category-badges">
            {item.category && item.category.length > 0 ? (
              item.category.map((category, index) => (
                <Link
                  to={`/the-loai/${category.slug}`}
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
              <span className="text-muted">Chưa phân loại</span>
            )}
          </div>
        </div>

        {/* Mô tả */}
        <div className="comic-description mt-3">
          <h5 className="section-heading">Mô tả:</h5>
          <div
            className="description-content"
            dangerouslySetInnerHTML={{ __html: item.content }}
          ></div>
        </div>
        
        <p className="text-end text-muted mt-3 small">
          {"Cập nhật: " + (item.updatedAt || "Không có")}
        </p>

        {/* Popup chia sẻ */}
        {showShareOptions && (
          <div className="mobile-share-options">
            <h5 className="section-heading">Chia sẻ truyện này:</h5>
            <div className="share-buttons">
              <FacebookShareButton
                url={shareUrl}
                quote={shareDescription}
                hashtag="#TruyenHay"
                className="share-button"
              >
                <FacebookIcon size={40} round /> 
                <span>Facebook</span>
              </FacebookShareButton>
              
              <TwitterShareButton
                url={shareUrl}
                title={shareTitle}
                hashtags={["TruyenHay"]}
                className="share-button"
              >
                <TwitterIcon size={40} round /> 
                <span>Twitter</span>
              </TwitterShareButton>
              
              <FacebookMessengerShareButton
                url={shareUrl}
                appId="000000000000"
                className="share-button"
                onClick={handleShareMessenger}
              >
                <FacebookMessengerIcon size={40} round />
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
                      setShowShareOptions(false);
                    })
                    .catch((err) => {
                      console.error("Sao chép thất bại:", err);
                      toast.error("Thử lại không thành công");
                    });
                }}
                className="share-button"
              >
                <BsClipboard size={40} />
                <span>Sao chép liên kết</span>
              </Button>
            </div>
            
            <Button 
              variant="secondary" 
              className="w-100 mt-3"
              onClick={() => setShowShareOptions(false)}
            >
              Đóng
            </Button>
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MobileComicInfo; 