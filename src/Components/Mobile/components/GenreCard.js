import React from 'react';
import { Link } from 'react-router-dom';
import './GenreCard.css';

// Component GenreCard hiển thị một thể loại truyện
const GenreCard = ({ genre }) => {
  return (
    <Link to={`/mobile/genres/${genre.id}`} className="genre-card-link">
      <div className="genre-card">
        <div>
          <div className="genre-name">{genre.name}</div>
          <div className="genre-description">{genre.description}</div>
        </div>
        <div className="comic-count">{genre.total_comics} truyện</div>
      </div>
    </Link>
  );
};

export default GenreCard; 