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

  // Xử lý chuyển chương
  const handleChapterNavigation = (direction) => {
    if (!item?.chapters?.[0]?.server_data || !getDataChapter?.data?.item?.chapter_name) return;
    
    const currentIndex = item.chapters[0].server_data.findIndex(
      (chapter) => chapter.chapter_name === getDataChapter.data.item.chapter_name
    );

    if (currentIndex === -1) return;

    let targetChapter;
    if (direction === 'prev' && currentIndex > 0) {
      targetChapter = item.chapters[0].server_data[currentIndex - 1];
    } else if (direction === 'next' && currentIndex < item.chapters[0].server_data.length - 1) {
      targetChapter = item.chapters[0].server_data[currentIndex + 1];
    }

    if (targetChapter) {
      handleReachChapter(targetChapter.chapter_api_data);
      scrollToTop();
    }
  };
  
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
              onError={(e) => {
                console.error(`Error loading image ${index + 1}`);
                e.target.src = '/placeholder.png'; // Thay thế bằng ảnh placeholder khi lỗi
              }}
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
          {item?.name} - Chapter {getDataChapter?.data?.item?.chapter_name || "Đang tải..."}
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
          disabled={!item?.chapters?.[0]?.server_data || !getDataChapter?.data?.item?.chapter_name || 
            item.chapters[0].server_data.findIndex(
              (chapter) => chapter.chapter_name === getDataChapter.data.item.chapter_name
            ) === 0}
          onClick={() => handleChapterNavigation('prev')}
          className="prev-chapter-btn"
        >
          Chương trước
        </Button>
        
        <Button
          variant="dark"
          disabled={!item?.chapters?.[0]?.server_data || !getDataChapter?.data?.item?.chapter_name || 
            item.chapters[0].server_data.findIndex(
              (chapter) => chapter.chapter_name === getDataChapter.data.item.chapter_name
            ) === item.chapters[0].server_data.length - 1}
          onClick={() => handleChapterNavigation('next')}
          className="next-chapter-btn"
        >
          Chương sau
        </Button>
      </div>
    </Modal>
  );
};

export default MobileChapterViewer; 