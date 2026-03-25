import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { roomsAPI, studentsAPI } from '../services/api'

/**
 * Reusable Room Allocation component
 * Props:
 * - title: string (e.g., "Double Sharing Allocation")
 * - roomType: string ('double', 'triple', 'four')
 * - capacity: number (2/3/4)
 */
export default function RoomAllocation({ title, roomType, capacity }) {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [filter, setFilter] = useState('all')
  const [current, setCurrent] = useState(null)
  const [photoData, setPhotoData] = useState(null)
  const [night, setNight] = useState(() => localStorage.getItem('nightMode') === 'true')

  // Fetch rooms from MongoDB
  useEffect(() => {
    fetchRooms()
  }, [roomType])

  async function fetchRooms() {
    setLoading(true)
    setError('')
    console.log('Fetching rooms for type:', roomType)
    
    const result = await roomsAPI.getByType(roomType)
    console.log('API Result:', result)
    
    if (result.success) {
      console.log('Rooms fetched:', result.rooms.length)
      setRooms(result.rooms)
    } else {
      console.error('Failed to fetch rooms:', result.message)
      setError(result.message || 'Failed to load rooms')
    }
    setLoading(false)
  }

  useEffect(() => {
    document.body.classList.toggle('night-mode', night)
    localStorage.setItem('nightMode', night)
  }, [night])

  const filtered = useMemo(() => {
    if (filter === 'all') return rooms
    return rooms.filter(r => r.status === filter)
  }, [rooms, filter])

  // Allocate student to room
  async function allocate(form) {
    if (!current) return
    const fields = ['name','id','email','phone','address','course','year','gender','dob','emergencyName','emergencyPhone','notes']
    const v = Object.fromEntries(fields.map(f => [f, form.get(f)]))
    
    // Only require essential fields
    if (!v.name || !v.id || !v.phone) {
      alert('Please fill required fields: Name, Student ID, and Phone')
      return
    }

    if (current.occupants.length >= current.capacity) {
      alert(`Room is at full capacity (${current.capacity})`)
      return
    }

    console.log('Current room data:', current);
    console.log('Room type:', current.type);

    const studentData = {
      name: v.name,
      studentId: v.id,
      email: v.email || '',
      phone: v.phone,
      address: v.address || '',
      dob: v.dob || null,
      photo: photoData || null,
      roomType: current.type.toLowerCase(),
      roomNumber: current.number,
    }

    console.log('Sending student data:', studentData);

    const result = await studentsAPI.add(studentData)
    
    console.log('API response:', result);
    
    if (result.success) {
      alert(`Allocated ${studentData.name} to Room ${current.number}`)
      fetchRooms() // Refresh rooms
      setCurrent(null) // Close modal
      setPhotoData(null)
    } else {
      alert(result.message || 'Failed to allocate student')
    }
  }

  async function removeOccupant(studentId) {
    if (!current) return
    
    const result = await studentsAPI.remove(studentId)
    
    if (result.success) {
      alert('Student removed successfully')
      fetchRooms() // Refresh rooms
      setCurrent(null)
    } else {
      alert(result.message || 'Failed to remove student')
    }
  }

  async function deallocateAll() {
    if (!current) return
    if (!confirm(`Are you sure you want to deallocate all ${current.occupants.length} students from Room ${current.number}?`)) return
    
    // Remove all students in this room
    for (const occupant of current.occupants) {
      await studentsAPI.remove(occupant._id)
    }
    
    alert('All students deallocated successfully')
    fetchRooms() // Refresh rooms
    setCurrent(null)
  }

  async function changeStatus(newStatus) {
    if (!current) return
    
    if (newStatus === 'available' && current.occupants.length > 0) {
      return alert('Cannot set to Available with occupants')
    }
    if (newStatus === 'occupied' && current.occupants.length === 0) {
      return alert('Cannot set to Occupied without occupants')
    }
    
    const result = await roomsAPI.updateStatus(current._id, newStatus)
    
    if (result.success) {
      alert('Room status updated successfully')
      fetchRooms() // Refresh rooms
      setCurrent(null)
    } else {
      alert(result.message || 'Failed to update room status')
    }
  }

  // UI below keeps original structure, trimmed for brevity
  return (
    <div>
      <style>{`
        /* Colorful Dark Room Allocation UI */
        body { 
          background: #1a1a1a;
          color: #fff;
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          padding: 20px;
        }
        .container{max-width:1400px;margin:0 auto}
        
        /* Stats Dashboard */
        .dashboard{
          display:grid;
          grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
          gap:20px;
          margin-bottom:30px;
          padding:20px;
          background:#2a2a2a;
          border-radius:12px;
        }
        .stat-card{
          background:linear-gradient(135deg,#667eea,#764ba2);
          padding:30px;
          border-radius:12px;
          text-align:center;
          color:#fff;
        }
        .stat-card.total{background:#3498db}
        .stat-card.available{background:#2ecc71}
        .stat-card.occupied{background:#e74c3c}
        .stat-card.reserved{background:#9b59b6}
        .stat-card .count{font-size:3rem;font-weight:bold;margin-bottom:10px}
        .stat-card .label{font-size:1rem;text-transform:uppercase;letter-spacing:1px;opacity:0.9}
        
        /* Room Grid */
        .room-grid{
          display:grid;
          grid-template-columns:repeat(auto-fill,minmax(160px,1fr));
          gap:20px;
          margin-bottom:30px;
        }
        
        /* Room Cards with Colored Borders */
        .room-box{
          background:#2a2a2a;
          padding:20px;
          border-radius:12px;
          text-align:center;
          cursor:pointer;
          transition:all .3s ease;
          border:3px solid transparent;
          position:relative;
        }
        .room-box:hover{
          transform:translateY(-5px);
          box-shadow:0 10px 30px rgba(0,0,0,.5);
        }
        .room-box.available{border-color:#2ecc71;border-top-width:5px}
        .room-box.occupied{border-color:#e74c3c;border-top-width:5px}
        .room-box.reserved{border-color:#9b59b6;border-top-width:5px}
        .room-box.maintenance{border-color:#f39c12;border-top-width:5px}
        
        .room-number{font-size:1.8rem;font-weight:bold;margin-bottom:8px;color:#fff}
        .room-status{
          font-weight:600;
          margin-bottom:10px;
          padding:5px 10px;
          border-radius:20px;
          display:inline-block;
          font-size:0.85rem;
          text-transform:uppercase;
          letter-spacing:0.5px;
        }
        .room-box.available .room-status{background:#2ecc71;color:#fff}
        .room-box.occupied .room-status{background:#e74c3c;color:#fff}
        .room-box.reserved .room-status{background:#9b59b6;color:#fff}
        .room-box.maintenance .room-status{background:#f39c12;color:#fff}
        
        .occupants{color:#aaa;font-size:0.9rem}
        
        /* Filter Buttons */
        .filters{
          display:flex;
          gap:15px;
          margin-bottom:25px;
          flex-wrap:wrap;
          justify-content:center;
          background:#2a2a2a;
          padding:15px;
          border-radius:12px;
        }
        .filter-btn{
          padding:12px 30px;
          border-radius:30px;
          border:none;
          color:#fff;
          font-weight:600;
          cursor:pointer;
          transition:all 0.3s;
          text-transform:capitalize;
        }
        .filter-btn:hover{transform:scale(1.05)}
        
        /* Modal */
        .modal{
          display:${current?'block':'none'};
          position:fixed;
          z-index:1000;
          left:0;
          top:0;
          width:100%;
          height:100%;
          background:rgba(0,0,0,.8);
          backdrop-filter:blur(5px);
        }
        .modal-content{
          background:#2a2a2a;
          color:#fff;
          margin:3% auto;
          padding:35px;
          border-radius:15px;
          width:650px;
          max-width:95%;
          position:relative;
          max-height:85vh;
          overflow-y:auto;
          border:2px solid #444;
        }
        .modal-content h2{
          margin:0 0 25px 0;
          padding-bottom:15px;
          border-bottom:2px solid #444;
          color:#fff;
        }
        .modal-content h3{
          margin:30px 0 20px 0;
          color:#fff;
          font-size:1.3rem;
        }
        .close-btn{
          position:absolute;
          top:15px;
          right:20px;
          cursor:pointer;
          font-size:28px;
          color:#fff;
          transition:color 0.3s;
        }
        .close-btn:hover{color:#e74c3c}
        
        /* Form Styles */
        .form-row{
          display:flex;
          gap:15px;
          margin-bottom:0;
        }
        .form-row > *{
          flex:1;
          margin-bottom:0;
        }
        .form-group{
          margin-bottom:20px;
          flex:1;
        }
        .form-group label{
          display:block;
          margin-bottom:8px;
          color:#aaa;
          font-weight:600;
          font-size:14px;
        }
        .form-group input, 
        .form-group select, 
        .form-group textarea{
          width:100%;
          padding:12px;
          border:2px solid #444;
          border-radius:8px;
          background:#1a1a1a;
          color:#fff;
          font-size:14px;
          box-sizing:border-box;
        }
        .form-group input:focus, 
        .form-group select:focus, 
        .form-group textarea:focus{
          outline:none;
          border-color:#667eea;
        }
        .form-group input[type="file"]{
          padding:8px;
          border-style:dashed;
        }
        
        /* Buttons */
        .action-buttons{
          display:flex;
          gap:15px;
          margin-top:25px;
          flex-wrap:wrap;
        }
        .btn{
          padding:14px 28px;
          border:none;
          border-radius:8px;
          font-weight:700;
          font-size:15px;
          cursor:pointer;
          transition:all 0.3s;
          flex:1;
          min-width:150px;
          text-transform:uppercase;
          letter-spacing:0.5px;
        }
        .btn:hover{
          transform:translateY(-2px);
          box-shadow:0 8px 20px rgba(0,0,0,.5);
        }
        .btn-success{
          background:#2ecc71;
          color:#fff;
          box-shadow:0 4px 15px rgba(46,204,113,0.4);
        }
        .btn-success:hover{
          background:#27ae60;
          box-shadow:0 8px 25px rgba(46,204,113,0.6);
        }
        .btn-danger{
          background:#e74c3c;
          color:#fff;
          box-shadow:0 4px 15px rgba(231,76,60,0.5);
        }
        .btn-danger:hover{
          background:#c0392b;
          box-shadow:0 8px 25px rgba(231,76,60,0.7);
        }
        .btn-secondary{
          background:#95a5a6;
          color:#fff;
        }
        .btn-warning{
          background:#f39c12;
          color:#fff;
        }
        .btn-primary{
          background:#3498db;
          color:#fff;
        }
        
        /* Header */
        .page-header{
          display:flex;
          justify-content:space-between;
          align-items:center;
          margin-bottom:30px;
          flex-wrap:wrap;
          gap:15px;
          background:#2a2a2a;
          padding:20px;
          border-radius:12px;
        }
        .page-header h1{
          margin:0;
          flex:1;
          color:#fff;
          display:flex;
          align-items:center;
          gap:10px;
        }
        .page-header h1::before{content:'🏠';font-size:2rem}
        .header-controls{display:flex;gap:10px;align-items:center}
        .back-btn{
          display:inline-flex;
          align-items:center;
          gap:8px;
          padding:12px 24px;
          background:linear-gradient(135deg,#667eea,#764ba2);
          color:white;
          text-decoration:none;
          border-radius:25px;
          font-weight:600;
          transition:all 0.3s;
          box-shadow:0 4px 15px rgba(102,126,234,0.4);
        }
        .back-btn:hover{
          transform:translateY(-2px);
          box-shadow:0 6px 20px rgba(102,126,234,0.6);
        }
        .theme-toggle{
          position:static;
          padding:12px 24px;
          border-radius:25px;
          background:#3498db;
          color:white;
          border:none;
          cursor:pointer;
          font-size:16px;
          font-weight:600;
          transition:all 0.3s;
          box-shadow:0 4px 15px rgba(52,152,219,0.4);
        }
        .theme-toggle:hover{
          background:#2980b9;
          transform:translateY(-2px);
          box-shadow:0 6px 20px rgba(52,152,219,0.6);
        }
        
        /* Occupant List */
        .occupant-list{
          border:2px solid #444;
          border-radius:8px;
          padding:15px;
          margin-bottom:20px;
          background:#1a1a1a;
        }
        .occupant-item{
          display:flex;
          justify-content:space-between;
          padding:15px 0;
          border-bottom:1px solid #444;
          align-items:center;
        }
        .occupant-item:last-child{border-bottom:none}
        .occupant-name{font-weight:600;margin-bottom:5px;color:#fff}
        .occupant-info{font-size:12px;color:#aaa}
        .remove-occupant{
          color:#e74c3c;
          background:none;
          border:none;
          cursor:pointer;
          font-weight:600;
          padding:8px 16px;
          border-radius:6px;
          transition:all 0.3s;
        }
        .remove-occupant:hover{background:#e74c3c;color:#fff}
        
        /* Modal Details */
        .modal-details{margin:20px 0}
        .detail-row{display:flex;gap:12px;margin-bottom:12px;padding:10px;background:#1a1a1a;border-radius:6px}
        .detail-label{width:120px;font-weight:600;color:#aaa}
        .detail-value{flex:1;color:#fff}
        .detail-value.status-available{color:#2ecc71}
        .detail-value.status-occupied{color:#e74c3c}
        .detail-value.status-reserved{color:#9b59b6}
        .detail-value.status-maintenance{color:#f39c12}
        
        @media(max-width:768px){
          .page-header{flex-direction:column;align-items:stretch}
          .page-header h1{text-align:center;font-size:1.5rem;justify-content:center}
          .header-controls{flex-direction:column;width:100%}
          .theme-toggle, .back-btn{width:100%;justify-content:center}
          .dashboard{grid-template-columns:1fr}
          .room-grid{grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:15px}
          .form-row{flex-direction:column}
          .action-buttons{flex-direction:column}
          .btn{width:100%}
        }
      `}</style>

      <div className="container">
        <div className="page-header">
          <h1>{title}</h1>
          <div className="header-controls">
            <button className="theme-toggle" onClick={() => setNight(n => !n)}>
              {night ? '☀️ Light' : '🌙 Night'} Mode
            </button>
            <Link to="/admin" className="back-btn">
              ← Back to Dashboard
            </Link>
          </div>
        </div>

        {loading ? (
          <div style={{textAlign:'center',padding:'60px',fontSize:'1.5rem',color:'#aaa'}}>
            ⏳ Loading rooms...
          </div>
        ) : error ? (
          <div style={{textAlign:'center',padding:'60px'}}>
            <div style={{fontSize:'3rem',marginBottom:'20px'}}>⚠️</div>
            <div style={{fontSize:'1.3rem',color:'#e74c3c',marginBottom:'10px'}}>{error}</div>
            <div style={{fontSize:'1rem',color:'#aaa',marginBottom:'20px'}}>
              Make sure you're logged in and have registered with room configuration.
            </div>
            <button 
              onClick={fetchRooms} 
              style={{
                padding:'12px 24px',
                background:'#3498db',
                color:'white',
                border:'none',
                borderRadius:'8px',
                cursor:'pointer',
                fontSize:'1rem',
                fontWeight:'600'
              }}
            >
              🔄 Retry
            </button>
          </div>
        ) : rooms.length === 0 ? (
          <div style={{textAlign:'center',padding:'60px'}}>
            <div style={{fontSize:'3rem',marginBottom:'20px'}}>📭</div>
            <div style={{fontSize:'1.3rem',color:'#aaa',marginBottom:'10px'}}>No rooms found</div>
            <div style={{fontSize:'1rem',color:'#888'}}>
              Please register first to set up your rooms, or check if you're logged in correctly.
            </div>
          </div>
        ) : (
          <>
            <div className="dashboard">
              <div className="stat-card total">
                <div className="count">{rooms.length}</div>
                <div className="label">Total Rooms</div>
              </div>
              <div className="stat-card available">
                <div className="count">{rooms.filter(r=>r.status==='available').length}</div>
                <div className="label">Available</div>
              </div>
              <div className="stat-card occupied">
                <div className="count">{rooms.filter(r=>r.status==='occupied').length}</div>
                <div className="label">Occupied</div>
              </div>
              <div className="stat-card reserved">
                <div className="count">{rooms.filter(r=>r.status==='reserved').length}</div>
                <div className="label">Reserved</div>
              </div>
            </div>

            <div className="filters" style={{display:'flex',gap:15,marginBottom:25,flexWrap:'wrap',justifyContent:'center'}}>
              {['all','available','occupied','reserved'].map(f => (
                <button key={f} className={`filter-btn ${f}`} onClick={()=>setFilter(f)} style={{padding:'10px 20px',borderRadius:30,border:'none',color:'#fff',background:f==='all'?'#3498db':f==='available'?'#2ecc71':f==='occupied'?'#e74c3c':'#9b59b6',opacity:filter===f?1:0.8}}>
                  {f==='all'?'All Rooms':f.charAt(0).toUpperCase()+f.slice(1)}
                </button>
              ))}
            </div>

            <div className="room-grid">
              {filtered.map(room => (
                <div key={room._id || room.number} className={`room-box ${room.status}`} onClick={()=>{setCurrent(room); setPhotoData(null)}}>
                  <div className="room-number" style={{fontSize:'1.5rem',fontWeight:'bold',marginBottom:5}}>{room.number}</div>
                  <div className="room-status" style={{fontWeight:600,marginBottom:10}}>{room.status.charAt(0).toUpperCase()+room.status.slice(1)}</div>
                  <div className="occupants">Occupants: {room.occupants.length}/{room.capacity}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Modal */}
      <div className="modal" onClick={(e)=>{ if(e.target.className==='modal') setCurrent(null) }}>
        <div className="modal-content">
          <span className="close-btn" onClick={()=>setCurrent(null)}>&times;</span>
          {current && (
            <div>
              <h2>Room {current.number} — {current.type}</h2>

              <div className="modal-details">
                <div className="detail-row" style={{display:'flex',gap:12,marginBottom:12}}>
                  <div className="detail-label" style={{width:120,fontWeight:600,color:'#7f8c8d'}}>Status:</div>
                  <div className={`detail-value status-${current.status}`} style={{flex:1}}>{current.status}</div>
                </div>
                <div className="detail-row" style={{display:'flex',gap:12,marginBottom:12}}>
                  <div className="detail-label" style={{width:120,fontWeight:600,color:'#7f8c8d'}}>Capacity:</div>
                  <div className="detail-value" style={{flex:1}}>{current.capacity}</div>
                </div>
                <div className="detail-row" style={{display:'flex',gap:12,marginBottom:12}}>
                  <div className="detail-label" style={{width:120,fontWeight:600,color:'#7f8c8d'}}>Occupants:</div>
                  <div className="detail-value" style={{flex:1}}>{current.occupants.length}/{current.capacity}</div>
                </div>
              </div>

              <div className="occupant-list" style={{border:'1px solid #ecf0f1',borderRadius:6,padding:10,marginBottom:20}}>
                {current.occupants.length===0 ? (
                  <div style={{textAlign:'center',color:'#95a5a6'}}>No occupants</div>
                ) : current.occupants.map((o, idx) => (
                  <div key={o._id || idx} className="occupant-item" style={{display:'flex',justifyContent:'space-between',padding:'10px 0',borderBottom:'1px solid #ecf0f1'}}>
                    <div>
                      <div className="occupant-name" style={{fontWeight:600}}>{o.name} ({o.studentId})</div>
                      <div className="occupant-info" style={{fontSize:12,color:'#7f8c8d'}}>
                        {o.email} · {o.phone} · {o.course} {o.year}
                      </div>
                    </div>
                    <button className="remove-occupant" onClick={()=>removeOccupant(o._id)} style={{color:'#e74c3c',background:'none',border:'none'}}>Remove</button>
                  </div>
                ))}
              </div>

              <h3>Add New Student</h3>
              <form onSubmit={(e)=>{e.preventDefault(); allocate(new FormData(e.currentTarget))}}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Full Name*</label>
                    <input name="name" placeholder="Enter full name" required />
                  </div>
                  <div className="form-group">
                    <label>Student ID*</label>
                    <input name="id" placeholder="Enter student ID" required />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Email</label>
                    <input name="email" type="email" placeholder="Enter email" />
                  </div>
                  <div className="form-group">
                    <label>Phone*</label>
                    <input name="phone" placeholder="Enter phone" required />
                  </div>
                </div>
                <div className="form-group">
                  <label>Permanent Address</label>
                  <textarea name="address" rows={2} placeholder="Enter permanent address" />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Course</label>
                    <select name="course" defaultValue="">
                      <option value="">Select course</option>
                      <option>Computer Science</option>
                      <option>Electrical Engineering</option>
                      <option>Mechanical Engineering</option>
                      <option>Business Administration</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Year of Study</label>
                    <select name="year" defaultValue="">
                      <option value="">Select year</option>
                      <option>1st Year</option>
                      <option>2nd Year</option>
                      <option>3rd Year</option>
                      <option>4th Year</option>
                      <option>5th Year</option>
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Gender</label>
                    <select name="gender" defaultValue="">
                      <option value="">Select gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                      <option>Prefer not to say</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date of Birth</label>
                    <input name="dob" type="date" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Emergency Contact</label>
                  <div className="form-row">
                    <input name="emergencyName" placeholder="Contact name" />
                    <input name="emergencyPhone" placeholder="Phone number" />
                  </div>
                </div>
                <div className="form-group">
                  <label>Notes</label>
                  <textarea name="notes" rows={2} placeholder="Any special requirements or notes" />
                </div>

                <div className="form-group">
                  <label>Profile Photo (Optional - Max 2MB)</label>
                  <input type="file" accept="image/*" onChange={(e)=>{
                    const f=e.target.files?.[0]; 
                    if(!f) return;
                    
                    // Check file size (2MB limit)
                    if(f.size > 2 * 1024 * 1024) {
                      alert('Image size should be less than 2MB');
                      e.target.value = '';
                      return;
                    }
                    
                    // Compress image before upload
                    const r=new FileReader(); 
                    r.onload = ev => {
                      const img = new Image();
                      img.onload = () => {
                        const canvas = document.createElement('canvas');
                        const ctx = canvas.getContext('2d');
                        
                        // Resize to max 400x400
                        let width = img.width;
                        let height = img.height;
                        const maxSize = 400;
                        
                        if (width > height && width > maxSize) {
                          height = (height * maxSize) / width;
                          width = maxSize;
                        } else if (height > maxSize) {
                          width = (width * maxSize) / height;
                          height = maxSize;
                        }
                        
                        canvas.width = width;
                        canvas.height = height;
                        ctx.drawImage(img, 0, 0, width, height);
                        
                        // Convert to base64 with compression
                        const compressed = canvas.toDataURL('image/jpeg', 0.7);
                        setPhotoData(compressed);
                      };
                      img.src = ev.target.result;
                    };
                    r.readAsDataURL(f);
                  }}/>
                </div>

                <div className="action-buttons">
                  <button type="submit" className="btn btn-success">✓ Allocate Student</button>
                </div>
              </form>

              <div style={{marginTop:30,paddingTop:30,borderTop:'3px solid #444'}}>
                <h3 style={{marginBottom:20}}>Room Management</h3>
                <div className="form-group" style={{marginBottom:20}}>
                  <label>Change Room Status</label>
                  <select value={current.status} onChange={(e)=>changeStatus(e.target.value)}>
                    <option value="available">Available</option>
                    <option value="occupied">Occupied</option>
                    <option value="reserved">Reserved</option>
                  </select>
                </div>

                <div className="action-buttons">
                  <button type="button" className="btn btn-danger" onClick={deallocateAll}>✕ Deallocate All Students</button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
