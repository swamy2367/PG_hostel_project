import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { io } from 'socket.io-client';
import { notificationAPI } from '../services/api';
import toast from 'react-hot-toast';

const SOCKET_URL = '';

// Bell SVG
function BellIcon({ size = 22 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return new Date(date).toLocaleDateString();
}

function typeIcon(type) {
  const icons = {
    complaint_raised: '🚨',
    complaint_update: '📝',
    complaint_resolved: '✅',
    complaint_escalated: '⚠️',
    complaint_admin_action: '🛡️',
    booking_new: '📋',
    booking_confirmed: '🎉',
    booking_rejected: '❌',
    payment_success: '💰',
    payment_refund: '💸',
    general: '📢',
  };
  return icons[type] || '🔔';
}

function typeColor(type) {
  if (type?.includes('complaint')) return '#6C63FF';
  if (type?.includes('booking')) return '#0891b2';
  if (type?.includes('payment')) return '#16a34a';
  return '#6366f1';
}

export default function NotificationBell() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);
  const socketRef = useRef(null);
  const navigate = useNavigate();

  // Close on outside click
  useEffect(() => {
    function onClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Connect socket + fetch initial
  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('adminToken');
    if (!token) return;

    // Fetch initial notifications
    fetchNotifications();

    // Connect Socket.io
    const socket = io(SOCKET_URL, { auth: { token }, transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('notification', (notif) => {
      setNotifications(prev => [notif, ...prev]);
      setUnreadCount(prev => prev + 1);
      // Toast
      toast(notif.title, {
        icon: typeIcon(notif.type),
        duration: 4000,
        style: { fontWeight: 600, fontSize: '0.88rem' },
      });
    });

    socket.on('connect_error', () => {
      // Silent fallback — will use polling
    });

    return () => { socket.disconnect(); };
  }, []);

  // Fetch from API
  async function fetchNotifications() {
    setLoading(true);
    const res = await notificationAPI.getAll();
    if (res.success) {
      setNotifications(res.notifications || []);
      setUnreadCount(res.unreadCount || 0);
    }
    setLoading(false);
  }

  // Mark single as read
  async function handleRead(notif) {
    if (!notif.isRead) {
      await notificationAPI.markRead(notif._id);
      setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
    setIsOpen(false);
    // Navigate based on type
    if (notif.relatedType === 'complaint' && notif.relatedId) {
      const role = localStorage.getItem('userRole');
      if (role === 'student') navigate('/student/complaints');
      else if (role === 'owner') navigate('/owner/complaints');
      else if (role === 'admin') navigate('/admin');
    } else if (notif.relatedType === 'booking') {
      const role = localStorage.getItem('userRole');
      if (role === 'student') navigate('/student/bookings');
      else if (role === 'owner') navigate('/owner/bookings');
    }
  }

  // Mark all as read
  async function handleMarkAllRead() {
    await notificationAPI.markAllRead();
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  return (
    <div ref={wrapperRef} className="notif-bell-wrap" style={{ position: 'relative' }}>
      <style>{`
        .notif-bell-btn {
          position: relative;
          background: none;
          border: none;
          color: var(--text-secondary);
          cursor: pointer;
          padding: 8px;
          border-radius: var(--radius-md);
          transition: all 0.2s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .notif-bell-btn:hover { color: var(--text); background: var(--bg-tertiary); }

        .notif-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          min-width: 18px;
          height: 18px;
          border-radius: 100px;
          background: #ef4444;
          color: white;
          font-size: 0.625rem;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0 5px;
          border: 2px solid var(--bg);
          animation: notifPop 0.3s ease;
        }

        @keyframes notifPop {
          0% { transform: scale(0); }
          50% { transform: scale(1.3); }
          100% { transform: scale(1); }
        }

        .notif-dropdown {
          position: absolute;
          top: calc(100% + 8px);
          right: -40px;
          width: 380px;
          max-height: 460px;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 16px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.15);
          z-index: 1000;
          overflow: hidden;
          animation: notifSlideIn 0.2s ease;
        }

        @media (max-width: 480px) {
          .notif-dropdown {
            position: fixed;
            top: 60px;
            left: 8px;
            right: 8px;
            width: auto;
          }
        }

        @keyframes notifSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .notif-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-light);
        }

        .notif-header-title {
          font-size: 0.95rem;
          font-weight: 800;
          color: var(--text);
        }

        .notif-mark-all {
          font-size: 0.75rem;
          color: var(--primary);
          font-weight: 600;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 6px;
          font-family: inherit;
          transition: background 0.15s;
        }
        .notif-mark-all:hover { background: var(--bg-tertiary); }

        .notif-list {
          max-height: 380px;
          overflow-y: auto;
        }

        .notif-item {
          display: flex;
          gap: 12px;
          padding: 14px 20px;
          cursor: pointer;
          transition: background 0.15s;
          border-bottom: 1px solid var(--border-light);
          position: relative;
        }
        .notif-item:last-child { border-bottom: none; }
        .notif-item:hover { background: var(--bg-tertiary); }
        .notif-item.unread { background: rgba(108,99,255,0.04); }
        .notif-item.unread::before {
          content: '';
          position: absolute;
          left: 8px;
          top: 50%;
          transform: translateY(-50%);
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #6C63FF;
        }

        .notif-item-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          flex-shrink: 0;
        }

        .notif-item-content { flex: 1; min-width: 0; }

        .notif-item-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text);
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .notif-item-msg {
          font-size: 0.75rem;
          color: var(--text-secondary);
          line-height: 1.4;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .notif-item-time {
          font-size: 0.68rem;
          color: var(--text-tertiary);
          margin-top: 4px;
          font-weight: 500;
        }

        .notif-empty {
          padding: 40px 20px;
          text-align: center;
          color: var(--text-tertiary);
          font-size: 0.85rem;
        }
        .notif-empty-icon {
          font-size: 2rem;
          margin-bottom: 8px;
          opacity: 0.5;
        }
      `}</style>

      <button className="notif-bell-btn" onClick={() => { setIsOpen(!isOpen); if (!isOpen) fetchNotifications(); }}>
        <BellIcon />
        {unreadCount > 0 && <span className="notif-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <div className="notif-dropdown">
          <div className="notif-header">
            <span className="notif-header-title">Notifications</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={handleMarkAllRead}>Mark all read</button>
            )}
          </div>

          <div className="notif-list">
            {loading && notifications.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty-icon">⏳</div>
                Loading...
              </div>
            ) : notifications.length === 0 ? (
              <div className="notif-empty">
                <div className="notif-empty-icon">🔔</div>
                No notifications yet
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n._id}
                  className={`notif-item ${!n.isRead ? 'unread' : ''}`}
                  onClick={() => handleRead(n)}
                >
                  <div className="notif-item-icon" style={{ background: `${typeColor(n.type)}12`, color: typeColor(n.type) }}>
                    {typeIcon(n.type)}
                  </div>
                  <div className="notif-item-content">
                    <div className="notif-item-title">{n.title}</div>
                    <div className="notif-item-msg">{n.message}</div>
                    <div className="notif-item-time">{timeAgo(n.createdAt)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
