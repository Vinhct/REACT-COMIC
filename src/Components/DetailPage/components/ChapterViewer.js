import React, { useEffect, useRef, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { IoChevronUpCircle, IoReturnUpBack } from "react-icons/io5";

const ChapterViewer = ({
  isModalOpen,
  handleClose,
  item,
  getDataChapter,
  loading,
  handleReachChapter
}) => {
  const [showFooter, setShowFooter] = useState(true);
  const lastScrollTopRef = useRef(0);

  useEffect(() => {
    const handleScroll = () => {
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
      return () => {
        modalBody.removeEventListener('scroll', handleScroll);
      };
    }
    
    return () => {};
  }, [isModalOpen]);

  // Reset scroll position when opening new chapter
  useEffect(() => {
    if (isModalOpen) {
      setShowFooter(true);
      lastScrollTopRef.current = 0;
    }
  }, [isModalOpen, getDataChapter]);

  return (
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
            <span className="comic-name">{item?.name}</span>
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
              if (!item?.chapters?.[0]?.server_data) return;
              
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
              if (!item?.chapters?.[0]?.server_data) return;
              
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
  );
};

export default ChapterViewer; 