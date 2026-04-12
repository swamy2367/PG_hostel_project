import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import DashboardLayout from '../components/DashboardLayout'
import {
  PlusIcon, EditIcon, TrashIcon, MapPinIcon, BedIcon, EyeIcon,
  CheckCircleIcon, PhoneIcon, UsersIcon, BuildingIcon
} from '../components/Icons'

export default function OwnerHostels() {
  const navigate = useNavigate()
  const [hostels, setHostels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchHostels()
  }, [])

  const fetchHostels = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/hostels/owner/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()

      if (response.ok && data.success) {
        setHostels(data.hostels || [])
        setError('')
      } else {
        setHostels([])
        setError('')
      }
    } catch (err) {
      console.error('Fetch hostel error:', err)
      setError('Failed to load hostels')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (hostelId) => {
    if (!window.confirm('Are you sure you want to delete this hostel?')) return

    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/hostels/${hostelId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })

      if (response.ok) {
        alert('Hostel deleted successfully')
        fetchHostels()
      } else {
        setError('Failed to delete hostel')
      }
    } catch (err) {
      setError('Failed to delete hostel')
    }
  }

  const roomTypes = ['single', 'double', 'triple', 'four']
  const roomLabels = { single: 'Single', double: 'Double', triple: 'Triple', four: 'Four-Person' }

  return (
    <DashboardLayout role="owner">
      {/* Page Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 'var(--space-8)',
        flexWrap: 'wrap',
        gap: 'var(--space-4)',
      }}>
        <div>
          <h1 style={{
            fontSize: 'var(--text-3xl)',
            fontWeight: 700,
            letterSpacing: 'var(--tracking-tighter)',
            marginBottom: 'var(--space-2)',
          }}>
            My Hostels
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
            Manage your hostel properties
          </p>
        </div>
        <Link to="/owner/hostels/add" className="btn btn-primary">
          <PlusIcon size={16} />
          Add Hostel
        </Link>
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
      ) : hostels.length > 0 ? (
        <div className="grid grid-3 animate-stagger">
          {hostels.map((hostel) => (
            <div key={hostel._id} className="card">
              {/* Header */}
              <div style={{
                background: 'linear-gradient(135deg, var(--primary), var(--primary-700))',
                padding: 'var(--space-5) var(--space-6)',
                color: 'white',
              }}>
                <h2 style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 600,
                  marginBottom: 'var(--space-2)',
                }}>
                  {hostel.name}
                </h2>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-1-5)',
                  fontSize: 'var(--text-sm)',
                  opacity: 0.9,
                }}>
                  <MapPinIcon size={14} />
                  {hostel.city}, {hostel.state}
                </div>
              </div>

              <div className="card-body">
                {/* Info Grid */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 1fr',
                  gap: 'var(--space-4)',
                  marginBottom: 'var(--space-5)',
                }}>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Contact</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600 }}>{hostel.contactPhone}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 'var(--space-1)' }}>Gender</div>
                    <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, textTransform: 'capitalize' }}>{hostel.gender}</div>
                  </div>
                </div>

                {/* Amenities */}
                {hostel.amenities && hostel.amenities.length > 0 && (
                  <div style={{ marginBottom: 'var(--space-5)' }}>
                    <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>Amenities</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 'var(--space-2)' }}>
                      {hostel.amenities.slice(0, 3).map((amenity, idx) => (
                        <span key={idx} className="chip">
                          <CheckCircleIcon size={12} />
                          {amenity}
                        </span>
                      ))}
                      {hostel.amenities.length > 3 && (
                        <span className="chip">+{hostel.amenities.length - 3} more</span>
                      )}
                    </div>
                  </div>
                )}

                {/* Rooms Grid */}
                <div style={{ marginBottom: 'var(--space-4)' }}>
                  <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500, marginBottom: 'var(--space-2)' }}>Rooms</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-3)' }}>
                    {roomTypes.map(type => {
                      const config = hostel.roomConfig?.[type]
                      if (!config || config.count <= 0) return null
                      return (
                        <div key={type} style={{
                          padding: 'var(--space-3)',
                          background: 'var(--bg-tertiary)',
                          borderRadius: 'var(--radius-md)',
                          border: '1px solid var(--border-light)',
                        }}>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontWeight: 500, textTransform: 'capitalize', marginBottom: 'var(--space-1)' }}>
                            {roomLabels[type]}
                          </div>
                          <div style={{ fontSize: 'var(--text-lg)', fontWeight: 700, marginBottom: 'var(--space-0-5)' }}>
                            {config.count}
                          </div>
                          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--success)', fontWeight: 500 }}>
                            ₹{config.rent}/mo
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                <button
                  className="btn btn-outline btn-sm w-full"
                  onClick={() => navigate('/owner/rooms')}
                >
                  <EyeIcon size={14} />
                  View Room Details
                </button>
              </div>

              {/* Actions */}
              <div className="card-footer" style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => navigate(`/owner/hostels/${hostel._id}/edit`)}
                >
                  <EditIcon size={14} />
                  Edit
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  style={{ flex: 1 }}
                  onClick={() => handleDelete(hostel._id)}
                >
                  <TrashIcon size={14} />
                  Delete
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
            <h3 className="empty-state-title">No Hostel Yet</h3>
            <p className="empty-state-text">Create your first hostel to get started</p>
            <Link to="/owner/hostels/add" className="btn btn-primary">
              <PlusIcon size={16} />
              Add Hostel
            </Link>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
