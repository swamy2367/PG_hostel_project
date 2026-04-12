import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import {
  BuildingIcon, BedIcon, ClipboardIcon, HourglassIcon, TicketIcon,
  PlusIcon, EditIcon, MapPinIcon, TrendingUpIcon, ArrowRightIcon
} from '../components/Icons'

export default function OwnerDashboard() {
  const navigate = useNavigate()
  const [stats, setStats] = useState({
    totalHostels: 0,
    totalRooms: 0,
    activeBookings: 0,
    pendingRequests: 0,
    openComplaints: 0
  })
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token')

        const [hostelResponse, complaintResponse] = await Promise.all([
          fetch('http://localhost:5000/api/hostels/owner/my', {
            headers: { 'Authorization': `Bearer ${token}` }
          }),
          fetch('http://localhost:5000/api/complaints/owner/stats', {
            headers: { 'Authorization': `Bearer ${token}` }
          })
        ])

        const data = await hostelResponse.json()
        const complaintData = await complaintResponse.json()

        let openComplaints = 0
        if (complaintData.success && complaintData.stats) {
          openComplaints = (complaintData.stats.open || 0) + (complaintData.stats.in_progress || 0)
        }

        if (hostelResponse.ok && data.success) {
          const hostels = data.hostels || []

          if (hostels.length > 0) {
            setHostels(hostels)

            const totalRooms = hostels.reduce((sum, hostel) => {
              return sum + (
                (hostel.roomConfig?.single?.count || 0) +
                (hostel.roomConfig?.double?.count || 0) +
                (hostel.roomConfig?.triple?.count || 0) +
                (hostel.roomConfig?.four?.count || 0)
              )
            }, 0)

            setStats({
              totalHostels: hostels.length,
              totalRooms,
              activeBookings: 0,
              pendingRequests: 0,
              openComplaints
            })
          } else {
            setStats(prev => ({ ...prev, openComplaints }))
          }
        }
      } catch (err) {
        console.error('Error fetching hostels:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const statCards = [
    { label: 'Total Hostels', value: stats.totalHostels, icon: BuildingIcon, color: '--primary' },
    { label: 'Total Rooms', value: stats.totalRooms, icon: BedIcon, color: '--accent' },
    { label: 'Active Bookings', value: stats.activeBookings, icon: ClipboardIcon, color: '--success' },
    { label: 'Pending Requests', value: stats.pendingRequests, icon: HourglassIcon, color: '--warning' },
    { label: 'Open Complaints', value: stats.openComplaints, icon: TicketIcon, color: '--danger', 
      onClick: () => navigate('/owner/complaints'), highlight: stats.openComplaints > 0 },
  ]

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
          Dashboard
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
          Manage your hostels, rooms, and bookings
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-5 animate-stagger" style={{ marginBottom: 'var(--space-10)' }}>
        {statCards.map(({ label, value, icon: StatIcon, color, onClick, highlight }) => (
          <div
            key={label}
            className="stat-card"
            style={{ cursor: onClick ? 'pointer' : 'default' }}
            onClick={onClick}
          >
            <div
              className="stat-card-icon"
              style={{
                color: `var(${color})`,
                background: `color-mix(in srgb, var(${color}) 10%, transparent)`,
                borderColor: `color-mix(in srgb, var(${color}) 20%, transparent)`,
              }}
            >
              <StatIcon size={20} />
            </div>
            <div
              className="stat-card-number"
              style={highlight ? { color: 'var(--warning)' } : {}}
            >
              {value}
            </div>
            <div className="stat-card-label">{label}</div>
          </div>
        ))}
      </div>

      {/* Hostels Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-6)',
      }}>
        <h2 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 600,
        }}>
          Your Hostels
        </h2>
        <button
          className="btn btn-primary"
          onClick={() => navigate('/owner/hostels/add')}
        >
          <PlusIcon size={16} />
          Add Hostel
        </button>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : hostels.length > 0 ? (
        <div className="grid grid-3 animate-stagger">
          {hostels.map(hostel => (
            <div key={hostel._id} className="card card-interactive">
              {/* Card Header with gradient */}
              <div style={{
                background: 'linear-gradient(135deg, var(--primary), var(--primary-700))',
                padding: 'var(--space-5) var(--space-6)',
                color: 'white',
              }}>
                <h3 style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-2)',
                }}>
                  {hostel.name}
                </h3>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  fontSize: 'var(--text-sm)',
                  opacity: 0.9,
                }}>
                  <MapPinIcon size={14} />
                  <span>{hostel.address}, {hostel.city}</span>
                </div>
              </div>

              {/* Room Stats */}
              <div className="card-body" style={{ padding: 'var(--space-5) var(--space-6)' }}>
                {[
                  { label: 'Single Rooms', value: hostel.roomConfig?.single?.count || 0 },
                  { label: 'Double Rooms', value: hostel.roomConfig?.double?.count || 0 },
                  { label: 'Triple Rooms', value: hostel.roomConfig?.triple?.count || 0 },
                  { label: 'Four-Person', value: hostel.roomConfig?.four?.count || 0 },
                ].map(({ label, value }) => (
                  <div key={label} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: 'var(--space-2-5) 0',
                    borderBottom: '1px solid var(--border-light)',
                    fontSize: 'var(--text-sm)',
                  }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                    <span style={{ fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="card-footer" style={{
                display: 'flex',
                gap: 'var(--space-3)',
              }}>
                <button
                  className="btn btn-primary btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => navigate('/owner/rooms')}
                >
                  <BedIcon size={14} />
                  Manage
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/owner/hostels/${hostel._id}/edit`)}
                >
                  <EditIcon size={14} />
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card" style={{ border: '1px dashed var(--border)' }}>
          <div className="empty-state">
            <div className="empty-state-icon">
              <BuildingIcon size={28} />
            </div>
            <h3 className="empty-state-title">No Hostels Yet</h3>
            <p className="empty-state-text">
              Start by adding your first hostel property to begin managing bookings.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => navigate('/owner/hostels/add')}
            >
              <PlusIcon size={16} />
              Add Your First Hostel
            </button>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
