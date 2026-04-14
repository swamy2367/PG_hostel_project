import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import {
  HomeIcon, BuildingIcon, BedIcon, ClipboardIcon, TicketIcon,
  LayoutDashboardIcon, UserIcon, LogOutIcon, SunIcon, MoonIcon,
  MenuIcon, XIcon, ChevronDownIcon, SearchIcon
} from './Icons';

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isDark, setIsDark] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userRole, setUserRole] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profileRef = useRef(null);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const dark = savedTheme === 'dark';
    setIsDark(dark);
    document.body.classList.toggle('dark-mode', dark);
    document.body.classList.toggle('dark-theme', dark);

    const token = localStorage.getItem('token');
    const role = localStorage.getItem('userRole');
    const name = localStorage.getItem('userName');
    if (token && role) {
      setIsLoggedIn(true);
      setUserRole(role);
      setUserName(name || (role === 'student' ? 'Student' : 'Owner'));
    }

    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);

    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    // Listen for theme changes
    const handleThemeChange = () => {
      const newTheme = localStorage.getItem('theme');
      setIsDark(newTheme === 'dark');
    };
    window.addEventListener('themeChange', handleThemeChange);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('themeChange', handleThemeChange);
    };
  }, []);

  function toggleTheme() {
    const newDark = !isDark;
    setIsDark(newDark);
    localStorage.setItem('theme', newDark ? 'dark' : 'light');
    document.body.classList.toggle('dark-mode', newDark);
    document.body.classList.toggle('dark-theme', newDark);
    window.dispatchEvent(new Event('themeChange'));
  }

  function handleLogout() {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('adminData');
    localStorage.removeItem('adminToken');
    setIsLoggedIn(false);
    setUserRole('');
    setUserName('');
    navigate('/');
  }

  const isActive = (path) => location.pathname === path;

  // Determine nav links based on role
  const getNavLinks = () => {
    if (userRole === 'owner') {
      return [
        { to: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
        { to: '/owner/hostels', label: 'Hostels', icon: BuildingIcon },
        { to: '/owner/rooms', label: 'Rooms', icon: BedIcon },
        { to: '/owner/bookings', label: 'Bookings', icon: ClipboardIcon },
        { to: '/owner/complaints', label: 'Complaints', icon: TicketIcon },
      ];
    }
    if (userRole === 'student') {
      return [
        { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
        { to: '/search', label: 'Browse', icon: SearchIcon },
        { to: '/student/bookings', label: 'Bookings', icon: ClipboardIcon },
        { to: '/student/complaints', label: 'Complaints', icon: TicketIcon },
      ];
    }
    return [
      { to: '/', label: 'Home', icon: HomeIcon },
      { to: '/search', label: 'Browse', icon: SearchIcon },
    ];
  };

  const navLinks = getNavLinks();

  return (
    <>
      <style>{`
        .navbar {
          position: sticky;
          top: 0;
          z-index: 1000;
          height: var(--header-height);
          display: flex;
          align-items: center;
          background: var(--bg);
          border-bottom: 1px solid var(--border);
          transition: all var(--duration-normal) var(--ease-default);
        }

        .navbar.scrolled {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          box-shadow: var(--shadow-sm);
        }

        body.dark-mode .navbar.scrolled,
        body.dark-theme .navbar.scrolled {
          background: rgba(17, 24, 39, 0.85);
        }

        .navbar-inner {
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 var(--space-6);
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-8);
        }

        .navbar-brand {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-xl);
          font-weight: 700;
          letter-spacing: var(--tracking-tighter);
          color: var(--text);
          flex-shrink: 0;
          transition: transform var(--duration-fast) var(--ease-default);
        }

        .navbar-brand:hover {
          transform: translateY(-1px);
        }

        .navbar-brand-text {
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .navbar-brand-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .navbar-nav {
          display: flex;
          align-items: center;
          gap: var(--space-1);
          list-style: none;
        }

        .nav-link {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: 0.5rem 0.875rem;
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-secondary);
          border-radius: var(--radius);
          transition: all var(--duration-fast) var(--ease-default);
          position: relative;
          white-space: nowrap;
        }

        .nav-link:hover {
          color: var(--text);
          background: var(--bg-tertiary);
        }

        .nav-link.active {
          color: var(--primary);
          background: var(--primary-50);
        }

        body.dark-mode .nav-link.active,
        body.dark-theme .nav-link.active {
          background: rgba(99, 102, 241, 0.12);
        }

        .nav-link-icon {
          opacity: 0.7;
          flex-shrink: 0;
        }

        .navbar-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-shrink: 0;
        }

        .navbar-divider {
          width: 1px;
          height: 24px;
          background: var(--border);
        }

        .theme-toggle {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius);
          color: var(--text-secondary);
          cursor: pointer;
          transition: all var(--duration-fast) var(--ease-default);
          border: 1px solid transparent;
        }

        .theme-toggle:hover {
          color: var(--text);
          background: var(--bg-tertiary);
        }

        .profile-menu {
          position: relative;
        }

        .profile-trigger {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: 4px 8px 4px 4px;
          border-radius: var(--radius-full);
          cursor: pointer;
          border: 1px solid var(--border);
          background: var(--bg);
          transition: all var(--duration-fast) var(--ease-default);
        }

        .profile-trigger:hover {
          border-color: var(--primary-300);
          box-shadow: var(--shadow-sm);
        }

        .profile-avatar {
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full);
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 12px;
          font-weight: 600;
        }

        .profile-name {
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text);
          max-width: 100px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .profile-chevron {
          color: var(--text-tertiary);
          transition: transform var(--duration-fast) var(--ease-default);
        }

        .profile-trigger[aria-expanded="true"] .profile-chevron {
          transform: rotate(180deg);
        }

        .profile-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: var(--shadow-lg);
          min-width: 220px;
          opacity: 0;
          visibility: hidden;
          transform: translateY(-8px) scale(0.97);
          transition: all var(--duration-fast) var(--ease-default);
          z-index: 1000;
          overflow: hidden;
        }

        .profile-dropdown.open {
          opacity: 1;
          visibility: visible;
          transform: translateY(0) scale(1);
        }

        .dropdown-header {
          padding: var(--space-4);
          border-bottom: 1px solid var(--border);
        }

        .dropdown-header-name {
          font-weight: 600;
          font-size: var(--text-sm);
          color: var(--text);
        }

        .dropdown-header-role {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-transform: capitalize;
        }

        .dropdown-section {
          padding: var(--space-1);
        }

        .dropdown-section + .dropdown-section {
          border-top: 1px solid var(--border);
        }

        .dropdown-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: 0.625rem 0.75rem;
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text);
          border-radius: var(--radius);
          cursor: pointer;
          transition: all var(--duration-fast) var(--ease-default);
          width: 100%;
          text-align: left;
          background: transparent;
          border: none;
        }

        .dropdown-item:hover {
          background: var(--bg-tertiary);
        }

        .dropdown-item.danger {
          color: var(--danger);
        }

        .dropdown-item.danger:hover {
          background: var(--danger-light);
        }

        .dropdown-item-icon {
          color: var(--text-tertiary);
          flex-shrink: 0;
        }

        /* Mobile */
        .mobile-toggle {
          display: none;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius);
          color: var(--text);
          cursor: pointer;
        }

        .mobile-toggle:hover {
          background: var(--bg-tertiary);
        }

        .mobile-nav {
          display: none;
        }

        @media (max-width: 768px) {
          .navbar-nav {
            display: none;
          }

          .mobile-toggle {
            display: flex;
          }

          .profile-name {
            display: none;
          }

          .mobile-nav {
            display: block;
            position: fixed;
            top: var(--header-height);
            left: 0;
            right: 0;
            bottom: 0;
            background: var(--bg);
            z-index: 999;
            padding: var(--space-4);
            overflow-y: auto;
            border-top: 1px solid var(--border);
            transform: translateX(-100%);
            transition: transform var(--duration-normal) var(--ease-default);
          }

          .mobile-nav.open {
            transform: translateX(0);
          }

          .mobile-nav-link {
            display: flex;
            align-items: center;
            gap: var(--space-3);
            padding: var(--space-4);
            font-size: var(--text-base);
            font-weight: 500;
            color: var(--text-secondary);
            border-radius: var(--radius-md);
            transition: all var(--duration-fast) var(--ease-default);
            margin-bottom: var(--space-1);
          }

          .mobile-nav-link:hover, .mobile-nav-link.active {
            background: var(--bg-tertiary);
            color: var(--primary);
          }

          .mobile-nav-footer {
            margin-top: var(--space-6);
            padding-top: var(--space-4);
            border-top: 1px solid var(--border);
            display: flex;
            flex-direction: column;
            gap: var(--space-2);
          }
        }
      `}</style>

      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-inner">
          {/* Brand */}
          <Link to={isLoggedIn && userRole === 'owner' ? '/owner/dashboard' : isLoggedIn && userRole === 'student' ? '/student/dashboard' : '/'} className="navbar-brand">
            <div className="navbar-brand-icon">
              <HomeIcon size={18} />
            </div>
            <span className="navbar-brand-text">HostelHub</span>
          </Link>

          {/* Desktop Nav */}
          <ul className="navbar-nav">
            {navLinks.map(({ to, label, icon: NavIcon }) => (
              <li key={to}>
                <Link to={to} className={`nav-link ${isActive(to) ? 'active' : ''}`}>
                  <NavIcon size={16} className="nav-link-icon" />
                  {label}
                </Link>
              </li>
            ))}
          </ul>

          {/* Actions */}
          <div className="navbar-actions">
            <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
              {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>

            {isLoggedIn && <NotificationBell />}

            {isLoggedIn ? (
              <div className="profile-menu" ref={profileRef}>
                <button
                  className="profile-trigger"
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  aria-expanded={isProfileOpen}
                >
                  <div className="profile-avatar">
                    {userName.charAt(0).toUpperCase()}
                  </div>
                  <span className="profile-name">{userName}</span>
                  <ChevronDownIcon size={14} className="profile-chevron" />
                </button>

                <div className={`profile-dropdown ${isProfileOpen ? 'open' : ''}`}>
                  <div className="dropdown-header">
                    <div className="dropdown-header-name">{userName}</div>
                    <div className="dropdown-header-role">{userRole}</div>
                  </div>
                  <div className="dropdown-section">
                    {userRole === 'student' && (
                      <Link to="/student/profile" className="dropdown-item" onClick={() => setIsProfileOpen(false)}>
                        <UserIcon size={16} className="dropdown-item-icon" />
                        My Profile
                      </Link>
                    )}
                    <Link
                      to={userRole === 'student' ? '/student/dashboard' : '/owner/dashboard'}
                      className="dropdown-item"
                      onClick={() => setIsProfileOpen(false)}
                    >
                      <LayoutDashboardIcon size={16} className="dropdown-item-icon" />
                      Dashboard
                    </Link>
                  </div>
                  <div className="dropdown-section">
                    <button className="dropdown-item danger" onClick={handleLogout}>
                      <LogOutIcon size={16} className="dropdown-item-icon" />
                      Logout
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <Link to="/login" className="btn btn-outline btn-sm hide-mobile">Login</Link>
                <Link to="/register" className="btn btn-primary btn-sm">Sign Up</Link>
              </>
            )}

            {/* Mobile Menu Toggle */}
            <button className="mobile-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
              {isMobileOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation */}
      <div className={`mobile-nav ${isMobileOpen ? 'open' : ''}`} onClick={() => setIsMobileOpen(false)}>
        {navLinks.map(({ to, label, icon: NavIcon }) => (
          <Link key={to} to={to} className={`mobile-nav-link ${isActive(to) ? 'active' : ''}`}>
            <NavIcon size={20} />
            {label}
          </Link>
        ))}

        {!isLoggedIn && (
          <div className="mobile-nav-footer">
            <Link to="/login" className="btn btn-outline btn-full">Login</Link>
            <Link to="/register" className="btn btn-primary btn-full">Sign Up</Link>
          </div>
        )}
      </div>
    </>
  );
}
