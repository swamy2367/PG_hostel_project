import { useState, useEffect } from 'react'
import toast from 'react-hot-toast';

const CATEGORIES = [
  { value: 'maintenance', label: 'Maintenance', desc: 'Plumbing, electrical, furniture' },
  { value: 'cleanliness', label: 'Cleanliness', desc: 'Room/common area cleaning' },
  { value: 'food', label: 'Food', desc: 'Mess/food quality issues' },
  { value: 'wifi_internet', label: 'WiFi/Internet', desc: 'Connectivity problems' },
  { value: 'water_supply', label: 'Water Supply', desc: 'Water availability' },
  { value: 'electricity', label: 'Electricity', desc: 'Power issues' },
  { value: 'security', label: 'Security', desc: 'Safety concerns' },
  { value: 'noise', label: 'Noise', desc: 'Disturbance issues' },
  { value: 'roommate', label: 'Roommate', desc: 'Roommate conflicts' },
  { value: 'staff_behavior', label: 'Staff Behavior', desc: 'Staff conduct' },
  { value: 'billing', label: 'Billing', desc: 'Payment disputes' },
  { value: 'amenities', label: 'Amenities', desc: 'Missing/broken amenities' },
  { value: 'other', label: 'Other', desc: 'Other issues' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#6b7280' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'urgent', label: 'Urgent', color: '#dc2626' }
];

export default function StudentComplaints({ activeBooking }) {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    category: '',
    priority: 'medium',
    subject: '',
    description: ''
  });
  const [feedbackComplaint, setFeedbackComplaint] = useState(null);
  const [feedbackData, setFeedbackData] = useState({ rating: 0, feedback: '' });
  
  const currentUserStr = localStorage.getItem('userData');
  const currentUserId = currentUserStr ? JSON.parse(currentUserStr)._id || JSON.parse(currentUserStr).id : null;

  useEffect(() => {
    fetchComplaints();
  }, [activeBooking]);

  const fetchComplaints = async () => {
    try {
      const token = localStorage.getItem('token');
      const hostelId = activeBooking?.hostel?._id || activeBooking?.hostel;
      const url = hostelId 
        ? `http://localhost:5000/api/complaints/hostel/${hostelId}`
        : 'http://localhost:5000/api/complaints/my';
        
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setComplaints(data.complaints);
      }
    } catch (error) {
      console.error('Fetch complaints error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!activeBooking) {
      toast.error('You need an active booking to raise a complaint');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/complaints', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          hostelId: activeBooking.hostel._id || activeBooking.hostel,
          ...formData
        })
      });
      const data = await res.json();
      
      if (data.success) {
        setShowForm(false);
        setFormData({ category: '', priority: 'medium', subject: '', description: '' });
        fetchComplaints();
      } else {
        toast.error(data.message || 'Failed to submit complaint');
      }
    } catch (error) {
      toast.error('Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedback = async () => {
    if (!feedbackComplaint || feedbackData.rating === 0) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/complaints/${feedbackComplaint._id}/feedback`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(feedbackData)
      });
      const data = await res.json();
      
      if (data.success) {
        setFeedbackComplaint(null);
        setFeedbackData({ rating: 0, feedback: '' });
        fetchComplaints();
      }
    } catch (error) {
      toast.error('Failed to submit feedback');
    }
  };

  const handleReopen = async (complaintId) => {
    const reason = prompt('Why are you reopening this complaint?');
    if (!reason) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/complaints/${complaintId}/reopen`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      
      if (data.success) {
        fetchComplaints();
      }
    } catch (error) {
      toast.error('Failed to reopen complaint');
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: { bg: 'rgba(251, 191, 36, 0.15)', text: '#f59e0b', border: 'rgba(251, 191, 36, 0.3)' },
      in_progress: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
      resolved: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
      closed: { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' },
      reopened: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' }
    };
    return colors[status] || colors.open;
  };

  const getPriorityColor = (priority) => {
    const p = PRIORITIES.find(pr => pr.value === priority);
    return p?.color || '#6b7280';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <>
      <style>{`
        .complaints-section {
          margin-top: 2rem;
        }

        .complaints-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.25rem;
        }

        .complaints-title {
          font-size: 1.25rem;
          font-weight: 600;
          color: var(--text);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .complaints-count {
          background: var(--bg-tertiary);
          padding: 0.25rem 0.75rem;
          border-radius: 9999px;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
        }

        .new-complaint-btn {
          padding: 0.625rem 1.25rem;
          background: linear-gradient(135deg, var(--primary), var(--primary-700));
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .new-complaint-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
        }

        .new-complaint-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .complaint-form-card {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 1rem;
          padding: 1.5rem;
          margin-bottom: 1.5rem;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .form-title {
          font-size: 1.125rem;
          font-weight: 600;
          margin-bottom: 1.25rem;
          color: var(--text);
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
          margin-bottom: 1rem;
        }

        .form-group {
          margin-bottom: 1rem;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: var(--text-secondary);
          margin-bottom: 0.5rem;
        }

        .form-select, .form-input, .form-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid var(--border);
          border-radius: 0.5rem;
          background: var(--bg-secondary);
          color: var(--text);
          font-size: 0.9375rem;
        }

        .form-select:focus, .form-input:focus, .form-textarea:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }

        .form-textarea {
          min-height: 100px;
          resize: vertical;
        }

        .category-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(140px, 1fr));
          gap: 0.5rem;
        }

        .category-option {
          padding: 0.75rem;
          border: 2px solid var(--border);
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s;
          text-align: center;
        }

        .category-option:hover {
          border-color: var(--primary);
        }

        .category-option.selected {
          border-color: var(--primary);
          background: rgba(99, 102, 241, 0.1);
        }

        .category-option-icon {
          font-size: 1.25rem;
          margin-bottom: 0.25rem;
        }

        .category-option-label {
          font-size: 0.8125rem;
          font-weight: 500;
          color: var(--text);
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 1.25rem;
        }

        .btn-cancel {
          padding: 0.625rem 1.25rem;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-submit {
          padding: 0.625rem 1.5rem;
          background: linear-gradient(135deg, var(--primary), var(--primary-700));
          color: white;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
        }

        .btn-submit:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .complaints-list {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .complaint-card {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: 0.75rem;
          padding: 1.25rem;
          transition: all 0.2s;
        }

        .complaint-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
        }

        .complaint-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.75rem;
        }

        .complaint-title {
          font-weight: 600;
          color: var(--text);
          margin-bottom: 0.25rem;
        }

        .complaint-meta {
          display: flex;
          gap: 0.75rem;
          font-size: 0.8125rem;
          color: var(--text-tertiary);
        }

        .complaint-badges {
          display: flex;
          gap: 0.5rem;
        }

        .status-badge, .priority-badge {
          padding: 0.25rem 0.625rem;
          border-radius: 9999px;
          font-size: 0.75rem;
          font-weight: 600;
          text-transform: capitalize;
        }

        .complaint-body {
          color: var(--text-secondary);
          font-size: 0.9375rem;
          line-height: 1.6;
          margin-bottom: 0.75rem;
        }

        .complaint-response {
          background: rgba(59, 130, 246, 0.05);
          border-left: 3px solid #3b82f6;
          padding: 0.75rem 1rem;
          margin-top: 0.75rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }

        .response-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #3b82f6;
          margin-bottom: 0.25rem;
        }

        .response-text {
          font-size: 0.875rem;
          color: var(--text-secondary);
        }

        .complaint-resolution {
          background: rgba(34, 197, 94, 0.05);
          border-left: 3px solid #22c55e;
          padding: 0.75rem 1rem;
          margin-top: 0.75rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }

        .resolution-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #22c55e;
          margin-bottom: 0.25rem;
        }

        .complaint-actions {
          display: flex;
          gap: 0.5rem;
          margin-top: 1rem;
          padding-top: 0.75rem;
          border-top: 1px solid var(--border);
        }

        .action-btn {
          padding: 0.5rem 1rem;
          border-radius: 0.375rem;
          font-size: 0.8125rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .action-btn.feedback {
          background: rgba(34, 197, 94, 0.1);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .action-btn.reopen {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .empty-complaints {
          text-align: center;
          padding: 3rem 2rem;
          color: var(--text-secondary);
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .feedback-modal {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .feedback-content {
          background: var(--bg);
          border-radius: 1rem;
          padding: 1.5rem;
          max-width: 400px;
          width: 90%;
        }

        .rating-stars {
          display: flex;
          gap: 0.25rem;
          margin-bottom: 1rem;
        }

        .star-btn {
          background: none;
          border: none;
          font-size: 2rem;
          cursor: pointer;
          color: var(--border);
          transition: all 0.15s;
        }

        .star-btn.active {
          color: #fbbf24;
          transform: scale(1.1);
        }

        @media (max-width: 640px) {
          .form-row {
            grid-template-columns: 1fr;
          }
          .complaints-header {
            flex-direction: column;
            gap: 1rem;
            align-items: stretch;
          }
          .category-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
      `}</style>

      <div className="complaints-section">
        <div className="complaints-header">
          <div className="complaints-title">
            {activeBooking ? 'Hostel Complaints' : 'My Complaints'}
            <span className="complaints-count">{complaints.length}</span>
          </div>
          <button 
            className="new-complaint-btn"
            onClick={() => setShowForm(true)}
            disabled={!activeBooking}
            title={!activeBooking ? 'You need an active booking to raise a complaint' : ''}
          >
            + Raise Issue
          </button>
        </div>

        {showForm && (
          <div className="complaint-form-card">
            <div className="form-title">Raise a New Complaint</div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Category *</label>
                <div className="category-grid">
                  {CATEGORIES.map(cat => (
                    <div
                      key={cat.value}
                      className={`category-option ${formData.category === cat.value ? 'selected' : ''}`}
                      onClick={() => setFormData({ ...formData, category: cat.value })}
                    >
                      <div className="category-option-icon">{cat.desc.charAt(0)}</div>
                      <div className="category-option-label">{cat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Subject *</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Brief description of the issue"
                    value={formData.subject}
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    required
                    maxLength={200}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Priority</label>
                  <select
                    className="form-select"
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    {PRIORITIES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description *</label>
                <textarea
                  className="form-textarea"
                  placeholder="Describe the issue in detail..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  maxLength={2000}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowForm(false)}>
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-submit"
                  disabled={submitting || !formData.category || !formData.subject || !formData.description}
                >
                  {submitting ? 'Submitting...' : 'Submit Complaint'}
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div className="empty-complaints">Loading complaints...</div>
        ) : complaints.length === 0 ? (
          <div className="empty-complaints">
            <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: 'var(--text-tertiary)' }}>✓</div>
            <div>No complaints yet</div>
            <div style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              {activeBooking ? 'Having an issue? Click "Raise Issue" above' : 'Book a hostel first to raise issues'}
            </div>
          </div>
        ) : (
          <div className="complaints-list">
            {complaints.map(complaint => {
              const statusColor = getStatusColor(complaint.status);
              return (
                <div key={complaint._id} className="complaint-card">
                  <div className="complaint-header">
                    <div>
                      <div className="complaint-title">{complaint.subject}</div>
                      <div className="complaint-meta">
                        <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                          {complaint.student?._id === currentUserId || complaint.student === currentUserId
                            ? 'By You'
                            : `By ${complaint.student?.name || 'Fellow Student'}`}
                        </span>
                        <span>•</span>
                        <span>{CATEGORIES.find(c => c.value === complaint.category)?.label || complaint.category}</span>
                        <span>•</span>
                        <span>{complaint.hostel?.name}</span>
                        <span>•</span>
                        <span>{formatDate(complaint.createdAt)}</span>
                      </div>
                    </div>
                    <div className="complaint-badges">
                      <span 
                        className="priority-badge"
                        style={{ 
                          background: `${getPriorityColor(complaint.priority)}15`,
                          color: getPriorityColor(complaint.priority),
                          border: `1px solid ${getPriorityColor(complaint.priority)}30`
                        }}
                      >
                        {complaint.priority}
                      </span>
                      <span 
                        className="status-badge"
                        style={{ 
                          background: statusColor.bg,
                          color: statusColor.text,
                          border: `1px solid ${statusColor.border}`
                        }}
                      >
                        {complaint.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="complaint-body">{complaint.description}</div>

                  {complaint.ownerResponse && (
                    <div className="complaint-response">
                      <div className="response-label">Owner's Response</div>
                      <div className="response-text">{complaint.ownerResponse}</div>
                    </div>
                  )}

                  {complaint.resolution && (
                    <div className="complaint-resolution">
                      <div className="resolution-label">Resolution</div>
                      <div className="response-text">{complaint.resolution}</div>
                    </div>
                  )}

                  {complaint.status === 'resolved' && (complaint.student?._id === currentUserId || complaint.student === currentUserId) && !complaint.studentRating && (
                    <div className="complaint-actions">
                      <button 
                        className="action-btn feedback"
                        onClick={() => setFeedbackComplaint(complaint)}
                      >
                        ✓ Give Feedback
                      </button>
                      <button 
                        className="action-btn reopen"
                        onClick={() => handleReopen(complaint._id)}
                      >
                        ↺ Reopen
                      </button>
                    </div>
                  )}

                  {complaint.studentRating && (
                    <div style={{ 
                      marginTop: '0.75rem', 
                      fontSize: '0.875rem', 
                      color: 'var(--text-secondary)' 
                    }}>
                      Your rating: {'★'.repeat(complaint.studentRating)}
                      {complaint.studentFeedback && ` - "${complaint.studentFeedback}"`}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Feedback Modal */}
        {feedbackComplaint && (
          <div className="feedback-modal" onClick={() => setFeedbackComplaint(null)}>
            <div className="feedback-content" onClick={e => e.stopPropagation()}>
              <div className="form-title">Rate Resolution</div>
              <p style={{ marginBottom: '1rem', color: 'var(--text-secondary)', fontSize: '0.9375rem' }}>
                How satisfied are you with how this issue was resolved?
              </p>
              <div className="rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    className={`star-btn ${star <= feedbackData.rating ? 'active' : ''}`}
                    onClick={() => setFeedbackData({ ...feedbackData, rating: star })}
                  >
                    ★
                  </button>
                ))}
              </div>
              <textarea
                className="form-textarea"
                placeholder="Any additional feedback (optional)..."
                value={feedbackData.feedback}
                onChange={(e) => setFeedbackData({ ...feedbackData, feedback: e.target.value })}
                style={{ marginBottom: '1rem' }}
              />
              <div className="form-actions">
                <button className="btn-cancel" onClick={() => setFeedbackComplaint(null)}>
                  Cancel
                </button>
                <button 
                  className="btn-submit"
                  onClick={handleFeedback}
                  disabled={feedbackData.rating === 0}
                >
                  Submit Feedback
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
