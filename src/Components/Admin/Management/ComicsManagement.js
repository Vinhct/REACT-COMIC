import React, { useState, useEffect } from 'react';
import { Container, Card, Table, Button, Form, InputGroup, Row, Col, Modal, Spinner, Alert, Badge, Image } from 'react-bootstrap';
import { FaSearch, FaEye, FaSave, FaBookOpen, FaFileImport, FaChartBar } from 'react-icons/fa';
import { withAdminAuth } from '../AdminContext';
import { supabase } from '../../../supabaseClient';
import axios from 'axios';
import AdminLayout from '../AdminLayout';

const ComicsManagement = () => {
  const [comics, setComics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [currentComic, setCurrentComic] = useState(null);
  const [importSlug, setImportSlug] = useState('');
  const [importLoading, setImportLoading] = useState(false);
  const [savedComics, setSavedComics] = useState([]);
  const [statsData, setStatsData] = useState({
    totalComics: 0,
    totalByStatus: {
      'Đang tiến hành': 0,
      'Đã hoàn thành': 0,
      'Tạm ngưng': 0
    },
    totalItemsOnAPI: 0,
    itemsUpdateInDay: 0
  });

  // Fetch comics from API on component mount
  useEffect(() => {
    fetchComics();
    fetchSavedComics();
    fetchComicsStats();
    fetchHomeStats();
  }, [currentPage]);

  // Fetch home stats from API
  const fetchHomeStats = async () => {
    try {
      const response = await axios.get('https://otruyenapi.com/v1/api/home');
      if (response.data?.data?.params) {
        const totalItems = response.data.data.params.pagination?.totalItems || 0;
        const itemsUpdateInDay = response.data.data.params.itemsUpdateInDay || 0;
        
        setStatsData(prev => ({
          ...prev,
          totalItemsOnAPI: totalItems,
          itemsUpdateInDay: itemsUpdateInDay
        }));
      }
    } catch (error) {
      console.error('Error fetching home stats:', error);
    }
  };

  // Fetch comics statistics
  const fetchComicsStats = async () => {
    try {
      // Lấy tổng số truyện
      const { count: totalComics, error: countError } = await supabase
        .from('comics')
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;

      // Lấy số lượng theo trạng thái
      const { data: statusData, error: statusError } = await supabase
        .from('comics')
        .select('status')
        .not('status', 'is', null);

      if (statusError) throw statusError;

      // Tính toán số lượng theo trạng thái
      const statusCounts = {
        'Đang tiến hành': 0,
        'Đã hoàn thành': 0,
        'Tạm ngưng': 0
      };

      statusData.forEach(comic => {
        const status = comic.status || 'Đang tiến hành';
        if (statusCounts[status] !== undefined) {
          statusCounts[status]++;
        } else {
          statusCounts['Đang tiến hành']++;
        }
      });

      setStatsData(prev => ({
        ...prev,
        totalComics: totalComics,
        totalByStatus: statusCounts
      }));

    } catch (error) {
      console.error('Error fetching comics stats:', error);
    }
  };

  // Fetch comics from API
  const fetchComics = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch from otruyenapi
      const response = await axios.get(`https://otruyenapi.com/v1/api/danh-sach/truyen-moi?page=${currentPage}`);
      
      if (response.data?.data?.items) {
        setComics(response.data.data.items);
        // Calculate total pages from total items
        const totalItems = response.data.data.totalItems || 0;
        const itemsPerPage = response.data.data.itemsPerPage || 24;
        setTotalPages(Math.ceil(totalItems / itemsPerPage));
      } else {
        throw new Error('API không trả về dữ liệu hợp lệ');
      }
    } catch (error) {
      console.error('Error fetching comics:', error);
      setError(error.message || 'Có lỗi xảy ra khi tải dữ liệu');
      // Set sample data as fallback
      setComics([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch saved comics from Supabase
  const fetchSavedComics = async () => {
    try {
      const { data, error } = await supabase
        .from('comics')
        .select('slug')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Create an array of saved comic slugs
      const savedSlugs = (data || []).map(comic => comic.slug);
      setSavedComics(savedSlugs);
    } catch (error) {
      console.error('Error fetching saved comics:', error);
    }
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle search submit
  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    try {
      setLoading(true);
      setError(null);

      // Search from otruyenapi
      const response = await axios.get(`https://otruyenapi.com/v1/api/tim-kiem?q=${encodeURIComponent(searchTerm)}`);
      
      if (response.data?.data?.items) {
        setComics(response.data.data.items);
        // Set page info for search results
        setCurrentPage(1);
        const totalItems = response.data.data.totalItems || response.data.data.items.length;
        const itemsPerPage = response.data.data.itemsPerPage || 24;
        setTotalPages(Math.ceil(totalItems / itemsPerPage));
      } else {
        setComics([]);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error searching comics:', error);
      setError(error.message || 'Có lỗi xảy ra khi tìm kiếm');
      setComics([]);
    } finally {
      setLoading(false);
    }
  };

  // View comic details
  const handleViewComic = async (comic) => {
    try {
      setCurrentComic({ ...comic, loading: true });
      setShowViewModal(true);

      // Fetch detailed info
      const response = await axios.get(`https://otruyenapi.com/v1/api/truyen-tranh/${comic.slug}`);
      
      if (response.data?.data?.item) {
        setCurrentComic({
          ...comic,
          details: response.data.data.item,
          loading: false
        });
      } else {
        setCurrentComic({
          ...comic,
          details: { error: 'Không thể tải chi tiết truyện' },
          loading: false
        });
      }
    } catch (error) {
      console.error('Error fetching comic details:', error);
      setCurrentComic({
        ...comic,
        details: { error: error.message || 'Có lỗi xảy ra khi tải chi tiết' },
        loading: false
      });
    }
  };

  // Save comic to Supabase
  const handleSaveComic = async (comic) => {
    try {
      setLoading(true);

      // Prepare comic data for Supabase
      const comicData = {
        slug: comic.slug,
        name: comic.name,
        thumbnail: `https://img.otruyenapi.com/uploads/comics/${comic.thumb_url}`,
        description: comic.content || '',
        author: comic.author || 'Đang cập nhật',
        status: comic.status || 'Đang tiến hành'
      };

      // Insert into Supabase
      const { error } = await supabase
        .from('comics')
        .upsert(comicData);

      if (error) throw error;

      // Add to saved comics array if not already included
      if (!savedComics.includes(comic.slug)) {
        setSavedComics([...savedComics, comic.slug]);
      }
      
      // Update stats after saving
      fetchComicsStats();
      
      setSuccessMessage(`Truyện "${comic.name}" đã được lưu vào cơ sở dữ liệu!`);
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      console.error('Error saving comic:', error);
      setError(error.message || 'Có lỗi xảy ra khi lưu truyện');
    } finally {
      setLoading(false);
    }
  };

  // Import comic by slug
  const handleImportComic = async () => {
    if (!importSlug.trim()) return;

    try {
      setImportLoading(true);
      setError(null);

      // Fetch comic details from API
      const response = await axios.get(`https://otruyenapi.com/v1/api/truyen-tranh/${importSlug}`);
      
      if (!response.data?.data?.item) {
        throw new Error('Không tìm thấy truyện với slug này');
      }

      const comicItem = response.data.data.item;

      // Prepare comic data for Supabase
      const comicData = {
        slug: importSlug,
        name: comicItem.name,
        thumbnail: `https://img.otruyenapi.com/uploads/comics/${comicItem.thumb_url}`,
        description: comicItem.content || '',
        author: comicItem.author || 'Đang cập nhật',
        status: comicItem.status || 'Đang tiến hành'
      };

      // Insert into Supabase
      const { error } = await supabase
        .from('comics')
        .upsert(comicData);

      if (error) throw error;

      // Add to saved comics array if not already included
      if (!savedComics.includes(importSlug)) {
        setSavedComics([...savedComics, importSlug]);
      }
      
      setSuccessMessage(`Truyện "${comicItem.name}" đã được nhập vào cơ sở dữ liệu!`);
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Close modal and reset form
      setShowImportModal(false);
      setImportSlug('');
    } catch (error) {
      console.error('Error importing comic:', error);
      setError(error.message || 'Có lỗi xảy ra khi nhập truyện');
    } finally {
      setImportLoading(false);
    }
  };

  // Filter comics based on search term (client-side filtering)
  const filteredComics = comics.filter(comic => {
    const searchTermLower = searchTerm.toLowerCase();
    return (
      comic.name?.toLowerCase().includes(searchTermLower) ||
      comic.author?.toLowerCase().includes(searchTermLower) ||
      comic.status?.toLowerCase().includes(searchTermLower)
    );
  });

  return (
    <AdminLayout title="Quản lý Truyện">
      <Container fluid>
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2>Quản lý Truyện</h2>
          <div>
            <Button 
              variant="primary" 
              className="me-2"
              onClick={() => setShowStatsModal(true)}
            >
              <FaChartBar className="me-1" />
              Thống kê
            </Button>
            <Button 
              variant="success" 
              onClick={() => setShowImportModal(true)}
            >
              <FaFileImport className="me-1" />
              Nhập truyện
            </Button>
          </div>
        </div>

        {successMessage && (
          <Alert variant="success" dismissible onClose={() => setSuccessMessage('')}>
            {successMessage}
          </Alert>
        )}

        {error && (
          <Alert variant="danger" dismissible onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        <Card className="mb-4">
          <Card.Header>
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Danh sách truyện từ API</h5>
              <div className="text-muted">
                Đã lưu: {statsData.totalComics} / {statsData.totalItemsOnAPI.toLocaleString()} truyện
              </div>
            </div>
          </Card.Header>
          <Card.Body>
            <Form onSubmit={handleSearch} className="mb-4">
              <InputGroup>
                <Form.Control
                  placeholder="Tìm kiếm truyện..."
                  value={searchTerm}
                  onChange={handleSearchChange}
                />
                <Button type="submit" variant="primary">
                  <FaSearch />
                </Button>
              </InputGroup>
            </Form>

            {loading && !comics.length ? (
              <div className="text-center my-5">
                <Spinner animation="border" role="status">
                  <span className="visually-hidden">Loading...</span>
                </Spinner>
              </div>
            ) : (
              <div className="table-responsive">
                <Table striped bordered hover>
                  <thead>
                    <tr>
                      <th style={{ width: '70px' }}>Ảnh</th>
                      <th>Tên truyện</th>
                      <th>Tác giả</th>
                      <th>Trạng thái</th>
                      <th style={{ width: '150px' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredComics.length > 0 ? (
                      filteredComics.map((comic) => (
                        <tr key={comic.id || comic.slug}>
                          <td>
                            <Image 
                              src={`https://img.otruyenapi.com/uploads/comics/${comic.thumb_url}`} 
                              alt={comic.name}
                              width={50}
                              height={70}
                              style={{ objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.src = 'https://placehold.co/50x70?text=No+Image';
                              }}
                            />
                          </td>
                          <td>
                            {comic.name}
                            {savedComics.includes(comic.slug) && (
                              <Badge bg="success" className="ms-2">Đã lưu</Badge>
                            )}
                          </td>
                          <td>{comic.author || 'Không có'}</td>
                          <td>{comic.status || 'Không có'}</td>
                          <td>
                            <Button
                              variant="info"
                              size="sm"
                              className="me-2"
                              onClick={() => handleViewComic(comic)}
                            >
                              <FaEye />
                            </Button>
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => handleSaveComic(comic)}
                              disabled={savedComics.includes(comic.slug)}
                            >
                              <FaSave />
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="text-center">
                          {loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy truyện nào'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </Table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center mt-4">
                <Button
                  variant="outline-primary"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  className="me-2"
                >
                  Trang trước
                </Button>
                <span className="mx-3 d-flex align-items-center">
                  Trang {currentPage} / {totalPages}
                </span>
                <Button
                  variant="outline-primary"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                >
                  Trang sau
                </Button>
              </div>
            )}
          </Card.Body>
        </Card>
      </Container>

      {/* View Comic Modal */}
      <Modal
        show={showViewModal}
        onHide={() => setShowViewModal(false)}
        size="lg"
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Chi tiết truyện</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {currentComic?.loading ? (
            <div className="text-center my-4">
              <Spinner animation="border" role="status">
                <span className="visually-hidden">Loading...</span>
              </Spinner>
            </div>
          ) : currentComic?.details?.error ? (
            <Alert variant="danger">{currentComic.details.error}</Alert>
          ) : currentComic && (
            <Row>
              <Col md={4}>
                <Image
                  src={`https://img.otruyenapi.com/uploads/comics/${currentComic.thumb_url}`}
                  alt={currentComic.name}
                  className="img-fluid mb-3"
                  onError={(e) => {
                    e.target.src = 'https://placehold.co/300x400?text=No+Image';
                  }}
                />
              </Col>
              <Col md={8}>
                <h3>{currentComic.name}</h3>
                <p><strong>Tác giả:</strong> {currentComic.author || 'Đang cập nhật'}</p>
                <p><strong>Trạng thái:</strong> {currentComic.status || 'Đang cập nhật'}</p>
                <p><strong>Thể loại:</strong> {
                  currentComic.details?.category 
                    ? currentComic.details.category.map(cat => cat.name).join(', ')
                    : 'Đang cập nhật'
                }</p>
                <hr />
                <h5>Nội dung:</h5>
                <p>{currentComic.details?.content || currentComic.content || 'Không có nội dung'}</p>
              </Col>
            </Row>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowViewModal(false)}>
            Đóng
          </Button>
          {currentComic && !savedComics.includes(currentComic.slug) && (
            <Button 
              variant="success" 
              onClick={() => {
                handleSaveComic(currentComic);
                setShowViewModal(false);
              }}
            >
              <FaSave className="me-2" />
              Lưu truyện
            </Button>
          )}
        </Modal.Footer>
      </Modal>

      {/* Import Comic Modal */}
      <Modal
        show={showImportModal}
        onHide={() => setShowImportModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Nhập truyện theo slug</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Slug truyện</Form.Label>
              <Form.Control
                type="text"
                placeholder="Ví dụ: truyen-tranh-xyz"
                value={importSlug}
                onChange={(e) => setImportSlug(e.target.value)}
              />
              <Form.Text className="text-muted">
                Nhập slug từ URL của truyện (đoạn cuối trong đường dẫn sau domain)
              </Form.Text>
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowImportModal(false)}>
            Hủy
          </Button>
          <Button 
            variant="primary" 
            onClick={handleImportComic}
            disabled={importLoading || !importSlug.trim()}
          >
            {importLoading ? (
              <>
                <Spinner animation="border" size="sm" className="me-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <FaBookOpen className="me-2" />
                Nhập truyện
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Stats Modal */}
      <Modal
        show={showStatsModal}
        onHide={() => setShowStatsModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Thống kê truyện</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="text-center mb-4">
            <h2 className="display-4">{statsData.totalComics}</h2>
            <p className="lead">Tổng số truyện trong CSDL</p>
            {statsData.totalItemsOnAPI > 0 && (
              <p className="text-secondary">
                <strong>Tổng số truyện trên API:</strong> {statsData.totalItemsOnAPI.toLocaleString()} truyện<br/>
                <strong>Cập nhật trong ngày:</strong> {statsData.itemsUpdateInDay} truyện
              </p>
            )}
          </div>

          <Card className="mb-4">
            <Card.Header className="bg-primary text-white">
              <h5 className="mb-0">Tỷ lệ đã lưu vào CSDL</h5>
            </Card.Header>
            <Card.Body className="text-center">
              <h3>
                {statsData.totalItemsOnAPI > 0 
                  ? ((statsData.totalComics / statsData.totalItemsOnAPI) * 100).toFixed(2)
                  : 0}%
              </h3>
              <div className="progress mt-2">
                <div 
                  className="progress-bar" 
                  role="progressbar" 
                  style={{ 
                    width: `${statsData.totalItemsOnAPI > 0 
                      ? ((statsData.totalComics / statsData.totalItemsOnAPI) * 100)
                      : 0}%` 
                  }}
                  aria-valuenow={statsData.totalComics} 
                  aria-valuemin="0" 
                  aria-valuemax={statsData.totalItemsOnAPI}
                ></div>
              </div>
              <p className="mt-2">
                {statsData.totalComics} / {statsData.totalItemsOnAPI.toLocaleString()} truyện
              </p>
            </Card.Body>
          </Card>

          <h5 className="mb-3">Phân loại theo trạng thái:</h5>
          <Table striped bordered>
            <thead>
              <tr>
                <th>Trạng thái</th>
                <th className="text-center">Số lượng</th>
                <th className="text-center">Tỷ lệ</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(statsData.totalByStatus).map(([status, count]) => (
                <tr key={status}>
                  <td>{status}</td>
                  <td className="text-center">{count}</td>
                  <td className="text-center">
                    {statsData.totalComics > 0 
                      ? `${((count / statsData.totalComics) * 100).toFixed(1)}%` 
                      : '0%'}
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowStatsModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </AdminLayout>
  );
};

export default withAdminAuth(ComicsManagement); 