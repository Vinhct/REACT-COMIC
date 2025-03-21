// src/Components/History.js
import React, { useEffect, useState } from "react";
import {
  Button,
  Container,
  Navbar,
  Nav,
  ListGroup,
  Image,
  Card,
  Dropdown,
} from "react-bootstrap";
import { Link } from "react-router-dom";
import { auth,db } from "../Components/Include/Authentication/Firebase";

import {
  collection,
  query,
  orderBy,
  onSnapshot,
  limit,
} from "firebase/firestore";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { Menu } from "../Components/Include/Dau-trang_Chan-trang/Menu";
import "./Include/responsive.css";

const History = () => {
  const [user, setUser] = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const defaultAvatar =
    "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

  useEffect(() => {
    // Lấy lịch sử tạm thời từ localStorage khi khởi động
    const localHistory = JSON.parse(localStorage.getItem("history") || "[]");
    if (localHistory.length > 0) {
      setHistory(localHistory);
      console.log("Loaded history from localStorage:", localHistory);
    }

    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      console.log("Auth state changed, user:", currentUser);

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
            console.log("Fetched history from Firestore:", historyData);
            setHistory(historyData);
            localStorage.setItem("history", JSON.stringify(historyData)); // Đồng bộ Firestore với localStorage
            setLoading(false);
          },
          (error) => {
            console.error("Error fetching history from Firestore:", error);
            setLoading(false);
            // Nếu Firestore lỗi, giữ lịch sử từ localStorage
            setHistory(localHistory);
          }
        );

        return () => unsubscribeSnapshot();
      } else {
        console.log("No user, using localStorage history:", localHistory);
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
      console.log("Logged out, clearing user state");
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  return (
    <>
      <Navbar bg="light" expand="lg" className="shadow-sm mb-4">
        {/* Logo */}

        <Menu />
      </Navbar>

      <Container>
        <Card.Title className="text-primary fw-bold display-6" style={{margin: "20px 20px"}}>
          Lịch sử đọc truyện
        </Card.Title>
        {loading ? (
          <p>Đang tải lịch sử...</p>
        ) : user ? (
          history.length > 0 ? (
            <ListGroup>
              {history.map((item) => (
                <ListGroup.Item
                  key={item.id || item.slug}
                  as={Link}
                  to={`/comics/${item.slug}`}
                  action
                >
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
