import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import {
  Badge,
  Button,
  Card,
  Col,
  Container,
  ListGroup,
  Modal,
  Nav,
  Navbar,
  Row,
  Image,
  Form,
} from "react-bootstrap";
import { Helmet } from "react-helmet";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Menu } from "./Include/Dau-trang_Chan-trang/Menu";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, db } from "../Components/Include/Authentication/Firebase";
import { BsClipboard } from "react-icons/bs";
import {
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  deleteDoc,
  doc,
  onSnapshot,
} from "firebase/firestore";
import debounce from "lodash/debounce";
import { Rating } from "react-simple-star-rating";
import { FaHeart, FaRegHeart, FaShareAlt } from "react-icons/fa";
import { Dropdown } from "react-bootstrap";
import {
  FacebookShareButton,
  TwitterShareButton,
  FacebookIcon,
  TwitterIcon,
  FacebookMessengerIcon,
  FacebookMessengerShareButton,
} from "react-share";
import { toast } from "react-toastify";
import RelatedComics from "./Include/RelatedComics";
import "./Include/responsive.css";
import "./DetailPage.css";
import { IoChevronUpCircle, IoReturnUpBack, IoChevronDown } from "react-icons/io5";

const DetailPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [getdata, setData] = useState([]);
  const [getDataChapter, setDataChapter] = useState([]);
  const [relatedComics, setRelatedComics] = useState([]); // Trạng thái mới để lưu truyện liên quan
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, SetIsNodalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]);
  const [rating, setRating] = useState(0);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState(null);
  const [commentSuccess, setCommentSuccess] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareOptions, setShowShareOptions] = useState(false);
  const [showFooter, setShowFooter] = useState(true);
  const lastScrollTopRef = useRef(0);
  const item = getdata?.data?.data?.item;
  const defaultAvatar =
    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

  const shareUrl = `${window.location.origin}/truyen/${slug}`;
  const shareTitle = item?.name || "Truyện hay!";
  const shareDescription =
    getdata?.data?.data?.seoOnPage?.descriptionHead || "Xem truyện này ngay!";

  const saveHistory = debounce(async (historyItem) => {
    if (!user) return;

    const historyRef = collection(db, `users/${user.uid}/history`);
    const q = query(historyRef, where("slug", "==", historyItem.slug));
    const querySnapshot = await getDocs(q);

    if (!querySnapshot.empty) return;

    const allHistoryQuery = query(historyRef, orderBy("timestamp", "desc"));
    const allHistorySnapshot = await getDocs(allHistoryQuery);
    const historyCount = allHistorySnapshot.size;

    if (historyCount >= 5) {
      const oldestDoc = allHistorySnapshot.docs[historyCount - 1];
      await deleteDoc(doc(db, `users/${user.uid}/history`, oldestDoc.id));
    }

    await addDoc(historyRef, historyItem);

    const localHistory = JSON.parse(localStorage.getItem("history") || "[]");
    const updatedLocal = localHistory.filter(
      (h) => h.slug !== historyItem.slug
    );
    updatedLocal.unshift(historyItem);
    localStorage.setItem("history", JSON.stringify(updatedLocal.slice(0, 5)));
  }, 1000);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const favoritesRef = collection(
          db,
          `users/${currentUser.uid}/favorites`
        );
        const q = query(favoritesRef, where("slug", "==", slug));
        getDocs(q).then((snapshot) => {
          setIsFavorite(!snapshot.empty);
        });

        const unsubscribeFavorites = onSnapshot(favoritesRef, (snapshot) => {
          const favoritesData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
          }));
          setFavorites(favoritesData);
        });
        return () => unsubscribeFavorites();
      }
    });
    
    // Xử lý sự kiện cuộn cho modal
    const handleScroll = () => {
      if (!isModalOpen) return;
      
      const modalBody = document.querySelector('.modal-body');
      if (!modalBody) return;
      
      const st = modalBody.scrollTop;
      
      // Xác định hướng cuộn
      if (st > lastScrollTopRef.current && st > 100) {
        // Cuộn xuống - ẩn footer
        setShowFooter(false);
      } else if (st < lastScrollTopRef.current || st < 100) {
        // Cuộn lên hoặc ở gần đầu trang - hiện footer
        setShowFooter(true);
      }
      
      // Cập nhật vị trí cuộn cuối cùng
      lastScrollTopRef.current = st;
    };

    const modalBody = document.querySelector('.modal-body');
    if (isModalOpen && modalBody) {
      modalBody.addEventListener('scroll', handleScroll);
    }
    
    return () => {
      unsubscribeAuth();
      const modalBody = document.querySelector('.modal-body');
      if (modalBody) {
        modalBody.removeEventListener('scroll', handleScroll);
      }
    };
  }, [slug, isModalOpen]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(
          `https://otruyenapi.com/v1/api/truyen-tranh/${slug}`
        );
        setData(response);
        setLoading(false);
        saveHistory({
          slug: slug,
          name: response.data.data.data.item.name || "Unknown",
          timestamp: serverTimestamp(),
        });

        // Lấy thể loại đầu tiên của truyện để gọi API truyện liên quan
        const categorySlug = response.data.data.data.item.category?.[0]?.slug;
        if (categorySlug) {
          try {
            const relatedResponse = await axios.get(
              `https://otruyenapi.com/v1/api/the-loai/${categorySlug}?page=1`
            );
            setRelatedComics(relatedResponse.data.data.items);
          } catch (relatedError) {
            console.error("Error fetching related comics:", relatedError);
          }
        }
      } catch (error) {
        setLoading(false);
      }
    };
    fetchData();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => {
      unsubscribe();
      saveHistory.cancel();
    };
  }, [slug, user]);

  useEffect(() => {
    if (!slug) return;

    const q = query(
      collection(db, `comics/${slug}/comments`),
      orderBy("timestamp", "desc")
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const commentsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setComments(commentsData);
      },
      (error) => {
        console.error("Error fetching comments:", error);
        setCommentError("Không thể tải bình luận.");
      }
    );

    return () => unsubscribe();
  }, [slug]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      const dropdown = document.querySelector('.chapter-list');
      const dropdownBtn = document.querySelector('.chapter-dropdown-btn');
      if (dropdown && dropdownBtn && !dropdownBtn.contains(event.target) && !dropdown.contains(event.target)) {
        dropdown.classList.remove('show');
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const handleSubmitComment = async (e) => {
    e.preventDefault();
    if (!user) {
      setCommentError("Vui lòng đăng nhập để bình luận và đánh giá.");
      return;
    }
    if (!commentText.trim() || rating === 0) {
      setCommentError("Vui lòng nhập bình luận và chọn đánh giá.");
      return;
    }

    try {
      await addDoc(collection(db, `comics/${slug}/comments`), {
        userId: user.uid,
        userName: user.displayName || user.email || "Ẩn danh",
        comment: commentText,
        rating: rating,
        timestamp: serverTimestamp(),
      });
      setCommentText("");
      setRating(0);
      setCommentSuccess("Bình luận và đánh giá đã được gửi!");
      setCommentError(null);
    } catch (error) {
      console.error("Error adding comment:", error);
      setCommentError("Không thể gửi bình luận. Vui lòng thử lại.");
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      alert("Vui lòng đăng nhập để thêm vào yêu thích!");
      return;
    }

    const favoriteData = {
      slug: slug,
      name: item.name || "Unknown",
      timestamp: serverTimestamp(),
    };

    try {
      if (isFavorite) {
        const q = query(
          collection(db, `users/${user.uid}/favorites`),
          where("slug", "==", slug)
        );
        const snapshot = await getDocs(q);
        snapshot.forEach((doc) => deleteDoc(doc.ref));
        setIsFavorite(false);
        alert("Đã xóa khỏi yêu thích!");
      } else {
        await addDoc(
          collection(db, `users/${user.uid}/favorites`),
          favoriteData
        );
        setIsFavorite(true);
        alert("Đã thêm vào yêu thích!");
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert("Có lỗi xảy ra. Vui lòng thử lại!");
    }
  };

  const calculateAverageRating = () => {
    if (comments.length === 0) return 0;
    const totalRating = comments.reduce(
      (sum, comment) => sum + (comment.rating || 0),
      0
    );
    return Math.round((totalRating / comments.length) * 10) / 10;
  };

  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error : {error}</p>;

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const handleClose = () => SetIsNodalOpen(false);
  const handleReachChapter = async (chapter_api) => {
    try {
      setLoading(true); // Thêm loading state
      const response = await axios.get(`${chapter_api}`);
      console.log("Chapter data:", response.data); // Log dữ liệu
      setDataChapter(response.data);
      setLoading(false);
      saveHistory({
        slug: slug,
        name: item.name || "Unknown",
        chapter: response.data.data.item.chapter_name || "Unknown",
        timestamp: serverTimestamp(),
      });
      // Reset scroll state khi mở chapter mới
      setShowFooter(true);
      lastScrollTopRef.current = 0;
    } catch (error) {
      console.error("Error loading chapter:", error); // Log lỗi
      setLoading(false);
    }
    SetIsNodalOpen(true);
  };

  const handleShareMessenger = () => {
    const messengerUrl = `https://www.messenger.com/t/100007XXXXXX/?link=${encodeURIComponent(
      shareUrl
    )}`;
    window.open(messengerUrl, "_blank");
    setShowShareOptions(false);
  };

  return (
    <>
      <Helmet>
        <title>{getdata.data?.seoOnPage?.titleHead}</title>
      </Helmet>

      <Menu />

      <Container className="my-4">
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
                  {getdata.data.data.seoOnPage.titleHead}
                </Card.Title>
                <Card.Text className="text-secondary">
                  {getdata.data.data.seoOnPage.descriptionHead}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        <Row>
          <Col md={6}>
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
                        to={`/genre/${category.slug}`} // Liên kết đến trang thể loại
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
          </Col>

          <Col md={6}>
            <Card
              className="shadow-sm border-0"
              style={{ backgroundColor: "#ffffff" }}
            >
              <Card.Body>
                <Card.Title className="text-center text-primary fw-bold">
                  Danh Sách Chương
                </Card.Title>
                <ListGroup
                  className="scrollable-list"
                  style={{ maxHeight: "400px", overflowY: "auto" }}
                >
                  {item.chapters && item.chapters.length > 0 ? (
                    item.chapters.map((chapter, index) => (
                      <div key={index}>
                        <h5 className="server-name">{chapter.server_name}</h5>
                        <ListGroup.Item>
                          {chapter.server_data &&
                          chapter.server_data.length > 0 ? (
                            chapter.server_data.map((listchapter, subindex) => (
                              <div
                                className="chapter_click"
                                key={subindex}
                                onClick={() =>
                                  handleReachChapter(
                                    listchapter.chapter_api_data
                                  )
                                }
                              >
                                Chapter : {listchapter.chapter_name}
                              </div>
                            ))
                          ) : (
                            <span>Coming soon ....</span>
                          )}
                        </ListGroup.Item>
                      </div>
                    ))
                  ) : (
                    <ListGroup.Item className="text-muted">
                      Không có chương nào
                    </ListGroup.Item>
                  )}
                </ListGroup>

                <div className="mt-4 rating-section">
                  <h5>
                    Đánh giá trung bình: {calculateAverageRating()} / 5 (
                    {comments.length} đánh giá)
                  </h5>
                  <Form onSubmit={handleSubmitComment}>
                    <Form.Group className="mb-3">
                      <Form.Label>Đánh giá của bạn:</Form.Label>
                      <Rating
                        onClick={(rate) => setRating(rate)}
                        ratingValue={rating}
                        size={20}
                        transition
                        fillColor="#f1c40f"
                        emptyColor="#e4e4e4"
                      />
                    </Form.Group>
                    <Form.Group className="mb-3">
                      <Form.Label>Bình luận:</Form.Label>
                      <Form.Control
                        as="textarea"
                        rows={3}
                        placeholder="Nhập bình luận của bạn..."
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                      />
                    </Form.Group>
                    {commentError && (
                      <p style={{ color: "red" }}>{commentError}</p>
                    )}
                    {commentSuccess && (
                      <p style={{ color: "green" }}>{commentSuccess}</p>
                    )}
                    <Button variant="primary" type="submit">
                      Gửi
                    </Button>
                  </Form>

                  <h5 className="mt-4">Danh sách bình luận:</h5>
                  <div className="comments-list">
                    {comments.length > 0 ? (
                      <ListGroup>
                        {comments.map((comment) => (
                          <ListGroup.Item key={comment.id}>
                            <strong>{comment.userName}</strong> - {comment.rating}{" "}
                            sao
                            <p>{comment.comment}</p>
                            <small>
                              {comment.timestamp?.toDate
                                ? comment.timestamp.toDate().toLocaleString()
                                : new Date(comment.timestamp).toLocaleString()}
                            </small>
                          </ListGroup.Item>
                        ))}
                      </ListGroup>
                    ) : (
                      <p>Chưa có bình luận nào.</p>
                    )}
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Sử dụng component RelatedComics */}
        <RelatedComics slug={slug} categories={item?.category} />

        {/* Modal đọc truyện */}
        {isModalOpen && (
          <Modal
            show={isModalOpen}
            onHide={handleClose}
            dialogClassName="chapter-modal"
            contentClassName="chapter-modal-content"
            size="xl"
            fullscreen
          >
            <Modal.Header closeButton>
              <Modal.Title>
                <div className="chapter-modal-title">
                  <span className="comic-name">{item.name}</span>
                  <div className="chapter-selector">
                    <span className="chapter-name">
                      Chap {getDataChapter?.data?.item?.chapter_name || "Đang tải..."}
                    </span>
                  </div>
                </div>
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <div className="chapter-image-container">
                <div className="floating-buttons">
                  <button 
                    className="scroll-to-top"
                    onClick={() => {
                      const modalBody = document.querySelector('.modal-body');
                      if (modalBody) {
                        modalBody.scrollTo({
                          top: 0,
                          behavior: 'smooth'
                        });
                      }
                    }}
                    title="Lên đầu trang"
                  >
                    <IoChevronUpCircle size={24} />
                  </button>
                  <button 
                    className="return-to-detail"
                    onClick={handleClose}
                    title="Trở về"
                  >
                    <IoReturnUpBack size={24} />
                  </button>
                </div>
                {loading ? (
                  <div className="loading-spinner">
                    <div className="spinner-border text-light" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : getDataChapter?.data?.item?.chapter_image ? (
                  getDataChapter.data.item.chapter_image.map((image, index) => (
                    <img
                      key={index}
                      src={`${getDataChapter.data.domain_cdn}/${getDataChapter.data.item.chapter_path}/${image.image_file}`}
                      alt={`Trang ${index + 1}`}
                      className="chapter-image"
                      loading="lazy"
                      onError={(e) => {
                        console.error(`Error loading image ${index + 1}`);
                        e.target.src = '/placeholder.png'; // Thay thế bằng ảnh placeholder khi lỗi
                      }}
                    />
                  ))
                ) : (
                  <div className="no-content">
                    <p>Không có nội dung cho chapter này</p>
                  </div>
                )}
              </div>
            </Modal.Body>
            <Modal.Footer>
              <div className={`chapter-navigation ${showFooter ? 'show' : 'hide'}`}>
                <Button
                  variant="outline-light"
                  onClick={() => {
                    // Xử lý chuyển chapter trước
                    const currentIndex = item.chapters[0].server_data.findIndex(
                      (chapter) => chapter.chapter_name === getDataChapter?.data?.item?.chapter_name
                    );
                    if (currentIndex > 0) {
                      handleReachChapter(
                        item.chapters[0].server_data[currentIndex - 1].chapter_api_data
                      );
                    }
                  }}
                  disabled={!getDataChapter?.data?.item?.chapter_name}
                >
                  Chapter Trước
                </Button>
                <Button variant="outline-light" onClick={handleClose}>
                  Đóng
                </Button>
                <Button
                  variant="outline-light"
                  onClick={() => {
                    // Xử lý chuyển chapter sau
                    const currentIndex = item.chapters[0].server_data.findIndex(
                      (chapter) => chapter.chapter_name === getDataChapter?.data?.item?.chapter_name
                    );
                    if (currentIndex < item.chapters[0].server_data.length - 1) {
                      handleReachChapter(
                        item.chapters[0].server_data[currentIndex + 1].chapter_api_data
                      );
                    }
                  }}
                  disabled={!getDataChapter?.data?.item?.chapter_name}
                >
                  Chapter Sau
                </Button>
              </div>
            </Modal.Footer>
          </Modal>
        )}
      </Container>
    </>
  );
};

export default DetailPage;
