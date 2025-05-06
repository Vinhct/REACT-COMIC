import React from 'react';
import { Card, Badge, Button, Nav } from 'react-bootstrap';
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
  handleShareMessenger,
  activeTab,
  setActiveTab,
  children // Thêm children prop để nhận nội dung từ parent
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
    <>
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

          {/* Navigation Tabs */}
          <Nav variant="tabs" className="mt-3">
            <Nav.Item>
              <Nav.Link 
                active={activeTab === "info"}
                onClick={() => setActiveTab("info")}
              >
                Thông tin
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === "chapters"}
                onClick={() => setActiveTab("chapters")}
              >
                Danh sách chương
              </Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link 
                active={activeTab === "comments"}
                onClick={() => setActiveTab("comments")}
              >
                Bình luận
              </Nav.Link>
            </Nav.Item>
          </Nav>
        </Card.Body>
      </Card>

      {/* Nội dung của tab */}
      {activeTab === "info" && (
        <Card className="shadow-sm border-0 mb-3">
          <Card.Body>
            {/* Thể loại */}
            <div className="category-section mb-3">
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
            <div className="comic-description">
              <h5 className="section-heading">Mô tả:</h5>
              <div
                className="description-content"
                dangerouslySetInnerHTML={{ __html: item.content }}
              ></div>
            </div>
            
            <p className="text-end text-muted mt-3 small">
              {"Cập nhật: " + (item.updatedAt || "Không có")}
            </p>
          </Card.Body>
        </Card>
      )}

      {/* Render children (MobileChapterList hoặc MobileCommentSection) dựa vào activeTab */}
      {activeTab !== "info" && children}
    </>
  );
};

export default MobileComicInfo; 