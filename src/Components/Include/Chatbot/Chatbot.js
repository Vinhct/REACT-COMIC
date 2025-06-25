import React, { useState, useRef, useEffect } from 'react';
import { Button, Form, Spinner, Badge } from 'react-bootstrap';
import { FaRobot, FaTimes, FaChevronDown, FaChevronUp, FaPaperPlane, FaSearch, FaListAlt, FaSmile, FaRandom, FaMicrophone } from 'react-icons/fa';
import axios from 'axios';
import './Chatbot.css';

// API key cho Google Gemini 
const GEMINI_API_KEY = "AIzaSyDwiXvBHJ8kwRdio87oP7oJy5yxhjLHHT0"; // Thay thế API key thực tại đây

// Map cảm xúc sang thể loại truyện phù hợp - đã điều chỉnh chính xác theo API
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

// Mô tả cảm xúc và đề xuất truyện
const emotionDescriptions = {
  "vui": "Bạn đang cảm thấy vui vẻ? Tuyệt vời! Tôi sẽ gợi ý một số truyện hài hước hoặc phiêu lưu để giữ tâm trạng tốt cho bạn.",
  "buồn": "Có vẻ bạn đang buồn? Tôi sẽ gợi ý truyện với những câu chuyện ý nghĩa hoặc một số tác phẩm tình cảm sâu sắc để đồng cảm với bạn.",
  "thất tình": "Thất tình à? Tôi hiểu cảm giác đó. Một số truyện ngôn tình hoặc drama có thể giúp bạn cảm thấy được đồng cảm và vơi bớt nỗi buồn.",
  "chán": "Khi cảm thấy chán, bạn cần những câu chuyện kích thích sự tò mò. Tôi sẽ gợi ý truyện phiêu lưu hoặc hài hước để làm bạn phấn chấn hơn.",
  "cô đơn": "Cảm giác cô đơn là điều tự nhiên. Tôi sẽ gợi ý những câu chuyện về tình bạn, tình yêu, và những kết nối giữa con người.",
  "căng thẳng": "Để giải tỏa căng thẳng, hãy đọc những truyện lôi cuốn để quên đi áp lực. Thể loại hành động hoặc trinh thám sẽ giúp bạn xả stress.",
  "tức giận": "Khi tức giận, đọc truyện võ thuật hoặc hành động mạnh mẽ có thể giúp bạn giải tỏa cảm xúc một cách an toàn.",
  "hạnh phúc": "Giữ vững cảm xúc hạnh phúc với những câu chuyện vui vẻ, lạc quan và tràn đầy năng lượng tích cực.",
  "tò mò": "Óc tò mò là nền tảng của tri thức. Hãy thỏa mãn điều đó với những truyện trinh thám hoặc khoa học viễn tưởng đầy bí ẩn.",
  "sợ hãi": "Đối mặt với nỗi sợ thông qua truyện kinh dị có thể là một cách thú vị để vượt qua lo lắng và khám phá cảm xúc sâu sắc."
};

// Hàm gọi API Gemini để xử lý tin nhắn
const callGeminiAPI = async (userMessage, genreList = [], apiKey = GEMINI_API_KEY) => {
  try {
    // Chuẩn bị một context cho AI để nó hiểu về trang web truyện
    const systemPrompt = `Bạn là trợ lý AI giúp người dùng tìm truyện trên một trang web truyện tranh.
    Các thể loại truyện sẵn có là: ${genreList.map(g => g.name).join(', ')}. 
    Đây là một vài cảm xúc và thể loại truyện phù hợp: ${Object.entries(emotionToGenreMap).map(([emotion, genres]) => `${emotion}: ${genres.join(', ')}`).join('; ')}.
    Nếu người dùng hỏi về thể loại, cảm xúc, hoặc tìm kiếm truyện, hãy cung cấp câu trả lời ngắn gọn và hữu ích.
    Hãy giữ câu trả lời ngắn gọn, thân thiện và tập trung vào việc giúp người dùng tìm truyện phù hợp.`;

    const payload = {
      contents: [{
        parts: [
          { text: systemPrompt },
          { text: `Người dùng: ${userMessage}` }
        ]
      }]
    };

    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`,
      payload,
      {
        headers: {
          'Content-Type': 'application/json'
        }
      }
    );

    // Lấy text từ phản hồi của API Gemini
    if (response.data && response.data.candidates && response.data.candidates[0] && response.data.candidates[0].content) {
      const aiResponse = response.data.candidates[0].content.parts[0].text;
      return aiResponse;
    } else {
      console.error('Unexpected Gemini API response format:', response.data);
      return "Xin lỗi, tôi không thể xử lý yêu cầu của bạn lúc này. Vui lòng thử lại sau.";
    }
  } catch (error) {
    console.error('Error calling Gemini API:', error);
    return "Xin lỗi, tôi gặp lỗi khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.";
  }
};

const Chatbot = ({ onFindComic, genreList = [], genresLoaded = false }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 1,
      text: "Xin chào! Tôi là trợ lý AI của web truyện. Tôi có thể giúp bạn tìm truyện theo thể loại, cảm xúc, hoặc sở thích. Bạn đang cảm thấy thế nào hôm nay?",
      sender: 'bot',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [showGenreList, setShowGenreList] = useState(false);
  const [showEmotionList, setShowEmotionList] = useState(false);
  
  // Thêm state cho Gemini API key
  const [geminiApiKey, setGeminiApiKey] = useState(localStorage.getItem('geminiApiKey') || GEMINI_API_KEY);
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Thêm state để theo dõi trạng thái đang tải truyện ngẫu nhiên
  const [loadingRandom, setLoadingRandom] = useState(false);

  // Thêm state để theo dõi trạng thái đang ghi âm
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef(null);

  // Lưu API key vào localStorage khi thay đổi
  useEffect(() => {
    if (geminiApiKey && geminiApiKey.trim() !== '') {
      localStorage.setItem('geminiApiKey', geminiApiKey);
    }
  }, [geminiApiKey]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current && isOpen && !isMinimized) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isMinimized]);

  // Focus input when chat opens
  useEffect(() => {
    if (isOpen && !isMinimized && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen, isMinimized]);

  // Cập nhật thông báo chào mừng khi danh sách thể loại được tải
  useEffect(() => {
    if (genresLoaded && genreList.length > 0 && messages.length === 1) {
      setMessages(prevMessages => [
        ...prevMessages,
        {
          id: prevMessages.length + 1,
          text: `Tôi đã tải được ${genreList.length} thể loại truyện. Bạn có thể hỏi về bất kỳ thể loại nào, cảm xúc hiện tại của bạn, hoặc gõ "danh sách thể loại" để xem tất cả.`,
          sender: 'bot',
          timestamp: new Date()
        }
      ]);
    }
  }, [genresLoaded, genreList]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
    if (!isOpen) {
      setIsMinimized(false);
    }
  };

  const toggleMinimize = (e) => {
    e.stopPropagation();
    setIsMinimized(!isMinimized);
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
  };

  const handleGenreClick = async (genreName) => {
    const userMessage = {
      id: messages.length + 1,
      text: `Tìm truyện thể loại ${genreName}`,
      sender: 'user',
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    setIsTyping(true);
    setShowGenreList(false);

    const genre = genreList.find(g => g.name.toLowerCase() === genreName.toLowerCase() || genreName.toLowerCase().includes(g.name.toLowerCase()));
    if (!genre) {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: `Không tìm thấy thể loại "${genreName}"!`,
        sender: 'bot',
        timestamp: new Date()
      }]);
      setIsTyping(false);
      return;
    }

    // Thông báo đang tìm kiếm
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      text: `Đang tìm kiếm truyện thể loại "${genreName}" cho bạn...`,
      sender: 'bot',
      timestamp: new Date()
    }]);

    try {
      // Lấy truyện theo thể loại
      const res = await axios.get(`https://otruyenapi.com/v1/api/the-loai/${genre.slug}?page=1`);
      const comics = res.data?.data?.items || [];
      if (comics.length === 0) {
        throw new Error('Không có truyện');
      }

      // Thông báo tìm thấy truyện
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: `Tìm thấy ${comics.length} truyện thuộc thể loại "${genreName}". Đây là 3 truyện gợi ý cho bạn:`,
        sender: 'bot',
        timestamp: new Date()
      }]);

      setMessages(prev => [...prev, {
        id: prev.length + 1,
        type: 'comics',
        comics: comics.slice(0, 3).map(comic => ({
          name: comic.name,
          slug: comic.slug,
          coverImage: getComicCoverUrl(comic),
          description: comic.description || 'Truyện tranh hấp dẫn, mời bạn đọc thử!'
        })),
        sender: 'bot',
        timestamp: new Date()
      }]);
    } catch (error) {
      // Thông báo đang thử phương án khác
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: `Đang thử tìm trong danh sách truyện mới nhất có thể loại "${genreName}"...`,
        sender: 'bot',
        timestamp: new Date()
      }]);
      
      try {
        const res = await axios.get('https://otruyenapi.com/v1/api/danh-sach/truyen-moi');
        const allComics = res.data?.data?.items || [];
        // Lọc truyện theo thể loại
        const genreComics = allComics.filter(comic => 
          comic.category && comic.category.some(cat => 
            cat.name.toLowerCase() === genreName.toLowerCase() ||
            cat.slug.toLowerCase() === genre.slug.toLowerCase()
          )
        );
        
        if (genreComics.length > 0) {
          // Thông báo tìm thấy truyện
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            text: `Tìm thấy ${genreComics.length} truyện thuộc thể loại "${genreName}" trong danh sách truyện mới. Đây là một vài gợi ý cho bạn:`,
            sender: 'bot',
            timestamp: new Date()
          }]);

          setMessages(prev => [...prev, {
            id: prev.length + 1,
            type: 'comics',
            comics: genreComics.slice(0, 3).map(comic => ({
              name: comic.name,
              slug: comic.slug,
              coverImage: getComicCoverUrl(comic),
              description: comic.description || 'Truyện tranh hấp dẫn, mời bạn đọc thử!'
            })),
            sender: 'bot',
            timestamp: new Date()
          }]);
        } else {
          throw new Error('Không tìm thấy truyện');
        }
      } catch (fallbackErr) {
        // Thông báo không tìm thấy và gợi ý
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          text: `Xin lỗi, hiện tại không tìm thấy truyện nào thuộc thể loại "${genreName}". Bạn có thể:
1. Thử tìm với tên thể loại khác
2. Xem danh sách thể loại bằng cách gõ "danh sách thể loại"
3. Hoặc để tôi gợi ý một số thể loại phổ biến cho bạn`,
          sender: 'bot',
          timestamp: new Date()
        }]);

        // Hiển thị một số thể loại phổ biến
        const popularGenres = genreList.slice(0, 5).map(g => g.name);
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          text: `Một số thể loại phổ biến: ${popularGenres.join(', ')}`,
          sender: 'bot',
          timestamp: new Date()
        }]);
      }
    }
    setIsTyping(false);
  };

  const handleEmotionClick = async (emotion) => {
    // Thêm tin nhắn người dùng
    const userMessage = {
      id: messages.length + 1,
      text: `Tôi đang cảm thấy ${emotion}`,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Hiển thị trạng thái đang gõ
    setIsTyping(true);

    // Lấy thể loại dựa trên cảm xúc
    const genresForEmotion = emotionToGenreMap[emotion] || ["Hài Hước", "Phiêu Lưu"];
    const emotionDesc = emotionDescriptions[emotion] || `Tôi sẽ gợi ý một số truyện phù hợp với cảm xúc ${emotion} của bạn.`;
    
    // Thêm phản hồi mô tả về cảm xúc
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      text: emotionDesc,
      sender: 'bot',
      timestamp: new Date()
    }]);

    // Thêm phản hồi với gợi ý thể loại
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      text: `Dựa vào tâm trạng của bạn, tôi gợi ý các thể loại truyện sau:`,
      sender: 'bot',
      timestamp: new Date(),
      genres: genresForEmotion.map(name => ({name, slug: name.toLowerCase().replace(/\s+/g, '-')}))
    }]);
    
    setIsTyping(false);
    setShowEmotionList(false);
  };

  const displayGenreList = () => {
    // Hiển thị danh sách thể loại như một tin nhắn
    const genreListText = genreList.length > 0 
      ? "Đây là danh sách các thể loại truyện hiện có:" 
      : "Xin lỗi, tôi không thể tải danh sách thể loại. Vui lòng thử lại sau.";
      
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      text: genreListText,
      sender: 'bot',
      timestamp: new Date(),
      genres: genreList
    }]);
    
    setShowGenreList(true);
  };

  const displayEmotionList = () => {
    // Hiển thị danh sách cảm xúc
    setMessages(prev => [...prev, {
      id: prev.length + 1,
      text: "Bạn đang cảm thấy thế nào? Hãy chọn một cảm xúc để tôi gợi ý truyện phù hợp:",
      sender: 'bot',
      timestamp: new Date(),
      emotions: Object.keys(emotionToGenreMap)
    }]);
    
    setShowEmotionList(true);
  };

  // Thêm hàm để xử lý việc lưu API key
  const handleSaveApiKey = () => {
    if (apiKeyInput.trim()) {
      setGeminiApiKey(apiKeyInput.trim());
      setShowApiKeyInput(false);
      setApiKeyInput('');
      
      // Thông báo cho người dùng biết API key đã được lưu
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: "API key của Gemini đã được cập nhật thành công!",
        sender: 'bot',
        timestamp: new Date()
      }]);
    }
  };

  const getAIResponse = async (userMessage) => {
    setIsTyping(true);
    
    try {
      // Logic tìm kiếm theo cảm xúc hoặc thể loại vẫn giữ nguyên
      const lowerCaseMessage = userMessage.toLowerCase();
      
      // Xử lý cài đặt API key
      if (lowerCaseMessage.includes('api key') || lowerCaseMessage.includes('cài đặt') || lowerCaseMessage.includes('setting')) {
        setShowApiKeyInput(true);
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          text: "Bạn có thể nhập API key của Google Gemini vào ô bên dưới:",
          sender: 'bot',
          timestamp: new Date()
        }]);
        setIsTyping(false);
        return;
      }
      
      // Xử lý các lệnh đặc biệt
      if (lowerCaseMessage.includes('danh sách thể loại') || lowerCaseMessage.includes('có những thể loại nào') || lowerCaseMessage.includes('list genre')) {
        displayGenreList();
        setIsTyping(false);
        return; 
      }
      else if (lowerCaseMessage.includes('cảm xúc') || lowerCaseMessage.includes('tôi đang cảm thấy') || lowerCaseMessage.includes('tâm trạng')) {
        displayEmotionList();
        setIsTyping(false);
        return;
      }
      // Kiểm tra nếu tin nhắn chứa cảm xúc
      else if (Object.keys(emotionToGenreMap).some(emotion => lowerCaseMessage.includes(emotion))) {
        const matchedEmotion = Object.keys(emotionToGenreMap).find(emotion => lowerCaseMessage.includes(emotion));
        handleEmotionClick(matchedEmotion);
        setIsTyping(false);
        return;
      }
      // Kiểm tra nếu tin nhắn khớp với thể loại truyện
      else if (genreList.some(genre => lowerCaseMessage.includes(genre.name.toLowerCase()))) {
        const matchedGenre = genreList.find(genre => lowerCaseMessage.includes(genre.name.toLowerCase()));
        
        // Notify parent component to search for the genre
        if (onFindComic) {
          await onFindComic(matchedGenre.name);
        }
        
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          text: `Đang tìm truyện thuộc thể loại ${matchedGenre.name} cho bạn...`,
          sender: 'bot',
          timestamp: new Date()
        }]);
        
        setIsTyping(false);
        return;
      }
      // Kiểm tra lệnh tìm kiếm
      else if (lowerCaseMessage.includes('tìm') || lowerCaseMessage.includes('search')) {
        // Trích xuất từ khóa tìm kiếm
        const searchTerms = userMessage.replace(/tìm|search/gi, '').trim();
        
        // Notify parent component to search
        if (onFindComic && searchTerms) {
          await onFindComic(searchTerms);
          
          setMessages(prev => [...prev, {
            id: prev.length + 1,
            text: `Tôi đang tìm kiếm truyện với từ khóa "${searchTerms}" cho bạn...`,
            sender: 'bot',
            timestamp: new Date()
          }]);
          
          setIsTyping(false);
          return;
        }
      }
      
      // Đã bỏ kiểm tra API key, sử dụng API key mặc định nếu người dùng chưa cài đặt
      // Sử dụng API key từ state để gọi Gemini API
      const aiResponse = await callGeminiAPI(userMessage, genreList, geminiApiKey);
      
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: aiResponse,
        sender: 'bot',
        timestamp: new Date()
      }]);
      
    } catch (error) {
      console.error("Error getting AI response:", error);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: "Xin lỗi, có lỗi xảy ra khi xử lý yêu cầu của bạn. Vui lòng thử lại sau.",
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  // Voice-to-text handler
  const handleVoiceInput = () => {
    // Check browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert('Trình duyệt của bạn không hỗ trợ Voice-to-Text (Web Speech API). Hãy dùng Chrome hoặc Edge mới nhất!');
      return;
    }
    if (isRecording) {
      recognitionRef.current && recognitionRef.current.stop();
      setIsRecording(false);
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = 'vi-VN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(prev => prev ? prev + ' ' + transcript : transcript);
      setIsRecording(false);
      inputRef.current && inputRef.current.focus();
    };
    recognition.onerror = (event) => {
      setIsRecording(false);
      alert('Lỗi nhận diện giọng nói: ' + event.error);
    };
    recognition.onend = () => setIsRecording(false);
    recognitionRef.current = recognition;
    recognition.start();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: messages.length + 1,
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');

    // Get AI response
    await getAIResponse(input);
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const renderGenreBadges = (genres) => {
    return (
      <div className="genre-badges-container">
        {genres.map((genre, index) => (
          <Badge 
            key={index} 
            className="genre-badge"
            onClick={() => handleGenreClick(genre.name)}
          >
            {genre.name}
          </Badge>
        ))}
      </div>
    );
  };

  const renderEmotionBadges = (emotions) => {
    return (
      <div className="emotion-badges-container">
        {emotions.map((emotion, index) => (
          <Badge 
            key={index} 
            className="emotion-badge"
            data-emotion={emotion}
            onClick={() => handleEmotionClick(emotion)}
          >
            {emotion}
          </Badge>
        ))}
      </div>
    );
  };

  // Thêm hàm renderComicCard
  const renderComicCard = (comic) => (
    <div className="comic-card">
      <img
        src={comic.coverImage}
        alt={comic.name}
        className="comic-cover"
        onError={e => { e.target.onerror = null; e.target.src = '/logo192.png'; }}
      />
      <div className="comic-info">
        <h5>{comic.name}</h5>
        <p>{comic.description}</p>
        <a href={`/comics/${comic.slug}`} className="btn btn-primary btn-sm" target="_blank" rel="noopener noreferrer">
          Đọc ngay
        </a>
      </div>
    </div>
  );

  // Thêm hàm để xử lý sự kiện khi người dùng nhấp vào nút truyện ngẫu nhiên
  const handleRandomComic = async () => {
    // Thêm tin nhắn người dùng
    const userMessage = {
      id: messages.length + 1,
      text: "Tìm truyện ngẫu nhiên",
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setLoadingRandom(true);
    
    try {
      // Hiển thị trạng thái đang gõ
      setIsTyping(true);
      
      // Lấy danh sách truyện mới
      const response = await axios.get('https://otruyenapi.com/v1/api/danh-sach/truyen-moi');
      
      if (response.data?.data?.items && response.data.data.items.length > 0) {
        // Chọn một truyện ngẫu nhiên từ danh sách
        const randomIndex = Math.floor(Math.random() * response.data.data.items.length);
        const randomComic = response.data.data.items[randomIndex];
        // Thêm phản hồi từ bot dạng card truyện
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          type: 'comic',
          comic: {
            name: randomComic.name,
            slug: randomComic.slug,
            coverImage: getComicCoverUrl(randomComic),
            description: randomComic.description || 'Truyện tranh hấp dẫn, mời bạn đọc thử!'
          },
          sender: 'bot',
          timestamp: new Date()
        }]);
        
        // Chờ một chút để người dùng đọc tin nhắn
        setTimeout(() => {
          // Điều hướng đến trang chi tiết truyện
          window.location.href = `/comics/${randomComic.slug}`;
        }, 1500);
      } else {
        // Nếu không có truyện nào được tìm thấy
        setMessages(prev => [...prev, {
          id: prev.length + 1,
          text: "Xin lỗi, tôi không thể tìm được truyện ngẫu nhiên lúc này. Vui lòng thử lại sau.",
          sender: 'bot',
          timestamp: new Date()
        }]);
      }
    } catch (error) {
      console.error("Error fetching random comic:", error);
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        text: "Có lỗi xảy ra khi tìm truyện ngẫu nhiên. Vui lòng thử lại sau.",
        sender: 'bot',
        timestamp: new Date()
      }]);
    } finally {
      setIsTyping(false);
      setLoadingRandom(false);
    }
  };

  // Hàm lấy url ảnh bìa chuẩn
  const getComicCoverUrl = (comic) => {
    if (comic.thumb_url) {
      // Nếu thumb_url là url đầy đủ thì dùng luôn, nếu không thì thêm prefix
      return comic.thumb_url.startsWith('http')
        ? comic.thumb_url
        : `https://img.otruyenapi.com/uploads/comics/${comic.thumb_url}`;
    }
    return comic.image || comic.coverImage || comic.thumbnail || '/logo192.png';
  };

  return (
    <div className="chatbot-container">
      {/* Chatbot button - Chỉ hiển thị khi cửa sổ chat đóng */}
      {!isOpen && (
        <Button 
          className="chatbot-button"
          onClick={toggleChat}
          aria-label="Open chat"
        >
          <FaRobot size={24} />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <div className={`chatbot-window ${isMinimized ? 'minimized' : ''}`}>
          {/* Chat header */}
          <div className="chatbot-header" onClick={toggleMinimize}>
            <div className="chatbot-title">
              <FaRobot className="me-2" />
              <span>Trợ lý tìm truyện AI</span>
            </div>
            <div className="chatbot-controls">
              <Button 
                variant="link" 
                className="minimize-button"
                onClick={toggleMinimize}
                aria-label={isMinimized ? "Expand chat" : "Minimize chat"}
              >
                {isMinimized ? <FaChevronUp /> : <FaChevronDown />}
              </Button>
              <Button 
                variant="link" 
                className="close-button"
                onClick={toggleChat}
                aria-label="Close chat"
              >
                <FaTimes />
              </Button>
            </div>
          </div>

          {/* Chat body - hidden when minimized */}
          {!isMinimized && (
            <>
              <div className="chatbot-messages">
                {messages.map(message => (
                  <div 
                    key={message.id} 
                    className={`message ${message.sender === 'user' ? 'user-message' : 'bot-message'}`}
                  >
                    <div className="message-content">
                      {message.type === 'comics' && Array.isArray(message.comics) ? (
                        <div className="comics-list">
                          {message.comics.map((comic, idx) => renderComicCard(comic))}
                        </div>
                      ) : message.type === 'comic' && message.comic ? (
                        renderComicCard(message.comic)
                      ) : (
                        <p>{message.text}</p>
                      )}
                      {message.genres && renderGenreBadges(message.genres)}
                      {message.emotions && renderEmotionBadges(message.emotions)}
                      <span className="message-time">{formatTime(message.timestamp)}</span>
                    </div>
                  </div>
                ))}
                {showApiKeyInput && (
                  <div className="api-key-input-container">
                    <p className="api-key-label">Nhập API key của Google Gemini:</p>
                    <div className="api-key-input-wrapper">
                      <Form.Control
                        type="text"
                        placeholder="Nhập API key của bạn..."
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        className="api-key-input"
                      />
                      <Button 
                        onClick={handleSaveApiKey}
                        className="api-key-save-btn"
                      >
                        Lưu
                      </Button>
                      <Button 
                        variant="outline-secondary"
                        onClick={() => setShowApiKeyInput(false)}
                        className="api-key-cancel-btn"
                      >
                        Hủy
                      </Button>
                    </div>
                  </div>
                )}
                {isTyping && (
                  <div className="message bot-message">
                    <div className="message-content typing">
                      <Spinner animation="grow" size="sm" />
                      <Spinner animation="grow" size="sm" />
                      <Spinner animation="grow" size="sm" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat input */}
              <Form onSubmit={handleSubmit} className="chatbot-input">
                <Form.Control
                  type="text"
                  placeholder="Nhập tin nhắn..."
                  value={input}
                  onChange={handleInputChange}
                  ref={inputRef}
                  autoComplete="off"
                />
                <Button
                  type="button"
                  className={`voice-btn${isRecording ? ' recording' : ''}`}
                  onClick={handleVoiceInput}
                  aria-label={isRecording ? 'Đang ghi âm...' : 'Nhấn để nói'}
                  style={{ marginRight: 8, background: isRecording ? '#22d3ee' : '#e5e7eb', color: isRecording ? '#fff' : '#444', border: 'none', boxShadow: isRecording ? '0 0 0 4px #a5f3fc' : 'none', transition: 'all 0.18s' }}
                >
                  <FaMicrophone style={{ animation: isRecording ? 'pulse 1s infinite' : 'none' }} />
                </Button>
                <Button
                  type="submit"
                  disabled={!input.trim() || isTyping}
                  className="send-button"
                >
                  <FaPaperPlane />
                </Button>
              </Form>
              
              {/* Quick suggestions */}
              <div className="quick-suggestions">
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={() => {
                    setInput("Tôi cảm thấy buồn");
                    inputRef.current.focus();
                  }}
                >
                  <FaSmile className="me-1" /> Đang buồn
                </Button>
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={() => {
                    setInput("Danh sách thể loại");
                    inputRef.current.focus();
                  }}
                >
                  <FaListAlt className="me-1" /> Xem thể loại
                </Button>
                <Button 
                  variant="outline-primary" 
                  size="sm" 
                  onClick={handleRandomComic}
                  disabled={loadingRandom}
                >
                  <FaRandom className="me-1" /> Truyện ngẫu nhiên
                </Button>
                <Button 
                  variant="outline-secondary" 
                  size="sm" 
                  onClick={() => setShowApiKeyInput(true)}
                >
                  <FaRobot className="me-1" /> Cài đặt API
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default Chatbot; 