import { useState, useEffect } from 'react';
import DashboardLayout from '../components/DashboardLayout';
import toast from 'react-hot-toast';

export default function OwnerRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    type: 'technical_issue',
    priority: 'medium',
    subject: '',
    description: ''
  });

  const [replyText, setReplyText] = useState({});
  const [replyAttachment, setReplyAttachment] = useState({});
  const [replying, setReplying] = useState(false);

  const handleFileChange = (reqId, e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) return toast.error('File size must be less than 5MB');
      const reader = new FileReader();
      reader.onloadend = () => {
        setReplyAttachment(prev => ({ ...prev, [reqId]: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const submitReply = async (reqId) => {
    const response = replyText[reqId];
    const attachment = replyAttachment[reqId];
    if (!response && !attachment) return toast.error('Please provide a message or attachment');

    setReplying(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:5000/api/owner-requests/my/${reqId}/reply`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ response, attachment })
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Info sent to admin');
        setReplyText(prev => { const n = {...prev}; delete n[reqId]; return n; });
        setReplyAttachment(prev => { const n = {...prev}; delete n[reqId]; return n; });
        fetchRequests();
      } else {
        toast.error(data.message || 'Failed to send info');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setReplying(false);
    }
  };

  const TYPES = [
    { value: 'complaint', label: 'Platform Complaint' },
    { value: 'technical_issue', label: 'Technical Issue' },
    { value: 'billing', label: 'Billing / Payments' },
    { value: 'feature_request', label: 'Feature Request' },
    { value: 'other', label: 'Other' }
  ];

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/owner-requests/my', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setRequests(data.requests || []);
    } catch (e) {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:5000/api/owner-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Request submitted to admin');
        setShowForm(false);
        setFormData({ type: 'technical_issue', priority: 'medium', subject: '', description: '' });
        fetchRequests();
      } else {
        toast.error(data.message || 'Submission failed');
      }
    } catch {
      toast.error('Network error');
    } finally {
      setSubmitting(false);
    }
  };

  const statusColors = {
    open: { bg: 'rgba(251, 191, 36, 0.15)', text: '#f59e0b', border: 'rgba(251, 191, 36, 0.3)' },
    in_progress: { bg: 'rgba(59, 130, 246, 0.15)', text: '#3b82f6', border: 'rgba(59, 130, 246, 0.3)' },
    resolved: { bg: 'rgba(34, 197, 94, 0.15)', text: '#22c55e', border: 'rgba(34, 197, 94, 0.3)' },
    rejected: { bg: 'rgba(239, 68, 68, 0.15)', text: '#ef4444', border: 'rgba(239, 68, 68, 0.3)' },
  };

  return (
    <DashboardLayout>
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: 800, margin: 0 }}>Admin Support</h1>
            <p style={{ color: 'var(--text-secondary)', margin: '0.25rem 0 0' }}>Raise issues, billing queries, or feature requests direct to HostelHub Admins</p>
          </div>
          <button 
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '0.6rem 1.25rem', background: 'var(--primary)', color: 'white',
              border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(108,99,255,0.3)', transition: 'all 0.2s'
            }}
          >
            {showForm ? 'Cancel' : '+ New Request'}
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleSubmit} style={{
            background: 'var(--bg)', padding: '1.5rem', borderRadius: '12px',
            border: '1px solid var(--border)', marginBottom: '2rem',
            animation: 'fadeIn 0.3s ease'
          }}>
            <h2 style={{ margin: '0 0 1rem', fontSize: '1.25rem' }}>Create Request</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Type</label>
                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                  {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Priority</label>
                <select value={formData.priority} onChange={e => setFormData({...formData, priority: e.target.value})} style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Subject</label>
              <input type="text" required value={formData.subject} onChange={e => setFormData({...formData, subject: e.target.value})} placeholder="Brief summary of your request" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)' }} />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem', color: 'var(--text-secondary)' }}>Description</label>
              <textarea required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} placeholder="Provide full details..." rows="4" style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical' }} />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button disabled={submitting} type="submit" style={{ padding: '0.6rem 1.5rem', background: 'var(--primary)', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', opacity: submitting ? 0.7 : 1 }}>
                {submitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </form>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {loading ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>Loading...</div>
          ) : requests.length === 0 ? (
            <div style={{ padding: '3rem', textAlign: 'center', background: 'var(--bg)', borderRadius: '12px', border: '1px dashed var(--border)' }}>
              <span style={{ fontSize: '2rem' }}>📥</span>
              <h3 style={{ margin: '1rem 0 0.5rem' }}>No Requests Found</h3>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>You haven't submitted any requests to admins yet.</p>
            </div>
          ) : (
            requests.map(r => {
              const sc = statusColors[r.status] || statusColors.open;
              return (
                <div key={r._id} style={{ background: 'var(--bg)', borderRadius: '12px', padding: '1.25rem', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: sc.text }}></div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text)' }}>{r.subject}</h3>
                    <span style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, padding: '4px 10px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase' }}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
                    <span>Type: {TYPES.find(t => t.value === r.type)?.label || r.type}</span>
                    <span>Priority: {r.priority}</span>
                    <span>{new Date(r.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: '0 0 1rem', fontSize: '0.9rem', color: 'var(--text)', lineHeight: 1.5 }}>{r.description}</p>
                  
                  {r.adminResponse && (
                    <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--primary)' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Admin Response</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{r.adminResponse}</div>
                      {r.resolvedAt && (
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                          Resolved on {new Date(r.resolvedAt).toLocaleString()}
                        </div>
                      )}
                    </div>
                  )}
                  {r.ownerResponse && (
                    <div style={{ background: 'var(--bg-tertiary)', padding: '1rem', borderRadius: '8px', borderLeft: '3px solid var(--text-secondary)', marginTop: '0.75rem' }}>
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Your Reply</div>
                      <div style={{ fontSize: '0.9rem', color: 'var(--text)' }}>{r.ownerResponse}</div>
                      {r.ownerAttachment && (
                        <div style={{ marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Attachment attached ✅</span>
                          {r.ownerAttachment.startsWith('data:image') && (
                            <img src={r.ownerAttachment} alt="attachment" style={{ display: 'block', maxWidth: '200px', marginTop: '0.5rem', borderRadius: '4px' }} />
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {r.status === 'in_progress' && !r.ownerResponse && (
                    <div style={{ background: 'rgba(59, 130, 246, 0.05)', padding: '1rem', borderRadius: '8px', marginTop: '1rem', border: '1px solid rgba(59, 130, 246, 0.2)' }}>
                      <h4 style={{ margin: '0 0 0.75rem', fontSize: '0.9rem', color: '#3b82f6' }}>Admin Requested Action / Info</h4>
                      <textarea
                        value={replyText[r._id] || ''}
                        onChange={e => setReplyText(prev => ({ ...prev, [r._id]: e.target.value }))}
                        placeholder="Type your response here..."
                        style={{ width: '100%', padding: '0.65rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg)', color: 'var(--text)', resize: 'vertical', minHeight: '60px', marginBottom: '0.75rem' }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <input type="file" id={`file-${r._id}`} style={{ display: 'none' }} onChange={(e) => handleFileChange(r._id, e)} />
                          <label htmlFor={`file-${r._id}`} style={{ fontSize: '0.8rem', cursor: 'pointer', padding: '0.4rem 0.8rem', background: 'var(--bg-tertiary)', borderRadius: '4px', border: '1px solid var(--border)' }}>
                            {replyAttachment[r._id] ? 'Attachment Added ✓' : '📎 Attach File'}
                          </label>
                        </div>
                        <button 
                          onClick={() => submitReply(r._id)} 
                          disabled={replying}
                          style={{ padding: '0.5rem 1rem', background: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', opacity: replying ? 0.7 : 1 }}
                        >
                          {replying ? 'Sending...' : 'Send Info'}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
