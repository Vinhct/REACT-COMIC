import axios from 'axios';
import React, { useEffect, useState } from 'react'
import { Badge, Card, CardBody, Col, Container, Row,Navbar,Nav, Pagination } from 'react-bootstrap';
import Button from 'react-bootstrap/Button';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Menu } from './Include/Menu';

const HT = () => {
  const [getdata,setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const items = getdata?.data?.items;
  const [currentPage, setCurentPage] = useState(1);
  const itemsPerPage = 24;
     
 
  useEffect(() => {
      const fetchData = async() => {
        try {
          const response = await axios.get(`https://otruyenapi.com/v1/api/danh-sach/hoan-thanh?page=${currentPage}`);
          setData(response.data);
          setLoading(false);
          console.log(response);
        } catch (error) {
          setLoading(false);
          
        }
      };
      fetchData();
  },[currentPage]);

  if(loading) return <p>Loading...</p>;
  if(error) return <p>Error : {error}</p>;
  //tinh toan trang
  const totalItems = getdata?.data?.params?.pagination?.totalItems || 0;
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  //Lay so trang
  const paginate =(pageNumber) => {
    setCurentPage(pageNumber);
  }

  return (
    <>
    <Helmet>
    <title>{getdata.data.seoOnPage.titleHead}</title>
    </Helmet>
  
    
    <Navbar bg="light" expand="lg" className="shadow-sm mb-4">
      <Container>
        <Navbar.Brand href="/" className="fw-bold text-primary">
          <Menu></Menu>
        </Navbar.Brand>
        <Nav className="ms-auto">
          <Button variant="outline-primary" className="me-2" as={Link} to="/login">
            Đăng nhập
          </Button>
          <Button variant="primary" as={Link} to="/register">
            Đăng ký
          </Button>
        </Nav>
      </Container>
    </Navbar>
  
    
    <Container>
      
      <Row className="mb-4">
        <Col>
          <Card className="shadow border-0" style={{ backgroundColor: "#f8f9fa" }}>
            <Card.Body>
              <Card.Title className="text-primary fw-bold display-6">
                Truyện đã hoàn thành
              </Card.Title>
              <Card.Text className="text-muted">
                {getdata.data.seoOnPage.descriptionHead}
              </Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
  
     
      <Row className="g-4">
        {items && items.length > 0 ? (
          items.map((item, index) => (
            <Col lg={3} md={4} sm={6} xs={12} key={index}>
              <Card className="shadow-sm border-0 h-100">
                <Card.Img
                  variant="top"
                  src={`https://img.otruyenapi.com/uploads/comics/${item.thumb_url}`}
                  alt={item.name}
                  className="rounded-top"
                  style={{ height: "200px", objectFit: "cover" }}
                />
                <Card.Body className="d-flex flex-column">
                  <Card.Title className="text-dark fw-bold text-truncate"  as={Link}
                      to={`/comics/${item.slug}`} style={{ textDecoration: 'none' }}>
                    {item.name || "No name"}
                  </Card.Title>
                  <Card.Text className="text-muted small">
                    {item.updatedAt || "Không có"}
                  </Card.Text>
  
                 
                  <Card.Text>
                    {item.category && item.category.length > 0 ? (
                      item.category.map((category, index) => (
                        <Badge bg="info" key={index} className="me-2 mb-1">
                          {category.name}
                        </Badge>
                      ))
                    ) : (
                      <span className="text-muted">others</span>
                    )}
                  </Card.Text>
  
                  <div className="mt-auto">
                    <Button
                      variant="primary"
                      size="sm"
                      className="w-100"
                      as={Link}
                      to={`/comics/${item.slug}`}
                    >
                      Chi Tiết
                    </Button>
                  </div>
                </Card.Body>
              </Card>
            </Col>
          ))
        ) : (
          <Col>
            <Card.Body className="text-center text-muted">
              No Content Available
            </Card.Body>
          </Col>
        )}
      </Row>
      {/*pagination Controls */}
                  <Pagination className="pagination-container" >
                       {/* Nut nui */}
                       <Pagination.Prev 
                       onClick={() => currentPage > 1 && paginate(currentPage -1)}
                       disabled = {currentPage === 1}
                       />
            
                       {[...Array(totalPages)].map((_,index) => {
                        const pageNumber = index + 1
            
                        const rangeStart = Math.floor((currentPage - 1) / 5) * 5 + 1; // ;lam tron
                        const rangeEnd = Math.min(rangeStart + 5 - 1, totalPages); 
            
                        if(pageNumber >= rangeStart && pageNumber <= rangeEnd){
                          return (
                            <Pagination.Item
                              key={pageNumber}
                              active={pageNumber === currentPage}
                              onClick={() => paginate(pageNumber)}
                            >
                              {pageNumber}
                            </Pagination.Item>
                          );
                        }
                        return null;
                       })}
            
                        {/* Nut tien */}
                        <Pagination.Next
                       onClick={() => currentPage < totalPages && paginate(currentPage + 1)}
                       disabled = {currentPage === totalPages}
                       />
                      
                       
                  </Pagination>
            
    </Container>
  </>
  
  
  );
};

export default HT
