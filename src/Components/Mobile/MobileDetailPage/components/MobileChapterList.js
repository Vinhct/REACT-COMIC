import React, { useState, useEffect } from 'react';
import { Card, ListGroup, Button, Form, InputGroup } from 'react-bootstrap';
import { BsSearch } from 'react-icons/bs';
import { useLocation } from 'react-router-dom';

const MobileChapterList = ({ item, handleReachChapter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState(false);
  
  // Lấy highlight_chapter từ URL
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const highlightChapter = params.get('highlight_chapter');

  // Cuộn đến chapter được highlight và mở rộng danh sách nếu cần
  useEffect(() => {
    if (highlightChapter) {
      // Đợi DOM render xong
      setTimeout(() => {
        const el = document.querySelector('.highlight-chapter');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setExpanded(true); // Mở rộng danh sách để hiển thị chapter được highlight
        }
      }, 200);
    }
  }, [highlightChapter, item]);

  // Kiểm tra item tồn tại
  if (!item) {
    return (
      <Card className="shadow-sm border-0 mb-3">
        <Card.Body>
          <Card.Title className="section-heading">
            Danh Sách Chương
          </Card.Title>
          <div className="text-center">
            <p>Không thể tải danh sách chương. Vui lòng thử lại sau.</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  // Lấy tất cả các chapter từ tất cả các server
  const getAllChapters = () => {
    if (!item.chapters || !item.chapters.length) return [];
    
    const allChapters = [];
    
    item.chapters.forEach(server => {
      if (server.server_data && server.server_data.length) {
        server.server_data.forEach(chapter => {
          allChapters.push({
            ...chapter,
            server_name: server.server_name
          });
        });
      }
    });
    
    return allChapters;
  };

  const allChapters = getAllChapters();
  
  // Lọc chapter theo từ khóa tìm kiếm
  const filteredChapters = allChapters.filter(chapter => 
    chapter.chapter_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Tìm index của chapter được highlight
  const highlightedIndex = highlightChapter ? 
    filteredChapters.findIndex(chapter => 
      chapter.chapter_name === highlightChapter || chapter.chapter === highlightChapter
    ) : -1;

  // Xác định danh sách chapter hiển thị
  let displayChapters;
  if (expanded) {
    // Hiển thị tất cả nếu đã mở rộng
    displayChapters = filteredChapters;
  } else if (highlightedIndex >= 0 && highlightedIndex >= 10) {
    // Nếu chapter được highlight nằm sau chapter thứ 10,
    // hiển thị 5 chapter trước và sau chapter được highlight
    const start = Math.max(0, highlightedIndex - 5);
    const end = Math.min(filteredChapters.length, highlightedIndex + 6);
    displayChapters = filteredChapters.slice(start, end);
  } else {
    // Mặc định hiển thị 10 chapter đầu tiên
    displayChapters = filteredChapters.slice(0, 10);
  }
  
  return (
    <Card className="shadow-sm border-0 mb-3">
      <Card.Body>
        <Card.Title className="section-heading">
          Danh Sách Chương
        </Card.Title>
        
        {/* Ô tìm kiếm chương */}
        <InputGroup className="mb-3">
          <Form.Control
            placeholder="Tìm chương..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button variant="outline-secondary">
            <BsSearch />
          </Button>
        </InputGroup>
        
        {/* Danh sách chương */}
        {filteredChapters.length > 0 ? (
          <div className="chapters-container">
            <ListGroup>
              {displayChapters.map((chapter, index) => (
                <ListGroup.Item 
                  key={index} 
                  className={`chapter-item${highlightChapter && (chapter.chapter_name === highlightChapter || chapter.chapter === highlightChapter) ? ' highlight-chapter' : ''}`}
                  onClick={() => handleReachChapter(chapter.chapter_api_data)}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="chapter-name">{chapter.chapter_name}</span>
                    <small className="text-muted server-tag">{chapter.server_name}</small>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
            
            {filteredChapters.length > displayChapters.length && (
              <Button 
                variant="outline-primary" 
                onClick={() => setExpanded(!expanded)} 
                className="mt-3 w-100"
              >
                {expanded ? "Thu gọn" : `Xem thêm (${filteredChapters.length - displayChapters.length} chương)`}
              </Button>
            )}
          </div>
        ) : (
          <div className="text-center py-3">
            {searchTerm ? (
              <p>Không tìm thấy chương phù hợp</p>
            ) : (
              <p>Chưa có chương nào</p>
            )}
          </div>
        )}
      </Card.Body>
    </Card>
  );
};

export default MobileChapterList; 