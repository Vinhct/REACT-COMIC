import React, { useEffect, useState } from 'react';
import { Container, Spinner, ListGroup, Image, Row, Col, Card, Badge } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { supabase } from '../../../supabaseClient';
import axios from 'axios';
import MobileMenu from '../Common/MobileMenu';
import './MobileRankingPage.css';
import { FaCrown, FaEye } from 'react-icons/fa';
import ChatbotProvider from '../../Include/Chatbot/ChatbotProvider';

const crownColors = ['#ffd700', '#c0c0c0', '#cd7f32'];
const badgeColors = {
  'ongoing': 'success',
  'completed': 'primary',
  'full': 'secondary',
  'tạm ngưng': 'warning',
};

const getBadgeColor = (status) => {
  if (!status) return 'secondary';
  const s = status.toLowerCase();
  if (s.includes('hoàn') || s.includes('complete')) return 'primary';
  if (s.includes('đang') || s.includes('ongoing')) return 'success';
  if (s.includes('tạm')) return 'warning';
  return 'secondary';
};

const MobileRankingPage = () => {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        // Lấy dữ liệu từ comic_stats
        const { data: statsData, error: statsError } = await supabase
          .from('comic_stats')
          .select('*')
          .order('view_count', { ascending: false })
          .limit(50);

        if (statsError) throw statsError;

        // Lấy thông tin truyện từ API
        const comicsData = [];
        for (const stat of statsData) {
          try {
            const searchResponse = await axios.get(`https://otruyenapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(stat.comic_slug)}`);
            const searchResults = searchResponse.data?.data?.items || [];
            const matchedComic = searchResults.find(comic => comic.slug === stat.comic_slug);
            
            if (matchedComic) {
              comicsData.push({
                ...stat,
                comic: {
                  name: matchedComic.name,
                  slug: matchedComic.slug,
                  thumb_url: matchedComic.thumb_url,
                  status: matchedComic.status,
                  category: matchedComic.category || []
                }
              });
            }
          } catch (apiError) {
            console.error(`Error fetching comic data for slug ${stat.comic_slug}:`, apiError);
          }
        }

        comicsData.sort((a, b) => b.view_count - a.view_count);
        setComics(comicsData);
      } catch (err) {
        console.error('Error fetching rankings:', err);
        setError('Không thể tải bảng xếp hạng. Vui lòng thử lại sau.');
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  if (loading) {
    return (
      <>
        <MobileMenu />
        <Container className="py-3">
          <div className="text-center">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Đang tải...</span>
            </Spinner>
            <p className="mt-2">Đang tải dữ liệu...</p>
          </div>
        </Container>
      </>
    );
  }

  if (error) {
    return (
      <>
        <MobileMenu />
        <Container className="py-3">
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        </Container>
      </>
    );
  }

  if (comics.length === 0) {
    return (
      <>
        <MobileMenu />
        <Container className="py-3">
          <div className="text-center">
            <p>Chưa có dữ liệu xếp hạng.</p>
          </div>
        </Container>
      </>
    );
  }

  // Top 3 truyện nổi bật
  const top3 = comics.slice(0, 3);
  const rest = comics.slice(3);

  return (
    <>
      <MobileMenu />
      <Container className="py-3">
        <h4 className="text-center mb-3">Bảng Xếp Hạng Truyện</h4>
        <Row className="mb-3 gx-2 gy-2">
          {top3.map((item, idx) => (
            <Col xs={12} key={item.comic_slug} className="mb-2">
              <Card className={`mobile-ranking-top-card top-${idx+1}`}> 
                <div className="d-flex align-items-center">
                  <div className="crown-icon me-2 d-flex align-items-center justify-content-center" style={{color: crownColors[idx], fontSize: 28, minWidth: 32}}>
                    <FaCrown />
                  </div>
                  <Image
                    src={`https://img.otruyenapi.com/uploads/comics/${item.comic.thumb_url}`}
                    alt={item.comic.name}
                    style={{ width: '65px', height: '90px', objectFit: 'cover', borderRadius: 10, border: `2px solid ${crownColors[idx]}` }}
                    className="me-3"
                  />
                  <div className="flex-grow-1">
                    <Link 
                      to={`/comics/${item.comic.slug}`}
                      className="text-decoration-none comic-title top-title"
                    >
                      {item.comic.name}
                    </Link>
                    <div className="comic-info">
                      <small className="text-muted">
                        {item.comic.category?.slice(0,2).map((cat, i) => (
                          <span key={cat.slug}>
                            {i > 0 && ' • '}
                            <Link 
                              to={`/the-loai/${cat.slug}`}
                              className="text-decoration-none category-link"
                            >
                              {cat.name}
                            </Link>
                          </span>
                        ))}
                        {item.comic.category?.length > 2 && ' ...'}
                      </small>
                    </div>
                    <div className="d-flex justify-content-between align-items-center mt-1">
                      <div className="d-flex align-items-center gap-2">
                        <Badge bg={getBadgeColor(item.comic.status)} className="status-badge-pill" pill>
                          {item.comic.status}
                        </Badge>
                        <div className="d-flex align-items-center view-count ms-1">
                          <FaEye style={{marginRight: 4, fontSize: 15, opacity: 0.8, color: '#333'}} />
                          <span>{typeof item.view_count === 'number' ? item.view_count.toLocaleString() : 0}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
        <div className="mb-2" style={{height: 6}}></div>
        <ListGroup>
          {rest.map((item, index) => (
            <ListGroup.Item 
              key={item.comic_slug}
              className="d-flex align-items-center p-2 mobile-ranking-item"
            >
              <div className="rank-number me-2">
                {index + 4}
              </div>
              <Image
                src={`https://img.otruyenapi.com/uploads/comics/${item.comic.thumb_url}`}
                alt={item.comic.name}
                style={{ width: '40px', height: '55px', objectFit: 'cover', borderRadius: 6 }}
                className="me-2"
              />
              <div className="flex-grow-1">
                <Link 
                  to={`/comics/${item.comic.slug}`}
                  className="text-decoration-none comic-title"
                >
                  {item.comic.name}
                </Link>
                <div className="comic-info">
                  <small className="text-muted">
                    {item.comic.category?.slice(0,2).map((cat, i) => (
                      <span key={cat.slug}>
                        {i > 0 && ' • '}
                        <Link 
                          to={`/the-loai/${cat.slug}`}
                          className="text-decoration-none category-link"
                        >
                          {cat.name}
                        </Link>
                      </span>
                    ))}
                    {item.comic.category?.length > 2 && ' ...'}
                  </small>
                </div>
                <div className="d-flex align-items-center gap-2 mt-1">
                  <Badge bg={getBadgeColor(item.comic.status)} className="status-badge-pill" pill>
                    {item.comic.status}
                  </Badge>
                  <div className="d-flex align-items-center view-count ms-1">
                    <FaEye style={{marginRight: 4, fontSize: 15, opacity: 0.8, color: '#333'}} />
                    <span>{typeof item.view_count === 'number' ? item.view_count.toLocaleString() : 0}</span>
                  </div>
                </div>
              </div>
            </ListGroup.Item>
          ))}
        </ListGroup>
      </Container>
      <div style={{ position: 'fixed', bottom: '140px', right: '20px', zIndex: 9999 }}>
        <ChatbotProvider />
      </div>
    </>
  );
};

export default MobileRankingPage; 