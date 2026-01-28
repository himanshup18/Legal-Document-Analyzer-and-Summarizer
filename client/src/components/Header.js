import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import './Header.css';

const Header = ({ onAuthClick }) => {
  const { user, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInitials = (name) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="app-header">
      <div className="header-content">
        <div className="header-left">
          <h1>Legal Document Analyzer & Summarizer</h1>
          <p>Upload legal documents to get AI-powered analysis and summaries</p>
        </div>

        <div className="header-right">
          {user ? (
            <div className="profile-section" ref={dropdownRef}>
              <button
                className="profile-button"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Profile menu"
              >
                <div className="profile-avatar">
                  {getInitials(user.name)}
                </div>
                <span className="profile-name">{user.name}</span>
                <svg
                  className={`dropdown-arrow ${showDropdown ? 'open' : ''}`}
                  width="12"
                  height="12"
                  viewBox="0 0 12 12"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M2 4L6 8L10 4"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>

              {showDropdown && (
                <div className="profile-dropdown">
                  <div className="dropdown-header">
                    <div className="dropdown-avatar">{getInitials(user.name)}</div>
                    <div className="dropdown-info">
                      <div className="dropdown-name">{user.name}</div>
                      <div className="dropdown-email">{user.email}</div>
                    </div>
                  </div>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item" onClick={logout}>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path
                        d="M6 14H3a2 2 0 01-2-2V4a2 2 0 012-2h3M10 12l4-4-4-4M14 8H6"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button className="signin-button" onClick={onAuthClick}>
              Sign In
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
