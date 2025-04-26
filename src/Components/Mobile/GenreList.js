import React, { useEffect, useState } from 'react';
import axios from 'axios';
import './GenreList.css';
import GenreCard from './components/GenreCard';
import Header from './Header';
import Footer from './Footer';
import Loading from './Loading';

const GenreList = () => {
  const [genres, setGenres] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchGenres();
  }, []);

  const fetchGenres = async () => {
    setLoading(true);
    try {
      console.log("Fetching genres...");
      const response = await axios.get('https://otruyenapi.com/v1/api/the-loai');
      if (response.data && response.data.status === 'success' && response.data.data) {
        setGenres(response.data.data);
      } else {
        console.error("Invalid response format from genre API");
        // Fallback data
        setGenres(sampleGenres);
      }
    } catch (error) {
      console.error("Error fetching genres:", error);
      // Fallback data
      setGenres(sampleGenres);
    } finally {
      setLoading(false);
    }
  };

  // Sample data in case API fails
  const sampleGenres = [
    { id: 1, name: "Hành Động", description: "Thể loại có đánh đấm, bạo lực", totalComics: 120 },
    { id: 2, name: "Phiêu Lưu", description: "Thể loại có những chuyến phiêu lưu mạo hiểm", totalComics: 85 },
    { id: 3, name: "Lãng Mạn", description: "Thể loại về tình yêu lãng mạn", totalComics: 150 },
    { id: 4, name: "Kinh Dị", description: "Thể loại rùng rợn, ma quái", totalComics: 65 },
    { id: 5, name: "Hài Hước", description: "Thể loại vui nhộn, hài hước", totalComics: 110 },
    { id: 6, name: "Kỳ Ảo", description: "Thể loại về phép thuật, thế giới kỳ ảo", totalComics: 95 }
  ];

  return (
    <div className="genre-list-container">
      <Header pageTitle="Thể Loại" />
      
      {loading ? (
        <Loading />
      ) : (
        <div className="genres-grid">
          {genres.map(genre => (
            <GenreCard 
              key={genre.id} 
              genre={genre} 
            />
          ))}
        </div>
      )}
      
      <Footer activeTab="genres" />
    </div>
  );
};

export default GenreList; 