import React, { useState, useEffect, useRef } from "react";
import { Container, Form, Button, InputGroup, Spinner, Row, Col, Badge } from "react-bootstrap";
import { useLocation, useNavigate } from "react-router-dom";
import { BsSearch, BsFilter, BsX } from "react-icons/bs";
import axios from "axios";
import MobileMenu from "./Common/MobileMenu";
import ComicCard from "./components/ComicCard";
import ErrorMessage from "./components/ErrorMessage";
import "./styles/MobileSearch.css";

const MobileSearch = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const searchParams = new URLSearchParams(location.search);
  const initialQuery = searchParams.get("query") || "";
  
  const searchInputRef = useRef(null);
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showAdvancedSearch, setShowAdvancedSearch] = useState(false);
  
  // Advanced search filters
  const [genres, setGenres] = useState([]);
  const [selectedGenres, setSelectedGenres] = useState([]);
  const [status, setStatus] = useState("all");
  const [sortBy, setSortBy] = useState("updatedAt");
  
  // Auto-focus on search input when page loads (if no initial query)
  useEffect(() => {
    if (!initialQuery && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current.focus();
      }, 300);
    }
  }, [initialQuery]);
  
  // Fetch genres for filters
  useEffect(() => {
    const fetchGenres = async () => {
      try {
        const response = await axios.get("https://otruyenapi.com/v1/api/the-loai");
        if (response.data?.data?.items) {
          setGenres(response.data.data.items);
        }
      } catch (error) {
        console.error("Error fetching genres:", error);
      }
    };
    
    fetchGenres();
  }, []);
  
  // Search for comics when query or filters change
  useEffect(() => {
    if (initialQuery) {
      performSearch(initialQuery, 1);
    }
  }, [initialQuery]);
  
  const performSearch = async (query, pageNum) => {
    if (!query) return;
    
    try {
      setLoading(true);
      setError(null);
      
      // Create API URL with filters
      let apiUrl = `https://otruyenapi.com/v1/api/tim-kiem?q=${encodeURIComponent(query)}&page=${pageNum}`;
      
      // Add filters if advanced search is used
      if (selectedGenres.length > 0) {
        const genreSlugs = selectedGenres.join(",");
        apiUrl += `&genres=${genreSlugs}`;
      }
      
      if (status !== "all") {
        apiUrl += `&status=${status}`;
      }
      
      apiUrl += `&sort=${sortBy}`;
      
      const response = await axios.get(apiUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json',
          'Cache-Control': 'no-cache'
        },
        timeout: 8000
      });
      
      if (response.data?.data?.items) {
        const results = response.data.data.items.map(comic => ({
          id: comic.id,
          title: comic.name,
          slug: comic.slug,
          thumbnail: comic.thumb_url,
          status: comic.status || "Đang cập nhật",
          updated_at: comic.updatedAt,
          genres: comic.category ? comic.category.map(cat => ({
            name: cat.name,
            slug: cat.slug
          })) : []
        }));
        
        if (pageNum === 1) {
          setSearchResults(results);
        } else {
          setSearchResults(prev => [...prev, ...results]);
        }
        
        setHasMore(results.length > 0);
        setPage(pageNum);
      } else {
        setSearchResults([]);
        setHasMore(false);
      }
    } catch (error) {
      console.error("Search error:", error);
      setError("Có lỗi xảy ra khi tìm kiếm. Vui lòng thử lại sau.");
      
      // Fallback data if API fails
      if (pageNum === 1) {
        const fallbackData = [
          {
            id: "search1",
            title: `Kết quả cho "${query}"`,
            slug: "sample-result-1",
            thumbnail: "https://i.imgur.com/QbPXnrV.jpg",
            status: "Đang cập nhật",
            updated_at: new Date().toISOString(),
            genres: [{ name: "Action", slug: "action" }]
          },
          {
            id: "search2",
            title: `Truyện liên quan "${query}"`,
            slug: "sample-result-2",
            thumbnail: "https://i.imgur.com/uT95Kqa.jpg",
            status: "Hoàn thành",
            updated_at: new Date().toISOString(),
            genres: [{ name: "Adventure", slug: "adventure" }]
          }
        ];
        setSearchResults(fallbackData);
      }
    } finally {
      setLoading(false);
    }
  };
  
  // Handle search form submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Update URL with search query and reset page
    navigate(`/mobile/search?query=${encodeURIComponent(searchQuery.trim())}`);
    performSearch(searchQuery.trim(), 1);
  };
  
  // Load more results
  const loadMoreResults = () => {
    if (loading || !hasMore) return;
    performSearch(searchQuery, page + 1);
  };
  
  // Toggle genre selection
  const handleGenreToggle = (genreSlug) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreSlug)) {
        return prev.filter(g => g !== genreSlug);
      } else {
        return [...prev, genreSlug];
      }
    });
  };
  
  // Apply filters
  const applyFilters = () => {
    performSearch(searchQuery, 1);
    setShowAdvancedSearch(false);
  };
  
  // Reset filters
  const resetFilters = () => {
    setSelectedGenres([]);
    setStatus("all");
    setSortBy("updatedAt");
  };
  
  return (
    <div className="mobile-search-page">
      <MobileMenu />
      
      <Container className="mobile-container">
        {/* Search Form */}
        <div className="search-form-container">
          <Form onSubmit={handleSearch}>
            <InputGroup className="mb-3">
              <Form.Control
                ref={searchInputRef}
                placeholder="Nhập tên truyện, tác giả..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search"
                className="search-input"
              />
              <Button variant="primary" type="submit">
                <BsSearch />
              </Button>
              <Button 
                variant="outline-secondary" 
                onClick={() => setShowAdvancedSearch(!showAdvancedSearch)}
              >
                <BsFilter />
              </Button>
            </InputGroup>
          </Form>
          
          {/* Advanced Search Panel */}
          {showAdvancedSearch && (
            <div className="advanced-search-panel">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="m-0">Tìm kiếm nâng cao</h5>
                <Button 
                  variant="link" 
                  className="p-0 text-secondary" 
                  onClick={() => setShowAdvancedSearch(false)}
                >
                  <BsX size={24} />
                </Button>
              </div>
              
              <Form.Group className="mb-3">
                <Form.Label>Thể loại</Form.Label>
                <div className="genres-container">
                  {genres.map(genre => (
                    <Badge 
                      key={genre.slug}
                      bg={selectedGenres.includes(genre.slug) ? "primary" : "light"}
                      text={selectedGenres.includes(genre.slug) ? "white" : "dark"}
                      className="genre-badge"
                      onClick={() => handleGenreToggle(genre.slug)}
                    >
                      {genre.name}
                    </Badge>
                  ))}
                </div>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Trạng thái</Form.Label>
                <Form.Select 
                  value={status} 
                  onChange={(e) => setStatus(e.target.value)}
                >
                  <option value="all">Tất cả</option>
                  <option value="ongoing">Đang tiến hành</option>
                  <option value="completed">Hoàn thành</option>
                </Form.Select>
              </Form.Group>
              
              <Form.Group className="mb-3">
                <Form.Label>Sắp xếp theo</Form.Label>
                <Form.Select 
                  value={sortBy} 
                  onChange={(e) => setSortBy(e.target.value)}
                >
                  <option value="updatedAt">Mới cập nhật</option>
                  <option value="name">Tên A-Z</option>
                  <option value="views">Lượt xem</option>
                  <option value="followers">Theo dõi</option>
                </Form.Select>
              </Form.Group>
              
              <div className="d-flex gap-2">
                <Button 
                  variant="outline-secondary" 
                  className="w-50"
                  onClick={resetFilters}
                >
                  Đặt lại
                </Button>
                <Button 
                  variant="primary" 
                  className="w-50"
                  onClick={applyFilters}
                >
                  Áp dụng
                </Button>
              </div>
            </div>
          )}
        </div>
        
        {/* Search Results */}
        {initialQuery && (
          <div className="search-results-container">
            <h4 className="search-results-title">
              {searchResults.length > 0 
                ? `Kết quả tìm kiếm cho "${initialQuery}"`
                : loading 
                  ? "Đang tìm kiếm..."
                  : `Không tìm thấy truyện nào cho "${initialQuery}"`
              }
            </h4>
            
            {loading && page === 1 ? (
              <div className="text-center my-5">
                <Spinner animation="border" variant="primary" />
              </div>
            ) : error ? (
              <ErrorMessage 
                message={error}
                onRetry={() => performSearch(searchQuery, 1)}
              />
            ) : (
              <>
                {searchResults.length > 0 ? (
                  <Row className="comic-grid">
                    {searchResults.map((comic, index) => (
                      <Col xs={6} key={index} className="mb-3">
                        <ComicCard comic={comic} />
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <div className="no-results-container">
                    <p>Không tìm thấy truyện nào phù hợp với tìm kiếm của bạn.</p>
                    <p>Hãy thử tìm kiếm với từ khóa khác hoặc bỏ bớt bộ lọc.</p>
                  </div>
                )}
                
                {hasMore && searchResults.length > 0 && (
                  <div className="text-center my-3">
                    <Button
                      variant="outline-primary"
                      onClick={loadMoreResults}
                      disabled={loading}
                      className="load-more-btn"
                    >
                      {loading ? (
                        <>
                          <Spinner
                            as="span"
                            animation="border"
                            size="sm"
                            role="status"
                            aria-hidden="true"
                            className="me-2"
                          />
                          Đang tải...
                        </>
                      ) : (
                        "Tải thêm kết quả"
                      )}
                    </Button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        
        {/* Initial State - No Search Yet */}
        {!initialQuery && !loading && searchResults.length === 0 && (
          <div className="initial-search-container">
            <div className="text-center">
              <BsSearch size={48} className="text-secondary mb-3" />
              <h4>Tìm kiếm truyện</h4>
              <p className="text-muted">
                Nhập tên truyện, tác giả hoặc nội dung bạn muốn tìm kiếm.
                <br />
                Bạn có thể sử dụng bộ lọc để tìm kiếm nâng cao.
              </p>
            </div>
          </div>
        )}
      </Container>
    </div>
  );
};

export default MobileSearch; 