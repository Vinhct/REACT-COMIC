// src/Components/Home.js
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Container, Button } from "react-bootstrap";
import { Helmet } from "react-helmet";
import { Menu } from "./Include/Dau-trang_Chan-trang/Menu";
import { BsArrowUp } from "react-icons/bs";
import "./Include/responsive.css";
import "./Include/Home.css";
import RecommendedComics from "./Include/RecommendedComics";
import ComicList from "./Include/ComicList";
import CompletedComics from "./Include/CompletedComics";
import UpcomingComics from "./Include/UpcomingComics";
import Footer from "./Include/Dau-trang_Chan-trang/Footer";
import Settings from "./Include/Settings";
import WelcomeBanner from "./Include/3D-Effects/WelcomeBanner";
import ChatbotProvider from "./Include/Chatbot/ChatbotProvider";

const Home = () => {
  const [getdata, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const itemsPerPage = 24;

  const getRandomComics = (comicsList, count) => {
    if (!comicsList || comicsList.length === 0) return [];
    const shuffled = [...comicsList];
    const len = shuffled.length;
    for (let i = len - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, Math.min(count, len));
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(
          `https://otruyenapi.com/v1/api/danh-sach/truyen-moi?page=${currentPage}`
        );
        setData(response.data);
        setLoading(false);
      } catch (error) {
        setError(error.message);
        setLoading(false);
      }
    };
    fetchData();
  }, [currentPage]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowBackToTop(true);
      } else {
        setShowBackToTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  if (error) {
    return <p className="text-center text-danger">Error: {error}</p>;
  }

  const items = getdata?.data?.items;
  const randomComics = getRandomComics(items, 10);

  return (
    <>
      <Helmet>
        <title>{getdata.data?.seoOnPage?.titleHead || "O-Truyện - Đọc truyện tranh online"}</title>
      </Helmet>
      <Menu />
      <WelcomeBanner />

      {/* Container chính với scroll snapping */}
      <div className="snap-container">
        {/* Phần Truyện Đề Cử */}
        <section className="snap-section recommended-section">
          <Container className="py-4">
            {!loading && <RecommendedComics comics={randomComics} />}
          </Container>
        </section>

        {/* Phần Truyện Mới */}
        <section className="snap-section">
          <Container className="py-4">
            <ComicList
              items={items}
              loading={loading}
              sectionTitle="Truyện Mới"
              limit={8}
              viewMoreLink="/truyen-moi"
            />
          </Container>
        </section>

        {/* Phần Truyện Hoàn Thành */}
        <section className="snap-section">
          <Container className="py-4">
            <CompletedComics />
          </Container>
        </section>

        {/* Phần Truyện Sắp Ra Mắt */}
        <section className="snap-section">
          <Container className="py-4">
            <UpcomingComics />
          </Container>
        </section>

        {/* Phần Footer */}
        <section className="snap-section footer-section">
          <Footer />
        </section>
      </div>

      {/* Nút Back to Top */}
      {showBackToTop && (
        <Button
          variant="primary"
          className="back-to-top"
          onClick={scrollToTop}
        >
          <BsArrowUp size={24} />
        </Button>
      )}

      {/* Nút Cài đặt */}
      <Settings />
      
      {/* Chatbot AI - Thêm div bao bọc với z-index cao */}
      <div style={{ position: 'relative', zIndex: 9999 }}>
        <ChatbotProvider />
      </div>
    </>
  );
};

export default Home;