import React from 'react';
import { Navbar, Container } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import MobileNotification from '../components/MobileNotification';
import { useAuth } from '../../../AuthContext';

const MobileHeader = () => {
  const { user } = useAuth();

  return (
    <Navbar bg="white" fixed="top" className="shadow-sm">
      <Container fluid className="px-3">
        <Navbar.Brand as={Link} to="/" className="p-0">
          <img
            src="/logo.png"
            height="40"
            className="d-inline-block align-top"
            alt="Logo"
          />
        </Navbar.Brand>
        <div className="d-flex align-items-center">
          {user && <MobileNotification />}
          <Link to="/profile">
            <img
              src={user?.avatar_url || '/default-avatar.png'}
              alt="Profile"
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                objectFit: 'cover',
                marginLeft: '8px'
              }}
            />
          </Link>
        </div>
      </Container>
    </Navbar>
  );
};

export default MobileHeader; 