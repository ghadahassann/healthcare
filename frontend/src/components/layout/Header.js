import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">
          <i className="fas fa-hospital"></i>
          <span>HealthCare System</span>
        </div>
      </div>
      
      <div className="header-center">
        <h1>Medical Dashboard</h1>
      </div>
      
      <div className="header-right">
        <div className="user-info">
          <i className="fas fa-user-md"></i>
          <span>Dr. Ahmed Mohamed</span>
        </div>
        <button className="notification-btn">
          <i className="fas fa-bell"></i>
          <span className="notification-badge">3</span>
        </button>
      </div>
    </header>
  );
};

export default Header;