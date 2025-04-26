import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Chatbot from './Chatbot';
import { useNavigate } from 'react-router-dom';

// Map cảm xúc sang thể loại - đã được cập nhật để phù hợp với API thực tế
const emotionToGenreMap = {
  "vui": ["Comedy", "Adventure", "School Life"],
  "buồn": ["Romance", "Drama", "Tragedy"],
  "thất tình": ["Romance", "Drama", "Ngôn Tình"],
  "chán": ["Comedy", "Horror", "Adventure"],
  "cô đơn": ["Romance", "Slice of Life", "Drama"],
  "căng thẳng": ["Horror", "Action", "Trinh Thám"],
  "tức giận": ["Action", "Martial Arts", "Shounen"],
  "hạnh phúc": ["Comedy", "Romance", "Slice of Life"],
  "tò mò": ["Trinh Thám", "Mystery", "Sci-fi"],
  "sợ hãi": ["Horror", "Psychological", "Supernatural"]
};

const ChatbotProvider = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [genres, setGenres] = useState([]);
  const [genresLoaded, setGenresLoaded] = useState(false);
  const navigate = useNavigate();

  // Lấy danh sách thể loại khi component được mount
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await axios.get('https://otruyenapi.com/v1/api/the-loai');
        if (response.data && response.data.data && response.data.data.items) {
          setGenres(response.data.data.items);
          setGenresLoaded(true);
          console.log("Danh sách thể loại:", response.data.data.items.map(genre => genre.name));
        }
      } catch (error) {
        console.error('Error fetching genres:', error);
      }
    };

    fetchGenres();
  }, []);

  useEffect(() => {
    if (searchQuery) {
      performSearch();
    }
  }, [searchQuery]);

  const performSearch = async () => {
    setIsSearching(true);
    try {
      // Kiểm tra xem searchQuery có phải là thể loại không
      const matchedGenre = genres.find(genre => 
        genre.name.toLowerCase() === searchQuery.toLowerCase() ||
        searchQuery.toLowerCase().includes(genre.name.toLowerCase())
      );

      if (matchedGenre) {
        // Nếu là thể loại, chuyển đến trang thể loại
        navigate(`/genre/${matchedGenre.slug}`);
        return;
      }

      // Nếu không phải thể loại, tìm kiếm theo từ khóa
      const response = await axios.get('https://otruyenapi.com/v1/api/danh-sach/truyen-moi');
      
      if (response.data && response.data.data && response.data.data.items) {
        const items = response.data.data.items;
        
        // Lọc truyện dựa trên từ khóa tìm kiếm
        const filtered = items.filter(comic => {
          const lowerCaseQuery = searchQuery.toLowerCase();
          
          // Tìm trong tên, thể loại và các trường khác
          const matchesName = comic.name && comic.name.toLowerCase().includes(lowerCaseQuery);
          
          // Tìm trong thể loại
          const matchesCategory = comic.category && comic.category.some(cat => 
            cat.name.toLowerCase().includes(lowerCaseQuery)
          );
          
          return matchesName || matchesCategory;
        });
        
        setSearchResults(filtered);
        
        // Lưu kết quả vào localStorage để trang tìm kiếm sử dụng
        localStorage.setItem('searchResults', JSON.stringify(filtered));
        
        // Nếu có kết quả, chuyển đến trang kết quả tìm kiếm
        navigate(`/search?query=${encodeURIComponent(searchQuery)}`);
      }
    } catch (error) {
      console.error('Error searching comics:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const searchComicsByGenre = async (genreName) => {
    // Tìm thể loại phù hợp
    const matchedGenre = genres.find(genre => 
      genre.name.toLowerCase() === genreName.toLowerCase() ||
      genreName.toLowerCase().includes(genre.name.toLowerCase()) ||
      genre.name.toLowerCase().includes(genreName.toLowerCase())
    );

    if (matchedGenre) {
      // Nếu tìm thấy thể loại, điều hướng đến trang thể loại
      navigate(`/genre/${matchedGenre.slug}`);
      return true;
    }
    
    return false;
  };

  const searchComicsByEmotion = async (emotion) => {
    // Kiểm tra xem cảm xúc có trong map không
    if (emotionToGenreMap[emotion]) {
      // Lấy thể loại truyện phù hợp với cảm xúc
      const genresForEmotion = emotionToGenreMap[emotion];
      
      // Tìm thể loại đầu tiên trong danh sách có trong cơ sở dữ liệu
      for (const genreName of genresForEmotion) {
        const matchedGenre = genres.find(genre => 
          genre.name.toLowerCase() === genreName.toLowerCase() || 
          genre.name.toLowerCase().includes(genreName.toLowerCase()) ||
          genreName.toLowerCase().includes(genre.name.toLowerCase())
        );
        
        if (matchedGenre) {
          // Nếu tìm thấy thể loại, điều hướng đến trang thể loại
          navigate(`/genre/${matchedGenre.slug}`);
          return true;
        }
      }
      
      // Nếu không tìm thấy thể loại phù hợp, tìm kiếm theo cảm xúc như một từ khóa
      setSearchQuery(emotion);
      return true;
    }
    
    return false;
  };

  const handleFindComic = async (query) => {
    // Nếu query chứa từ "thể loại" hoặc "genre", không thiết lập searchQuery
    if (query.toLowerCase().includes('thể loại') || query.toLowerCase().includes('genre')) {
      return;
    }
    
    // Kiểm tra xem query có phải là cảm xúc không
    const isEmotion = Object.keys(emotionToGenreMap).some(emotion => query.toLowerCase().includes(emotion));
    
    if (isEmotion) {
      // Tìm cảm xúc phù hợp
      const matchedEmotion = Object.keys(emotionToGenreMap).find(emotion => query.toLowerCase().includes(emotion));
      
      if (matchedEmotion) {
        // Tìm kiếm dựa trên cảm xúc
        const isEmotionSearch = await searchComicsByEmotion(matchedEmotion);
        
        if (isEmotionSearch) {
          return;
        }
      }
    }
    
    // Kiểm tra xem có phải đang tìm kiếm theo thể loại không
    const isGenreSearch = await searchComicsByGenre(query);
    
    // Nếu không phải tìm kiếm theo thể loại hoặc cảm xúc, thiết lập searchQuery để tìm kiếm thông thường
    if (!isGenreSearch) {
      setSearchQuery(query);
    }
  };

  return <Chatbot onFindComic={handleFindComic} genreList={genres} genresLoaded={genresLoaded} />;
};

export default ChatbotProvider; 