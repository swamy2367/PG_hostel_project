import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { adminAPI } from '../services/api';
import ConfirmModal from '../components/ConfirmModal';
import {
  BarChart2Icon, CreditCardIcon, ClipboardIcon, RefreshIcon,
  GraduationCapIcon, BuildingIcon, HomeIcon, ListIcon,
  SunIcon, MoonIcon, LogOutIcon, ChevronLeftIcon, ChevronRightIcon,
  SearchIcon, ShieldCheckIcon, CheckCircleIcon, XCircleIcon,
  DollarSignIcon, HourglassIcon, UsersIcon, AlertTriangleIcon,
  KeyIcon, TrendingUpIcon, WalletIcon, CheckIcon, HashIcon
} from '../components/Icons';
import NotificationBell from '../components/NotificationBell';

const TABS = [
  { id: 'overview', label: 'Overview', Icon: BarChart2Icon },
  { id: 'payments', label: 'Payments', Icon: CreditCardIcon },
  { id: 'bookings', label: 'Bookings', Icon: ClipboardIcon },
  { id: 'refunds', label: 'Refunds', Icon: RefreshIcon },
  { id: 'students', label: 'Students', Icon: GraduationCapIcon },
  { id: 'owners', label: 'Owners', Icon: BuildingIcon },
  { id: 'hostels', label: 'Hostels', Icon: HomeIcon },
  { id: 'transactions', label: 'Transactions', Icon: ListIcon },
  { id: 'owner_requests', label: 'Owner Requests', Icon: AlertTriangleIcon },
];

const STATUS_COLORS = {
  escrow: '#f59e0b', released: '#22c55e', refunded: '#ef4444', pending: '#6b7280', failed: '#dc2626',
  pending_confirmation: '#f59e0b', confirmed: '#22c55e', approved: '#3b82f6', active: '#06b6d4',
  cancelled: '#6b7280', completed: '#10b981', rejected: '#ef4444', switched: '#8b5cf6',
};

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [refunds, setRefunds] = useState([]);
  const [students, setStudents] = useState([]);
  const [owners, setOwners] = useState([]);
  const [hostels, setHostels] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [ownerRequests, setOwnerRequests] = useState([]);
  const [requestActionText, setRequestActionText] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [paymentFilter, setPaymentFilter] = useState('');
  const [bookingFilter, setBookingFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const dark = savedTheme === 'dark';
    setIsDark(dark);
    document.body.classList.toggle('dark-mode', dark);

    const role = localStorage.getItem('userRole');
    if (role !== 'admin') {
      navigate('/admin/login');
      return;
    }
    loadTab('overview');
  }, []);

  async function loadTab(tab) {
    setIsLoading(true);
    try {
      if (tab === 'overview') {
        const result = await adminAPI.getDashboard();
        if (result.success) setStats(result.stats);
      } else if (tab === 'payments') {
        const result = await adminAPI.getPayments(paymentFilter);
        if (result.success) setPayments(result.payments || []);
      } else if (tab === 'bookings') {
        const result = await adminAPI.getBookings(bookingFilter);
        if (result.success) setBookings(result.bookings || []);
      } else if (tab === 'refunds') {
        const result = await adminAPI.getRefunds();
        if (result.success) setRefunds(result.refunds || []);
      } else if (tab === 'students') {
        const result = await adminAPI.getStudents();
        if (result.success) setStudents(result.students || []);
      } else if (tab === 'owners') {
        const result = await adminAPI.getOwners();
        if (result.success) setOwners(result.owners || []);
      } else if (tab === 'hostels') {
        const result = await adminAPI.getHostels();
        if (result.success) setHostels(result.hostels || []);
      } else if (tab === 'transactions') {
        const result = await adminAPI.getTransactions();
        if (result.success) setTransactions(result.transactions || []);
      } else if (tab === 'owner_requests') {
        const token = localStorage.getItem('adminToken');
        const res = await fetch('/api/owner-requests/admin', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (data.success) setOwnerRequests(data.requests || []);
      }
    } catch (err) {
      console.error('Load tab error:', err);
    }
    setIsLoading(false);
  }

  useEffect(() => { loadTab(activeTab); }, [activeTab, paymentFilter, bookingFilter]);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    localStorage.setItem('theme', next ? 'dark' : 'light');
    document.body.classList.toggle('dark-mode', next);
  }

  function logout() {
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    navigate('/admin/login');
  }

  const [confirmAction, setConfirmAction] = useState(null);

  async function handleReleasePayment(paymentId) {
    setConfirmAction({
      title: 'Release Payment',
      message: 'Release this escrow payment to the hostel owner?',
      confirmText: 'Release',
      confirmColor: '#22c55e',
      onConfirm: async () => {
        setConfirmAction(null);
        const result = await adminAPI.releasePayment(paymentId);
        if (result.success) { toast.success('Payment released'); loadTab('payments'); }
        else toast.error(result.message);
      }
    });
  }

  async function handleBlockUser(userId, role, currentlyActive) {
    const action = currentlyActive ? 'block' : 'unblock';
    setConfirmAction({
      title: `${action.charAt(0).toUpperCase() + action.slice(1)} User`,
      message: `${action.charAt(0).toUpperCase() + action.slice(1)} this ${role}?`,
      confirmText: action.charAt(0).toUpperCase() + action.slice(1),
      confirmColor: currentlyActive ? '#ef4444' : '#22c55e',
      onConfirm: async () => {
        setConfirmAction(null);
        const result = await adminAPI.blockUser(userId, role, currentlyActive);
        if (result.success) { toast.success(`User ${action}ed`); loadTab(role === 'student' ? 'students' : 'owners'); }
        else toast.error(result.message);
      }
    });
  }

  async function handleToggleHostel(hostelId) {
    const result = await adminAPI.toggleHostel(hostelId);
    if (result.success) { toast.success('Hostel updated'); loadTab('hostels'); }
    else toast.error(result.message);
  }

  function StatusBadge({ status }) {
    const color = STATUS_COLORS[status] || '#6b7280';
    return (
      <span style={{
        display: 'inline-block', padding: '4px 10px', borderRadius: '20px',
        fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em',
        background: `${color}18`, color, border: `1px solid ${color}40`,
      }}>{status?.replace(/_/g, ' ')}</span>
    );
  }

  async function handleOwnerRequestAction(requestId, action) {
    const response = requestActionText[requestId] || '';
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/owner-requests/admin/${requestId}/action`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ action, response })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Request ${action}`);
        setRequestActionText(prev => { const n = {...prev}; delete n[requestId]; return n; });
        loadTab('owner_requests');
      } else {
        toast.error(data.message || 'Action failed');
      }
    } catch (error) {
      toast.error('Failed to process action');
    }
  }

  // ── RENDER ──────────────────────────────────────────────────────────
  return (
    <>
      <style>{adminStyles}</style>
      <div className="adm-layout">
        {/* Sidebar */}
        <aside className={`adm-sidebar ${sidebarOpen ? '' : 'collapsed'}`}>
          <div className="adm-sidebar-header">
            <div className="adm-logo">
              <ShieldCheckIcon size={22} style={{ color: 'var(--adm-primary)' }} />
              {sidebarOpen && <span className="adm-logo-text">HostelHub Admin</span>}
            </div>
            <button className="adm-toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <ChevronLeftIcon size={14} /> : <ChevronRightIcon size={14} />}
            </button>
          </div>
          <nav className="adm-nav">
            {TABS.map(tab => (
              <button
                key={tab.id}
                className={`adm-nav-item ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => { setActiveTab(tab.id); setSearchTerm(''); }}
              >
                <span className="adm-nav-icon"><tab.Icon size={18} /></span>
                {sidebarOpen && <span className="adm-nav-label">{tab.label}</span>}
              </button>
            ))}
          </nav>
          <div className="adm-sidebar-footer">
            <button className="adm-nav-item" onClick={toggleTheme}>
              <span className="adm-nav-icon">{isDark ? <SunIcon size={18} /> : <MoonIcon size={18} />}</span>
              {sidebarOpen && <span className="adm-nav-label">{isDark ? 'Light' : 'Dark'} Mode</span>}
            </button>
            <button className="adm-nav-item logout" onClick={logout}>
              <span className="adm-nav-icon"><LogOutIcon size={18} /></span>
              {sidebarOpen && <span className="adm-nav-label">Logout</span>}
            </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="adm-main">
          <div className="adm-header">
            <h1 className="adm-page-title">
              {(() => {
                const tab = TABS.find(t => t.id === activeTab);
                return tab ? <><tab.Icon size={24} style={{ marginRight: 8, verticalAlign: 'middle' }} /> {tab.label}</> : '';
              })()}
            </h1>
            {['payments', 'bookings', 'students', 'owners', 'hostels', 'transactions'].includes(activeTab) && (
              <div className="adm-search-wrap">
                <SearchIcon size={16} />
                <input
                  className="adm-search"
                  placeholder={`Search ${activeTab}...`}
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            )}
            <NotificationBell />
          </div>

          {isLoading ? (
            <div className="adm-loader"><div className="adm-spinner" /></div>
          ) : (
            <div className="adm-content">
              {/* ── OVERVIEW TAB ── */}
              {activeTab === 'overview' && stats && (
                <>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--adm-text-sec)', marginBottom: 14 }}>Platform Earnings</h3>
                  <div className="adm-grid-4" style={{ marginBottom: 28 }}>
                    {[
                      { label: 'Total Earnings', value: `₹${(stats.totalEarnings || 0).toLocaleString()}`, Icon: DollarSignIcon, color: '#22c55e' },
                      { label: 'Commission Revenue', value: `₹${(stats.commissionRevenue || 0).toLocaleString()}`, Icon: TrendingUpIcon, color: '#3b82f6' },
                      { label: 'Listing Fee Revenue', value: `₹${(stats.subscriptionRevenue || 0).toLocaleString()}`, Icon: CreditCardIcon, color: '#8b5cf6' },
                      { label: 'Monthly Earnings', value: `₹${(stats.monthlyEarnings || 0).toLocaleString()}`, Icon: WalletIcon, color: '#f59e0b' },
                      { label: 'Paid Owners', value: stats.activeSubscriptions || 0, Icon: ShieldCheckIcon, color: '#06b6d4' },
                    ].map((card, i) => (
                      <div key={i} className="adm-stat-card" style={{ borderLeft: `4px solid ${card.color}` }}>
                        <div className="adm-stat-icon" style={{ color: card.color }}>
                          <card.Icon size={28} />
                        </div>
                        <div>
                          <div className="adm-stat-value">{card.value}</div>
                          <div className="adm-stat-label">{card.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <h3 style={{ fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--adm-text-sec)', marginBottom: 14 }}>Platform Overview</h3>
                  <div className="adm-grid-4">
                    {[
                      { label: 'Total Bookings', value: stats.totalBookings, Icon: ClipboardIcon, color: '#3b82f6' },
                      { label: 'Total Revenue', value: `₹${(stats.totalRevenue || 0).toLocaleString()}`, Icon: TrendingUpIcon, color: '#22c55e' },
                      { label: 'In Escrow', value: `₹${(stats.escrowAmount || 0).toLocaleString()}`, Icon: WalletIcon, color: '#f59e0b' },
                      { label: 'Pending Confirmations', value: stats.pendingConfirmations, Icon: HourglassIcon, color: '#8b5cf6' },
                      { label: 'Confirmed', value: stats.confirmedBookings, Icon: CheckCircleIcon, color: '#10b981' },
                      { label: 'Refunded', value: stats.refundedBookings, Icon: RefreshIcon, color: '#ef4444' },
                      { label: 'Students', value: stats.totalStudents, Icon: GraduationCapIcon, color: '#06b6d4' },
                      { label: 'Owners', value: stats.totalOwners, Icon: BuildingIcon, color: '#ec4899' },
                      { label: 'Hostels', value: stats.totalHostels, Icon: HomeIcon, color: '#14b8a6' },
                      { label: 'Refund Requests', value: stats.refundRequests, Icon: AlertTriangleIcon, color: '#f97316' },
                    ].map((card, i) => (
                      <div key={i} className="adm-stat-card" style={{ borderLeft: `4px solid ${card.color}` }}>
                        <div className="adm-stat-icon" style={{ color: card.color }}>
                          <card.Icon size={28} />
                        </div>
                        <div>
                          <div className="adm-stat-value">{card.value}</div>
                          <div className="adm-stat-label">{card.label}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {/* ── PAYMENTS TAB ── */}
              {activeTab === 'payments' && (
                <>
                  <div className="adm-filters">
                    {['', 'escrow', 'released', 'refunded', 'pending', 'failed'].map(f => (
                      <button key={f} className={`adm-filter-btn ${paymentFilter === f ? 'active' : ''}`}
                        onClick={() => setPaymentFilter(f)}>
                        {f || 'All'}
                      </button>
                    ))}
                  </div>
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead>
                        <tr><th>Transaction ID</th><th>Student</th><th>Hostel</th><th>Amount</th><th>Status</th><th>Date</th><th>Action</th></tr>
                      </thead>
                      <tbody>
                        {payments.filter(p => !searchTerm || p.transactionId?.toLowerCase().includes(searchTerm.toLowerCase()) || p.student?.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                          <tr key={p._id}>
                            <td><code className="adm-code">{p.transactionId}</code></td>
                            <td>{p.student?.name || '—'}<br /><small style={{ color: 'var(--adm-text-sec)' }}>{p.student?.email}</small></td>
                            <td>{p.hostel?.name || '—'}</td>
                            <td style={{ fontWeight: 700 }}>₹{p.amount?.toLocaleString()}</td>
                            <td><StatusBadge status={p.status} /></td>
                            <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                            <td>
                              {p.status === 'escrow' && (
                                <button className="adm-action-btn release" onClick={() => handleReleasePayment(p._id)}>
                                  <CheckIcon size={12} /> Release
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                        {payments.length === 0 && <tr><td colSpan="7" className="adm-empty">No payments found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ── BOOKINGS TAB ── */}
              {activeTab === 'bookings' && (
                <>
                  <div className="adm-filters">
                    {['', 'pending', 'approved', 'pending_confirmation', 'confirmed', 'active', 'refunded', 'switched', 'cancelled', 'completed'].map(f => (
                      <button key={f} className={`adm-filter-btn ${bookingFilter === f ? 'active' : ''}`}
                        onClick={() => setBookingFilter(f)}>
                        {(f || 'All').replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                  <div className="adm-table-wrap">
                    <table className="adm-table">
                      <thead>
                        <tr><th>Student</th><th>Hostel</th><th>Room</th><th>Amount</th><th>Status</th><th>Paid</th><th>Date</th></tr>
                      </thead>
                      <tbody>
                        {bookings.filter(b => !searchTerm || b.student?.name?.toLowerCase().includes(searchTerm.toLowerCase())).map(b => (
                          <tr key={b._id}>
                            <td>{b.student?.name || '—'}<br /><small style={{ color: 'var(--adm-text-sec)' }}>{b.student?.email}</small></td>
                            <td>{b.hostel?.name || '—'}</td>
                            <td>{b.roomType} #{b.roomNumber}</td>
                            <td style={{ fontWeight: 700 }}>₹{(b.totalPrice || b.rent)?.toLocaleString()}</td>
                            <td><StatusBadge status={b.status} /></td>
                            <td>{b.isPaid ? <CheckCircleIcon size={16} style={{ color: '#22c55e' }} /> : <XCircleIcon size={16} style={{ color: '#ef4444' }} />}</td>
                            <td>{new Date(b.createdAt).toLocaleDateString()}</td>
                          </tr>
                        ))}
                        {bookings.length === 0 && <tr><td colSpan="7" className="adm-empty">No bookings found</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {/* ── REFUNDS TAB ── */}
              {activeTab === 'refunds' && (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr><th>Student</th><th>Hostel</th><th>Amount</th><th>Reason</th><th>Status</th><th>Date</th></tr>
                    </thead>
                    <tbody>
                      {refunds.map(r => (
                        <tr key={r._id}>
                          <td>{r.student?.name || '—'}</td>
                          <td>{r.hostel?.name || '—'}</td>
                          <td style={{ fontWeight: 700 }}>₹{r.refundAmount?.toLocaleString() || r.amount?.toLocaleString()}</td>
                          <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.refundReason || r.booking?.refundReason || '—'}</td>
                          <td><StatusBadge status="refunded" /></td>
                          <td>{r.refundedAt ? new Date(r.refundedAt).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                      {refunds.length === 0 && <tr><td colSpan="6" className="adm-empty">No refunds found</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── STUDENTS TAB ── */}
              {activeTab === 'students' && (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Phone</th><th>Status</th><th>Joined</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {students.filter(s => !searchTerm || s.name?.toLowerCase().includes(searchTerm.toLowerCase()) || s.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(s => (
                        <tr key={s._id}>
                          <td style={{ fontWeight: 600 }}>{s.name}</td>
                          <td>{s.email}</td>
                          <td>{s.phone || '—'}</td>
                          <td>{s.isActive !== false ? <StatusBadge status="active" /> : <StatusBadge status="rejected" />}</td>
                          <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              className={`adm-action-btn ${s.isActive !== false ? 'danger' : 'release'}`}
                              onClick={() => handleBlockUser(s._id, 'student', s.isActive !== false)}
                            >
                              {s.isActive !== false ? <><XCircleIcon size={12} /> Block</> : <><CheckCircleIcon size={12} /> Unblock</>}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {students.length === 0 && <tr><td colSpan="6" className="adm-empty">No students found</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── OWNERS TAB ── */}
              {activeTab === 'owners' && (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr><th>Username</th><th>Email</th><th>Hostels</th><th>Status</th><th>Joined</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {owners.filter(o => !searchTerm || o.username?.toLowerCase().includes(searchTerm.toLowerCase()) || o.email?.toLowerCase().includes(searchTerm.toLowerCase())).map(o => (
                        <tr key={o._id}>
                          <td style={{ fontWeight: 600 }}>{o.username}</td>
                          <td>{o.email}</td>
                          <td>{o.hostels?.map(h => h.name).join(', ') || '—'}</td>
                          <td>{o.isActive !== false ? <StatusBadge status="active" /> : <StatusBadge status="rejected" />}</td>
                          <td>{new Date(o.createdAt).toLocaleDateString()}</td>
                          <td>
                            <button
                              className={`adm-action-btn ${o.isActive !== false ? 'danger' : 'release'}`}
                              onClick={() => handleBlockUser(o._id, 'owner', o.isActive !== false)}
                            >
                              {o.isActive !== false ? <><XCircleIcon size={12} /> Block</> : <><CheckCircleIcon size={12} /> Unblock</>}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {owners.length === 0 && <tr><td colSpan="6" className="adm-empty">No owners found</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── HOSTELS TAB ── */}
              {activeTab === 'hostels' && (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr><th>Name</th><th>City</th><th>Owner</th><th>Gender</th><th>Active</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {hostels.filter(h => !searchTerm || h.name?.toLowerCase().includes(searchTerm.toLowerCase()) || h.city?.toLowerCase().includes(searchTerm.toLowerCase())).map(h => (
                        <tr key={h._id}>
                          <td style={{ fontWeight: 600 }}>{h.name}</td>
                          <td>{h.city || '—'}</td>
                          <td>{h.owner?.username || '—'}</td>
                          <td style={{ textTransform: 'capitalize' }}>{h.gender || '—'}</td>
                          <td>{h.isActive ? <StatusBadge status="active" /> : <StatusBadge status="rejected" />}</td>
                          <td>
                            <button
                              className={`adm-action-btn ${h.isActive ? 'danger' : 'release'}`}
                              onClick={() => handleToggleHostel(h._id)}
                            >
                              {h.isActive ? <><XCircleIcon size={12} /> Deactivate</> : <><CheckCircleIcon size={12} /> Activate</>}
                            </button>
                          </td>
                        </tr>
                      ))}
                      {hostels.length === 0 && <tr><td colSpan="6" className="adm-empty">No hostels found</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── TRANSACTIONS TAB ── */}
              {activeTab === 'transactions' && (
                <div className="adm-table-wrap">
                  <table className="adm-table">
                    <thead>
                      <tr><th>TXN ID</th><th>Student</th><th>Hostel</th><th>Room</th><th>Amount</th><th>Status</th><th>Created</th></tr>
                    </thead>
                    <tbody>
                      {transactions.filter(t => !searchTerm || t.transactionId?.toLowerCase().includes(searchTerm.toLowerCase())).map(t => (
                        <tr key={t._id}>
                          <td><code className="adm-code">{t.transactionId}</code></td>
                          <td>{t.student?.name || '—'}</td>
                          <td>{t.hostel?.name || '—'}</td>
                          <td>{t.booking?.roomType || '—'} #{t.booking?.roomNumber || ''}</td>
                          <td style={{ fontWeight: 700 }}>₹{t.amount?.toLocaleString()}</td>
                          <td><StatusBadge status={t.status} /></td>
                          <td>{new Date(t.createdAt).toLocaleString()}</td>
                        </tr>
                      ))}
                      {transactions.length === 0 && <tr><td colSpan="7" className="adm-empty">No transactions found</td></tr>}
                    </tbody>
                  </table>
                </div>
              )}

              {/* ── OWNER REQUESTS ── */}
              {activeTab === 'owner_requests' && (
                <div>
                  <div style={{ marginBottom: '1rem', color: 'var(--adm-text-sec)', fontSize: '0.85rem' }}>
                    {ownerRequests.length} owner request{ownerRequests.length !== 1 ? 's' : ''} requiring admin attention
                  </div>
                  {ownerRequests.length === 0 ? (
                    <div className="adm-empty" style={{ padding: '3rem', textAlign: 'center' }}>
                      <AlertTriangleIcon size={32} style={{ opacity: 0.3, marginBottom: '0.5rem' }} />
                      <div>No owner requests</div>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {ownerRequests.map(r => (
                        <div key={r._id} style={{
                          background: 'var(--adm-card)', border: '1px solid var(--adm-border)',
                          borderRadius: '12px', padding: '1.25rem', borderLeft: '4px solid #a855f7'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--adm-text)' }}>{r.subject}</div>
                              <div style={{ fontSize: '0.8rem', color: 'var(--adm-text-sec)', marginTop: 2 }}>
                                By {r.owner?.name} — {r.type.replace('_', ' ')}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                              <StatusBadge status={r.status} />
                              <span style={{
                                padding: '4px 10px', borderRadius: '20px', fontSize: '0.68rem', fontWeight: 700,
                                background: 'rgba(168,85,247,0.12)', color: '#a855f7', textTransform: 'uppercase'
                              }}>{r.priority}</span>
                            </div>
                          </div>

                          <div style={{ fontSize: '0.88rem', color: 'var(--adm-text)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
                            {r.description}
                          </div>

                          {r.ownerResponse && (
                            <div style={{ background: 'rgba(59,130,246,0.06)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #3b82f6', marginBottom: '0.75rem' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#3b82f6', textTransform: 'uppercase', marginBottom: '0.25rem' }}>Owner Reply</div>
                              <div style={{ fontSize: '0.85rem' }}>{r.ownerResponse}</div>
                              {r.ownerAttachment && (
                                <div style={{ marginTop: '0.5rem' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>Attachment Provided ✅</span>
                                    <a href={r.ownerAttachment} download={`Owner_Attachment_${r._id}`} style={{ fontSize: '0.75rem', fontWeight: 600, padding: '2px 8px', background: '#3b82f6', color: 'white', borderRadius: '4px', textDecoration: 'none' }}>Download File</a>
                                  </div>
                                  {r.ownerAttachment.startsWith('data:image') && (
                                    <img 
                                      src={r.ownerAttachment} 
                                      alt="attachment" 
                                      style={{ display: 'block', maxWidth: '200px', marginTop: '0.5rem', borderRadius: '4px', border: '1px solid var(--border)', cursor: 'pointer' }}
                                      onClick={() => window.open(r.ownerAttachment, '_blank')}
                                      title="Click to view full size"
                                    />
                                  )}
                                </div>
                              )}
                            </div>
                          )}

                          {r.adminResponse && (
                            <div style={{ background: 'rgba(34,197,94,0.06)', padding: '0.75rem', borderRadius: '8px', borderLeft: '3px solid #22c55e', marginBottom: '0.75rem' }}>
                              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#22c55e', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
                                Admin Response History
                              </div>
                              <div style={{ fontSize: '0.85rem' }}>{r.adminResponse}</div>
                              {r.resolvedAt && (
                                <div style={{ fontSize: '0.75rem', color: 'var(--adm-text-sec)', marginTop: 4 }}>
                                  Resolved on {new Date(r.resolvedAt).toLocaleString()}
                                </div>
                              )}
                            </div>
                          )}

                          {['open', 'in_progress'].includes(r.status) && (
                            <div style={{ borderTop: '1px solid var(--adm-border)', paddingTop: '0.75rem' }}>
                              <textarea
                                placeholder="Admin response / notes..."
                                value={requestActionText[r._id] || ''}
                                onChange={e => setRequestActionText(prev => ({ ...prev, [r._id]: e.target.value }))}
                                style={{
                                  width: '100%', padding: '0.6rem', border: '1px solid var(--adm-border)',
                                  borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'inherit',
                                  minHeight: '60px', resize: 'vertical', background: 'var(--adm-bg)',
                                  color: 'var(--adm-text)', marginBottom: '0.5rem'
                                }}
                              />
                              <div style={{ display: 'flex', gap: '0.5rem' }}>
                                <button className="adm-action-btn release" onClick={() => handleOwnerRequestAction(r._id, 'resolved')}>
                                  ✅ Resolve
                                </button>
                                <button className="adm-action-btn" style={{ background: '#f59e0b', color: 'white' }} onClick={() => handleOwnerRequestAction(r._id, 'more_info')}>
                                  📋 Request Info
                                </button>
                                <button className="adm-action-btn danger" onClick={() => handleOwnerRequestAction(r._id, 'rejected')}>
                                  ❌ Reject
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </>
  );
}

// ─── ADMIN STYLES ────────────────────────────────────────────────────
const adminStyles = `
  :root {
    --adm-sidebar-w: 260px;
    --adm-sidebar-collapsed: 68px;
    --adm-primary: #4f46e5;
    --adm-bg: #f8fafc;
    --adm-card: #ffffff;
    --adm-text: #0f172a;
    --adm-text-sec: #64748b;
    --adm-border: #e2e8f0;
    --adm-hover: #f1f5f9;
  }
  body.dark-mode {
    --adm-bg: #0f172a;
    --adm-card: #1e293b;
    --adm-text: #f1f5f9;
    --adm-text-sec: #94a3b8;
    --adm-border: #334155;
    --adm-hover: #1e293b;
  }

  .adm-layout {
    display: flex;
    min-height: 100vh;
    background: var(--adm-bg);
    color: var(--adm-text);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
  }

  /* Sidebar */
  .adm-sidebar {
    width: var(--adm-sidebar-w);
    background: var(--adm-card);
    border-right: 1px solid var(--adm-border);
    display: flex;
    flex-direction: column;
    transition: width 0.3s cubic-bezier(.4,0,.2,1);
    position: fixed;
    top: 0; left: 0; bottom: 0;
    z-index: 100;
    overflow: hidden;
  }
  .adm-sidebar.collapsed { width: var(--adm-sidebar-collapsed); }
  .adm-sidebar-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 16px;
    border-bottom: 1px solid var(--adm-border);
    min-height: 72px;
  }
  .adm-logo {
    display: flex;
    align-items: center;
    gap: 10px;
    overflow: hidden;
    white-space: nowrap;
  }
  .adm-logo-text {
    font-size: 1.1rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    background: linear-gradient(135deg, var(--adm-primary), #7c3aed);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
  }
  .adm-toggle-btn {
    background: none;
    border: 1px solid var(--adm-border);
    border-radius: 8px;
    width: 28px; height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: var(--adm-text-sec);
    flex-shrink: 0;
    transition: all 0.2s;
  }
  .adm-toggle-btn:hover { background: var(--adm-hover); border-color: var(--adm-primary); color: var(--adm-primary); }

  .adm-nav {
    flex: 1;
    padding: 12px 8px;
    overflow-y: auto;
  }
  .adm-nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    width: 100%;
    padding: 10px 14px;
    border: none;
    background: none;
    color: var(--adm-text-sec);
    font-size: 0.875rem;
    font-weight: 500;
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    white-space: nowrap;
    font-family: inherit;
    margin-bottom: 2px;
  }
  .adm-nav-item:hover { background: var(--adm-hover); color: var(--adm-text); }
  .adm-nav-item.active {
    background: linear-gradient(135deg, rgba(79,70,229,0.1), rgba(124,58,237,0.08));
    color: var(--adm-primary);
    font-weight: 600;
  }
  .adm-nav-item.logout:hover { background: rgba(239,68,68,0.08); color: #ef4444; }
  .adm-nav-icon { flex-shrink: 0; width: 24px; display: flex; align-items: center; justify-content: center; }
  .adm-nav-label { overflow: hidden; text-overflow: ellipsis; }

  .adm-sidebar-footer {
    padding: 12px 8px;
    border-top: 1px solid var(--adm-border);
  }

  /* Main */
  .adm-main {
    flex: 1;
    margin-left: var(--adm-sidebar-w);
    transition: margin-left 0.3s cubic-bezier(.4,0,.2,1);
    padding: 28px 32px;
    min-height: 100vh;
  }
  .adm-sidebar.collapsed ~ .adm-main { margin-left: var(--adm-sidebar-collapsed); }

  .adm-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 28px;
    flex-wrap: wrap;
    gap: 16px;
  }
  .adm-page-title {
    font-size: 1.625rem;
    font-weight: 800;
    letter-spacing: -0.02em;
    display: flex;
    align-items: center;
  }
  .adm-search-wrap {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border: 1.5px solid var(--adm-border);
    border-radius: 10px;
    background: var(--adm-card);
    color: var(--adm-text-sec);
    transition: all 0.2s;
    width: 280px;
  }
  .adm-search-wrap:focus-within { border-color: var(--adm-primary); box-shadow: 0 0 0 3px rgba(79,70,229,0.1); }
  .adm-search {
    border: none;
    background: none;
    color: var(--adm-text);
    font-size: 0.875rem;
    outline: none;
    width: 100%;
    font-family: inherit;
  }

  /* Loader */
  .adm-loader { display: flex; justify-content: center; padding: 80px 0; }
  .adm-spinner {
    width: 36px; height: 36px;
    border: 3px solid var(--adm-border);
    border-top-color: var(--adm-primary);
    border-radius: 50%;
    animation: admSpin 0.7s linear infinite;
  }
  @keyframes admSpin { to { transform: rotate(360deg); } }

  /* Stat Cards */
  .adm-grid-4 {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
    gap: 18px;
  }
  .adm-stat-card {
    background: var(--adm-card);
    border: 1px solid var(--adm-border);
    border-radius: 14px;
    padding: 22px 20px;
    display: flex;
    align-items: center;
    gap: 16px;
    transition: all 0.3s;
  }
  .adm-stat-card:hover { transform: translateY(-2px); box-shadow: 0 8px 24px rgba(0,0,0,0.06); }
  .adm-stat-icon {
    width: 52px; height: 52px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 12px;
    background: currentColor;
    opacity: 0.1;
    position: relative;
  }
  .adm-stat-icon svg {
    position: absolute;
    opacity: 1;
  }
  .adm-stat-icon {
    position: relative;
  }
  .adm-stat-value { font-size: 1.5rem; font-weight: 800; letter-spacing: -0.02em; }
  .adm-stat-label { font-size: 0.8rem; color: var(--adm-text-sec); font-weight: 500; margin-top: 2px; }

  /* Filters */
  .adm-filters {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 20px;
  }
  .adm-filter-btn {
    padding: 7px 16px;
    border: 1.5px solid var(--adm-border);
    background: var(--adm-card);
    color: var(--adm-text-sec);
    border-radius: 20px;
    font-size: 0.8rem;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    text-transform: capitalize;
    font-family: inherit;
  }
  .adm-filter-btn:hover { border-color: var(--adm-primary); color: var(--adm-primary); }
  .adm-filter-btn.active {
    background: var(--adm-primary);
    color: white;
    border-color: var(--adm-primary);
  }

  /* Table */
  .adm-table-wrap {
    background: var(--adm-card);
    border: 1px solid var(--adm-border);
    border-radius: 14px;
    overflow: hidden;
  }
  .adm-table {
    width: 100%;
    border-collapse: collapse;
  }
  .adm-table th {
    text-align: left;
    padding: 14px 16px;
    font-size: 0.75rem;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--adm-text-sec);
    background: var(--adm-hover);
    border-bottom: 1px solid var(--adm-border);
  }
  .adm-table td {
    padding: 12px 16px;
    font-size: 0.85rem;
    border-bottom: 1px solid var(--adm-border);
    vertical-align: middle;
  }
  .adm-table tr:last-child td { border-bottom: none; }
  .adm-table tr:hover td { background: var(--adm-hover); }
  .adm-empty { text-align: center; color: var(--adm-text-sec); padding: 40px 16px !important; }
  .adm-code {
    font-family: 'SFMono-Regular', Consolas, monospace;
    font-size: 0.75rem;
    background: var(--adm-hover);
    padding: 3px 8px;
    border-radius: 6px;
    color: var(--adm-primary);
  }

  /* Action Buttons */
  .adm-action-btn {
    padding: 6px 14px;
    border: none;
    border-radius: 8px;
    font-size: 0.75rem;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    display: inline-flex;
    align-items: center;
    gap: 4px;
  }
  .adm-action-btn.release {
    background: #22c55e;
    color: white;
  }
  .adm-action-btn.release:hover { background: #16a34a; }
  .adm-action-btn.danger {
    background: #ef4444;
    color: white;
  }
  .adm-action-btn.danger:hover { background: #dc2626; }

  /* Responsive */
  @media (max-width: 768px) {
    .adm-sidebar { width: var(--adm-sidebar-collapsed); }
    .adm-sidebar .adm-nav-label,
    .adm-sidebar .adm-logo-text { display: none; }
    .adm-main { margin-left: var(--adm-sidebar-collapsed); padding: 20px 16px; }
    .adm-grid-4 { grid-template-columns: 1fr 1fr; }
    .adm-search-wrap { width: 100%; }
    .adm-toggle-btn { display: none; }
  }
  @media (max-width: 480px) {
    .adm-grid-4 { grid-template-columns: 1fr; }
    .adm-table { font-size: 0.8rem; }
  }
`;
