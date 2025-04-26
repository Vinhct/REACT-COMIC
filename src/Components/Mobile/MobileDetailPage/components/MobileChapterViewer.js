import React, { useState, useRef, useEffect } from 'react';
import { Modal, Button, Spinner, Alert } from 'react-bootstrap';
import { BsArrowLeft, BsHouseDoor, BsChevronUp } from 'react-icons/bs';
import { Link } from 'react-router-dom';

const MobileChapterViewer = ({
  isModalOpen,
  handleClose,
  item,
  getDataChapter,
  loading,
  handleReachChapter
}) => {
  const [showControls, setShowControls] = useState(true);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const lastScrollTopRef = useRef(0);
  
  // Xử lý ẩn/hiện controls khi cuộn
  useEffect(() => {
    const handleScroll = () => {
      const modalBody = document.querySelector('.mobile-chapter-viewer');
      if (!modalBody) return;
      
      const st = modalBody.scrollTop;
      
      // Hiển thị nút lên đầu trang khi cuộn xuống đủ xa
      if (st > 300) {
        setShowScrollToTop(true);
      } else {
        setShowScrollToTop(false);
      }
      
      // Xác định hướng cuộn
      if (st > lastScrollTopRef.current && st > 100) {
        // Cuộn xuống - ẩn controls
        setShowControls(false);
      } else if (st < lastScrollTopRef.current || st < 100) {
        // Cuộn lên hoặc ở gần đầu trang - hiện controls
        setShowControls(true);
      }
      
      // Cập nhật vị trí cuộn cuối cùng
      lastScrollTopRef.current = st;
    };

    const modalBody = document.querySelector('.mobile-chapter-viewer');
    if (isModalOpen && modalBody) {
      modalBody.addEventListener('scroll', handleScroll);
      return () => {
        modalBody.removeEventListener('scroll', handleScroll);
      };
    }
    
    return () => {};
  }, [isModalOpen]);

  // Reset scroll position khi mở chapter mới
  useEffect(() => {
    if (isModalOpen) {
      setShowControls(true);
      setShowScrollToTop(false);
      lastScrollTopRef.current = 0;
      
      const modalBody = document.querySelector('.mobile-chapter-viewer');
      if (modalBody) {
        modalBody.scrollTop = 0;
      }
    }
  }, [isModalOpen, getDataChapter]);
  
  // Hàm cuộn lên đầu trang
  const scrollToTop = () => {
    const modalBody = document.querySelector('.mobile-chapter-viewer');
    if (modalBody) {
      modalBody.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    }
  };

  // Kiểm tra chương hiện tại và tìm chương trước/sau
  const findCurrentChapterInfo = () => {
    if (!item || !item.chapters || !getDataChapter) return null;
    
    let currentServer = null;
    let currentChapter = null;
    let prevChapter = null;
    let nextChapter = null;
    
    // Lặp qua tất cả server và chapter để tìm chương hiện tại
    for (const server of item.chapters) {
      if (!server.server_data) continue;
      
      for (let i = 0; i < server.server_data.length; i++) {
        const chapter = server.server_data[i];
        if (chapter.chapter_api_data === getDataChapter.chapter_api_data) {
          currentServer = server;
          currentChapter = chapter;
          
          // Tìm chương trước và sau trong cùng server
          if (i > 0) {
            prevChapter = server.server_data[i - 1];
          }
          
          if (i < server.server_data.length - 1) {
            nextChapter = server.server_data[i + 1];
          }
          
          break;
        }
      }
      
      if (currentChapter) break;
    }
    
    return {
      currentServer,
      currentChapter,
      prevChapter,
      nextChapter
    };
  };
  
  const chapterInfo = findCurrentChapterInfo();
  
  // Hàm kiểm tra và hiển thị dữ liệu chapter theo định dạng phù hợp
  const renderChapterImages = () => {
    // Kiểm tra nếu có chapter_data theo định dạng mobile
    if (getDataChapter?.chapter_data?.length > 0) {
      return (
        <div className="chapter-content">
          {getDataChapter.chapter_data.map((imageUrl, index) => (
            <img
              key={index}
              src={imageUrl}
              alt={`Trang ${index + 1}`}
              className="chapter-image"
              loading="lazy"
            />
          ))}
        </div>
      );
    } 
    // Kiểm tra nếu có định dạng theo desktop
    else if (getDataChapter?.data?.item?.chapter_image) {
      return (
        <div className="chapter-content">
          {getDataChapter.data.item.chapter_image.map((image, index) => (
            <img
              key={index}
              src={`${getDataChapter.data.domain_cdn}/${getDataChapter.data.item.chapter_path}/${image.image_file}`}
              alt={`Trang ${index + 1}`}
              className="chapter-image"
              loading="lazy"
            />
          ))}
        </div>
      );
    } else {
      return (
        <Alert variant="danger" className="m-3">
          Không thể tải nội dung chương. Vui lòng thử lại sau.
        </Alert>
      );
    }
  };
  
  return (
    <Modal
      show={isModalOpen}
      onHide={handleClose}
      fullscreen={true}
      className="mobile-chapter-modal"
    >
      <Modal.Header className={`bg-dark text-white d-flex justify-content-between align-items-center ${showControls ? 'show' : 'hide'}`}>
        <Button variant="none" className="text-white p-0" onClick={handleClose}>
          <BsArrowLeft size={24} />
        </Button>
        <Modal.Title className="m-auto text-center fs-6">
         Chapter: {chapterInfo?.currentChapter?.chapter_name || getDataChapter?.data?.item?.chapter_name || "Đang tải..."}
        </Modal.Title>
        <Link to="/" className="text-white">
          <BsHouseDoor size={20} />
        </Link>
      </Modal.Header>
      
      <Modal.Body className="mobile-chapter-viewer p-0">
        {loading ? (
          <div className="text-center my-5 text-white">
            <Spinner animation="border" variant="light" />
            <p className="mt-3">Đang tải chương...</p>
          </div>
        ) : renderChapterImages()}
        
        {showScrollToTop && (
          <Button 
            className="scroll-to-top-btn" 
            variant="primary" 
            onClick={scrollToTop}
          >
            <BsChevronUp />
          </Button>
        )}
      </Modal.Body>
      
      <div className={`chapter-controls d-flex justify-content-between ${showControls ? 'show' : 'hide'}`}>
        <Button
          variant="dark"
          disabled={!chapterInfo?.prevChapter}
          onClick={() => chapterInfo?.prevChapter && handleReachChapter(chapterInfo.prevChapter.chapter_api_data)}
        >
          Chương trước
        </Button>
        
        <Button
          variant="dark"
          disabled={!chapterInfo?.nextChapter}
          onClick={() => chapterInfo?.nextChapter && handleReachChapter(chapterInfo.nextChapter.chapter_api_data)}
        >
          Chương sau
        </Button>
      </div>
    </Modal>
  );
};

export default MobileChapterViewer; 