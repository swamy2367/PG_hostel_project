import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { studentsAPI, feesAPI } from '../services/api'

export default function FeeManagement(){
  const [search, setSearch] = useState('')
  const [students, setStudents] = useState([])
  const [roomFilter, setRoomFilter] = useState('double')
  const [showPayModal, setShowPayModal] = useState(false)
  const [showHistoryModal, setShowHistoryModal] = useState(false)
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [paymentForm, setPaymentForm] = useState({
    amount: '',
    date: new Date().toISOString().split('T')[0],
    method: 'Cash',
    reference: ''
  })

  useEffect(()=>{
    const savedTheme = localStorage.getItem('theme')
    document.body.classList.toggle('dark-mode', savedTheme === 'dark')
    fetchStudents()
  },[])

  async function fetchStudents() {
    const result = await studentsAPI.getAll()
    if (result.success) {
      setStudents(result.students || [])
    }
  }

  const filtered = students.filter(s => {
    if (s.roomType !== roomFilter) return false
    const q = search.toLowerCase().trim()
    if (!q) return true
    return (
      (s.name||'').toLowerCase().includes(q) ||
      (s.studentId||'').toLowerCase().includes(q)
    )
  })

  function openPayModal(student) {
    const monthlyFee = student.rent || 5000
    const totalPaid = student.totalPaid || 0
    const due = monthlyFee - totalPaid
    setSelectedStudent({...student, monthlyFee, totalPaid})
    setPaymentForm({
      amount: due > 0 ? due : 0,
      date: new Date().toISOString().split('T')[0],
      method: 'Cash',
      reference: ''
    })
    setShowPayModal(true)
  }

  function openHistoryModal(student) {
    setSelectedStudent(student)
    setShowHistoryModal(true)
  }

  function closeModals() {
    setShowPayModal(false)
    setShowHistoryModal(false)
    setSelectedStudent(null)
  }

  async function recordPayment() {
    if (!selectedStudent || !paymentForm.amount || paymentForm.amount <= 0) {
      alert('Please enter a valid amount')
      return
    }

    const paymentData = {
      studentId: selectedStudent.studentId,
      amount: paymentForm.amount,
      date: paymentForm.date,
      method: paymentForm.method,
      reference: paymentForm.reference
    }

    const result = await feesAPI.addPayment(paymentData)
    
    if (result.success) {
      alert('Payment recorded successfully!')
      closeModals()
      fetchStudents()
    } else {
      alert(result.message || 'Failed to record payment')
    }
  }

  const getStatus = (student) => {
    const monthlyFee = student.rent || 5000
    const totalPaid = student.totalPaid || 0
    const due = monthlyFee - totalPaid
    if (due <= 0) return { text: 'Paid', class: 'status-paid' }
    if (due === monthlyFee) return { text: 'Unpaid', class: 'status-unpaid' }
    return { text: 'Partial', class: 'status-partial' }
  }

  const styles = `
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    body {
      background-color: #1a1a1a;
      color: #e0e0e0;
      padding: 20px;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .fee-container {
      max-width: 1600px;
      margin: 0 auto;
      background-color: #2d2d2d;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    }

    .fee-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
      flex-wrap: wrap;
      gap: 1rem;
    }

    .fee-title {
      color: #f5f5f5;
      font-size: 2.2rem;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .room-type-nav {
      display: flex;
      background-color: #1a1a1a;
      border-radius: 25px;
      padding: 5px;
    }

    .nav-btn {
      background: none;
      border: none;
      color: #a0a0a0;
      font-size: 1rem;
      font-weight: 600;
      padding: 10px 20px;
      border-radius: 20px;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .nav-btn.active,
    .nav-btn:hover {
      background-color: #3498db;
      color: #fff;
    }

    .search-container {
      position: relative;
      margin-bottom: 20px;
      width: 50%;
      max-width: 600px;
    }

    .search-icon {
      position: absolute;
      left: 15px;
      top: 50%;
      transform: translateY(-50%);
      color: #777;
    }

    .search-input {
      width: 100%;
      padding: 12px 12px 12px 40px;
      border-radius: 25px;
      border: none;
      background-color: #1a1a1a;
      color: #e0e0e0;
      font-size: 1rem;
      outline: none;
      transition: all 0.3s ease;
    }

    .search-input:focus {
      background-color: #3d3d3d;
      box-shadow: 0 0 0 2px #3498db;
    }

    .table-container {
      width: 100%;
      overflow-x: auto;
    }

    table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }

    th, td {
      padding: 15px;
      border-bottom: 1px solid #3d3d3d;
      vertical-align: middle;
    }

    th {
      background-color: #3d3d3d;
      color: #3498db;
      text-transform: uppercase;
      font-size: 0.9rem;
      letter-spacing: 0.5px;
    }

    td {
      color: #c0c0c0;
    }

    tr:hover {
      background-color: #333;
    }

    .student-photo {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background-color: #555;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .student-photo img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .btn {
      padding: 8px 12px;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.3s ease;
      margin-right: 5px;
    }

    .btn-pay {
      background-color: #3498db;
      color: white;
    }

    .btn-pay:hover {
      background-color: #2980b9;
    }

    .btn-history {
      background-color: #444;
      color: #e0e0e0;
    }

    .btn-history:hover {
      background-color: #555;
    }

    .status-badge {
      display: inline-block;
      padding: 5px 12px;
      border-radius: 15px;
      font-weight: 700;
      font-size: 0.85rem;
      text-transform: uppercase;
    }

    .status-paid {
      background-color: #1e3a2a;
      color: #2ecc71;
    }

    .status-unpaid {
      background-color: #3a1e1e;
      color: #e74c3c;
    }

    .status-partial {
      background-color: #3a2a1e;
      color: #f39c12;
    }

    .modal-backdrop {
      display: ${showPayModal || showHistoryModal ? 'block' : 'none'};
      position: fixed;
      z-index: 1000;
      left: 0;
      top: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      backdrop-filter: blur(5px);
    }

    .modal {
      display: ${showPayModal || showHistoryModal ? 'block' : 'none'};
      position: fixed;
      z-index: 1001;
      left: 50%;
      top: 50%;
      transform: translate(-50%, -50%);
      background-color: #2d2d2d;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
      width: 600px;
      max-width: 90%;
      max-height: 90vh;
      overflow-y: auto;
    }

    .modal-header {
      padding: 20px 25px;
      border-bottom: 1px solid #444;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .modal-header h2 {
      color: #f5f5f5;
      font-size: 1.5rem;
    }

    .close-btn {
      font-size: 2rem;
      color: #777;
      cursor: pointer;
      transition: color 0.3s ease;
      background: none;
      border: none;
    }

    .close-btn:hover {
      color: #fff;
    }

    .modal-body {
      padding: 25px;
    }

    .modal-section {
      margin-bottom: 20px;
    }

    .modal-section h3 {
      color: #3498db;
      font-size: 1.1rem;
      margin-bottom: 15px;
      border-bottom: 1px solid #444;
      padding-bottom: 5px;
    }

    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 15px;
    }

    .detail-item {
      background-color: #1a1a1a;
      padding: 10px 15px;
      border-radius: 8px;
    }

    .detail-label {
      font-size: 0.8rem;
      color: #888;
      margin-bottom: 5px;
    }

    .detail-value {
      font-size: 1rem;
      font-weight: 600;
      color: #e0e0e0;
    }

    .form-group {
      margin-bottom: 15px;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
      color: #c0c0c0;
    }

    .form-group input,
    .form-group select {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 8px;
      background-color: #1a1a1a;
      color: #e0e0e0;
      font-size: 1rem;
      outline: none;
    }

    .form-group input:focus,
    .form-group select:focus {
      box-shadow: 0 0 0 2px #3498db;
    }

    .form-row {
      display: flex;
      gap: 15px;
    }

    .form-row .form-group {
      flex: 1;
    }

    .modal-footer {
      padding: 20px 25px;
      background-color: #333;
      border-top: 1px solid #444;
      border-bottom-left-radius: 15px;
      border-bottom-right-radius: 15px;
      display: flex;
      justify-content: flex-end;
      gap: 10px;
    }

    .btn-secondary {
      background-color: #555;
      color: #e0e0e0;
    }

    .btn-secondary:hover {
      background-color: #666;
    }

    .history-table {
      width: 100%;
      border-collapse: collapse;
    }

    .history-table th,
    .history-table td {
      padding: 10px;
      border-bottom: 1px solid #444;
      text-align: left;
    }

    .history-table th {
      background-color: #3d3d3d;
      color: #c0c0c0;
      font-size: 0.9rem;
    }

    .history-table td {
      font-size: 0.95rem;
    }

    .back-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      text-decoration: none;
      border-radius: 25px;
      font-weight: 600;
      transition: all 0.3s;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
    }

    .back-btn:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
    }

    @media(max-width:768px){
      .fee-header{flex-direction:column;align-items:stretch}
      .room-type-nav{flex-direction:column}
      .search-container{width:100%;max-width:100%}
      .detail-grid{grid-template-columns:1fr}
    }
  `

  return (
    <div style={{minHeight:'100vh'}}>
      <style>{styles}</style>

      <div className="fee-container">
        <div className="fee-header">
          <h1 className="fee-title">
            <span>💰</span> Hostel Fees Management
          </h1>
          
          <nav className="room-type-nav">
            <button 
              className={`nav-btn ${roomFilter === 'double' ? 'active' : ''}`}
              onClick={() => setRoomFilter('double')}
            >
              Double Sharing
            </button>
            <button 
              className={`nav-btn ${roomFilter === 'triple' ? 'active' : ''}`}
              onClick={() => setRoomFilter('triple')}
            >
              Triple Sharing
            </button>
            <button 
              className={`nav-btn ${roomFilter === 'four' ? 'active' : ''}`}
              onClick={() => setRoomFilter('four')}
            >
              Four Sharing
            </button>
          </nav>
        </div>

        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px',flexWrap:'wrap',gap:'1rem'}}>
          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input 
              type="text" 
              className="search-input"
              placeholder="Search by Student Name or Student ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <Link to="/admin" className="back-btn">← Back to Dashboard</Link>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Photo</th>
                <th>Name</th>
                <th>Student ID</th>
                <th>Room No.</th>
                <th>Phone</th>
                <th>Monthly Fee</th>
                <th>Total Paid</th>
                <th>Due</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="10" style={{textAlign:'center',color:'#888',padding:'20px'}}>
                    No students are currently allocated to '{roomFilter}' sharing rooms.
                  </td>
                </tr>
              ) : (
                filtered.map(student => {
                  const monthlyFee = student.rent || 5000
                  const totalPaid = student.totalPaid || 0
                  const due = monthlyFee - totalPaid
                  const status = getStatus(student)
                  
                  return (
                    <tr key={student._id}>
                      <td>
                        <div className="student-photo">
                          {student.photo ? (
                            <img src={student.photo} alt={student.name} />
                          ) : (
                            <span style={{fontSize:'1.2rem'}}>👤</span>
                          )}
                        </div>
                      </td>
                      <td>{student.name}</td>
                      <td>{student.studentId}</td>
                      <td>{student.roomNumber}</td>
                      <td>{student.phone}</td>
                      <td>₹{monthlyFee}</td>
                      <td>₹{totalPaid}</td>
                      <td>₹{due > 0 ? due : 0}</td>
                      <td>
                        <span className={`status-badge ${status.class}`}>
                          {status.text}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-pay" onClick={() => openPayModal(student)}>
                          💳 Pay
                        </button>
                        <button className="btn btn-history" onClick={() => openHistoryModal(student)}>
                          📜 History
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="modal-backdrop" onClick={closeModals}></div>

      {showPayModal && selectedStudent && (
        <div className="modal">
          <div className="modal-header">
            <h2>💳 Record Payment</h2>
            <button className="close-btn" onClick={closeModals}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="modal-section">
              <h3>Student Details</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Student Name</div>
                  <div className="detail-value">{selectedStudent.name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Student ID</div>
                  <div className="detail-value">{selectedStudent.studentId}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Room Number</div>
                  <div className="detail-value">{selectedStudent.roomNumber}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Room Type</div>
                  <div className="detail-value">{selectedStudent.roomType}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Monthly Fee</div>
                  <div className="detail-value">₹{selectedStudent.monthlyFee}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label" style={{color:'#e74c3c'}}>Current Due</div>
                  <div className="detail-value" style={{color:'#e74c3c'}}>
                    ₹{selectedStudent.monthlyFee - selectedStudent.totalPaid > 0 ? selectedStudent.monthlyFee - selectedStudent.totalPaid : 0}
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3>Add Payment</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Amount (₹)</label>
                  <input 
                    type="number" 
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm({...paymentForm, amount: e.target.value})}
                    placeholder="Enter amount"
                  />
                </div>
                <div className="form-group">
                  <label>Date</label>
                  <input 
                    type="date" 
                    value={paymentForm.date}
                    onChange={(e) => setPaymentForm({...paymentForm, date: e.target.value})}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select 
                  value={paymentForm.method}
                  onChange={(e) => setPaymentForm({...paymentForm, method: e.target.value})}
                >
                  <option value="Cash">Cash</option>
                  <option value="UPI">UPI</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Card">Card</option>
                </select>
              </div>
              <div className="form-group">
                <label>Reference / Notes</label>
                <input 
                  type="text" 
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm({...paymentForm, reference: e.target.value})}
                  placeholder="Optional transaction ID or notes"
                />
              </div>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModals}>Close</button>
            <button className="btn btn-pay" onClick={recordPayment}>Record Payment</button>
          </div>
        </div>
      )}

      {showHistoryModal && selectedStudent && (
        <div className="modal">
          <div className="modal-header">
            <h2>📜 Payment History</h2>
            <button className="close-btn" onClick={closeModals}>&times;</button>
          </div>
          <div className="modal-body">
            <div className="modal-section">
              <h3>Student Details</h3>
              <div className="detail-grid">
                <div className="detail-item">
                  <div className="detail-label">Student Name</div>
                  <div className="detail-value">{selectedStudent.name}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Student ID</div>
                  <div className="detail-value">{selectedStudent.studentId}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Room Number</div>
                  <div className="detail-value">{selectedStudent.roomNumber}</div>
                </div>
                <div className="detail-item">
                  <div className="detail-label">Room Type</div>
                  <div className="detail-value">{selectedStudent.roomType}</div>
                </div>
              </div>
            </div>

            <div className="modal-section">
              <h3>Payment Records</h3>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Amount (₹)</th>
                    <th>Method</th>
                    <th>Reference</th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedStudent.paymentHistory || selectedStudent.paymentHistory.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{textAlign:'center',color:'#888'}}>
                        No payment records found.
                      </td>
                    </tr>
                  ) : (
                    selectedStudent.paymentHistory.map((payment, idx) => (
                      <tr key={idx}>
                        <td>{payment.date}</td>
                        <td>₹{payment.amount}</td>
                        <td>{payment.method || 'N/A'}</td>
                        <td>{payment.reference || '-'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
          <div className="modal-footer">
            <button className="btn btn-secondary" onClick={closeModals}>Close</button>
          </div>
        </div>
      )}
    </div>
  )
}
