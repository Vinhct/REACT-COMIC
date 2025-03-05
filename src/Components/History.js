// src/Components/History.js
import React, { useEffect, useState } from "react";
import { Button, Container, Navbar, Nav, ListGroup, Image, Card } from "react-bootstrap";
import { Link } from "react-router-dom";
import { auth } from "../Components/Include/Firebase";
import { db } from "../Components/Include/Firebase";
import { collection, query, orderBy, onSnapshot, limit } from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { Menu } from "../Components/Include/Menu";

const History = () => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const defaultAvatar = "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

  useEffect(() => {
    const localHistory = JSON.parse(localStorage.getItem("history") || "[]");
    setHistory(localHistory);

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        const q = query(
          collection(db, `users/${currentUser.uid}/history`),
          orderBy("timestamp", "desc"),
          limit(5) // Giới hạn 5 truyện
        );
        const unsubscribeSnapshot = onSnapshot(
          q,
          (snapshot) => {
            const historyData = snapshot.docs.map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }));
            setHistory(historyData);
            localStorage.setItem("history", JSON.stringify(historyData)); // Đồng bộ localStorage
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching history:", error);
            setLoading(false);
          }
        );
        return () => unsubscribeSnapshot();
      } else {
        setHistory(localHistory.slice(0, 5)); // Giới hạn 5 trong localStorage
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <>
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
                    src={user.photoURL || defaultAvatar}
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

      <Container>
      <Card.Title className="text-primary fw-bold display-6">
                 Lịch sử đọc truyện
            </Card.Title>
        {loading ? (
          <p>Đang tải lịch sử...</p>
        ) : user ? (
          history.length > 0 ? (
            <ListGroup>
              {history.map((item) => (
                <ListGroup.Item key={item.id || item.slug} as={Link} to={`/comics/${item.slug}`} action>
                  <strong>{item.name}</strong>
                  {item.chapter && <span> - Chapter: {item.chapter}</span>}
                  <br />
                  <small>
                    {item.timestamp?.toDate
                      ? item.timestamp.toDate().toLocaleString()
                      : new Date(item.timestamp).toLocaleString()}
                  </small>
                </ListGroup.Item>
              ))}
            </ListGroup>
          ) : (
            <p>Chưa có lịch sử đọc truyện.</p>
          )
        ) : (
          <p>Vui lòng đăng nhập để xem lịch sử đọc truyện.</p>
        )}
      </Container>
    </>
  );
};

export default History;