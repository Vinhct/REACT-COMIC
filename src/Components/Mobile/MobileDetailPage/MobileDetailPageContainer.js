import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import { Button, Container, Alert, Spinner, Card, Row, Col, Badge } from "react-bootstrap";
import { auth, db } from "../../Include/Authentication/Firebase";
import MobileMenu from "../Common/MobileMenu";
import "../styles/MobileDetailPage.css";
import { BsArrowLeft, BsBookmark, BsBookmarkFill, BsShare } from "react-icons/bs";
import { useSupabaseAuth } from "../../Include/Authentication/SupabaseAuthContext";

// Import hooks từ phiên bản desktop
import {
  useComicData,
  useChapterViewer,
  useSupabaseComments,
  useSupabaseFavorites,
  useSupabaseHistory
} from "../../DetailPage/hooks";

// Import components con
import MobileComicInfo from "./components/MobileComicInfo";
import MobileChapterList from "./components/MobileChapterList";
import MobileCommentSection from "./components/MobileCommentSection";
import MobileChapterViewer from "./components/MobileChapterViewer";

const MobileDetailPageContainer = () => {
  const { slug } = useParams();
  const [retryCount, setRetryCount] = useState(0);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  
  // Sử dụng Supabase auth
  const { user } = useSupabaseAuth();
  
  // Sử dụng các custom hooks
  const { saveHistory, loading: historyLoading } = useSupabaseHistory(user);
  const { 
    comicData, 
    relatedComics, 
    loading, 
    error, 
    item, 
    seoData,
    refetch 
  } = useComicData(slug, saveHistory, retryCount);
  
  const { 
    chapterData, 
    isModalOpen, 
    loading: chapterLoading, 
    handleClose, 
    handleReachChapter 
  } = useChapterViewer(saveHistory, item?.name, slug);
  
  const {
    comments,
    rating,
    setRating,
    commentText,
    setCommentText,
    commentError,
    commentSuccess,
    handleSubmitComment,
    calculateAverageRating,
    loading: commentLoading
  } = useSupabaseComments(slug, user);
  
  const {
    favorites,
    isFavorite,
    loading: favoriteLoading,
    handleToggleFavorite
  } = useSupabaseFavorites(slug, user, item?.name, item?.thumb_url);
  
  // Chuẩn bị dữ liệu chia sẻ
  const shareUrl = `${window.location.origin}/comics/${slug}`;
  const shareTitle = item?.name || "Truyện hay!";
  const shareDescription = seoData?.descriptionHead || "Xem truyện này ngay!";
  
  const handleShareMessenger = () => {
    const messengerUrl = `https://www.messenger.com/t/100007XXXXXX/?link=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(messengerUrl, "_blank");
  };

  // Hàm thử lại khi gặp lỗi
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
  };

  // Lấy tất cả các chapter từ tất cả các server
  const getAllChapters = () => {
    if (!item || !item.chapters || !item.chapters.length) return [];
    
    const allChapters = [];
    
    item.chapters.forEach(server => {
      if (server.server_data && server.server_data.length) {
        server.server_data.forEach(chapter => {
          allChapters.push({
            ...chapter,
            server_name: server.server_name
          });
        });
      }
    });
    
    return allChapters;
  };

  // Xử lý đường dẫn ảnh
  const getImageUrl = (thumbUrl) => {
    if (!thumbUrl) return "/fallback-image.jpg";
    
    // Kiểm tra nếu thumbnail đã là URL đầy đủ
    if (thumbUrl.startsWith('http')) {
      return thumbUrl;
    }
    
    // Nếu không, thêm prefix đúng
    return `https://img.otruyenapi.com/uploads/comics/${thumbUrl}`;
  };

  // Xử lý trạng thái loading
  if (loading) {
    return (
      <div className="mobile-detail-page">
        <MobileMenu />
        <Container className="mobile-container">
          <div className="text-center my-5 py-5">
            <Spinner animation="border" variant="primary" />
            <p className="mt-3">Đang tải thông tin truyện...</p>
          </div>
        </Container>
      </div>
    );
  }

  // Xử lý trạng thái lỗi
  if (error) {
    return (
      <div className="mobile-detail-page">
        <MobileMenu />
        <Container className="mobile-container">
          <div className="d-flex align-items-center my-3">
            <Button as={Link} to="/" variant="link" className="p-0 me-2">
              <BsArrowLeft size={24} />
            </Button>
            <h4 className="m-0">Lỗi</h4>
          </div>
          
          <Alert variant="danger" className="mt-3">
            <Alert.Heading>Có lỗi xảy ra!</Alert.Heading>
            <p>{error}</p>
            <hr />
            <div className="d-flex justify-content-end">
              <Button variant="outline-danger" onClick={handleRetry}>
                Thử lại
              </Button>
            </div>
          </Alert>
        </Container>
      </div>
    );
  }

  // Kiểm tra xem có dữ liệu không
  if (!item) {
    return (
      <div className="mobile-detail-page">
        <MobileMenu />
        <Container className="mobile-container">
          <div className="d-flex align-items-center my-3">
            <Button as={Link} to="/" variant="link" className="p-0 me-2">
              <BsArrowLeft size={24} />
            </Button>
            <h4 className="m-0">Không tìm thấy</h4>
          </div>
          
          <Alert variant="warning" className="mt-3">
            <Alert.Heading>Không tìm thấy truyện!</Alert.Heading>
            <p>Không thể tìm thấy thông tin truyện với slug "{slug}".</p>
            <hr />
            <div className="d-flex justify-content-end">
              <Button variant="outline-warning" onClick={handleRetry}>
                Thử lại
              </Button>
            </div>
          </Alert>
        </Container>
      </div>
    );
  }

  return (
    <div className="mobile-detail-page">
      <Helmet>
        <title>{seoData?.titleHead || item.name}</title>
      </Helmet>

      <MobileMenu />

      <Container className="mobile-container">
        {/* Header */}
        <div className="d-flex align-items-center justify-content-between my-3">
          <div className="d-flex align-items-center">
          <Button as={Link} to="/" variant="link" className="p-0 me-2">
            <BsArrowLeft size={24} />
          </Button>
            <h4 className="m-0">{item.name}</h4>
          </div>
          <div className="d-flex align-items-center">
              <Button
              variant="link"
              className="p-0 me-3"
                onClick={handleToggleFavorite}
              disabled={favoriteLoading}
            >
              {isFavorite ? (
                <BsBookmarkFill size={20} className="text-danger" />
              ) : (
                <BsBookmark size={20} />
              )}
              </Button>
              <Button 
              variant="link"
              className="p-0"
                onClick={() => setShowShareOptions(!showShareOptions)}
              >
              <BsShare size={20} />
              </Button>
          </div>
        </div>

        {/* Thông tin truyện */}
        <MobileComicInfo 
          item={item}
          getImageUrl={getImageUrl}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />

        {/* Danh sách chương */}
        {activeTab === "chapters" && (
          <MobileChapterList
            chapters={getAllChapters()}
            handleReachChapter={handleReachChapter}
          />
        )}

        {/* Phần bình luận */}
        {activeTab === "comments" && (
          <MobileCommentSection
            comments={comments}
            rating={rating}
            setRating={setRating}
            commentText={commentText}
            setCommentText={setCommentText}
            handleSubmitComment={handleSubmitComment}
            commentError={commentError}
            commentSuccess={commentSuccess}
            calculateAverageRating={calculateAverageRating}
            user={user}
          />
        )}

        {/* Modal đọc truyện */}
          <MobileChapterViewer
            isModalOpen={isModalOpen}
            handleClose={handleClose}
            item={item}
            getDataChapter={chapterData}
            loading={chapterLoading}
            handleReachChapter={handleReachChapter}
          />
      </Container>
    </div>
  );
};

export default MobileDetailPageContainer; 