import React, { useState } from 'react';
import { FaHeart, FaBookOpen, FaFire, FaStar, FaPause, FaPlay } from 'react-icons/fa';
import './WelcomeBanner.css';

const WelcomeBanner = () => {
  const [isPaused, setIsPaused] = useState(false);
  


  return (
    <div className={`welcome-banner ${isPaused ? 'paused' : ''}`}>
      
      <div className="welcome-text-container">
        <div className="welcome-text">
          <span className="welcome-section">
            <FaBookOpen className="welcome-icon" /> Chào mừng bạn đến với trang web truyện
          </span>
          <span className="welcome-divider">★</span>
          <span className="welcome-section">
            <FaHeart className="welcome-icon" /> Khám phá kho truyện đa dạng và phong phú
          </span>
          <span className="welcome-divider">★</span>
          <span className="welcome-section">
            <FaFire className="welcome-icon" /> Trải nghiệm thế giới truyện tranh tuyệt vời
          </span>
          <span className="welcome-divider">★</span>
          <span className="welcome-section">
            <FaStar className="welcome-icon" /> Cập nhật truyện mới hàng ngày
          </span>
          <span className="welcome-divider">★</span>
          <span className="welcome-section">
            <FaBookOpen className="welcome-icon" /> Cảm ơn bạn đã ghé thăm
          </span>
        </div>
      </div>
    </div>
  );
};

export default WelcomeBanner; 