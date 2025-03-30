import React, { useEffect, useState } from "react";
import { Helmet } from "react-helmet";
import { Link, useParams } from "react-router-dom";
import { Button, Col, Container, Row, Card } from "react-bootstrap";
import { onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../Include/Authentication/Firebase";
import { Menu } from "../Include/Dau-trang_Chan-trang/Menu";
import RelatedComics from "../Include/RelatedComics";
import "./detailPage.css";

// Import các component con
import ComicInfo from "./components/ComicInfo";
import ChapterList from "./components/ChapterList";
import CommentSection from "./components/CommentSection";
import ChapterViewer from "./components/ChapterViewer";

// Import custom hooks
import {
  useComicData,
  useChapterViewer,
  useComments,
  useFavorites,
  useHistory
} from "./hooks";

const DetailPageContainer = () => {
  const { slug } = useParams();
  const [user, setUser] = useState(null);
  
  // Sử dụng các custom hooks
  const saveHistory = useHistory(db, user);
  const { 
    comicData, 
    relatedComics, 
    loading, 
    error, 
    item, 
    seoData 
  } = useComicData(slug, saveHistory);
  
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
    calculateAverageRating
  } = useComments(db, slug, user);
  
  const {
    isFavorite,
    handleToggleFavorite
  } = useFavorites(db, slug, user, item?.name);
  
  // Theo dõi trạng thái đăng nhập
  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    
    return () => unsubscribeAuth();
  }, []);
  
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

  // Xử lý trạng thái loading và lỗi
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error}</p>;

  return (
    <>
      <Helmet>
        <title>{seoData?.titleHead}</title>
      </Helmet>

      <Menu />

      <Container className="detail-container">
        <Button as={Link} to="/" style={{ marginBottom: "20px" }}>
          Back to Home
        </Button>

        <Row className="mb-4">
          <Col>
            <Card
              className="shadow-sm border-0"
              style={{ backgroundColor: "#f8f9fa", marginTop: "15px" }}
            >
              <Card.Body>
                <Card.Title className="text-primary fw-bold">
                  {seoData?.titleHead}
                </Card.Title>
                <Card.Text className="text-secondary">
                  {seoData?.descriptionHead}
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