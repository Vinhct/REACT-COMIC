import React, { useState, useEffect } from 'react';
import { Button, Offcanvas, Form, ToggleButton } from 'react-bootstrap';
import { FaCog, FaSun, FaMoon, FaFont, FaTextHeight } from 'react-icons/fa';
import './Settings.css';

const Settings = () => {
  const [show, setShow] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [fontSize, setFontSize] = useState(1); // 1 is normal size

  // Load settings from localStorage on component mount
  useEffect(() => {
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    const savedFontSize = parseFloat(localStorage.getItem('fontSize')) || 1;
    
    setDarkMode(savedDarkMode);
    setFontSize(savedFontSize);
    
    // Apply saved settings
    applyDarkMode(savedDarkMode);
    applyFontSize(savedFontSize);
  }, []);

  const handleClose = () => setShow(false);
  const handleShow = () => setShow(true);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', newDarkMode);
    applyDarkMode(newDarkMode);
  };

  const applyDarkMode = (isDark) => {
    if (isDark) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
  };

  const handleFontSizeChange = (e) => {
    const newSize = parseFloat(e.target.value);
    setFontSize(newSize);
    localStorage.setItem('fontSize', newSize);
    applyFontSize(newSize);
  };

  const applyFontSize = (size) => {
    document.documentElement.style.setProperty('--font-size-multiplier', size);
  };

  return (
    <>
      <Button 
        onClick={handleShow} 
        className="settings-button"
        aria-label="Settings"
      >
        <FaCog />
      </Button>

      <Offcanvas show={show} onHide={handleClose} placement="end" className="settings-panel">
        <Offcanvas.Header closeButton>
          <Offcanvas.Title className="settings-title gradient-text">Cài đặt</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <div className="settings-option">
            <div className="settings-option-header">
              {darkMode ? <FaMoon className="settings-icon" /> : <FaSun className="settings-icon" />}
              <h5>Chế độ {darkMode ? 'tối' : 'sáng'}</h5>
            </div>
            <Form.Check
              type="switch"
              id="dark-mode-switch"
              checked={darkMode}
              onChange={toggleDarkMode}
              className="settings-switch"
              label=""
            />
          </div>

          <div className="settings-option">
            <div className="settings-option-header">
              <FaFont className="settings-icon" />
              <h5>Cỡ chữ</h5>
            </div>
            <div className="font-size-slider">
              <FaFont size={12} />
              <Form.Range
                min={0.8}
                max={1.4}
                step={0.1}
                value={fontSize}
                onChange={handleFontSizeChange}
              />
              <FaFont size={24} />
            </div>
            <div className="font-size-preview">
              <p>Kích thước chữ hiện tại: {Math.round(fontSize * 100)}%</p>
            </div>
          </div>
        </Offcanvas.Body>
      </Offcanvas>
    </>
  );
};

export default Settings; 