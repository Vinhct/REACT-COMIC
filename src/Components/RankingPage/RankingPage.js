import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Card, Table, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { Menu } from '../Include/Dau-trang_Chan-trang/Menu';
import { supabase } from '../../supabaseClient';
import axios from 'axios';

const RankingPage = () => {
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
            // Đầu tiên thử lấy danh sách truyện để tìm ID
            const searchResponse = await axios.get(`https://otruyenapi.com/v1/api/tim-kiem?keyword=${encodeURIComponent(stat.comic_slug)}`);
            const searchResults = searchResponse.data?.data?.items || [];
            
            // Tìm truyện có slug khớp
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
            } else {
              console.log(`Không tìm thấy truyện với slug: ${stat.comic_slug}`);
            }
          } catch (apiError) {
            console.error(`Error fetching comic data for slug ${stat.comic_slug}:`, apiError);
          }
        }

        // Sắp xếp lại theo view_count để đảm bảo thứ tự đúng
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
        <Menu />
        <Container className="my-4">
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
        <Menu />
        <Container className="my-4">
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
        <Menu />
        <Container className="my-4">
          <Card>
            <Card.Header as="h5" className="text-center bg-primary text-white">
              Bảng Xếp Hạng Truyện
            </Card.Header>
            <Card.Body>
              <div className="text-center">
                <p>Chưa có dữ liệu xếp hạng.</p>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </>
    );
  }

  return (
    <>
      <Menu />
      <Container className="my-4">
        <Card>
          <Card.Header as="h5" className="text-center bg-primary text-white">
            Bảng Xếp Hạng Truyện
          </Card.Header>
          <Card.Body>
            <Table striped hover responsive>
              <thead>
                <tr>
                  <th width="5%">#</th>
                  <th width="15%">Ảnh</th>
                  <th width="40%">Tên Truyện</th>
                  <th width="20%">Thể Loại</th>
                  <th width="10%">Trạng Thái</th>
                  <th width="10%">Lượt Xem</th>
                </tr>
              </thead>
              <tbody>
                {comics.map((item, index) => (
                  <tr key={item.comic_slug}>
                    <td className="align-middle">{index + 1}</td>
                    <td className="align-middle">
                      <img
                        src={`https://img.otruyenapi.com/uploads/comics/${item.comic.thumb_url}`}
                        alt={item.comic.name}
                        style={{ width: '50px', height: '70px', objectFit: 'cover' }}
                      />
                    </td>
                    <td className="align-middle">
                      <Link 
                        to={`/truyen/${item.comic.slug}`}
                        className="text-decoration-none"
                      >
                        {item.comic.name}
                      </Link>
                    </td>
                    <td className="align-middle">
                      {item.comic.category?.map((cat, i) => (
                        <span key={cat.slug}>
                          {i > 0 && ', '}
                          <Link 
                            to={`/genre/${cat.slug}`}
                            className="text-decoration-none"
                          >
                            {cat.name}
                          </Link>
                        </span>
                      ))}
                    </td>
                    <td className="align-middle">
                      <span className={`badge bg-${item.comic.status === 'Đang tiến hành' ? 'success' : 'secondary'}`}>
                        {item.comic.status}
                      </span>
                    </td>
                    <td className="align-middle text-center">
                      {item.view_count.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </Card.Body>
        </Card>
      </Container>
    </>
  );
};

export default RankingPage; 