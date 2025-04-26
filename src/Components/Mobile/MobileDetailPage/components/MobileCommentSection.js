import React from 'react';
import { Card, Button, Form, Row, Col } from 'react-bootstrap';
import { Rating } from 'react-simple-star-rating';
import { BsPersonCircle } from 'react-icons/bs';

const MobileCommentSection = ({
  comments,
  rating,
  setRating,
  commentText,
  setCommentText,
  handleSubmitComment,
  commentError,
  commentSuccess,
  calculateAverageRating,
  user
}) => {
  return (
    <Card className="shadow-sm border-0 mb-5">
      <Card.Body>
        <Card.Title className="section-heading">
          Bình luận và đánh giá
        </Card.Title>
        
        {/* Hiển thị đánh giá trung bình */}
        <div className="average-rating mb-3">
          <div className="d-flex align-items-center">
            <span className="me-2">Đánh giá trung bình:</span>
            <Rating
              initialValue={calculateAverageRating()}
              readonly
              size={20}
              allowFraction
            />
            <span className="ms-2 fw-bold">
              {calculateAverageRating()}/5
            </span>
          </div>
        </div>

        {/* Form bình luận */}
        {user ? (
          <Form onSubmit={handleSubmitComment} className="comment-form mb-4">
            <Form.Group className="mb-3">
              <Form.Label>Đánh giá của bạn</Form.Label>
              <div>
                <Rating
                  onClick={(rate) => setRating(rate)}
                  initialValue={rating}
                  size={25}
                />
              </div>
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Bình luận</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Nhập bình luận của bạn..."
              />
            </Form.Group>
            
            {commentError && (
              <div className="alert alert-danger" role="alert">
                {commentError}
              </div>
            )}
            
            {commentSuccess && (
              <div className="alert alert-success" role="alert">
                Bình luận đã được gửi thành công!
              </div>
            )}
            
            <Button variant="primary" type="submit">
              Gửi bình luận
            </Button>
          </Form>
        ) : (
          <div className="alert alert-info mb-4" role="alert">
            Vui lòng đăng nhập để bình luận và đánh giá
          </div>
        )}

        {/* Danh sách bình luận */}
        <div className="comments-list">
          <h5 className="mb-3">Tất cả bình luận ({comments.length})</h5>
          
          {comments.length > 0 ? (
            comments.map((comment) => (
              <div key={comment.id} className="comment-item mb-3 p-3 border-bottom">
                <div className="comment-header d-flex justify-content-between mb-2">
                  <div className="d-flex align-items-center">
                    <BsPersonCircle className="me-2" size={24} />
                    <span className="commenter-name fw-bold">
                      {comment.user?.displayName || comment.user?.email || "Ẩn danh"}
                    </span>
                  </div>
                  <span className="comment-date text-muted small">
                    {new Date(comment.timestamp).toLocaleDateString()}
                  </span>
                </div>
                
                <div className="comment-rating mb-2">
                  <Rating
                    initialValue={comment.rating}
                    readonly
                    size={16}
                  />
                  <span className="ms-2">{comment.rating}/5</span>
                </div>
                
                <p className="comment-text mb-0">{comment.text}</p>
              </div>
            ))
          ) : (
            <p className="text-center text-muted">
              Chưa có bình luận nào. Hãy là người đầu tiên bình luận!
            </p>
          )}
        </div>
      </Card.Body>
    </Card>
  );
};

export default MobileCommentSection; 