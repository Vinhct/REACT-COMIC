import React, { useState } from 'react';
import './AdBanner.css';

const AdBanner = ({ image, link, alt = 'Quảng cáo', style = {} }) => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="ad-banner" style={style}>
      <button className="ad-banner-close" onClick={() => setVisible(false)} aria-label="Đóng quảng cáo">×</button>
      {link ? (
        <a href={link} target="_blank" rel="noopener noreferrer">
          <img src={image} alt={alt} className="ad-banner-img" />
        </a>
      ) : (
        <img src={image} alt={alt} className="ad-banner-img" />
      )}
    </div>
  );
};

export default AdBanner; 