import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function OwnerNavbar() {
  const navigate = useNavigate()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isDark, setIsDark] = useState(false)
  const [ownerName, setOwnerName] = useState('Owner')

  useEffect(() => {
    // Get theme from localStorage
    const savedTheme = localStorage.getItem('theme')
    setIsDark(savedTheme === 'dark')
    
    // Get owner name from localStorage or fetch from API
    const storedName = localStorage.getItem('userName')
    if (storedName && storedName !== 'undefined' && storedName !== 'null') {
      setOwnerName(storedName)
    } else {
      // Fetch owner details
      fetchOwnerName()
    }

    // Apply theme to body
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }

    // Click outside handler
    const handleClickOutside = (e) => {
      if (isProfileOpen && !e.target.closest('.navbar-profile')) {
        setIsProfileOpen(false)
      }
    }

    document.addEventListener('click', handleClickOutside)
    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [isProfileOpen])

  const fetchOwnerName = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.user) {
        const name = data.user.name || data.user.email?.split('@')[0] || 'Owner'
        setOwnerName(name)
        localStorage.setItem('userName', name)
      }
    } catch (err) {
      console.error('Failed to fetch owner name:', err)
    }
  }

  const toggleTheme = () => {
    const newTheme = !isDark ? 'dark' : 'light'
    setIsDark(!isDark)
    localStorage.setItem('theme', newTheme)
    
    // Apply to body
    if (newTheme === 'dark') {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }
    
    // Trigger theme change event
    window.dispatchEvent(new Event('themeChange'))
  }

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('userRole')
    localStorage.removeItem('userName')
    navigate('/login')
  }

  return (
    <>
      <style>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        .owner-navbar {
          background: rgba(255, 255, 255, 0.9);
          padding: 0 2rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 64px;
          position: sticky;
          top: 0;
          z-index: 100;
          border-bottom: 1px solid #e2e8f0;
          backdrop-filter: blur(20px) saturate(180%);
          transition: all 0.3s ease;
        }

        body.dark-theme .owner-navbar {
          background: rgba(15, 23, 42, 0.9);
          border-bottom-color: #1e293b;
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          text-decoration: none;
          font-weight: 700;
          font-size: 1.25rem;
          background: linear-gradient(135deg, #4f46e5, #06b6d4);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          letter-spacing: -0.025em;
          transition: opacity 0.2s;
        }

        .navbar-brand:hover {
          opacity: 0.85;
        }

        body.dark-theme .navbar-brand {
          background: linear-gradient(135deg, #6366f1, #22d3ee);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .navbar-menu {
          display: flex;
          gap: 0.25rem;
          align-items: center;
          list-style: none;
        }

        .navbar-link {
          color: #64748b;
          text-decoration: none;
          font-size: 0.875rem;
          font-weight: 500;
          padding: 0.5rem 0.875rem;
          border-radius: 0.5rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
          transition: all 0.2s ease;
          position: relative;
        }

        .navbar-link:hover {
          color: #4f46e5;
          background: rgba(79, 70, 229, 0.06);
        }

        body.dark-theme .navbar-link {
          color: #94a3b8;
        }

        body.dark-theme .navbar-link:hover {
          color: #818cf8;
          background: rgba(99, 102, 241, 0.1);
        }

        .navbar-profile {
          position: relative;
        }

        .profile-trigger {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          cursor: pointer;
          padding: 0.375rem 0.5rem;
          border-radius: 0.375rem;
          transition: all 0.2s ease;
          background: transparent;
          border: none;
        }

        .profile-trigger:hover {
          background: #f3f4f6;
        }

        body.dark-theme .profile-trigger:hover {
          background: #374151;
        }

        .profile-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        .profile-name {
          font-weight: 600;
          font-size: 0.875rem;
          color: #1f2937;
        }

        body.dark-theme .profile-name {
          color: #f3f4f6;
        }

        .profile-role {
          font-size: 0.75rem;
          color: #6b7280;
        }

        body.dark-theme .profile-role {
          color: #9ca3af;
        }

        .profile-avatar {
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: #3b82f6;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 0.875rem;
          color: white;
        }

        body.dark-theme .profile-avatar {
          background: #3b82f6;
        }

        .profile-dropdown {
          position: absolute;
          top: calc(100% + 0.5rem);
          right: 0;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.15);
          min-width: 200px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px);
          transition: all 0.2s ease;
          z-index: 1000;
        }

        body.dark-theme .profile-dropdown {
          background: #1e293b;
          border-color: #334155;
          box-shadow: 0 10px 40px -10px rgba(0, 0, 0, 0.4);
        }

        .profile-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0);
        }

        .dropdown-section {
          padding: 0.5rem;
          border-bottom: 1px solid #e5e7eb;
        }

        body.dark-theme .dropdown-section {
          border-bottom-color: #374151;
        }

        .dropdown-section:last-child {
          border-bottom: none;
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 0.75rem;
          padding: 0.625rem 0.75rem;
          border-radius: 0.375rem;
          cursor: pointer;
          font-size: 0.875rem;
          color: #1f2937;
          transition: all 0.2s ease;
          background: transparent;
          border: none;
          width: 100%;
          text-align: left;
        }

        .dropdown-item:hover {
          background: #f3f4f6;
        }

        body.dark-theme .dropdown-item {
          color: #f3f4f6;
        }

        body.dark-theme .dropdown-item:hover {
          background: #374151;
        }

        .dropdown-item.danger {
          color: #ef4444;
        }

        .dropdown-item.danger:hover {
          background: #fef2f2;
        }

        body.dark-theme .dropdown-item.danger {
          color: #f87171;
        }

        body.dark-theme .dropdown-item.danger:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        .theme-toggle {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.75rem;
          color: #6b7280;
        }

        body.dark-theme .theme-toggle {
          color: #9ca3af;
        }

        .toggle-switch {
          position: relative;
          width: 36px;
          height: 20px;
          background: #d1d5db;
          border-radius: 10px;
          transition: all 0.3s ease;
        }

        .toggle-switch.active {
          background: #3b82f6;
        }

        .toggle-slider {
          position: absolute;
          top: 2px;
          left: 2px;
          width: 16px;
          height: 16px;
          background: white;
          border-radius: 50%;
          transition: all 0.3s ease;
        }

        .toggle-switch.active .toggle-slider {
          transform: translateX(16px);
        }

        .mobile-menu-btn {
          display: none;
          background: transparent;
          border: none;
          color: #1f2937;
          font-size: 1.25rem;
          cursor: pointer;
          padding: 0.5rem;
        }

        body.dark-theme .mobile-menu-btn {
          color: #f3f4f6;
        }

        @media (max-width: 768px) {
          .owner-navbar {
            padding: 1rem;
            flex-wrap: wrap;
          }

          .navbar-menu {
            display: none;
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: #ffffff;
            border-bottom: 1px solid #e5e7eb;
            flex-direction: column;
            gap: 0.25rem;
            padding: 1rem;
            width: 100%;
          }

          body.dark-theme .navbar-menu {
            background: #1f2937;
            border-bottom-color: #374151;
          }

          .navbar-menu.open {
            display: flex;
          }

          .navbar-link {
            padding: 0.75rem 1rem;
            width: 100%;
          }

          .mobile-menu-btn {
            display: block;
            order: 3;
          }

          .navbar-profile {
            width: 100%;
            padding-top: 1rem;
            border-top: 1px solid #e5e7eb;
            order: 4;
          }

          .profile-trigger {
            width: 100%;
            justify-content: flex-start;
          }

          .profile-dropdown {
            position: static;
            margin-top: 0.5rem;
            transform: none;
          }

          .profile-dropdown.open {
            transform: none;
          }

          .navbar-brand {
            flex: 1;
            order: 1;
          }

          .navbar-brand + .mobile-menu-btn {
            order: 2;
          }
        }
      `}</style>

      <nav className="owner-navbar">
        <Link to="/owner/dashboard" className="navbar-brand">
          HostelHub
        </Link>

        <button
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>

        <ul className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
          <li><Link to="/owner/dashboard" className="navbar-link">📊 Dashboard</Link></li>
          <li><Link to="/owner/hostels" className="navbar-link">🏠 Hostels</Link></li>
          <li><Link to="/owner/rooms" className="navbar-link">🛏️ Rooms</Link></li>
          <li><Link to="/owner/bookings" className="navbar-link">📋 Bookings</Link></li>
          <li><Link to="/owner/complaints" className="navbar-link">🎫 Complaints</Link></li>
        </ul>

        <div className="navbar-profile">
          <button 
            className="profile-trigger"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="profile-info">
              <div className="profile-name">{ownerName}</div>
              <div className="profile-role">Owner</div>
            </div>
            <div className="profile-avatar">👤</div>
          </button>

          <div className={`profile-dropdown ${isProfileOpen ? 'open' : ''}`}>
            <div className="dropdown-section">
              <button className="dropdown-item" onClick={toggleTheme}>
                <span>{isDark ? '☀️ Light Mode' : '🌙 Dark Mode'}</span>
                <div className={`toggle-switch ${isDark ? 'active' : ''}`}>
                  <div className="toggle-slider"></div>
                </div>
              </button>
            </div>
            <div className="dropdown-section">
              <button className="dropdown-item danger" onClick={handleLogout}>
                🚪 Logout
              </button>
            </div>
          </div>
        </div>
      </nav>
    </>
  )
}
