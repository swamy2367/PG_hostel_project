import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboardIcon, BuildingIcon, BedIcon, ClipboardIcon, TicketIcon,
  HomeIcon, SunIcon, MoonIcon, LogOutIcon, ChevronLeftIcon, ChevronRightIcon,
  MenuIcon, XIcon, UserIcon
} from './Icons';

export default function DashboardLayout({ children, role = 'owner' }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isDark, setIsDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const dark = savedTheme === 'dark';
    setIsDark(dark);
    document.body.classList.toggle('dark-mode', dark);
    document.body.classList.toggle('dark-theme', dark);

    const name = localStorage.getItem('userName');
    setUserName(name || (role === 'student' ? 'Student' : 'Owner'));

    const handleThemeChange = () => {
      const newTheme = localStorage.getItem('theme');
      setIsDark(newTheme === 'dark');
    };
    window.addEventListener('themeChange', handleThemeChange);
    return () => window.removeEventListener('themeChange', handleThemeChange);
  }, [role]);

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
    navigate('/');
  }

  const isActive = (path) => location.pathname === path;

  const ownerLinks = [
    { to: '/owner/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
    { to: '/owner/hostels', label: 'Hostels', icon: BuildingIcon },
    { to: '/owner/rooms', label: 'Rooms', icon: BedIcon },
    { to: '/owner/bookings', label: 'Bookings', icon: ClipboardIcon },
    { to: '/owner/complaints', label: 'Complaints', icon: TicketIcon },
  ];

  const studentLinks = [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
    { to: '/search', label: 'Browse Hostels', icon: BuildingIcon },
    { to: '/student/bookings', label: 'Bookings', icon: ClipboardIcon },
    { to: '/student/complaints', label: 'Complaints', icon: TicketIcon },
    { to: '/student/profile', label: 'Profile', icon: UserIcon },
  ];

  const navLinks = role === 'owner' ? ownerLinks : studentLinks;

  return (
    <>
      <style>{`
        .dashboard-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }

        .dashboard-topbar {
          position: sticky;
          top: 0;
          z-index: 900;
          height: var(--header-height);
          background: var(--bg);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          padding: 0 var(--space-6);
          gap: var(--space-4);
          transition: background var(--duration-normal) var(--ease-default);
        }

        .dashboard-topbar.scrolled {
          background: var(--glass-bg);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
        }

        .topbar-brand {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-xl);
          font-weight: 700;
          letter-spacing: var(--tracking-tighter);
          flex-shrink: 0;
        }

        .topbar-brand-icon {
          width: 32px;
          height: 32px;
          background: linear-gradient(135deg, var(--primary), var(--accent));
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
        }

        .topbar-brand-text {
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .topbar-spacer {
          flex: 1;
        }

        .topbar-actions {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          flex-shrink: 0;
        }

        .topbar-user {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-1) var(--space-3) var(--space-1) var(--space-1);
          border-radius: var(--radius-full);
          border: 1px solid var(--border);
          cursor: default;
        }

        .topbar-user-name {
          font-size: var(--text-sm);
          font-weight: 500;
        }

        .topbar-user-role {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-transform: capitalize;
        }

        .topbar-mobile-toggle {
          display: none;
          width: 40px;
          height: 40px;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius);
          color: var(--text);
          cursor: pointer;
        }

        .topbar-mobile-toggle:hover {
          background: var(--bg-tertiary);
        }

        .dashboard-body {
          display: flex;
          flex: 1;
        }

        .dash-sidebar {
          width: var(--sidebar-width);
          background: var(--bg);
          border-right: 1px solid var(--border);
          padding: var(--space-4);
          display: flex;
          flex-direction: column;
          position: sticky;
          top: var(--header-height);
          height: calc(100vh - var(--header-height));
          overflow-y: auto;
          transition: width var(--duration-normal) var(--ease-default);
          flex-shrink: 0;
        }

        .dash-sidebar.collapsed {
          width: var(--sidebar-collapsed-width);
        }

        .dash-sidebar.collapsed .sidebar-label,
        .dash-sidebar.collapsed .sidebar-section-title {
          opacity: 0;
          width: 0;
          overflow: hidden;
          white-space: nowrap;
        }

        .sidebar-collapse-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: var(--radius-full);
          background: var(--bg);
          border: 1px solid var(--border);
          color: var(--text-tertiary);
          cursor: pointer;
          position: absolute;
          top: var(--space-6);
          right: -14px;
          z-index: 10;
          box-shadow: var(--shadow-sm);
          transition: all var(--duration-fast) var(--ease-default);
        }

        .sidebar-collapse-btn:hover {
          background: var(--bg-tertiary);
          color: var(--text);
        }

        .sidebar-nav-section {
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
          flex: 1;
        }

        .sidebar-section-title {
          font-size: var(--text-xs);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: var(--text-tertiary);
          padding: var(--space-2) var(--space-3);
          margin-bottom: var(--space-1);
          margin-top: var(--space-4);
        }

        .sidebar-section-title:first-child {
          margin-top: 0;
        }

        .sidebar-item {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-2-5) var(--space-3);
          border-radius: var(--radius-md);
          color: var(--text-secondary);
          font-size: var(--text-sm);
          font-weight: 500;
          transition: all var(--duration-fast) var(--ease-default);
          white-space: nowrap;
          cursor: pointer;
        }

        .sidebar-item:hover {
          background: var(--bg-tertiary);
          color: var(--text);
        }

        .sidebar-item.active {
          background: var(--primary-50);
          color: var(--primary);
        }

        body.dark-mode .sidebar-item.active,
        body.dark-theme .sidebar-item.active {
          background: rgba(99, 102, 241, 0.12);
        }

        .sidebar-item-icon {
          flex-shrink: 0;
          opacity: 0.7;
        }

        .sidebar-item.active .sidebar-item-icon {
          opacity: 1;
        }

        .sidebar-footer {
          padding-top: var(--space-4);
          border-top: 1px solid var(--border);
          margin-top: auto;
          display: flex;
          flex-direction: column;
          gap: var(--space-1);
        }

        .dash-main {
          flex: 1;
          min-width: 0;
          padding: var(--space-8);
          max-width: 100%;
        }

        .dash-main-inner {
          max-width: 1200px;
          margin: 0 auto;
        }

        /* Mobile overlay */
        .sidebar-overlay {
          display: none;
        }

        @media (max-width: 1024px) {
          .topbar-mobile-toggle {
            display: flex;
          }

          .dash-sidebar {
            position: fixed;
            top: var(--header-height);
            left: 0;
            bottom: 0;
            z-index: 900;
            transform: translateX(-100%);
            box-shadow: none;
            width: var(--sidebar-width) !important;
          }

          .dash-sidebar.mobile-open {
            transform: translateX(0);
            box-shadow: var(--shadow-xl);
          }

          .dash-sidebar.mobile-open .sidebar-label,
          .dash-sidebar.mobile-open .sidebar-section-title {
            opacity: 1 !important;
            width: auto !important;
          }

          .sidebar-overlay {
            display: block;
            position: fixed;
            inset: 0;
            top: var(--header-height);
            background: rgba(0, 0, 0, 0.3);
            z-index: 899;
            opacity: 0;
            visibility: hidden;
            transition: all var(--duration-normal) var(--ease-default);
          }

          .sidebar-overlay.visible {
            opacity: 1;
            visibility: visible;
          }

          .sidebar-collapse-btn {
            display: none;
          }

          .dash-main {
            padding: var(--space-4);
          }
        }

        @media (max-width: 640px) {
          .topbar-user-name,
          .topbar-user-role {
            display: none;
          }
          .dash-main {
            padding: var(--space-4) var(--space-3);
          }
        }
      `}</style>

      <div className="dashboard-layout">
        {/* Top Bar */}
        <header className="dashboard-topbar">
          <button
            className="topbar-mobile-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            {sidebarOpen ? <XIcon size={20} /> : <MenuIcon size={20} />}
          </button>

          <Link
            to={role === 'owner' ? '/owner/dashboard' : '/student/dashboard'}
            className="topbar-brand"
          >
            <div className="topbar-brand-icon">
              <HomeIcon size={18} />
            </div>
            <span className="topbar-brand-text">HostelHub</span>
          </Link>

          <div className="topbar-spacer" />

          <div className="topbar-actions">
            <button
              className="btn btn-ghost btn-icon"
              onClick={toggleTheme}
              aria-label="Toggle theme"
            >
              {isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}
            </button>

            <div className="topbar-user">
              <div className="avatar avatar-sm">
                {userName.charAt(0).toUpperCase()}
              </div>
              <div>
                <div className="topbar-user-name">{userName}</div>
                <div className="topbar-user-role">{role}</div>
              </div>
            </div>
          </div>
        </header>

        {/* Body: Sidebar + Main */}
        <div className="dashboard-body">
          {/* Mobile Overlay */}
          <div
            className={`sidebar-overlay ${sidebarOpen ? 'visible' : ''}`}
            onClick={() => setSidebarOpen(false)}
          />

          {/* Sidebar */}
          <aside className={`dash-sidebar ${collapsed ? 'collapsed' : ''} ${sidebarOpen ? 'mobile-open' : ''}`}>
            <div className="sidebar-collapse-btn hide-mobile" onClick={() => setCollapsed(!collapsed)}>
              {collapsed ? <ChevronRightIcon size={14} /> : <ChevronLeftIcon size={14} />}
            </div>

            <div className="sidebar-nav-section">
              <div className="sidebar-section-title">
                <span className="sidebar-label">Navigation</span>
              </div>
              {navLinks.map(({ to, label, icon: NavIcon }) => (
                <Link
                  key={to}
                  to={to}
                  className={`sidebar-item ${isActive(to) ? 'active' : ''}`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <NavIcon size={18} className="sidebar-item-icon" />
                  <span className="sidebar-label">{label}</span>
                </Link>
              ))}
            </div>

            <div className="sidebar-footer">
              <button className="sidebar-item" onClick={toggleTheme}>
                {isDark ? <SunIcon size={18} className="sidebar-item-icon" /> : <MoonIcon size={18} className="sidebar-item-icon" />}
                <span className="sidebar-label">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
              </button>
              <button className="sidebar-item" onClick={handleLogout} style={{ color: 'var(--danger)' }}>
                <LogOutIcon size={18} className="sidebar-item-icon" />
                <span className="sidebar-label">Logout</span>
              </button>
            </div>
          </aside>

          {/* Main Content */}
          <main className="dash-main">
            <div className="dash-main-inner page-enter">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}
