import React, { useState } from 'react';
import { Card, ListGroup, Button, Form, InputGroup } from 'react-bootstrap';
import { BsSearch } from 'react-icons/bs';

const MobileChapterList = ({ item, handleReachChapter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expanded, setExpanded] = useState(false);

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
  
  // Hiển thị số lượng chapter phù hợp với kích thước màn hình
  const displayChapters = expanded ? filteredChapters : filteredChapters.slice(0, 10);
  
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
                  className="chapter-item"
                  onClick={() => handleReachChapter(chapter.chapter_api_data)}
                >
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="chapter-name">{chapter.chapter_name}</span>
                    <small className="text-muted server-tag">{chapter.server_name}</small>
                  </div>
                </ListGroup.Item>
              ))}
            </ListGroup>
            
            {filteredChapters.length > 10 && (
              <Button 
                variant="outline-primary" 
                onClick={() => setExpanded(!expanded)} 
                className="mt-3 w-100"
              >
                {expanded ? "Thu gọn" : `Xem thêm (${filteredChapters.length - 10} chương)`}
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