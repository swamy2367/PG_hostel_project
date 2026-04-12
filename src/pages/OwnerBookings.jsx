import React, { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import {
  ClipboardIcon, CheckCircleIcon, XCircleIcon, HourglassIcon,
  LogOutIcon, HomeIcon, UserIcon, MailIcon, PhoneIcon, CalendarIcon, BedIcon
} from '../components/Icons'

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([])
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBookings()
  }, [])

  const fetchBookings = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/bookings/owner/all', {
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
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/approve`, {
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
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/reject`, {
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

  const handleCheckout = async (bookingId) => {
    if (!window.confirm('Are you sure you want to checkout this student?')) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/bookings/${bookingId}/checkout`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) {
        fetchBookings()
      } else {
        const data = await response.json()
        setError(data.message || 'Failed to checkout')
      }
    } catch (err) {
      setError('Failed to checkout')
    }
  }

  const filteredBookings = filter === 'all'
    ? bookings
    : filter === 'approved'
    ? bookings.filter(b => b.status === 'approved' || b.status === 'active')
    : bookings.filter(b => b.status === filter)

  const filters = [
    { key: 'all', label: 'All', count: bookings.length },
    { key: 'pending', label: 'Pending', count: bookings.filter(b => b.status === 'pending').length },
    { key: 'approved', label: 'Approved', count: bookings.filter(b => b.status === 'approved' || b.status === 'active').length },
    { key: 'completed', label: 'Completed', count: bookings.filter(b => b.status === 'completed').length },
  ]

  const statusConfig = {
    pending: { badge: 'badge-warning', label: 'Pending', icon: HourglassIcon },
    approved: { badge: 'badge-success', label: 'Approved', icon: CheckCircleIcon },
    active: { badge: 'badge-info', label: 'Active', icon: HomeIcon },
    rejected: { badge: 'badge-danger', label: 'Rejected', icon: XCircleIcon },
    cancelled: { badge: 'badge-neutral', label: 'Cancelled', icon: XCircleIcon },
    completed: { badge: 'badge-success', label: 'Completed', icon: CheckCircleIcon },
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
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => handleApprove(booking._id)}
                        >
                          <CheckCircleIcon size={14} />
                          Approve
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleReject(booking._id)}
                        >
                          <XCircleIcon size={14} />
                          Reject
                        </button>
                      </>
                    )}
                    {(booking.status === 'approved' || booking.status === 'active') && (
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleCheckout(booking._id)}
                      >
                        <LogOutIcon size={14} />
                        Checkout
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
