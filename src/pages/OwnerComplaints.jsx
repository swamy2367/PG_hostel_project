import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast';
import DashboardLayout from '../components/DashboardLayout';
import { TicketIcon, CheckCircleIcon } from '../components/Icons';

const CATEGORIES = [
  { value: 'maintenance', label: 'Maintenance' },
  { value: 'cleanliness', label: 'Cleanliness' },
  { value: 'food', label: 'Food' },
  { value: 'wifi_internet', label: 'WiFi/Internet' },
  { value: 'water_supply', label: 'Water Supply' },
  { value: 'electricity', label: 'Electricity' },
  { value: 'security', label: 'Security' },
  { value: 'noise', label: 'Noise' },
  { value: 'roommate', label: 'Roommate' },
  { value: 'staff_behavior', label: 'Staff Behavior' },
  { value: 'billing', label: 'Billing' },
  { value: 'amenities', label: 'Amenities' },
  { value: 'other', label: 'Other' }
];

const PRIORITIES = [
  { value: 'low', label: 'Low', color: '#6b7280' },
  { value: 'medium', label: 'Medium', color: '#f59e0b' },
  { value: 'high', label: 'High', color: '#ef4444' },
  { value: 'urgent', label: 'Urgent', color: '#dc2626' }
];

export default function OwnerComplaints() {
  const [complaints, setComplaints] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ open: 0, in_progress: 0, resolved: 0, closed: 0, escalated: 0 });
  const [filters, setFilters] = useState({ status: 'all', hostel: 'all', priority: 'all' });
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [responseText, setResponseText] = useState('');
  const [resolutionText, setResolutionText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showEscalate, setShowEscalate] = useState(false);
  const [escalateReason, setEscalateReason] = useState('other');
  const [escalateNote, setEscalateNote] = useState('');

  useEffect(() => {
    fetchData();
  }, []);


  const fetchData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Fetch complaints and hostels in parallel
      const [complaintsRes, hostelsRes, statsRes] = await Promise.all([
        fetch('http://localhost:5000/api/complaints/owner/all', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/hostels/owner/my', {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch('http://localhost:5000/api/complaints/owner/stats', {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const complaintsData = await complaintsRes.json();
      const hostelsData = await hostelsRes.json();
      const statsData = await statsRes.json();

      if (complaintsData.success) {
        setComplaints(complaintsData.complaints);
      }
      if (hostelsData.success) {
        setHostels(hostelsData.hostels);
      }
      if (statsData.success) {
        setStats(statsData.stats);
      }
    } catch (error) {
      console.error('Fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async () => {
    if (!selectedComplaint || !responseText.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/complaints/owner/${selectedComplaint._id}/respond`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ response: responseText })
      });
      const data = await res.json();
      
      if (data.success) {
        setResponseText('');
        fetchData();
        setSelectedComplaint({ ...selectedComplaint, ownerResponse: responseText, status: 'in_progress' });
      }
    } catch (error) {
      toast.error('Failed to send response');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!selectedComplaint || !resolutionText.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/complaints/owner/${selectedComplaint._id}/resolve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ resolution: resolutionText })
      });
      const data = await res.json();
      
      if (data.success) {
        setResolutionText('');
        setSelectedComplaint(null);
        fetchData();
      }
    } catch (error) {
      toast.error('Failed to resolve complaint');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      open: { bg: 'rgba(251, 191, 36, 0.15)', text: '#f59e0b', border: 'rgba(251, 191, 36, 0.3)' },
      in_progress: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
      resolved: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
      closed: { bg: 'rgba(107, 114, 128, 0.15)', text: '#6b7280', border: 'rgba(107, 114, 128, 0.3)' },
      reopened: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
      escalated: { bg: 'rgba(168, 85, 247, 0.15)', text: '#a855f7', border: 'rgba(168, 85, 247, 0.3)' }
    };
    return colors[status] || colors.open;
  };

  const handleEscalate = async () => {
    if (!selectedComplaint) return;
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/complaints/owner/${selectedComplaint._id}/escalate`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ reason: escalateReason, note: escalateNote })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Complaint escalated to admin');
        setShowEscalate(false);
        setEscalateNote('');
        setSelectedComplaint(null);
        fetchData();
      } else {
        toast.error(data.message || 'Failed to escalate');
      }
    } catch (error) {
      toast.error('Failed to escalate');
    } finally {
      setSubmitting(false);
    }
  };

  const getPriorityColor = (priority) => {
    const p = PRIORITIES.find(pr => pr.value === priority);
    return p?.color || '#6b7280';
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const filteredComplaints = complaints.filter(c => {
    if (filters.status !== 'all' && c.status !== filters.status) return false;
    if (filters.hostel !== 'all' && (c.hostel?._id || c.hostel) !== filters.hostel) return false;
    if (filters.priority !== 'all' && c.priority !== filters.priority) return false;
    return true;
  });

  return (
    <DashboardLayout role="owner">

      <style>{`

        .owner-complaints-wrapper {
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
          transition: all 0.3s ease;
        }

        .light-theme { background: #ffffff; color: #111827; }
        .dark-theme { background: #0f172a; color: #f1f5f9; }

        .complaints-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 2rem;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-title {
          font-size: 1.75rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .page-subtitle {
          color: #6b7280;
          font-size: 0.9375rem;
        }

        .dark-theme .page-subtitle { color: #94a3b8; }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 2rem;
        }

        .stat-card {
          background: #f8fafc;
          padding: 1.25rem;
          border-radius: 0.75rem;
          border: 1px solid #e2e8f0;
          text-align: center;
          transition: all 0.2s;
        }

        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
        }

        .dark-theme .stat-card {
          background: #1e293b;
          border-color: #334155;
        }

        .stat-number {
          font-size: 2rem;
          font-weight: 700;
          line-height: 1;
          margin-bottom: 0.25rem;
        }

        .stat-label {
          font-size: 0.8125rem;
          color: #6b7280;
          font-weight: 500;
        }

        .dark-theme .stat-label { color: #94a3b8; }

        .stat-card.open .stat-number { color: #f59e0b; }
        .stat-card.in_progress .stat-number { color: #3b82f6; }
        .stat-card.resolved .stat-number { color: #22c55e; }
        .stat-card.closed .stat-number { color: #6b7280; }

        .filters-bar {
          display: flex;
          gap: 1rem;
          margin-bottom: 1.5rem;
          flex-wrap: wrap;
        }

        .filter-select {
          padding: 0.625rem 1rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          background: #ffffff;
          color: #111827;
          font-size: 0.875rem;
          min-width: 150px;
        }

        .dark-theme .filter-select {
          background: #1e293b;
          border-color: #334155;
          color: #f1f5f9;
        }

        .complaints-layout {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1.5rem;
        }

        .complaints-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: calc(100vh - 350px);
          overflow-y: auto;
        }

        .complaint-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 0.75rem;
          padding: 1rem 1.25rem;
          cursor: pointer;
          transition: all 0.2s;
        }

        .complaint-card:hover {
          border-color: #6366f1;
          box-shadow: 0 2px 8px rgba(99, 102, 241, 0.1);
        }

        .complaint-card.selected {
          border-color: #6366f1;
          background: rgba(99, 102, 241, 0.05);
        }

        .dark-theme .complaint-card {
          background: #1e293b;
          border-color: #334155;
        }

        .dark-theme .complaint-card.selected {
          background: rgba(99, 102, 241, 0.1);
        }

        .complaint-card-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 0.5rem;
        }

        .complaint-card-title {
          font-weight: 600;
          font-size: 0.9375rem;
          color: #111827;
        }

        .dark-theme .complaint-card-title { color: #f1f5f9; }

        .complaint-card-badges {
          display: flex;
          gap: 0.375rem;
        }

        .badge {
          padding: 0.1875rem 0.5rem;
          border-radius: 9999px;
          font-size: 0.6875rem;
          font-weight: 600;
          text-transform: uppercase;
        }

        .complaint-card-meta {
          font-size: 0.8125rem;
          color: #6b7280;
          display: flex;
          gap: 0.75rem;
          flex-wrap: wrap;
        }

        .dark-theme .complaint-card-meta { color: #94a3b8; }

        .complaint-card-student {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 0.5rem;
          font-size: 0.8125rem;
        }

        .student-avatar {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-size: 0.625rem;
          font-weight: 600;
        }

        .detail-panel {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.5rem;
          position: sticky;
          top: 2rem;
          max-height: calc(100vh - 300px);
          overflow-y: auto;
        }

        .dark-theme .detail-panel {
          background: #1e293b;
          border-color: #334155;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 1.25rem;
          padding-bottom: 1rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .dark-theme .detail-header { border-color: #334155; }

        .detail-title {
          font-size: 1.25rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .detail-section {
          margin-bottom: 1.25rem;
        }

        .detail-label {
          font-size: 0.75rem;
          font-weight: 600;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.5rem;
        }

        .dark-theme .detail-label { color: #94a3b8; }

        .detail-value {
          font-size: 0.9375rem;
          color: #111827;
          line-height: 1.6;
        }

        .dark-theme .detail-value { color: #e2e8f0; }

        .detail-student {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem;
          background: rgba(99, 102, 241, 0.05);
          border-radius: 0.5rem;
        }

        .student-avatar-lg {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: 600;
        }

        .student-info {
          flex: 1;
        }

        .student-name {
          font-weight: 600;
          margin-bottom: 0.125rem;
        }

        .student-email {
          font-size: 0.8125rem;
          color: #6b7280;
        }

        .dark-theme .student-email { color: #94a3b8; }

        .response-box {
          background: rgba(59, 130, 246, 0.05);
          border-left: 3px solid #3b82f6;
          padding: 0.75rem 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }

        .resolution-box {
          background: rgba(34, 197, 94, 0.05);
          border-left: 3px solid #22c55e;
          padding: 0.75rem 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
        }

        .action-form {
          margin-top: 1.5rem;
          padding-top: 1rem;
          border-top: 1px solid #e2e8f0;
        }

        .dark-theme .action-form { border-color: #334155; }

        .action-textarea {
          width: 100%;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          background: #ffffff;
          color: #111827;
          font-size: 0.9375rem;
          min-height: 100px;
          resize: vertical;
          margin-bottom: 0.75rem;
        }

        .dark-theme .action-textarea {
          background: #0f172a;
          border-color: #334155;
          color: #f1f5f9;
        }

        .action-buttons {
          display: flex;
          gap: 0.75rem;
        }

        .btn {
          padding: 0.625rem 1.25rem;
          border-radius: 0.5rem;
          font-weight: 500;
          font-size: 0.875rem;
          cursor: pointer;
          transition: all 0.2s;
          border: none;
        }

        .btn-primary {
          background: linear-gradient(135deg, #3b82f6, #1d4ed8);
          color: white;
        }

        .btn-primary:hover {
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .btn-success {
          background: linear-gradient(135deg, #22c55e, #16a34a);
          color: white;
        }

        .btn-success:hover {
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);
        }

        .btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .empty-state {
          text-align: center;
          padding: 3rem;
          color: #6b7280;
        }

        .empty-icon {
          font-size: 3rem;
          margin-bottom: 1rem;
        }

        .no-selection {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 100%;
          min-height: 300px;
          color: #6b7280;
        }

        .loading {
          display: flex;
          justify-content: center;
          align-items: center;
          min-height: 400px;
        }

        .spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #e2e8f0;
          border-top-color: #6366f1;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .feedback-box {
          background: rgba(251, 191, 36, 0.1);
          border-left: 3px solid #fbbf24;
          padding: 0.75rem 1rem;
          border-radius: 0 0.5rem 0.5rem 0;
          margin-top: 0.75rem;
        }

        .feedback-rating {
          color: #fbbf24;
          margin-bottom: 0.25rem;
        }

        @media (max-width: 1024px) {
          .complaints-layout {
            grid-template-columns: 1fr;
          }
          .detail-panel {
            position: relative;
            top: 0;
            max-height: none;
          }
        }

        @media (max-width: 768px) {
          .stats-grid {
            grid-template-columns: repeat(2, 1fr);
          }
          .filters-bar {
            flex-direction: column;
          }
          .filter-select {
            width: 100%;
          }
        }
      `}</style>

      <div className="complaints-container">
        <div className="page-header">
          <h1 className="page-title">Student Complaints</h1>
          <p className="page-subtitle">Manage and resolve student issues across your hostels</p>
        </div>

        <div className="stats-grid">
          <div className="stat-card open">
            <div className="stat-number">{stats.open || 0}</div>
            <div className="stat-label">Open</div>
          </div>
          <div className="stat-card in_progress">
            <div className="stat-number">{stats.in_progress || 0}</div>
            <div className="stat-label">In Progress</div>
          </div>
          <div className="stat-card resolved">
            <div className="stat-number">{stats.resolved || 0}</div>
            <div className="stat-label">Resolved</div>
          </div>
          <div className="stat-card closed">
            <div className="stat-number">{stats.closed || 0}</div>
            <div className="stat-label">Closed</div>
          </div>
        </div>

        <div className="filters-bar">
          <select 
            className="filter-select"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="all">All Status</option>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
            <option value="reopened">Reopened</option>
            <option value="escalated">Escalated</option>
          </select>

          <select 
            className="filter-select"
            value={filters.hostel}
            onChange={(e) => setFilters({ ...filters, hostel: e.target.value })}
          >
            <option value="all">All Hostels</option>
            {hostels.map(h => (
              <option key={h._id} value={h._id}>{h.name}</option>
            ))}
          </select>

          <select 
            className="filter-select"
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="all">All Priorities</option>
            {PRIORITIES.map(p => (
              <option key={p.value} value={p.value}>{p.label}</option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="loading">
            <div className="spinner"></div>
          </div>
        ) : (
          <div className="complaints-layout">
            <div className="complaints-list">
              {filteredComplaints.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon"><CheckCircleIcon size={28} /></div>
                  <div>No complaints found</div>
                </div>
              ) : (
                filteredComplaints.map(complaint => {
                  const statusColor = getStatusColor(complaint.status);
                  return (
                    <div 
                      key={complaint._id}
                      className={`complaint-card ${selectedComplaint?._id === complaint._id ? 'selected' : ''}`}
                      onClick={() => setSelectedComplaint(complaint)}
                    >
                      <div className="complaint-card-header">
                        <div className="complaint-card-title">{complaint.subject}</div>
                        <div className="complaint-card-badges">
                          <span 
                            className="badge"
                            style={{ 
                              background: `${getPriorityColor(complaint.priority)}15`,
                              color: getPriorityColor(complaint.priority)
                            }}
                          >
                            {complaint.priority}
                          </span>
                          <span 
                            className="badge"
                            style={{ 
                              background: statusColor.bg,
                              color: statusColor.text
                            }}
                          >
                            {complaint.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="complaint-card-meta">
                        <span>{CATEGORIES.find(c => c.value === complaint.category)?.label || complaint.category}</span>
                        <span>â€¢</span>
                        <span>{complaint.hostel?.name}</span>
                        <span>â€¢</span>
                        <span>{formatDate(complaint.createdAt)}</span>
                      </div>
                      <div className="complaint-card-student">
                        <div className="student-avatar">
                          {complaint.student?.name?.charAt(0)?.toUpperCase() || '?'}
                        </div>
                        <span>{complaint.student?.name || 'Unknown Student'}</span>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="detail-panel">
              {selectedComplaint ? (
                <>
                  <div className="detail-header">
                    <div>
                      <div className="detail-title">{selectedComplaint.subject}</div>
                      <div className="complaint-card-badges">
                        <span 
                          className="badge"
                          style={{ 
                            background: `${getPriorityColor(selectedComplaint.priority)}15`,
                            color: getPriorityColor(selectedComplaint.priority)
                          }}
                        >
                          {selectedComplaint.priority}
                        </span>
                        <span 
                          className="badge"
                          style={{ 
                            background: getStatusColor(selectedComplaint.status).bg,
                            color: getStatusColor(selectedComplaint.status).text
                          }}
                        >
                          {selectedComplaint.status.replace('_', ' ')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <div className="detail-label">Student</div>
                    <div className="detail-student">
                      <div className="student-avatar-lg">
                        {selectedComplaint.student?.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div className="student-info">
                        <div className="student-name">{selectedComplaint.student?.name || 'Unknown'}</div>
                        <div className="student-email">{selectedComplaint.student?.email || ''}</div>
                      </div>
                    </div>
                  </div>

                  <div className="detail-section">
                    <div className="detail-label">Category & Hostel</div>
                    <div className="detail-value">
                      {CATEGORIES.find(c => c.value === selectedComplaint.category)?.label || selectedComplaint.category}
                      {' '} at {selectedComplaint.hostel?.name}
                      {selectedComplaint.room && ` (Room #${selectedComplaint.room.roomNumber})`}
                    </div>
                  </div>

                  <div className="detail-section">
                    <div className="detail-label">Description</div>
                    <div className="detail-value">{selectedComplaint.description}</div>
                  </div>

                  <div className="detail-section">
                    <div className="detail-label">Submitted</div>
                    <div className="detail-value">{formatDate(selectedComplaint.createdAt)}</div>
                  </div>

                  {selectedComplaint.ownerResponse && (
                    <div className="detail-section">
                      <div className="detail-label">Your Response</div>
                      <div className="response-box">{selectedComplaint.ownerResponse}</div>
                    </div>
                  )}

                  {selectedComplaint.resolution && (
                    <div className="detail-section">
                      <div className="detail-label">Resolution</div>
                      <div className="resolution-box">{selectedComplaint.resolution}</div>
                    </div>
                  )}

                  {selectedComplaint.studentRating && (
                    <div className="detail-section">
                      <div className="detail-label">Student Feedback</div>
                      <div className="feedback-box">
                        <div className="feedback-rating">{'â˜…'.repeat(selectedComplaint.studentRating)}</div>
                        {selectedComplaint.studentFeedback && (
                          <div>{selectedComplaint.studentFeedback}</div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Form */}
                  {['open', 'in_progress', 'reopened'].includes(selectedComplaint.status) && (
                    <div className="action-form">
                      {!selectedComplaint.ownerResponse && (
                        <>
                          <div className="detail-label">Send Response</div>
                          <textarea
                            className="action-textarea"
                            placeholder="Write your response to the student..."
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                          />
                          <div className="action-buttons">
                            <button 
                              className="btn btn-primary"
                              onClick={handleRespond}
                              disabled={submitting || !responseText.trim()}
                            >
                              {submitting ? 'Sending...' : 'Send Response'}
                            </button>
                          </div>
                        </>
                      )}

                      {selectedComplaint.ownerResponse && (
                        <>
                          <div className="detail-label">Mark as Resolved</div>
                          <textarea
                            className="action-textarea"
                            placeholder="Describe how this issue was resolved..."
                            value={resolutionText}
                            onChange={(e) => setResolutionText(e.target.value)}
                          />
                          <div className="action-buttons">
                            <button 
                              className="btn btn-success"
                              onClick={handleResolve}
                              disabled={submitting || !resolutionText.trim()}
                            >
                              {submitting ? 'Resolving...' : 'Mark Resolved'}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Actions Area */}
                </>
              ) : (
                <div className="no-selection">
                  <div className="empty-state-icon" style={{ width: 64, height: 64, marginBottom: '1rem' }}><TicketIcon size={28} /></div>
                  <div>Select a complaint to view details</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Modals End */}
    </DashboardLayout>
  );
}
