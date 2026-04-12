import React, { useState, useEffect } from 'react'
import DashboardLayout from '../components/DashboardLayout'
import {
  BedIcon, EditIcon, TrashIcon, UserIcon, BuildingIcon,
  UsersIcon, CheckCircleIcon, AlertCircleIcon, XIcon
} from '../components/Icons'

export default function ManageRooms() {
  const [hostels, setHostels] = useState([])
  const [selectedHostel, setSelectedHostel] = useState(null)
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editingRoom, setEditingRoom] = useState(null)
  const [formData, setFormData] = useState({
    roomType: 'double',
    rent: '',
    roomNumber: ''
  })

  useEffect(() => {
    fetchHostel()
  }, [])

  const fetchHostel = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch('http://localhost:5000/api/hostels/owner/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()

      if (response.ok && data.success && data.hostels && data.hostels.length > 0) {
        setHostels(data.hostels)
        setSelectedHostel(data.hostels[0])
        fetchRoomsForHostel(data.hostels[0]._id)
        setError('')
      } else if (data.hostels && data.hostels.length === 0) {
        setError('No hostels found. Please add a hostel first.')
      } else {
        setError('Failed to load hostels')
      }
    } catch (err) {
      console.error('Fetch hostel error:', err)
      setError('Failed to load hostels')
    } finally {
      setLoading(false)
    }
  }

  const handleHostelChange = (hostelId) => {
    const hostel = hostels.find(h => h._id === hostelId)
    if (hostel) {
      setSelectedHostel(hostel)
      fetchRoomsForHostel(hostelId)
    }
  }

  const fetchRoomsForHostel = async (hostelId) => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/rooms/hostel/${hostelId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()

      if (data.success && data.rooms) {
        setRooms(data.rooms)
      } else {
        const hostel = hostels.find(h => h._id === hostelId)
        if (hostel) generateRoomsFromConfig(hostel.roomConfig)
      }
    } catch (err) {
      console.error('Error fetching rooms:', err)
      const hostel = hostels.find(h => h._id === hostelId)
      if (hostel) generateRoomsFromConfig(hostel.roomConfig)
    }
  }

  const generateRoomsFromConfig = (roomConfig) => {
    const roomsList = []
    const parseRoomNumbers = (input) => {
      if (!input) return []
      const numbers = []
      const parts = input.split(',').map(s => s.trim())
      parts.forEach(part => {
        if (part.includes('-')) {
          const [start, end] = part.split('-').map(Number)
          for (let i = start; i <= end; i++) numbers.push(i)
        } else {
          const num = Number(part)
          if (!isNaN(num)) numbers.push(num)
        }
      })
      return numbers
    }

    Object.entries(roomConfig || {}).forEach(([type, config]) => {
      if (!config || config.count === 0) return
      const roomNumbers = parseRoomNumbers(config.roomNumbers)
      if (roomNumbers.length === 0) {
        const startNum = type === 'single' ? 101 : type === 'double' ? 201 : type === 'triple' ? 301 : 401
        for (let i = 0; i < config.count; i++) roomNumbers.push(startNum + i)
      }
      roomNumbers.slice(0, config.count).forEach((num) => {
        roomsList.push({
          _id: `${type}-${num}`, number: num, type, rent: config.rent,
          capacity: type === 'single' ? 1 : type === 'double' ? 2 : type === 'triple' ? 3 : 4,
          status: 'available', occupants: [], currentBookings: []
        })
      })
    })
    setRooms(roomsList)
  }

  const handleEditRoom = (room) => {
    setEditingRoom(room._id)
    setFormData({ roomType: room.type, rent: room.rent, roomNumber: room.roomNumber || room.number })
  }

  const handleSaveRoom = async () => {
    if (!editingRoom) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/hostels/${selectedHostel._id}/rooms/${editingRoom}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(formData)
      })
      if (response.ok) { setEditingRoom(null); fetchHostel() }
      else setError('Failed to update room')
    } catch (err) { setError('Failed to update room') }
  }

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return
    if (!selectedHostel) return
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`http://localhost:5000/api/hostels/${selectedHostel._id}/rooms/${roomId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (response.ok) fetchHostel()
      else setError('Failed to delete room')
    } catch (err) { setError('Failed to delete room') }
  }

  const handleCancelEdit = () => {
    setEditingRoom(null)
    setFormData({ roomType: 'double', rent: '', roomNumber: '' })
  }

  /* ── Derived Stats ─────────────────────── */
  const totalRooms = rooms.length
  const occupiedRooms = rooms.filter(r => (r.occupants?.length || 0) >= r.capacity).length
  const availableRooms = rooms.filter(r => (r.occupants?.length || 0) < r.capacity && !(r.currentBookings?.length > 0)).length
  const pendingRooms = rooms.filter(r => r.currentBookings?.length > 0 && (r.occupants?.length || 0) < r.capacity).length
  const totalCapacity = rooms.reduce((sum, r) => sum + (r.capacity || 0), 0)
  const totalOccupants = rooms.reduce((sum, r) => sum + (r.occupants?.length || 0), 0)

  const getTypeLabel = (type) => ({ single: 'Single', double: 'Double', triple: 'Triple', four: 'Four-Person' }[type] || type)
  const getTypeColor = (type) => ({ single: '--primary', double: '--accent', triple: '--warning', four: '--success' }[type] || '--primary')

  const statCards = [
    { label: 'Total Rooms', value: totalRooms, icon: BedIcon, color: '--primary' },
    { label: 'Available', value: availableRooms, icon: CheckCircleIcon, color: '--success' },
    { label: 'Occupied', value: occupiedRooms, icon: UsersIcon, color: '--danger' },
    { label: 'Pending', value: pendingRooms, icon: AlertCircleIcon, color: '--warning' },
  ]

  return (
    <DashboardLayout role="owner">
      <style>{roomPageStyles}</style>

      {/* ── Page Header ──────────────────────── */}
      <div className="rm-header">
        <div>
          <h1 className="rm-title">Rooms Management</h1>
          <p className="rm-subtitle">
            {selectedHostel ? `${selectedHostel.name} — ${selectedHostel.city}` : 'View and manage your hostel rooms'}
          </p>
        </div>
        {hostels.length > 1 && (
          <div className="rm-hostel-select-wrap">
            <BuildingIcon size={16} />
            <select
              className="rm-hostel-select"
              value={selectedHostel?._id || ''}
              onChange={(e) => handleHostelChange(e.target.value)}
            >
              {hostels.map(h => (
                <option key={h._id} value={h._id}>{h.name}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="rm-error">
          <AlertCircleIcon size={16} />
          {error}
        </div>
      )}

      {/* ── Stats Row ────────────────────────── */}
      {!loading && rooms.length > 0 && (
        <div className="rm-stats animate-stagger">
          {statCards.map(({ label, value, icon: StatIcon, color }) => (
            <div key={label} className="stat-card">
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
              <div className="stat-card-number">{value}</div>
              <div className="stat-card-label">{label}</div>
            </div>
          ))}

          {/* Occupancy Bar */}
          <div className="stat-card rm-occupancy-card">
            <div className="stat-card-label" style={{ marginBottom: 'var(--space-3)' }}>Occupancy Rate</div>
            <div className="rm-occupancy-value">
              {totalCapacity > 0 ? Math.round((totalOccupants / totalCapacity) * 100) : 0}%
            </div>
            <div className="rm-occupancy-bar">
              <div
                className="rm-occupancy-fill"
                style={{ width: `${totalCapacity > 0 ? (totalOccupants / totalCapacity) * 100 : 0}%` }}
              />
            </div>
            <div className="rm-occupancy-detail">
              {totalOccupants} of {totalCapacity} beds filled
            </div>
          </div>
        </div>
      )}

      {/* ── Room Cards Grid ──────────────────── */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 'var(--space-16)' }}>
          <div className="spinner spinner-lg" />
        </div>
      ) : rooms.length > 0 ? (
        <div className="rm-grid animate-stagger">
          {rooms.map(room => {
            const occupantCount = room.occupants?.length || 0
            const pendingCount = room.currentBookings?.length || 0
            const roomNumber = room.number || room.roomNumber
            const roomStatus = occupantCount >= room.capacity ? 'occupied'
              : pendingCount > 0 ? 'pending' : 'available'
            const typeColor = getTypeColor(room.type)

            return (
              <div key={room._id} className="rm-card">
                {/* Card Top Stripe */}
                <div className="rm-card-stripe" style={{ background: `var(${typeColor})` }} />

                <div className="rm-card-header">
                  <div className="rm-card-num">
                    <div className="rm-card-icon" style={{
                      color: `var(${typeColor})`,
                      background: `color-mix(in srgb, var(${typeColor}) 10%, transparent)`,
                    }}>
                      <BedIcon size={16} />
                    </div>
                    <div>
                      <div className="rm-card-room-number">Room {roomNumber}</div>
                      <div className="rm-card-type">{getTypeLabel(room.type)}</div>
                    </div>
                  </div>
                  <span className={`rm-status rm-status-${roomStatus}`}>
                    {roomStatus === 'occupied' && 'Full'}
                    {roomStatus === 'pending' && 'Pending'}
                    {roomStatus === 'available' && 'Available'}
                  </span>
                </div>

                <div className="rm-card-body">
                  <div className="rm-card-stats">
                    <div className="rm-card-stat">
                      <span className="rm-card-stat-label">Capacity</span>
                      <span className="rm-card-stat-value">{room.capacity}</span>
                    </div>
                    <div className="rm-card-stat">
                      <span className="rm-card-stat-label">Occupied</span>
                      <span className="rm-card-stat-value">{occupantCount}/{room.capacity}</span>
                    </div>
                    <div className="rm-card-stat">
                      <span className="rm-card-stat-label">Rent</span>
                      <span className="rm-card-stat-value rm-price">₹{room.rent?.toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Occupancy Bar */}
                  <div className="rm-mini-bar">
                    <div className="rm-mini-fill" style={{
                      width: `${room.capacity > 0 ? (occupantCount / room.capacity) * 100 : 0}%`,
                      background: occupantCount >= room.capacity ? 'var(--danger)' : 'var(--success)',
                    }} />
                  </div>

                  {/* Occupants */}
                  {(occupantCount > 0 || pendingCount > 0) && (
                    <div className="rm-occupants">
                      <div className="rm-occupants-title">
                        <UserIcon size={12} />
                        Occupants ({occupantCount + pendingCount})
                      </div>
                      {room.occupants?.map((occ) => (
                        <div key={occ._id} className="rm-occupant">
                          <div className="avatar avatar-sm">{(occ.name || 'U').charAt(0).toUpperCase()}</div>
                          <div className="rm-occupant-info">
                            <div className="rm-occupant-name">{occ.name}</div>
                            <div className="rm-occupant-email">{occ.email}</div>
                          </div>
                        </div>
                      ))}
                      {room.currentBookings?.map((booking) => (
                        <div key={booking._id} className="rm-occupant rm-occupant-pending">
                          <div className="avatar avatar-sm" style={{ background: 'var(--warning)' }}>
                            {(booking.student?.name || 'U').charAt(0).toUpperCase()}
                          </div>
                          <div className="rm-occupant-info">
                            <div className="rm-occupant-name">
                              {booking.student?.name || 'Unknown'}
                              <span className="badge badge-warning" style={{ marginLeft: 'var(--space-2)', fontSize: '0.6rem' }}>PENDING</span>
                            </div>
                            <div className="rm-occupant-email">{booking.student?.email || 'N/A'}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {occupantCount === 0 && pendingCount === 0 && (
                    <div className="rm-no-occupants">No occupants yet</div>
                  )}
                </div>

                <div className="rm-card-footer">
                  <button className="btn btn-outline btn-sm" onClick={() => handleEditRoom(room)}>
                    <EditIcon size={14} /> Edit
                  </button>
                  <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRoom(room._id)}>
                    <TrashIcon size={14} /> Delete
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="card" style={{ border: '1px dashed var(--border)' }}>
          <div className="empty-state">
            <div className="empty-state-icon"><BedIcon size={28} /></div>
            <h3 className="empty-state-title">No Rooms Found</h3>
            <p className="empty-state-text">
              {error || 'Add a hostel and configure rooms to get started.'}
            </p>
          </div>
        </div>
      )}

      {/* ── Edit Modal ───────────────────────── */}
      {editingRoom && (
        <div className="modal-overlay" onClick={handleCancelEdit}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Edit Room #{formData.roomNumber}</h3>
              <button className="btn btn-ghost btn-icon btn-sm" onClick={handleCancelEdit}>
                <XIcon size={18} />
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
                Update the monthly rent for this room.
              </p>
              <div className="form-group">
                <label className="form-label">Monthly Rent (₹)</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.rent}
                  onChange={(e) => setFormData({ ...formData, rent: e.target.value })}
                  min="0"
                  placeholder="Enter amount"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={handleCancelEdit} className="btn btn-secondary">Cancel</button>
              <button onClick={handleSaveRoom} className="btn btn-primary">Save Changes</button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}

/* ═══════════════════════════════════════════════════════════════
   STYLES — Uses global design tokens from index.css
   ═══════════════════════════════════════════════════════════════ */
const roomPageStyles = `
  /* ── Header ────────────────────────────── */
  .rm-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-8);
    gap: var(--space-4);
    flex-wrap: wrap;
  }

  .rm-title {
    font-size: var(--text-3xl);
    font-weight: 700;
    letter-spacing: var(--tracking-tighter);
    margin-bottom: var(--space-1);
  }

  .rm-subtitle {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .rm-hostel-select-wrap {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-md);
    color: var(--text-secondary);
  }

  .rm-hostel-select {
    border: none;
    background: transparent;
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text);
    cursor: pointer;
    outline: none;
    font-family: inherit;
    min-width: 150px;
  }

  .rm-error {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    background: var(--danger-light);
    color: var(--danger-dark);
    padding: var(--space-3) var(--space-4);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-6);
    font-size: var(--text-sm);
    font-weight: 500;
    border-left: 3px solid var(--danger);
  }

  body.dark-mode .rm-error,
  body.dark-theme .rm-error {
    color: var(--danger);
  }

  /* ── Stats ─────────────────────────────── */
  .rm-stats {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: var(--space-4);
    margin-bottom: var(--space-8);
  }

  .rm-occupancy-card {
    display: flex;
    flex-direction: column;
    justify-content: center;
  }

  .rm-occupancy-value {
    font-size: var(--text-3xl);
    font-weight: 800;
    letter-spacing: var(--tracking-tighter);
    color: var(--text);
    margin-bottom: var(--space-2);
  }

  .rm-occupancy-bar {
    height: 6px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-full);
    overflow: hidden;
    margin-bottom: var(--space-2);
  }

  .rm-occupancy-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--success), var(--primary));
    border-radius: var(--radius-full);
    transition: width 0.6s var(--ease-out);
  }

  .rm-occupancy-detail {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  /* ── Grid ───────────────────────────────── */
  .rm-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: var(--space-5);
  }

  /* ── Room Card ─────────────────────────── */
  .rm-card {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    overflow: hidden;
    transition: all var(--duration-normal) var(--ease-default);
    position: relative;
  }

  .rm-card:hover {
    border-color: var(--primary-200);
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }

  .rm-card-stripe {
    height: 3px;
    width: 100%;
  }

  .rm-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: var(--space-5) var(--space-5) 0;
  }

  .rm-card-num {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .rm-card-icon {
    width: 36px;
    height: 36px;
    border-radius: var(--radius-md);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .rm-card-room-number {
    font-weight: 700;
    font-size: var(--text-base);
    letter-spacing: var(--tracking-tight);
  }

  .rm-card-type {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    font-weight: 500;
  }

  /* Status Badges */
  .rm-status {
    padding: 0.2rem 0.625rem;
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    font-weight: 600;
    letter-spacing: 0.02em;
  }

  .rm-status-available { background: var(--success-light); color: var(--success-dark); }
  .rm-status-occupied { background: var(--danger-light); color: var(--danger-dark); }
  .rm-status-pending { background: var(--warning-light); color: var(--warning-dark); }

  body.dark-mode .rm-status-available, body.dark-theme .rm-status-available { color: var(--success); }
  body.dark-mode .rm-status-occupied, body.dark-theme .rm-status-occupied { color: var(--danger); }
  body.dark-mode .rm-status-pending, body.dark-theme .rm-status-pending { color: var(--warning); }

  /* Card Body */
  .rm-card-body {
    padding: var(--space-5);
  }

  .rm-card-stats {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: var(--space-3);
    padding-bottom: var(--space-4);
    border-bottom: 1px solid var(--border-light);
  }

  .rm-card-stat {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .rm-card-stat-label {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  .rm-card-stat-value {
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--text);
  }

  .rm-price {
    color: var(--success-dark) !important;
  }

  body.dark-mode .rm-price, body.dark-theme .rm-price {
    color: var(--success) !important;
  }

  /* Mini occupancy bar */
  .rm-mini-bar {
    height: 4px;
    background: var(--bg-tertiary);
    border-radius: var(--radius-full);
    overflow: hidden;
    margin-top: var(--space-4);
  }

  .rm-mini-fill {
    height: 100%;
    border-radius: var(--radius-full);
    transition: width 0.5s var(--ease-out);
  }

  /* Occupants */
  .rm-occupants {
    margin-top: var(--space-4);
  }

  .rm-occupants-title {
    display: flex;
    align-items: center;
    gap: var(--space-1-5);
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-tertiary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--space-3);
  }

  .rm-occupant {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-2-5);
    border-radius: var(--radius-md);
    margin-bottom: var(--space-2);
    transition: background 0.15s;
  }

  .rm-occupant:hover {
    background: var(--bg-tertiary);
  }

  .rm-occupant-pending {
    background: var(--warning-light);
    border: 1px solid color-mix(in srgb, var(--warning) 20%, transparent);
  }

  body.dark-mode .rm-occupant-pending,
  body.dark-theme .rm-occupant-pending {
    background: rgba(245, 158, 11, 0.08);
    border-color: rgba(245, 158, 11, 0.15);
  }

  .rm-occupant-info {
    min-width: 0;
    flex: 1;
  }

  .rm-occupant-name {
    font-size: var(--text-sm);
    font-weight: 600;
    display: flex;
    align-items: center;
  }

  .rm-occupant-email {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .rm-no-occupants {
    margin-top: var(--space-4);
    padding: var(--space-3);
    background: var(--bg-secondary);
    border-radius: var(--radius);
    font-size: var(--text-xs);
    color: var(--text-muted);
    text-align: center;
    font-style: italic;
  }

  /* Card Footer */
  .rm-card-footer {
    display: flex;
    gap: var(--space-2);
    padding: 0 var(--space-5) var(--space-5);
  }

  .rm-card-footer .btn {
    flex: 1;
  }

  /* ── Responsive ────────────────────────── */
  @media (max-width: 1200px) {
    .rm-stats {
      grid-template-columns: repeat(3, 1fr);
    }
  }

  @media (max-width: 768px) {
    .rm-header {
      flex-direction: column;
    }

    .rm-stats {
      grid-template-columns: repeat(2, 1fr);
    }

    .rm-grid {
      grid-template-columns: 1fr;
    }

    .rm-title {
      font-size: var(--text-2xl);
    }
  }

  @media (max-width: 480px) {
    .rm-stats {
      grid-template-columns: 1fr;
    }
  }
`;
