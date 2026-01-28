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
    <header className="app-header bg-white/90 backdrop-blur sticky top-0 z-40 shadow-md">
      <div className="header-content max-w-6xl mx-auto flex items-center justify-between gap-6 px-4">
        <div className="header-left">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-800">
            Legal Document Analyzer &amp; Summarizer
          </h1>
          <p className="text-slate-500 text-sm md:text-base">
            Upload legal documents to get AI-powered analysis, risks, and key clauses.
          </p>
        </div>

        <div className="header-right flex items-center">
          {user ? (
            <div className="profile-section relative" ref={dropdownRef}>
              <button
                className="profile-button flex items-center gap-3 px-3 py-2 border border-slate-200 rounded-xl bg-white hover:shadow-sm transition"
                onClick={() => setShowDropdown(!showDropdown)}
                aria-label="Profile menu"
              >
                <div className="profile-avatar w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-xs font-semibold">
                  {getInitials(user.name)}
                </div>
                <span className="profile-name hidden sm:inline text-sm font-medium text-slate-800">
                  {user.name}
                </span>
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
                <div className="profile-dropdown absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden">
                  <div className="dropdown-header flex items-center gap-3 px-4 py-3 bg-slate-50">
                    <div className="dropdown-avatar w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 text-white flex items-center justify-center text-sm font-semibold">
                      {getInitials(user.name)}
                    </div>
                    <div className="dropdown-info min-w-0">
                      <div className="dropdown-name font-semibold text-slate-900 truncate">
                        {user.name}
                      </div>
                      <div className="dropdown-email text-xs text-slate-500 truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>
                  <div className="dropdown-divider h-px bg-slate-200" />
                  <button
                    className="dropdown-item w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
                    onClick={logout}
                  >
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
            <button
              className="signin-button inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 text-sm font-semibold shadow-md hover:shadow-lg hover:translate-y-[-1px] transition"
              onClick={onAuthClick}
            >
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
