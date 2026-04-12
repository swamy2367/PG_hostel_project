import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, bookingsAPI, hostelsAPI } from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import {
  SearchIcon, MapPinIcon, HomeIcon, ClipboardIcon, HourglassIcon,
  BuildingIcon, ArrowRightIcon, TicketIcon
} from '../components/Icons';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchCity, setSearchCity] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    setIsLoading(true);
    const [userResult, bookingsResult] = await Promise.all([
      authAPI.getMe(),
      bookingsAPI.getMyBookings(),
    ]);

    if (userResult.success) {
      setUser(userResult.user);
    } else {
      navigate('/login');
      return;
    }

    if (bookingsResult.success) {
      setBookings(bookingsResult.bookings);
    }

    setIsLoading(false);
  }

  function handleSearch(e) {
    e?.preventDefault();
    if (!searchCity.trim()) return;
    navigate(`/search?q=${encodeURIComponent(searchCity.trim())}`);
  }

  const activeBooking = bookings.find(b => b.status === 'active' || b.status === 'approved');
  const pendingCount = bookings.filter(b => b.status === 'pending').length;
  const historyCount = bookings.filter(b => ['rejected', 'cancelled', 'completed'].includes(b.status)).length;

  if (isLoading) {
    return (
      <DashboardLayout role="student">
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}>
          <div className="spinner spinner-lg" />
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Loading your dashboard...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <style>{`
        .dash-welcome {
          margin-bottom: var(--space-8);
        }
        .dash-welcome h1 {
          font-size: var(--text-3xl);
          font-weight: 700;
          letter-spacing: var(--tracking-tighter);
          margin-bottom: var(--space-1);
        }
        .dash-welcome p {
          color: var(--text-secondary);
          font-size: var(--text-base);
        }
        .dash-search-card {
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
          border-radius: var(--radius-xl);
          padding: var(--space-8);
          margin-bottom: var(--space-6);
          position: relative;
          overflow: hidden;
          color: white;
        }
        .dash-search-card::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 60%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .dash-search-card h2 {
          font-size: var(--text-xl);
          font-weight: 600;
          margin-bottom: var(--space-1);
          position: relative;
        }
        .dash-search-card p {
          opacity: 0.85;
          font-size: var(--text-sm);
          margin-bottom: var(--space-5);
          position: relative;
        }
        .dash-search-form {
          display: flex;
          gap: var(--space-3);
          position: relative;
        }
        .dash-search-input {
          flex: 1;
          padding: var(--space-3) var(--space-4);
          border-radius: var(--radius-lg);
          border: 2px solid rgba(255,255,255,0.3);
          background: rgba(255,255,255,0.15);
          color: white;
          font-size: var(--text-sm);
          backdrop-filter: blur(8px);
        }
        .dash-search-input::placeholder { color: rgba(255,255,255,0.7); }
        .dash-search-input:focus {
          outline: none;
          border-color: white;
          background: rgba(255,255,255,0.2);
        }
        .dash-search-btn {
          padding: var(--space-3) var(--space-5);
          background: white;
          color: var(--primary);
          border: none;
          border-radius: var(--radius-lg);
          font-weight: 600;
          font-size: var(--text-sm);
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: var(--space-2);
          transition: transform var(--duration-fast);
        }
        .dash-search-btn:hover { transform: translateY(-1px); }
        .stat-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: var(--space-4);
          margin-bottom: var(--space-6);
        }
        .stat-card {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          display: flex;
          align-items: center;
          gap: var(--space-4);
          transition: all var(--duration-fast) var(--ease-default);
          text-decoration: none;
          color: var(--text);
        }
        .stat-card:hover {
          border-color: var(--primary);
          box-shadow: var(--shadow-md);
          transform: translateY(-2px);
        }
        .stat-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .stat-icon-blue { background: rgba(99, 102, 241, 0.1); color: var(--primary); }
        body.dark-mode .stat-icon-blue { background: rgba(99, 102, 241, 0.15); }
        .stat-icon-amber { background: rgba(245, 158, 11, 0.1); color: #f59e0b; }
        body.dark-mode .stat-icon-amber { background: rgba(245, 158, 11, 0.15); }
        .stat-icon-green { background: rgba(16, 185, 129, 0.1); color: #10b981; }
        body.dark-mode .stat-icon-green { background: rgba(16, 185, 129, 0.15); }
        .stat-icon-red { background: rgba(239, 68, 68, 0.1); color: #ef4444; }
        body.dark-mode .stat-icon-red { background: rgba(239, 68, 68, 0.15); }
        .stat-info { flex: 1; }
        .stat-label {
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
        }
        .stat-value {
          font-size: var(--text-2xl);
          font-weight: 700;
          line-height: 1.2;
        }
        .stat-link {
          font-size: var(--text-xs);
          color: var(--primary);
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: var(--space-1);
        }
        .active-stay-card {
          background: var(--bg);
          border: 2px solid var(--primary);
          border-radius: var(--radius-xl);
          overflow: hidden;
        }
        .active-stay-header {
          padding: var(--space-5) var(--space-6);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-light);
        }
        .active-stay-title {
          font-size: var(--text-base);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .active-stay-body {
          padding: var(--space-6);
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: var(--space-5);
        }
        .stay-field label {
          display: block;
          font-size: var(--text-xs);
          color: var(--text-tertiary);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-weight: 500;
          margin-bottom: var(--space-1);
        }
        .stay-field-value {
          font-weight: 600;
        }
        .stay-field-value.rent {
          color: var(--success);
        }
        .active-stay-footer {
          padding: 0 var(--space-6) var(--space-5);
          display: flex;
          gap: var(--space-3);
        }
        @media (max-width: 640px) {
          .dash-search-form { flex-direction: column; }
          .stat-grid { grid-template-columns: 1fr 1fr; }
          .active-stay-body { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      {/* Welcome */}
      <div className="dash-welcome">
        <h1>Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
        <p>Here's what's happening with your account.</p>
      </div>

      {/* Search Card */}
      <div className="dash-search-card">
        <h2>Find Your Perfect Hostel</h2>
        <p>Search for hostels by city or name</p>
        <form className="dash-search-form" onSubmit={handleSearch}>
          <input
            type="text"
            className="dash-search-input"
            placeholder="Enter city name (e.g., Hyderabad, Bangalore...)"
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
          />
          <button type="submit" className="dash-search-btn">
            <SearchIcon size={16} />
            Search
          </button>
        </form>
      </div>

      {/* Quick Stats */}
      <div className="stat-grid">
        <Link to="/student/bookings" className="stat-card">
          <div className="stat-icon stat-icon-green">
            <HomeIcon size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Current Stay</div>
            <div className="stat-value">{activeBooking ? '1' : '—'}</div>
          </div>
          <div className="stat-link">View <ArrowRightIcon size={12} /></div>
        </Link>

        <Link to="/student/bookings" className="stat-card" onClick={() => {}}>
          <div className="stat-icon stat-icon-amber">
            <HourglassIcon size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Pending</div>
            <div className="stat-value">{pendingCount}</div>
          </div>
          <div className="stat-link">View <ArrowRightIcon size={12} /></div>
        </Link>

        <Link to="/student/bookings" className="stat-card">
          <div className="stat-icon stat-icon-blue">
            <ClipboardIcon size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">History</div>
            <div className="stat-value">{historyCount}</div>
          </div>
          <div className="stat-link">View <ArrowRightIcon size={12} /></div>
        </Link>

        <Link to="/student/complaints" className="stat-card">
          <div className="stat-icon stat-icon-red">
            <TicketIcon size={22} />
          </div>
          <div className="stat-info">
            <div className="stat-label">Complaints</div>
            <div className="stat-value">→</div>
          </div>
          <div className="stat-link">Manage <ArrowRightIcon size={12} /></div>
        </Link>
      </div>

      {/* Active Stay */}
      {activeBooking && (
        <div className="active-stay-card">
          <div className="active-stay-header">
            <div className="active-stay-title">
              <HomeIcon size={18} />
              Your Current Stay
            </div>
            <span className="badge badge-success" style={{ textTransform: 'capitalize' }}>
              {activeBooking.status}
            </span>
          </div>
          <div className="active-stay-body">
            <div className="stay-field">
              <label>Hostel</label>
              <div className="stay-field-value">{activeBooking.hostel?.name || 'N/A'}</div>
            </div>
            <div className="stay-field">
              <label>Location</label>
              <div className="stay-field-value">{activeBooking.hostel?.city || 'N/A'}</div>
            </div>
            <div className="stay-field">
              <label>Room Type</label>
              <div className="stay-field-value" style={{ textTransform: 'capitalize' }}>{activeBooking.roomType} Sharing</div>
            </div>
            <div className="stay-field">
              <label>Room</label>
              <div className="stay-field-value">#{activeBooking.roomNumber || 'TBD'}</div>
            </div>
            <div className="stay-field">
              <label>Monthly Rent</label>
              <div className="stay-field-value rent">₹{activeBooking.rent?.toLocaleString() || 'N/A'}</div>
            </div>
            <div className="stay-field">
              <label>Check-in</label>
              <div className="stay-field-value">{activeBooking.checkInDate ? new Date(activeBooking.checkInDate).toLocaleDateString() : 'Pending'}</div>
            </div>
          </div>
          <div className="active-stay-footer">
            <Link to="/student/bookings" className="btn btn-primary btn-sm">
              Manage Booking
            </Link>
            <Link to={`/hostel/${activeBooking.hostel?._id || activeBooking.hostel}`} className="btn btn-outline btn-sm">
              View Hostel
            </Link>
          </div>
        </div>
      )}

      {/* No bookings CTA */}
      {!activeBooking && pendingCount === 0 && (
        <div className="card" style={{ textAlign: 'center', padding: 'var(--space-12) var(--space-8)' }}>
          <div style={{
            width: 64, height: 64, margin: '0 auto var(--space-5)',
            borderRadius: 'var(--radius-xl)', background: 'var(--bg-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--text-tertiary)',
          }}>
            <BuildingIcon size={28} />
          </div>
          <h3 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>
            No Active Booking
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 400, margin: '0 auto var(--space-5)' }}>
            Use the search above or browse hostels to find your perfect accommodation.
          </p>
          <Link to="/search" className="btn btn-primary">
            <SearchIcon size={16} /> Browse Hostels
          </Link>
        </div>
      )}
    </DashboardLayout>
  );
}
