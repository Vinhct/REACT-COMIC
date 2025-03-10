import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { Badge, Button, Card, Col, Container, ListGroup, Modal, Nav, Navbar, Row, Image, Form } from 'react-bootstrap';
import { Helmet } from 'react-helmet';
import { Link, useParams } from 'react-router-dom';
import { Menu } from './Include/Menu';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../Components/Include/Firebase";
import { db } from "../Components/Include/Firebase"; // Thêm Firestore
import { collection, addDoc, serverTimestamp, query, where, getDocs, orderBy, limit, deleteDoc, doc, onSnapshot } from "firebase/firestore"; // Thêm Firestore functions
import debounce from "lodash/debounce";
import { Rating } from "react-simple-star-rating"; // Cần cài đặt: npm install react-simple-star-rating

const DetailPage = () => {
  const { slug } = useParams();
  const [getdata, setData] = useState([]);
  const [getDataChapter, setDataChapter] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, SetIsNodalOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [comments, setComments] = useState([]); // Danh sách bình luận
  const [rating, setRating] = useState(0); // Đánh giá từ 1-5
  const [commentText, setCommentText] = useState(""); // Nội dung bình luận
  const [commentError, setCommentError] = useState(null); // Thông báo lỗi bình luận
  const [commentSuccess, setCommentSuccess] = useState(null); // Thông báo thành công
  const item = getdata?.data?.data?.item;
  const defaultAvatar = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

  // Hàm lưu lịch sử với kiểm tra trùng lặp và giới hạn 5
  const saveHistory = debounce(async (historyItem) => {
    if (!user) return;

    const historyRef = collection(db, `users/${user.uid}/history`);
    const q = query(historyRef, where("slug", "==", historyItem.slug));
    const querySnapshot = await getDocs(q);

    // Nếu slug đã tồn tại, không thêm mới
    if (!querySnapshot.empty) return;

    // Kiểm tra số lượng truyện trong lịch sử
    const allHistoryQuery = query(historyRef, orderBy("timestamp", "desc"));
    const allHistorySnapshot = await getDocs(allHistoryQuery);
    const historyCount = allHistorySnapshot.size;

    // Nếu đã có 5 truyện, xóa truyện cũ nhất
    if (historyCount >= 5) {
      const oldestDoc = allHistorySnapshot.docs[historyCount - 1];
      await deleteDoc(doc(db, `users/${user.uid}/history`, oldestDoc.id));
    }

    // Thêm truyện mới
    await addDoc(historyRef, historyItem);

    // Cập nhật localStorage
    const localHistory = JSON.parse(localStorage.getItem("history") || "[]");
    const updatedLocal = localHistory.filter((h) => h.slug !== historyItem.slug); // Xóa trùng
    updatedLocal.unshift(historyItem);
    localStorage.setItem("history", JSON.stringify(updatedLocal.slice(0, 5))); // Giới hạn 5
  }, 1000);

  // Lấy thông tin người dùng
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // Lấy dữ liệu truyện
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
        setData(response);
        setLoading(false);
        // Lưu lịch sử khi vào trang chi tiết truyện
        saveHistory({
          slug: slug,
          name: response.data.data.data.item.name || "Unknown",
          timestamp: serverTimestamp(),
        });
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
      saveHistory.cancel(); // Hủy debounce khi component unmount
    };
  }, [slug, user]);

  // Lấy danh sách bình luận từ Firestore
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
        console.log("Fetched comments:", commentsData); // Debug
        setComments(commentsData);
      },
      (error) => {
        console.error("Error fetching comments:", error);
        setCommentError("Không thể tải bình luận.");
      }
    );

    return () => unsubscribe();
  }, [slug]);

  // Xử lý gửi bình luận và đánh giá
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

  // Tính trung bình đánh giá
  const calculateAverageRating = () => {
    if (comments.length === 0) return 0;
    const totalRating = comments.reduce((sum, comment) => sum + (comment.rating || 0), 0);
    return Math.round((totalRating / comments.length) * 10) / 10; // Làm tròn đến 1 chữ số thập phân
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
      const response = await axios.get(`${chapter_api}`);
      setDataChapter(response.data);
      setLoading(false);
      // Lưu lịch sử khi xem chương (nếu muốn)
      saveHistory({
        slug: slug,
        name: item.name || "Unknown",
        chapter: response.data.data.item.chapter_name || "Unknown",
        timestamp: serverTimestamp(),
      });
    } catch (error) {
      setLoading(false);
    }
    SetIsNodalOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>{getdata.data?.seoOnPage?.titleHead}</title>
      </Helmet>

      <Navbar bg="light" expand="lg" className="shadow-sm mb-4">
        <Container>
          <Navbar.Brand as={Link} to="/" className="fw-bold text-primary">
            <Menu />
          </Navbar.Brand>
          <Nav className="ms-auto align-items-center">
            {user ? (
              <>
                <Nav.Item className="d-flex align-items-center me-2">
                  <Image
                    src={user.photoURL || defaultAvatar} // Ảnh mặc định
                    roundedCircle
                    width="30"
                    height="30"
                    className="me-2"
                    alt="User avatar"
                  />
                  <span>{user.displayName || user.email || "Người dùng"}</span>
                </Nav.Item>
                <Button variant="outline-danger" onClick={handleLogout}>
                  Đăng xuất
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline-primary" className="me-2" as={Link} to="/login">
                  Đăng nhập
                </Button>
                <Button variant="primary" as={Link} to="/register">
                  Đăng ký
                </Button>
              </>
            )}
          </Nav>
        </Container>
      </Navbar>

      <Container className="my-4">
        <Button as={Link} to="/" style={{ marginBottom: "20px" }}>Back to Home</Button>

        <Row className="mb-4">
          <Col>
            <Card className="shadow-sm border-0" style={{ backgroundColor: "#f8f9fa" }}>
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
            <Card className="shadow-lg border-0" style={{ backgroundColor: "#fdfdfd" }}>
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
                      <Badge
                        bg="info"
                        key={index}
                        className="me-2 mb-2 text-light"
                        style={{ fontSize: "90%" }}
                      >
                        {category.name}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-muted">Khác</span>
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
              </Card.Body>
            </Card>
          </Col>

          <Col md={6}>
            <Card className="shadow-sm border-0" style={{ backgroundColor: "#ffffff" }}>
              <Card.Body>
                <Card.Title className="text-center text-primary fw-bold">
                  Danh Sách Chương
                </Card.Title>
                <ListGroup className='scrollabel-list' style={{ maxHeight: "400px", overflowY: "auto" }}>
                  {item.chapters && item.chapters.length > 0 ? (
                    item.chapters.map((chapter, index) => (
                      <div key={index}>
                        <h5>{chapter.server_name}</h5>
                        <ListGroup.Item>
                          {chapter.server_data && chapter.server_data.length > 0 ? (
                            chapter.server_data.map((listchapter, subindex) => (
                              <div
                                className='chapter_click'
                                key={subindex}
                                onClick={() => handleReachChapter(listchapter.chapter_api_data)}
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

                {/* Thêm phần bình luận và đánh giá ngay dưới danh sách chương */}
                <div className="mt-4">
                  <h5>Đánh giá trung bình: {calculateAverageRating()} / 5 ({comments.length} đánh giá)</h5>
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
                    {commentError && <p style={{ color: "red" }}>{commentError}</p>}
                    {commentSuccess && <p style={{ color: "green" }}>{commentSuccess}</p>}
                    <Button variant="primary" type="submit">
                      Gửi
                    </Button>
                  </Form>

                  <h5 className="mt-4">Danh sách bình luận:</h5>
                  {comments.length > 0 ? (
                    <ListGroup>
                      {comments.map((comment) => (
                        <ListGroup.Item key={comment.id}>
                          <strong>{comment.userName}</strong> - {comment.rating} sao
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
              </Card.Body>
            </Card>
          </Col>
        </Row>
        {isModalOpen && (
          <Modal show={isModalOpen} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>
                Chapter: {getDataChapter.data.item.chapter_name} - {getDataChapter.data.item.comic_name}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              {getDataChapter.data.item.chapter_image && getDataChapter.data.item.chapter_image.length > 0 ? (
                getDataChapter.data.item.chapter_image.map((chapterImage, index) => (
                  <Card.Img
                    style={{ margin: 0 }}
                    variant="top"
                    key={index}
                    src={`${getDataChapter.data.domain_cdn}/${getDataChapter.data.item.chapter_path}/${chapterImage.image_file}`}
                  />
                ))
              ) : (
                "No Content ...."
              )}
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                Close
              </Button>
            </Modal.Footer>
          </Modal>
        )}
      </Container>
    </>
  );
};

export default DetailPage;