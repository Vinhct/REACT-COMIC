import React from 'react';
import { Card, ListGroup } from 'react-bootstrap';

const ChapterList = ({ item, handleReachChapter }) => {
  return (
    <Card
      className="shadow-sm border-0"
      style={{ backgroundColor: "#ffffff" }}
    >
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
                        className="chapter_click"
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