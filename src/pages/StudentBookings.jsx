import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI, bookingsAPI, reviewsAPI } from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import {
  HomeIcon, ClipboardIcon, HourglassIcon, CheckCircleIcon,
  XCircleIcon, BuildingIcon, SearchIcon
} from '../components/Icons';

export default function StudentBookings() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [myReviews, setMyReviews] = useState([]);
  const [activeTab, setActiveTab] = useState('active');

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setIsLoading(true);
    const [userResult, bookingsResult, reviewsResult] = await Promise.all([
      authAPI.getMe(),
      bookingsAPI.getMyBookings(),
      reviewsAPI.getMyReviews()
    ]);

    if (!userResult.success) {
      navigate('/login');
      return;
    }
    if (bookingsResult.success) setBookings(bookingsResult.bookings);
    if (reviewsResult.success) setMyReviews(reviewsResult.reviews || []);
    setIsLoading(false);
  }

  async function handleCancelBooking(bookingId) {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    const result = await bookingsAPI.cancel(bookingId);
    if (result.success) fetchData();
    else alert(result.message || 'Failed to cancel booking');
  }

  function hasReviewedBooking(bookingId) {
    return myReviews.some(r => r.booking === bookingId || r.booking?._id === bookingId);
  }

  async function submitReview(booking, rating, comment, isComplaint) {
    const result = await reviewsAPI.create({
      hostelId: booking.hostel._id || booking.hostel,
      bookingId: booking._id,
      rating,
      comment,
      isComplaint
    });
    if (result.success) {
      alert('Review submitted successfully!');
      fetchData();
    } else {
      alert(result.message || 'Failed to submit review');
    }
  }

  const activeBooking = bookings.find(b => b.status === 'active' || b.status === 'approved');
  const pendingBookings = bookings.filter(b => b.status === 'pending');
  const pastBookings = bookings.filter(b => ['rejected', 'cancelled', 'completed'].includes(b.status));

  const tabs = [
    { id: 'active', label: 'Current Stay', count: activeBooking ? 1 : 0, icon: HomeIcon },
    { id: 'pending', label: 'Pending', count: pendingBookings.length, icon: HourglassIcon },
    { id: 'history', label: 'History', count: pastBookings.length, icon: ClipboardIcon },
  ];

  if (isLoading) {
    return (
      <DashboardLayout role="student">
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 'var(--space-4)' }}>
          <div className="spinner spinner-lg" />
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Loading bookings...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <style>{`
        .bookings-container {
          max-width: var(--max-width);
          margin: 0 auto;
          padding: var(--space-8) var(--space-6);
        }
        .bookings-header {
          margin-bottom: var(--space-8);
        }
        .bookings-title {
          font-size: var(--text-3xl);
          font-weight: 700;
          letter-spacing: var(--tracking-tighter);
          margin-bottom: var(--space-2);
        }
        .bookings-subtitle {
          color: var(--text-secondary);
          font-size: var(--text-base);
        }
        .tabs {
          display: flex;
          gap: var(--space-1);
          margin-bottom: var(--space-6);
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          padding: var(--space-1);
        }
        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-3) var(--space-4);
          font-size: var(--text-sm);
          font-weight: 500;
          color: var(--text-secondary);
          background: transparent;
          border: none;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all var(--duration-fast) var(--ease-default);
        }
        .tab-btn:hover {
          color: var(--text);
          background: var(--bg-tertiary);
        }
        .tab-btn.active {
          color: white;
          background: var(--primary);
          box-shadow: var(--shadow-sm);
        }
        .tab-count {
          background: rgba(255,255,255,0.2);
          padding: 0.125rem 0.5rem;
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 600;
        }
        .tab-btn:not(.active) .tab-count {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }
        .booking-card {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          overflow: hidden;
          margin-bottom: var(--space-4);
          transition: all var(--duration-fast) var(--ease-default);
        }
        .booking-card:hover {
          box-shadow: var(--shadow-md);
        }
        .booking-card-active {
          border-color: var(--primary);
          border-width: 2px;
        }
        .booking-card-header {
          padding: var(--space-5) var(--space-6);
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border-light);
        }
        .booking-card-title {
          font-size: var(--text-lg);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .booking-card-body {
          padding: var(--space-6);
        }
        .booking-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
          gap: var(--space-5);
        }
        .booking-field label {
          display: block;
          font-size: var(--text-xs);
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: var(--text-tertiary);
          font-weight: 500;
          margin-bottom: var(--space-1);
        }
        .booking-field-value {
          font-size: var(--text-base);
          font-weight: 600;
        }
        .booking-field-value.rent {
          color: var(--success);
        }
        .booking-actions {
          display: flex;
          gap: var(--space-3);
          margin-top: var(--space-5);
          padding-top: var(--space-5);
          border-top: 1px solid var(--border-light);
          flex-wrap: wrap;
        }
        .empty-tab {
          text-align: center;
          padding: var(--space-16) var(--space-8);
        }
        .empty-tab-icon {
          width: 64px;
          height: 64px;
          margin: 0 auto var(--space-5);
          border-radius: var(--radius-xl);
          background: var(--bg-tertiary);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--text-tertiary);
        }
        .empty-tab-title {
          font-size: var(--text-xl);
          font-weight: 600;
          margin-bottom: var(--space-2);
        }
        .empty-tab-text {
          color: var(--text-secondary);
          font-size: var(--text-sm);
          max-width: 360px;
          margin: 0 auto var(--space-5);
        }
        .status-pill {
          display: inline-flex;
          align-items: center;
          gap: var(--space-1-5);
          padding: 0.375rem 0.875rem;
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.02em;
        }
        .status-active, .status-approved {
          background: var(--success-light);
          color: var(--success-dark);
        }
        body.dark-mode .status-active, body.dark-mode .status-approved {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
        }
        .status-pending {
          background: rgba(251, 191, 36, 0.12);
          color: #b45309;
        }
        body.dark-mode .status-pending {
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
        }
        .status-rejected {
          background: rgba(239, 68, 68, 0.1);
          color: #dc2626;
        }
        body.dark-mode .status-rejected {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
        }
        .status-cancelled {
          background: var(--bg-tertiary);
          color: var(--text-secondary);
        }
        .status-completed {
          background: rgba(16, 185, 129, 0.1);
          color: #059669;
        }
        body.dark-mode .status-completed {
          background: rgba(16, 185, 129, 0.15);
          color: #34d399;
        }
        .history-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-5) var(--space-6);
          border-bottom: 1px solid var(--border-light);
          gap: var(--space-4);
          flex-wrap: wrap;
          transition: background var(--duration-fast);
        }
        .history-item:last-child { border-bottom: none; }
        .history-item:hover { background: var(--bg-tertiary); }
        .history-item-info h4 {
          font-size: var(--text-base);
          font-weight: 600;
          margin-bottom: var(--space-1);
        }
        .history-item-meta {
          display: flex;
          gap: var(--space-3);
          font-size: var(--text-sm);
          color: var(--text-secondary);
          flex-wrap: wrap;
        }
        @media (max-width: 640px) {
          .bookings-container { padding: var(--space-5) var(--space-4); }
          .bookings-title { font-size: var(--text-2xl); }
          .tabs { flex-direction: column; }
          .booking-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>

      <div className="bookings-container">
        <div className="bookings-header">
          <h1 className="bookings-title">My Bookings</h1>
          <p className="bookings-subtitle">Manage your hostel bookings and requests</p>
        </div>

        {/* Tabs */}
        <div className="tabs">
          {tabs.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <tab.icon size={16} />
              {tab.label}
              <span className="tab-count">{tab.count}</span>
            </button>
          ))}
        </div>

        {/* Active Tab */}
        {activeTab === 'active' && (
          activeBooking ? (
            <div className="booking-card booking-card-active">
              <div className="booking-card-header">
                <div className="booking-card-title">
                  <HomeIcon size={20} />
                  Your Current Stay
                </div>
                <span className={`status-pill status-${activeBooking.status}`}>
                  {activeBooking.status}
                </span>
              </div>
              <div className="booking-card-body">
                <div className="booking-grid">
                  <div className="booking-field">
                    <label>Hostel</label>
                    <div className="booking-field-value">{activeBooking.hostel?.name || 'N/A'}</div>
                  </div>
                  <div className="booking-field">
                    <label>Location</label>
                    <div className="booking-field-value">{activeBooking.hostel?.city || 'N/A'}</div>
                  </div>
                  <div className="booking-field">
                    <label>Room Type</label>
                    <div className="booking-field-value" style={{ textTransform: 'capitalize' }}>{activeBooking.roomType} Sharing</div>
                  </div>
                  <div className="booking-field">
                    <label>Room Number</label>
                    <div className="booking-field-value">#{activeBooking.roomNumber || 'TBD'}</div>
                  </div>
                  <div className="booking-field">
                    <label>Monthly Rent</label>
                    <div className="booking-field-value rent">₹{activeBooking.rent?.toLocaleString() || 'N/A'}</div>
                  </div>
                  {activeBooking.durationType && activeBooking.durationType !== 'month' || activeBooking.durationValue > 1 ? (
                    <>
                      <div className="booking-field">
                        <label>Duration</label>
                        <div className="booking-field-value">
                          {activeBooking.durationValue || 1} {activeBooking.durationType === 'day' ? 'Day' : activeBooking.durationType === 'week' ? 'Week' : 'Month'}{(activeBooking.durationValue || 1) !== 1 ? 's' : ''}
                        </div>
                      </div>
                      <div className="booking-field">
                        <label>Total Price</label>
                        <div className="booking-field-value rent">₹{activeBooking.totalPrice?.toLocaleString() || 'N/A'}</div>
                      </div>
                    </>
                  ) : null}
                  <div className="booking-field">
                    <label>Check-in</label>
                    <div className="booking-field-value">
                      {activeBooking.checkInDate
                        ? new Date(activeBooking.checkInDate).toLocaleDateString()
                        : 'Pending'}
                    </div>
                  </div>
                </div>
                <div className="booking-actions">
                  <button onClick={() => handleCancelBooking(activeBooking._id)} className="btn btn-danger btn-sm">
                    Cancel Booking
                  </button>
                  <Link to={`/hostel/${activeBooking.hostel?._id || activeBooking.hostel}`} className="btn btn-outline btn-sm">
                    View Hostel
                  </Link>
                </div>

                {/* Review Section */}
                {(activeBooking.status === 'approved' || activeBooking.status === 'active') && (
                  <div style={{ marginTop: 'var(--space-6)', paddingTop: 'var(--space-6)', borderTop: '1px solid var(--border-light)' }}>
                    {hasReviewedBooking(activeBooking._id) ? (
                      <div style={{
                        background: 'var(--bg-tertiary)',
                        padding: 'var(--space-4)',
                        borderRadius: 'var(--radius-md)',
                        textAlign: 'center'
                      }}>
                        <span style={{ color: 'var(--success)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 'var(--space-2)', justifyContent: 'center' }}>
                          <CheckCircleIcon size={16} /> You've already reviewed this stay
                        </span>
                      </div>
                    ) : (
                      <ReviewForm
                        onSubmit={(rating, comment, isComplaint) => submitReview(activeBooking, rating, comment, isComplaint)}
                      />
                    )}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="booking-card">
              <div className="empty-tab">
                <div className="empty-tab-icon"><HomeIcon size={28} /></div>
                <div className="empty-tab-title">No Active Booking</div>
                <p className="empty-tab-text">You don't have an active stay right now. Browse hostels to find your next home.</p>
                <Link to="/search" className="btn btn-primary">
                  <SearchIcon size={16} /> Browse Hostels
                </Link>
              </div>
            </div>
          )
        )}

        {/* Pending Tab */}
        {activeTab === 'pending' && (
          pendingBookings.length > 0 ? (
            <div className="booking-card">
              {pendingBookings.map(booking => (
                <div key={booking._id} className="history-item">
                  <div className="history-item-info">
                    <h4>{booking.hostel?.name || 'Hostel'}</h4>
                    <div className="history-item-meta">
                      <span style={{ textTransform: 'capitalize' }}>{booking.roomType} Sharing</span>
                      <span>•</span>
                      <span>
                        {booking.durationValue || 1} {booking.durationType === 'day' ? 'Day' : booking.durationType === 'week' ? 'Week' : 'Month'}{(booking.durationValue || 1) !== 1 ? 's' : ''}
                        {booking.totalPrice ? ` · ₹${booking.totalPrice.toLocaleString()}` : ''}
                      </span>
                      <span>•</span>
                      <span>Applied {new Date(booking.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
                    <span className="status-pill status-pending">Pending</span>
                    <button onClick={() => handleCancelBooking(booking._id)} className="btn btn-danger btn-sm">
                      Cancel
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="booking-card">
              <div className="empty-tab">
                <div className="empty-tab-icon"><HourglassIcon size={28} /></div>
                <div className="empty-tab-title">No Pending Requests</div>
                <p className="empty-tab-text">All your booking requests have been processed.</p>
              </div>
            </div>
          )
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          pastBookings.length > 0 ? (
            <div className="booking-card">
              {pastBookings.map(booking => (
                <div key={booking._id} className="history-item">
                  <div className="history-item-info">
                    <h4>{booking.hostel?.name || 'Hostel'}</h4>
                    <div className="history-item-meta">
                      <span style={{ textTransform: 'capitalize' }}>{booking.roomType} Sharing</span>
                      <span>•</span>
                      <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <span className={`status-pill status-${booking.status}`}>
                    {booking.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="booking-card">
              <div className="empty-tab">
                <div className="empty-tab-icon"><ClipboardIcon size={28} /></div>
                <div className="empty-tab-title">No Booking History</div>
                <p className="empty-tab-text">Your past bookings will appear here.</p>
              </div>
            </div>
          )
        )}
      </div>
    </DashboardLayout>
  );
}

// Review Form Component
function ReviewForm({ onSubmit }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isComplaint, setIsComplaint] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (rating === 0) { alert('Please select a rating'); return; }
    setSubmitting(true);
    await onSubmit(rating, comment, isComplaint);
    setSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit}>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>
          Rate Your Experience
        </label>
        <div style={{ display: 'flex', gap: 'var(--space-1)', alignItems: 'center' }}>
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              style={{
                background: 'none',
                border: 'none',
                fontSize: '1.75rem',
                cursor: 'pointer',
                color: star <= (hoverRating || rating) ? '#fbbf24' : 'var(--border)',
                transition: 'transform 0.1s, color 0.2s',
                transform: star <= (hoverRating || rating) ? 'scale(1.1)' : 'scale(1)',
                padding: '0.25rem'
              }}
            >
              ★
            </button>
          ))}
          <span style={{ marginLeft: 'var(--space-2)', fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            {rating > 0 ? `${rating}/5` : 'Select rating'}
          </span>
        </div>
      </div>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={{ display: 'block', marginBottom: 'var(--space-2)', fontWeight: 500, fontSize: 'var(--text-sm)' }}>
          Your Review (Optional)
        </label>
        <textarea
          className="form-input"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience..."
          style={{ width: '100%', minHeight: 100, resize: 'vertical' }}
        />
      </div>
      <div style={{ marginBottom: 'var(--space-4)' }}>
        <label style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', cursor: 'pointer', fontSize: 'var(--text-sm)' }}>
          <input type="checkbox" checked={isComplaint} onChange={(e) => setIsComplaint(e.target.checked)} style={{ width: '1rem', height: '1rem' }} />
          Mark as a complaint (owner will be notified)
        </label>
      </div>
      <button type="submit" disabled={submitting || rating === 0} className="btn btn-primary btn-sm">
        {submitting ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  );
}
