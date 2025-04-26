import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import { Button, Col, Container, Row, Card, Alert } from "react-bootstrap";
import { db } from "../Include/Authentication/Firebase";
import { Menu } from "../Include/Dau-trang_Chan-trang/Menu";
import RelatedComics from "../Include/RelatedComics";
import "./detailPage.css";
import { useSupabaseAuth } from "../Include/Authentication/SupabaseAuthContext";

// Import các component con
import ComicInfo from "./components/ComicInfo";
import ChapterList from "./components/ChapterList";
import CommentSection from "./components/CommentSection";
import ChapterViewer from "./components/ChapterViewer";

// Import custom hooks
import {
  useComicData,
  useChapterViewer,
  useSupabaseComments,
  useSupabaseFavorites,
  useSupabaseHistory
} from "./hooks";

const DetailPageContainer = () => {
  const { slug } = useParams();
  const [retryCount, setRetryCount] = useState(0);
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
  const shareUrl = `${window.location.origin}/truyen/${slug}`;
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

  // Xử lý trạng thái loading
  if (loading) {
    return (
      <>
        <Menu />
        <Container className="detail-container">
          <div className="text-center my-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3">Đang tải thông tin truyện...</p>
          </div>
        </Container>
      </>
    );
  }

  // Xử lý trạng thái lỗi
  if (error) {
    return (
      <>
        <Menu />
        <Container className="detail-container">
          <Button as={Link} to="/" style={{ marginBottom: "20px" }}>
            Về trang chủ
          </Button>
          <Alert variant="danger">
            <Alert.Heading>Có lỗi xảy ra!</Alert.Heading>
            <p>{error}</p>
            <hr />
            <div className="d-flex justify-content-between">
              <p className="mb-0">
                Vui lòng thử lại sau hoặc quay lại trang chủ.
              </p>
              <Button variant="outline-danger" onClick={handleRetry}>
                Thử lại
              </Button>
            </div>
          </Alert>
        </Container>
      </>
    );
  }

  // Kiểm tra xem có dữ liệu không
  if (!item) {
    return (
      <>
        <Menu />
        <Container className="detail-container">
          <Button as={Link} to="/" style={{ marginBottom: "20px" }}>
            Về trang chủ
          </Button>
          <Alert variant="warning">
            <Alert.Heading>Không tìm thấy truyện!</Alert.Heading>
            <p>Không thể tìm thấy thông tin truyện với slug "{slug}".</p>
            <hr />
            <div className="d-flex justify-content-between">
              <p className="mb-0">
                Vui lòng kiểm tra lại đường dẫn hoặc quay lại trang chủ.
              </p>
              <Button variant="outline-warning" onClick={handleRetry}>
                Thử lại
              </Button>
            </div>
          </Alert>
        </Container>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>{seoData?.titleHead || item.name}</title>
      </Helmet>

      <Menu />

      <Container className="detail-container">
        <Button as={Link} to="/" style={{ marginBottom: "20px" }}>
          Về trang chủ
        </Button>

        <Row className="mb-4">
          <Col>
            <Card
              className="shadow-sm border-0"
              style={{ backgroundColor: "#f8f9fa", marginTop: "15px" }}
            >
              <Card.Body>
                <Card.Title className="text-primary fw-bold">
                  {seoData?.titleHead || item.name}
                </Card.Title>
                <Card.Text className="text-secondary">
                  {seoData?.descriptionHead || (item.content && typeof item.content === 'string' ? item.content.substring(0, 200) : "Không có mô tả")}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          {/* Thông tin truyện */}
          <Col md={6}>
            <ComicInfo 
              item={item}
              isFavorite={isFavorite}
              handleToggleFavorite={handleToggleFavorite}
              showShareOptions={false}
              setShowShareOptions={() => {}}
              shareUrl={shareUrl}
              shareTitle={shareTitle}
              shareDescription={shareDescription}
              handleShareMessenger={handleShareMessenger}
              loading={favoriteLoading}
            />
          </Col>

          <Col md={6}>
            {/* Danh sách chương */}
            <ChapterList 
              item={item} 
              handleReachChapter={handleReachChapter} 
            />

            {/* Phần bình luận */}
            <CommentSection 
              comments={comments}
              rating={rating}
              setRating={setRating}
              commentText={commentText}
              setCommentText={setCommentText}
              handleSubmitComment={handleSubmitComment}
              commentError={commentError}
              commentSuccess={commentSuccess}
              calculateAverageRating={calculateAverageRating}
            />
          </Col>
        </Row>

        {/* Truyện liên quan */}
        <RelatedComics slug={slug} categories={item?.category} />

        {/* Modal đọc truyện */}
        <ChapterViewer 
          isModalOpen={isModalOpen}
          handleClose={handleClose}
          item={item}
          getDataChapter={chapterData}
          loading={chapterLoading}
          handleReachChapter={handleReachChapter}
        />
      </Container>
    </>
  );
};

export default DetailPageContainer; 