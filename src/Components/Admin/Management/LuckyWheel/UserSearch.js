import React, { useState } from 'react';
import { InputGroup, FormControl, Button, Spinner, Card, Badge, Table, Tabs, Tab } from 'react-bootstrap';
import { FaSearch, FaUser, FaUsers, FaArrowRight, FaUserFriends, FaExclamationTriangle } from 'react-icons/fa';

const UserSearch = ({ 
  userSearchTerm, 
  setUserSearchTerm, 
  handleSearchUsers, 
  isSearching, 
  searchedUsers, 
  selectUser,
  selectedUserInfo,
  clearSelectedUser,
  allUsers,
  isLoadingAllUsers
}) => {
  const [activeTab, setActiveTab] = useState('search');

  return (
    <div className="position-relative">
      <div className="d-flex align-items-center mb-3">
        {selectedUserInfo ? (
          <div className="d-flex align-items-center">
            <FaUser className="me-2 text-primary" />
            <span>Lịch sử quay của: <strong>{selectedUserInfo.display_name || selectedUserInfo.email}</strong></span>
            <Button 
              variant="outline-secondary" 
              size="sm" 
              className="ms-3" 
              onClick={clearSelectedUser}
            >
              Xem tất cả
            </Button>
          </div>
        ) : (
          <div className="d-flex justify-content-between w-100 align-items-center">
            <h5 className="mb-0"><FaUsers className="me-2" />Chọn người dùng để xem lịch sử</h5>
            <Badge bg="info">Đang xem tất cả lịch sử</Badge>
          </div>
        )}
      </div>
      
      <Card className="mb-3 border-primary">
        <Card.Header className="bg-light">
          <Tabs 
            activeKey={activeTab} 
            onSelect={k => setActiveTab(k)}
            className="mb-0"
          >
            <Tab eventKey="search" title={<span><FaSearch className="me-1" /> Tìm kiếm</span>}>
            </Tab>
            <Tab eventKey="all" title={<span><FaUserFriends className="me-1" /> Tất cả người dùng</span>}>
            </Tab>
          </Tabs>
        </Card.Header>
        <Card.Body>
          {activeTab === 'search' ? (
            <>
              <InputGroup className="mb-2">
                <InputGroup.Text>
                  <FaUser />
                </InputGroup.Text>
                <FormControl
                  placeholder="Nhập tên hoặc email người dùng..."
                  value={userSearchTerm}
                  onChange={(e) => setUserSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSearchUsers()}
                />
                <Button variant="primary" onClick={handleSearchUsers} disabled={isSearching}>
                  {isSearching ? <Spinner animation="border" size="sm" /> : <FaSearch />}
                  {!isSearching && <span className="ms-1">Tìm kiếm</span>}
                </Button>
              </InputGroup>
              
              {searchedUsers.length > 0 && (
                <div className="border rounded mt-2">
                  <div className="p-2 bg-light border-bottom">
                    <strong>Kết quả tìm kiếm: {searchedUsers.length} người dùng</strong>
                  </div>
                  <div style={{maxHeight: '200px', overflowY: 'auto'}}>
                    {searchedUsers.map(user => (
                      <div 
                        key={user.id} 
                        className="p-2 border-bottom user-search-item d-flex align-items-center justify-content-between" 
                        style={{cursor: 'pointer'}}
                        onClick={() => selectUser(user)}
                      >
                        <div className="d-flex align-items-center">
                          <div className="d-flex justify-content-center align-items-center me-2" 
                               style={{width: '30px', height: '30px', borderRadius: '50%', backgroundColor: '#e9f5fe'}}>
                            <FaUser className="text-primary" />
                          </div>
                          <div>
                            <div><strong>{user.display_name || 'Không có tên'}</strong></div>
                            <div className="text-muted small">{user.email}</div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline-primary">
                          <FaArrowRight /> Chọn
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {searchedUsers.length === 0 && userSearchTerm && !isSearching && (
                <div className="text-center p-3 text-muted">
                  <FaSearch size={20} className="mb-2" />
                  <p>Không tìm thấy người dùng phù hợp. Vui lòng thử từ khóa khác.</p>
                </div>
              )}
            </>
          ) : (
            <>
              {isLoadingAllUsers ? (
                <div className="text-center p-4">
                  <Spinner animation="border" variant="primary" />
                  <p className="mt-2">Đang tải danh sách người dùng...</p>
                </div>
              ) : allUsers.length === 0 ? (
                <div className="text-center p-3">
                  <FaExclamationTriangle size={24} className="text-warning mb-2" />
                  <p>Không tìm thấy người dùng nào trong hệ thống.</p>
                </div>
              ) : (
                <div style={{maxHeight: '300px', overflowY: 'auto'}}>
                  <Table bordered hover size="sm">
                    <thead className="bg-light">
                      <tr>
                        <th>#</th>
                        <th>Tên người dùng</th>
                        <th>Email</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allUsers.map((user, index) => (
                        <tr key={user.id}>
                          <td>{index + 1}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="d-flex justify-content-center align-items-center me-2" 
                                  style={{width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e9f5fe'}}>
                                <FaUser className="text-primary" size={12} />
                              </div>
                              <span>{user.display_name || 'Không có tên'}</span>
                            </div>
                          </td>
                          <td>{user.email}</td>
                          <td>
                            <Button 
                              size="sm" 
                              variant="outline-primary"
                              onClick={() => selectUser(user)}
                            >
                              <FaArrowRight className="me-1" /> Xem lịch sử
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default UserSearch; 