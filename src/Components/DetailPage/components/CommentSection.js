import React from 'react';
import { Form, Button, ListGroup } from 'react-bootstrap';
import { Rating } from "react-simple-star-rating";

const CommentSection = ({ 
  comments, 
  rating, 
  setRating, 
  commentText, 
  setCommentText, 
  handleSubmitComment, 
  commentError, 
  commentSuccess,
  calculateAverageRating
}) => {
  return (
    <div className="mt-4 rating-section">
      <h5>
        Đánh giá trung bình: {calculateAverageRating()} / 5 (
        {comments.length} đánh giá)
      </h5>
      <Form onSubmit={handleSubmitComment}>
        <Form.Group className="mb-3">
          <Form.Label>Đánh giá của bạn:</Form.Label>
          <Rating
            onClick={(rate) => setRating(rate)}
            ratingValue={rating}
            size={20}
            transition
            fillColor="#f1c40f"
            emptyColor="#e4e4e4"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Bình luận:</Form.Label>
          <Form.Control
            as="textarea"
            rows={3}
            placeholder="Nhập bình luận của bạn..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
        </Form.Group>
        {commentError && (
          <p style={{ color: "red" }}>{commentError}</p>
        )}
        {commentSuccess && (
          <p style={{ color: "green" }}>Bình luận đã được gửi thành công!</p>
        )}
        <Button variant="primary" type="submit">
          Gửi
        </Button>
      </Form>

      <h5 className="mt-4">Danh sách bình luận:</h5>
      <div className="comments-list">
        {comments.length > 0 ? (
          <ListGroup>
            {comments.map((comment) => (
              <ListGroup.Item key={comment.id}>
                <strong>{comment.user?.displayName || comment.user?.email || "Ẩn danh"}</strong> - {comment.rating}{" "}
                sao
                <p>{comment.text}</p>
                <small>
                  {comment.timestamp ? new Date(comment.timestamp).toLocaleString() : ""}
                </small>
              </ListGroup.Item>
            ))}
          </ListGroup>
        ) : (
          <p>Chưa có bình luận nào.</p>
        )}
      </div>
    </div>
  );
};

export default CommentSection; 