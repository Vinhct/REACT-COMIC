import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Spinner, Alert, Tabs, Tab } from 'react-bootstrap';
import { FaPlusCircle, FaMagic, FaHistory, FaGift, FaUserFriends } from 'react-icons/fa';
import AdminLayout from '../AdminLayout';
import { withAdminAuth } from '../AdminContext';

// Import the separated components
import PrizesList from './LuckyWheel/PrizesList';
import SpinHistory from './LuckyWheel/SpinHistory';
import UserStats from './LuckyWheel/UserStats';
import PrizeModal from './LuckyWheel/PrizeModal';
import UserSearch from './LuckyWheel/UserSearch';

// Import API functions
import { 
  fetchPrizes, 
  fetchWheelStats, 
  fetchSpinHistory, 
  fetchUserStatistics,
  searchUsers,
  addPrize,
  updatePrize,
  deletePrize,
  fetchAllUsers,
  migrateSpinHistorySchema
} from './LuckyWheel/api';

const LuckyWheelManagement = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('prizes');
  
  // States for prizes
  const [prizes, setPrizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');
  const [stats, setStats] = useState({ totalPrizes: 0, totalSpins: 0, prizesClaimed: 0 });

  // States for modal
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState('add');
  const [formData, setFormData] = useState({
    name: '',
    type: 'coin',
    value: 0,
    description: '',
    probability: 0,
    is_active: true
  });

  // States for history
  const [spinHistory, setSpinHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyPerPage, setHistoryPerPage] = useState(10);
  const [hasMoreHistory, setHasMoreHistory] = useState(false);
  const [totalHistoryItems, setTotalHistoryItems] = useState(0);
  const [totalHistoryPages, setTotalHistoryPages] = useState(0);
  
  // States for history filters
  const [historyFilters, setHistoryFilters] = useState({
    startDate: null,
    endDate: null,
    prizeType: 'all'
  });

  // States for user search
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [isLoadingAllUsers, setIsLoadingAllUsers] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [selectedUserInfo, setSelectedUserInfo] = useState(null);
  const [userStatistics, setUserStatistics] = useState({
    loading: true,
    totalSpins: 0,
    prizesClaimed: 0,
    mostWonPrize: null
  });

  // Format date helper function
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // State for edit prize ID
  const [editPrizeId, setEditPrizeId] = useState(null);

  // Load prizes
  const loadPrizes = async () => {
    setLoading(true);
    const { data, error } = await fetchPrizes();
    
    if (error) {
      setErrorMessage(`Lỗi khi tải dữ liệu phần thưởng: ${error}`);
    } else {
      setPrizes(data || []);
    }
    setLoading(false);
  };

  // Load wheel stats
  const loadWheelStats = async () => {
    setStatsLoading(true);
    const { data, error } = await fetchWheelStats();
    
    if (error) {
      setErrorMessage(`Lỗi khi tải thống kê: ${error}`);
    } else {
      setStats(data || { totalPrizes: 0, totalSpins: 0, prizesClaimed: 0 });
    }
    setStatsLoading(false);
  };

  // Load spin history
  const loadSpinHistory = async (page = 1, userId = null) => {
    setHistoryLoading(true);
    const { data, hasMore, totalItems, totalPages, error } = await fetchSpinHistory(
      page, 
      historyPerPage, 
      userId,
      historyFilters
    );
    
    if (error) {
      setErrorMessage(`Lỗi khi tải lịch sử quay: ${error}`);
    } else {
      setSpinHistory(data || []);
      setHasMoreHistory(hasMore);
      setHistoryPage(page);
      setTotalHistoryItems(totalItems);
      setTotalHistoryPages(totalPages);
    }
    setHistoryLoading(false);
  };

  // Load user statistics
  const loadUserStatistics = async (userId) => {
    setUserStatistics(prev => ({ ...prev, loading: true }));
    
    if (userId) {
      const { data, error } = await fetchUserStatistics(userId);
      
      if (error) {
        setErrorMessage(`Lỗi khi tải thống kê người dùng: ${error}`);
      } else {
        setUserStatistics({
          loading: false,
          totalSpins: data?.totalSpins || 0,
          prizesClaimed: data?.prizesClaimed || 0,
          mostWonPrize: data?.mostWonPrize || null,
          userProfile: data?.userProfile || null
        });
      }
    } else {
      setUserStatistics({
        loading: false,
        totalSpins: 0,
        prizesClaimed: 0,
        mostWonPrize: null,
        userProfile: null
      });
    }
  };

  // Handle load more history
  const handleLoadMoreHistory = () => {
    loadSpinHistory(historyPage + 1, selectedUserId);
  };

  // Handle search users
  const handleSearchUsers = async () => {
    if (!userSearchTerm.trim()) return;
    
    setIsSearching(true);
    const { data, error } = await searchUsers(userSearchTerm);
    
    if (error) {
      setErrorMessage(`Lỗi khi tìm kiếm người dùng: ${error}`);
    } else {
      setSearchedUsers(data || []);
    }
    setIsSearching(false);
  };

  // Handle select user
  const selectUser = (user) => {
    setSelectedUserId(user.id);
    setSelectedUserInfo(user);
    setSearchedUsers([]);
    setUserSearchTerm('');
    setHistoryPage(1);
    loadSpinHistory(1, user.id);
    loadUserStatistics(user.id);
  };

  // Handle clear selected user
  const clearSelectedUser = () => {
    setSelectedUserId(null);
    setSelectedUserInfo(null);
    setHistoryPage(1);
    loadSpinHistory(1, null);
    setUserStatistics(prev => ({ ...prev, loading: true }));
  };

  // Handle form input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle open add modal
  const openAddModal = () => {
    setFormData({
      name: '',
      type: 'coin',
      value: 0,
      description: '',
      probability: 0,
      is_active: true
    });
    setModalMode('add');
    setShowModal(true);
  };

  // Handle open edit modal
  const openEditModal = (prize) => {
    setFormData({
      name: prize.name,
      type: prize.type,
      value: prize.value,
      description: prize.description || '',
      probability: prize.probability,
      is_active: prize.is_active
    });
    setModalMode('edit');
    setShowModal(true);
    setEditPrizeId(prize.id);
  };

  // Handle form submit
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const prizeData = {
      name: formData.name,
      type: formData.type,
      value: parseFloat(formData.value),
      description: formData.description,
      probability: parseFloat(formData.probability),
      is_active: formData.is_active
    };
    
    if (modalMode === 'add') {
      const { error } = await addPrize(prizeData);
      
      if (error) {
        setErrorMessage(`Lỗi khi thêm phần thưởng: ${error}`);
      } else {
        loadPrizes();
        loadWheelStats();
        setShowModal(false);
      }
    } else {
      const { error } = await updatePrize(editPrizeId, prizeData);
      
      if (error) {
        setErrorMessage(`Lỗi khi cập nhật phần thưởng: ${error}`);
      } else {
        loadPrizes();
        setShowModal(false);
      }
    }
  };

  // Handle delete prize
  const handleDeletePrize = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa phần thưởng này?')) {
      const { success, error } = await deletePrize(id);
      
      if (!success) {
        setErrorMessage(`Lỗi khi xóa phần thưởng: ${error}`);
      } else {
        loadPrizes();
        loadWheelStats();
      }
    }
  };

  // Handle page change
  const handlePageChange = (page) => {
    loadSpinHistory(page, selectedUserId);
  };

  // Handle per page change
  const handlePerPageChange = (perPage) => {
    setHistoryPerPage(perPage);
    setHistoryPage(1); // Reset to first page
    loadSpinHistory(1, selectedUserId);
  };

  // Handle filter change
  const handleFilterChange = (filterName, value) => {
    setHistoryFilters(prev => ({
      ...prev,
      [filterName]: value
    }));
    setHistoryPage(1); // Reset to first page
    
    // Small delay to avoid too many API calls when changing date inputs
    setTimeout(() => {
      loadSpinHistory(1, selectedUserId);
    }, 300);
  };

  // Callback khi trạng thái phát thưởng được cập nhật
  const handleStatusUpdated = () => {
    console.log("Status updated callback triggered, reloading spin history data");
    // Tải lại dữ liệu lịch sử quay với trang hiện tại
    loadSpinHistory(historyPage, selectedUserId);
  };

  // Load all users for admin selection
  const loadAllUsers = async () => {
    setIsLoadingAllUsers(true);
    const { data, error } = await fetchAllUsers();
    
    if (error) {
      setErrorMessage(`Lỗi khi tải danh sách người dùng: ${error}`);
    } else {
      setAllUsers(data || []);
    }
    setIsLoadingAllUsers(false);
  };

  // Initial load
  useEffect(() => {
    // Kiểm tra và cập nhật cấu trúc bảng nếu cần
    const checkSchema = async () => {
      const migrationResult = await migrateSpinHistorySchema();
      if (!migrationResult.success) {
        setErrorMessage(`Lỗi cấu trúc dữ liệu: ${migrationResult.error}. Vui lòng làm theo hướng dẫn hiển thị để cập nhật cấu trúc bảng.`);
      }
    };
    
    checkSchema();
    loadPrizes();
    loadWheelStats();
    loadSpinHistory();
    loadAllUsers();
  }, []);

  return (
    <AdminLayout title="Quản lý Vòng quay">
      <Container fluid className="p-4">
        {errorMessage && (
          <Alert variant="danger" onClose={() => setErrorMessage('')} dismissible>
            {errorMessage}
          </Alert>
        )}
        
        <Row className="mb-4">
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div>
                    <h6 className="mb-0">Tổng số phần thưởng</h6>
                    <h2 className="mb-0">
                      {statsLoading ? <Spinner size="sm" animation="border" /> : stats.totalPrizes}
                    </h2>
                  </div>
                  <div className="ms-auto">
                    <FaGift size={24} className="text-primary" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div>
                    <h6 className="mb-0">Tổng số lượt quay</h6>
                    <h2 className="mb-0">
                      {statsLoading ? <Spinner size="sm" animation="border" /> : stats.totalSpins}
                    </h2>
                  </div>
                  <div className="ms-auto">
                    <FaMagic size={24} className="text-success" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          
          <Col md={4}>
            <Card className="shadow-sm">
              <Card.Body>
                <div className="d-flex align-items-center">
                  <div>
                    <h6 className="mb-0">Phần thưởng đã trao</h6>
                    <h2 className="mb-0">
                      {statsLoading ? <Spinner size="sm" animation="border" /> : stats.prizesClaimed}
                    </h2>
                  </div>
                  <div className="ms-auto">
                    <FaUserFriends size={24} className="text-warning" />
                  </div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
        
        <Card className="shadow-sm mb-4">
          <Card.Header className="bg-white">
            <Tabs
              activeKey={activeTab}
              onSelect={(k) => setActiveTab(k)}
              className="mb-0"
              fill
            >
              <Tab 
                eventKey="prizes" 
                title={
                  <span><FaGift className="me-2" />Phần thưởng</span>
                }
              />
              <Tab 
                eventKey="history" 
                title={
                  <span><FaHistory className="me-2" />Lịch sử quay</span>
                }
              />
            </Tabs>
          </Card.Header>
          <Card.Body>
            {activeTab === 'prizes' && (
              <Row>
                <Col lg={12}>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="mb-0">Danh sách phần thưởng</h5>
                    <Button 
                      variant="primary"
                      size="sm"
                      onClick={openAddModal}
                    >
                      <FaPlusCircle className="me-1" /> Thêm phần thưởng
                    </Button>
                  </div>
                  <PrizesList 
                    prizes={prizes}
                    loading={loading}
                    openEditModal={openEditModal}
                    handleDeletePrize={handleDeletePrize}
                  />
                </Col>
              </Row>
            )}
            
            {activeTab === 'history' && (
              <Row>
                <Col lg={4}>
                  {selectedUserId && (
                    <UserStats userStatistics={userStatistics} />
                  )}
                  
                  <UserSearch 
                    userSearchTerm={userSearchTerm}
                    setUserSearchTerm={setUserSearchTerm}
                    handleSearchUsers={handleSearchUsers}
                    isSearching={isSearching}
                    searchedUsers={searchedUsers}
                    selectUser={selectUser}
                    selectedUserInfo={selectedUserInfo}
                    clearSelectedUser={clearSelectedUser}
                    allUsers={allUsers}
                    isLoadingAllUsers={isLoadingAllUsers}
                  />
                </Col>
                
                <Col lg={8}>
                  <SpinHistory 
                    spinHistory={spinHistory}
                    historyLoading={historyLoading}
                    historyPage={historyPage}
                    historyPerPage={historyPerPage}
                    hasMoreHistory={hasMoreHistory}
                    totalItems={totalHistoryItems}
                    totalPages={totalHistoryPages}
                    handleLoadMoreHistory={handleLoadMoreHistory}
                    handlePageChange={handlePageChange}
                    handlePerPageChange={handlePerPageChange}
                    handleFilterChange={handleFilterChange}
                    filters={historyFilters}
                    formatDate={formatDate}
                    onStatusUpdated={handleStatusUpdated}
                  />
                </Col>
              </Row>
            )}
          </Card.Body>
        </Card>

        <PrizeModal 
          showModal={showModal}
          setShowModal={setShowModal}
          modalMode={modalMode}
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          setFormData={setFormData}
        />
      </Container>
    </AdminLayout>
  );
};

export default withAdminAuth(LuckyWheelManagement);
