import React, { useEffect } from 'react';
import { Card, ListGroup } from 'react-bootstrap';
import { useLocation } from 'react-router-dom';

const ChapterList = ({ item, handleReachChapter }) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const highlightChapter = params.get('highlight_chapter');

  useEffect(() => {
    if (highlightChapter) {
      // Đợi DOM render xong
      setTimeout(() => {
        const el = document.querySelector('.highlight-chapter');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 200);
    }
  }, [highlightChapter, item]);

  // Kiểm tra item tồn tại
  if (!item) {
    return (
      <Card className="chapter-list mb-4">
        <Card.Body>
          <Card.Title className="text-center text-primary fw-bold">
            Danh Sách Chương
          </Card.Title>
          <div className="text-center">
            <p>Không thể tải danh sách chương. Vui lòng thử lại sau.</p>
          </div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <Card className="chapter-list mb-4">
      <Card.Body>
        <Card.Title className="text-center text-primary fw-bold">
          Danh Sách Chương
        </Card.Title>
        <ListGroup
          className="scrollable-list"
          style={{ maxHeight: "400px", overflowY: "auto" }}
        >
          {item.chapters && item.chapters.length > 0 ? (
            item.chapters.map((chapter, index) => (
              <div key={index}>
                <h5 className="server-name">{chapter.server_name}</h5>
                <ListGroup.Item>
                  {chapter.server_data &&
                  chapter.server_data.length > 0 ? (
                    chapter.server_data.map((listchapter, subindex) => (
                      <div
                        className={`chapter_click${highlightChapter && (listchapter.chapter_name === highlightChapter || listchapter.chapter === highlightChapter) ? ' highlight-chapter' : ''}`}
                        key={subindex}
                        onClick={() =>
                          handleReachChapter(
                            listchapter.chapter_api_data
                          )
                        }
                      >
                        Chapter : {listchapter.chapter_name}
                      </div>
                    ))
                  ) : (
                    <span>Coming soon ....</span>
                  )}
                </ListGroup.Item>
              </div>
            ))
          ) : (
            <ListGroup.Item className="text-muted">
              Không có chương nào
            </ListGroup.Item>
          )}
        </ListGroup>
      </Card.Body>
    </Card>
  );
};

export default ChapterList; 