import React, { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'
import ConfirmModal from '../components/ConfirmModal'
import {
  ClipboardIcon, CheckCircleIcon, XCircleIcon, HourglassIcon,
  LogOutIcon, HomeIcon, UserIcon, MailIcon, PhoneIcon, CalendarIcon, BedIcon
} from '../components/Icons'

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [verifyCode, setVerifyCode] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [verifyMessage, setVerifyMessage] = useState({ type: '', text: '' })

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('/api/bookings/owner/all', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()
      if (response.ok && data.success) {
        setBookings(data.bookings || [])
      } else {
        setError(data.message || 'Failed to load bookings')
      }
    } catch (err) {
      setError('Failed to load bookings')
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (bookingId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/${bookingId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
      if (response.ok) {
        fetchBookings()
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to approve booking')
      }
    } catch (err) {
      setError('Failed to approve booking')
    }
  }

  const handleReject = async (bookingId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/bookings/${bookingId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ownerNotes: 'Booking rejected' })
      })
      if (response.ok) {
        fetchBookings()
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to reject booking')
      }
    } catch (err) {
      setError('Failed to reject booking')
    }
  }
  const [confirmAction, setConfirmAction] = useState(null);

  const handleCheckout = (bookingId) => {
    setConfirmAction({
      title: 'Checkout Student',
      message: 'Are you sure you want to checkout this student?',
      confirmText: 'Checkout',
      confirmColor: '#f59e0b',
      onConfirm: async () => {
        setConfirmAction(null);
        try {
          const token = localStorage.getItem('token')
          const response = await fetch(`/api/bookings/${bookingId}/checkout`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
          })
          if (response.ok) {
            toast.success('Student checked out');
            fetchBookings()
          } else {
            const data = await response.json()
            toast.error(data.message || 'Failed to checkout')
          }
        } catch (err) {
          toast.error('Failed to checkout')
        }
      }
    });
  }

  const handleConfirmCode = async () => {
    if (!verifyCode || verifyCode.trim().length !== 6) {
      setVerifyMessage({ type: 'error', text: 'Please enter a valid 6-digit code' })
      return
    }
    setVerifying(true)
    setVerifyMessage({ type: '', text: '' })
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('/api/bookings/confirm-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ code: verifyCode.trim() })
      })
      const data = await response.json()
      if (data.success) {
        setVerifyMessage({ type: 'success', text: data.message })
        setVerifyCode('')
        fetchBookings()
      } else {
        setVerifyMessage({ type: 'error', text: data.message || 'Invalid code' })
      }
    } catch (err) {
      setVerifyMessage({ type: 'error', text: 'Failed to verify code' })
    }
    setVerifying(false)
  }

  const filteredBookings = filter === 'all'
    ? bookings
    : filter === 'paid'
    ? bookings.filter(b => b.status === 'pending_confirmation')
    : filter === 'confirmed'
    ? bookings.filter(b => b.status === 'confirmed' || b.status === 'approved' || b.status === 'active')
    : bookings.filter(b => b.status === filter)

  const filters = [
    { key: 'all', label: 'All', count: bookings.length },
    { key: 'paid', label: 'Paid (Pending)', count: bookings.filter(b => b.status === 'pending_confirmation').length },
    { key: 'confirmed', label: 'Confirmed', count: bookings.filter(b => ['confirmed', 'approved', 'active'].includes(b.status)).length },
    { key: 'rejected', label: 'Rejected', count: bookings.filter(b => b.status === 'rejected').length },
    { key: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
    { key: 'refunded', label: 'Refunded', count: bookings.filter(b => b.status === 'refunded').length },
  ]

  const statusConfig = {
    pending: { badge: 'badge-warning', label: 'Pending', icon: HourglassIcon },
    approved: { badge: 'badge-success', label: 'Approved', icon: CheckCircleIcon },
    active: { badge: 'badge-info', label: 'Active', icon: HomeIcon },
    rejected: { badge: 'badge-danger', label: 'Rejected', icon: XCircleIcon },
    cancelled: { badge: 'badge-neutral', label: 'Cancelled', icon: XCircleIcon },
    completed: { badge: 'badge-success', label: 'Completed', icon: CheckCircleIcon },
    pending_confirmation: { badge: 'badge-warning', label: 'Paid · Pending', icon: HourglassIcon },
    confirmed: { badge: 'badge-success', label: 'Confirmed', icon: CheckCircleIcon },
    refunded: { badge: 'badge-danger', label: 'Refunded', icon: XCircleIcon },
    switched: { badge: 'badge-neutral', label: 'Switched', icon: XCircleIcon },
  }

  return (
    <DashboardLayout role="owner">
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 700,
          letterSpacing: 'var(--tracking-tighter)',
          marginBottom: 'var(--space-2)',
        }}>
          Booking Requests
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
          Manage and track all student booking requests
        </p>
      </div>

      {/* Verification Code Entry */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(79,70,229,0.06), rgba(139,92,246,0.04))',
        border: '2px solid rgba(79,70,229,0.15)',
        borderRadius: 'var(--radius-xl)',
        padding: 'var(--space-6)',
        marginBottom: 'var(--space-6)',
      }}>
        <h3 style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-2)' }}>
          🔑 Enter Verification Code
        </h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
          Enter the 6-digit code from a student to confirm their booking and release payment.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap', alignItems: 'center' }}>
          <input
            type="text"
            className="form-input"
            placeholder="Enter 6-digit code"
            value={verifyCode}
            onChange={e => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            style={{
              width: 200,
              fontFamily: 'monospace',
              fontSize: 'var(--text-lg)',
              letterSpacing: '0.2em',
              textAlign: 'center',
              fontWeight: 700,
            }}
          />
          <button
            className="btn btn-primary btn-sm"
            onClick={handleConfirmCode}
            disabled={verifying || verifyCode.length !== 6}
          >
            {verifying ? '⏳ Verifying...' : '✅ Confirm Booking'}
          </button>
        </div>
        {verifyMessage.text && (
          <div style={{
            marginTop: 'var(--space-3)',
            padding: 'var(--space-3) var(--space-4)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            fontWeight: 500,
            background: verifyMessage.type === 'success' ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            color: verifyMessage.type === 'success' ? '#16a34a' : '#dc2626',
            border: `1px solid ${verifyMessage.type === 'success' ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`,
          }}>
            {verifyMessage.text}
          </div>
        )}
      </div>

      {/* Filters */}
      <div style={{
        display: 'flex',
        gap: 'var(--space-2)',
        marginBottom: 'var(--space-6)',
        flexWrap: 'wrap',
      }}>
        {filters.map(f => (
          <button
            key={f.key}
            className={`btn btn-sm ${filter === f.key ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label} ({f.count})
          </button>
        ))}
      </div>

      {error && (
        <div style={{
          background: 'var(--danger-light)',
          color: 'var(--danger-dark)',
          padding: 'var(--space-3) var(--space-4)',
          borderRadius: 'var(--radius-md)',
          marginBottom: 'var(--space-6)',
          fontSize: 'var(--text-sm)',
          fontWeight: 500,
          borderLeft: '4px solid var(--danger)',
        }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : filteredBookings.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }} className="animate-stagger">
          {filteredBookings.map(booking => {
            const config = statusConfig[booking.status] || statusConfig.pending
            const StatusIcon = config.icon
            const studentName = booking.student?.name || 'Unknown Student'
            const studentEmail = booking.student?.email || 'N/A'
            const studentPhone = booking.student?.phone || 'N/A'
            const hostelName = booking.hostel?.name || 'Unknown Hostel'
            const roomNumber = booking.room?.number || 'N/A'
            const roomType = booking.room?.type || booking.roomType || 'N/A'

            return (
              <div key={booking._id} className="card" style={{ overflow: 'visible' }}>
                <div className="card-body" style={{
                  display: 'grid',
                  gridTemplateColumns: 'auto 1fr auto',
                  gap: 'var(--space-5)',
                  alignItems: 'flex-start',
                }}>
                  {/* Status Icon */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: 'var(--space-2)',
                  }}>
                    <div className={`stat-card-icon`} style={{
                      width: 48,
                      height: 48,
                      borderRadius: 'var(--radius-lg)',
                    }}>
                      <StatusIcon size={20} />
                    </div>
                    <span className={`badge ${config.badge}`} style={{ fontSize: '0.625rem' }}>
                      {config.label}
                    </span>
                  </div>

                  {/* Info */}
                  <div>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: 'var(--space-3)',
                      paddingBottom: 'var(--space-3)',
                      borderBottom: '1px solid var(--border-light)',
                    }}>
                      <div>
                        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600, marginBottom: 'var(--space-1)' }}>
                          {studentName} — Room {roomNumber}
                        </h3>
                        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>
                          Requested: {new Date(booking.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>

                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
                      gap: 'var(--space-4)',
                    }}>
                      {[
                        { label: 'Hostel', value: hostelName },
                        { label: 'Room Type', value: roomType.charAt(0).toUpperCase() + roomType.slice(1) },
                        { label: 'Duration', value: `${booking.durationValue || 1} ${booking.durationType === 'day' ? 'Day' : booking.durationType === 'week' ? 'Week' : 'Month'}${(booking.durationValue || 1) !== 1 ? 's' : ''}` },
                        { label: 'Total Price', value: booking.totalPrice ? `₹${booking.totalPrice.toLocaleString()}` : `₹${booking.rent?.toLocaleString() || 'N/A'}/mo` },
                        { label: 'Email', value: studentEmail },
                        { label: 'Phone', value: studentPhone },
                      ].map(({ label, value }) => (
                        <div key={label}>
                          <div style={{
                            fontSize: 'var(--text-xs)',
                            color: 'var(--text-tertiary)',
                            fontWeight: 500,
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            marginBottom: 'var(--space-0-5)',
                          }}>
                            {label}
                          </div>
                          <div style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: label === 'Total Price' ? 'var(--success)' : undefined }}>
                            {value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 'var(--space-2)',
                    minWidth: 110,
                  }}>
                    {booking.status === 'pending' && (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => handleApprove(booking._id)}>
                          <CheckCircleIcon size={14} /> Approve
                        </button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(booking._id)}>
                          <XCircleIcon size={14} /> Reject
                        </button>
                      </>
                    )}
                    {booking.status === 'pending_confirmation' && (
                      <>
                        <button className="btn btn-danger btn-sm" onClick={() => handleReject(booking._id)}>
                          <XCircleIcon size={14} /> Reject & Refund
                        </button>
                      </>
                    )}
                    {(booking.status === 'approved' || booking.status === 'active' || booking.status === 'confirmed') && (
                      <button className="btn btn-outline btn-sm" onClick={() => handleCheckout(booking._id)}>
                        <LogOutIcon size={14} /> Checkout
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card" style={{ border: '1px dashed var(--border)' }}>
          <div className="empty-state">
            <div className="empty-state-icon">
              <ClipboardIcon size={28} />
            </div>
            <h3 className="empty-state-title">
              {filter === 'all' ? 'No Bookings Yet' : `No ${filter} bookings`}
            </h3>
            <p className="empty-state-text">
              {filter === 'all'
                ? 'Bookings from students will appear here'
                : `No bookings with status "${filter}"`}
            </p>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
