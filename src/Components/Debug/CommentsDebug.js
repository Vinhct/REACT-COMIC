import React, { useEffect, useState } from 'react';
import { Container, Card, Button, Alert } from 'react-bootstrap';
import { supabase } from '../../supabaseClient';

/**
 * Component để gỡ lỗi bảng comments
 */
const CommentsDebug = () => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [testComment, setTestComment] = useState(null);

  // Lấy tất cả bình luận
  const fetchAllComments = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching all comments from Supabase...');
      
      // Sử dụng cú pháp đơn giản
      const { data, error } = await supabase
        .from('comments')
        .select('id, comment, rating, created_at, user_id, slug')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching comments:', error);
        setError(error.message);
        return;
      }

      console.log('Comments data:', data);
      setComments(data || []);
    } catch (err) {
      console.error('Exception while fetching comments:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Tạo bình luận test
  const createTestComment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Lấy user hiện tại
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Vui lòng đăng nhập để tạo bình luận test');
        return;
      }
      
      const testData = {
        user_id: user.id,
        slug: 'test-comic',
        comment: 'Đây là bình luận test - ' + new Date().toISOString(),
        rating: 5
      };
      
      console.log('Creating test comment:', testData);
      
      const { data, error } = await supabase
        .from('comments')
        .insert([testData])
        .select();
        
      if (error) {
        console.error('Error creating test comment:', error);
        setError(error.message);
        return;
      }
      
      console.log('Test comment created:', data);
      setTestComment(data[0]);
      
      // Tải lại danh sách bình luận
      fetchAllComments();
    } catch (err) {
      console.error('Exception while creating test comment:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Kiểm tra bảng comments có tồn tại
  const checkCommentsTable = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Checking if comments table exists...');
      
      // Lấy thông tin về schema
      const { data, error } = await supabase
        .from('comments')
        .select('id')
        .limit(1);
        
      if (error) {
        if (error.code === '42P01') { // Relation does not exist
          setError('Bảng comments không tồn tại trong cơ sở dữ liệu');
        } else {
          setError(`Lỗi khi kiểm tra bảng: ${error.message}`);
        }
        return;
      }
      
      console.log('Comments table exists, sample data:', data);
    } catch (err) {
      console.error('Exception while checking table:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  // Load ban đầu
  useEffect(() => {
    checkCommentsTable();
    fetchAllComments();
  }, []);
  
  return (
    <Container className="my-5">
      <h2>Debug - Bảng Comments</h2>
      
      {error && (
        <Alert variant="danger">
          <Alert.Heading>Lỗi!</Alert.Heading>
          <p>{error}</p>
        </Alert>
      )}
      
      <div className="mb-4">
        <Button 
          variant="primary" 
          className="me-2"
          onClick={fetchAllComments}
          disabled={loading}
        >
          {loading ? 'Đang tải...' : 'Tải lại bình luận'}
        </Button>
        
        <Button
          variant="success"
          onClick={createTestComment}
          disabled={loading}
        >
          Tạo bình luận test
        </Button>
      </div>
      
      {testComment && (
        <Alert variant="success" className="mb-4">
          <Alert.Heading>Bình luận test đã được tạo!</Alert.Heading>
          <pre>{JSON.stringify(testComment, null, 2)}</pre>
        </Alert>
      )}
      
      <h4>Số lượng bình luận: {comments.length}</h4>
      
      {comments.length === 0 ? (
        <Alert variant="info">
          Không có bình luận nào trong cơ sở dữ liệu
        </Alert>
      ) : (
        comments.map(comment => (
          <Card key={comment.id} className="mb-3">
            <Card.Header>
              <strong>ID:</strong> {comment.id} | <strong>Slug:</strong> {comment.slug}
            </Card.Header>
            <Card.Body>
              <Card.Title>
                User ID: {comment.user_id} - {comment.rating} sao
              </Card.Title>
              <Card.Text>{comment.comment}</Card.Text>
              <div className="text-muted">
                <small>Thời gian: {new Date(comment.created_at).toLocaleString()}</small>
              </div>
            </Card.Body>
          </Card>
        ))
      )}
    </Container>
  );
};

export default CommentsDebug; 