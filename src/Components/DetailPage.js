import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Badge, Button, Card, Col, Container, ListGroup, Modal, Nav, Navbar, Row, Image } from 'react-bootstrap';
import { Helmet } from 'react-helmet';
import { data, Link, useParams } from 'react-router-dom'
import { Menu } from './Include/Menu';
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth } from "../Components/Include/Firebase";
import { db } from "../Components/Include/Firebase"; // Thêm Firestore
import { collection, addDoc, serverTimestamp, query,
  where,
  getDocs,
  orderBy,
  limit,
  deleteDoc,
  doc, } from "firebase/firestore"; // Thêm Firestore functions
import debounce from "lodash/debounce";

const DetailPage = () => {
const {slug} = useParams();
const [getdata,setData] = useState([]);
const [getDataChapter,setDataChapter] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);
const [isModalOpen, SetIsNodalOpen] = useState(false);
const [user, setUser] = useState(null);
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

    useEffect(() => {
      const fetchData = async() => {
        try {
          const response = await axios.get(`https://otruyenapi.com/v1/api/truyen-tranh/${slug}`);
          setData(response);
          setLoading(false);
          //console.log(response);
           // Lưu lịch sử khi vào trang chi tiết truyện
                // Lưu lịch sử khi vào trang
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
  if(loading) return <p>Loading...</p>;
  if(error) return <p>Error : {error}</p>;

  const handleLogout = async () => {
        try {
          await signOut(auth);
          setUser(null);
        } catch (err) {
          console.error("Logout error:", err);
        }
      };

const handleClose = () => SetIsNodalOpen(false);
const handleReachChapter = async(chapter_api) =>{
  try {
    const response = await axios.get(
      `${chapter_api}`);
    setDataChapter(response.data);
    setLoading(false);
    //console.log(response);
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
                   >Chapter : {listchapter.chapter_name}</div>
                ))) : (
                <span>Coming soon ....</span>)}

                  </ListGroup.Item>
                 </div>
                ))
              ) : (
                <ListGroup.Item className="text-muted">
                  Không có chương nào
                </ListGroup.Item>
              )}
            </ListGroup>
          </Card.Body>
        </Card>
      </Col>
   </Row>
   {
    isModalOpen && (
      <Modal show={isModalOpen} onHide={handleClose}>
        <Modal.Header closeButton>
          <Modal.Title>
          Chapter: {getDataChapter.data.item.chapter_name} - {getDataChapter.data.item.comic_name}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
         {getDataChapter.data.item.chapter_image && getDataChapter.data.item.chapter_image.length > 0 ?
         (getDataChapter.data.item.chapter_image.map((chapterImage,index) =>(
               <Card.Img style={{margin:0}} variant="top" 
               src={`${getDataChapter.data.domain_cdn}/${getDataChapter.data.item.chapter_path}/${chapterImage.image_file}`}>
                   
               </Card.Img>
         ))):(
             "No Content ...."
         )
        }
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
         
        </Modal.Footer>
      </Modal>
    )
   }
   
  </Container>
</>

  );
};

export default DetailPage