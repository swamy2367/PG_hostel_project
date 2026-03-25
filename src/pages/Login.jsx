import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { authAPI } from '../services/api'

export default function Login() {
  const [mode, setMode] = useState('login') // 'login' or 'register'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [hostelName, setHostelName] = useState('')
  const [hostelLogo, setHostelLogo] = useState('')
  const [doubleRooms, setDoubleRooms] = useState(30)
  const [tripleRooms, setTripleRooms] = useState(30)
  const [fourRooms, setFourRooms] = useState(40)
  const [doubleStartRoom, setDoubleStartRoom] = useState(201)
  const [tripleStartRoom, setTripleStartRoom] = useState(301)
  const [fourStartRoom, setFourStartRoom] = useState(401)
  const [otp, setOtp] = useState('')
  const [generatedOtp, setGeneratedOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    document.body.classList.toggle('dark-mode', savedTheme === 'dark')
  }, [])
  
  // Clear form when switching modes
  useEffect(() => {
    setUsername('')
    setEmail('')
    setPassword('')
    setConfirmPassword('')
    setOtpSent(false)
    setOtp('')
    setErrorMessage('')
  }, [mode])

  async function handleLogin(e) {
    e.preventDefault()
    setErrorMessage('')
    
    if (!username || !password) {
      setErrorMessage('Enter username and password')
      return
    }
    
    setIsLoading(true)
    const result = await authAPI.login(username, password)
    setIsLoading(false)
    
    if (result.success) {
      alert('Login successful!')
      navigate('/admin')
    } else {
      setErrorMessage(result.message || 'Invalid credentials')
    }
  }

  async function handleRegister(e) {
    e.preventDefault()
    setErrorMessage('')
    
    if (!username || !email || !password || !confirmPassword || !hostelName) {
      setErrorMessage('Please fill all required fields')
      return
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setErrorMessage('Please enter a valid email address')
      return
    }
    
    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match')
      return
    }
    
    if (doubleRooms < 0 || tripleRooms < 0 || fourRooms < 0) {
      setErrorMessage('Room counts cannot be negative')
      return
    }

    const adminData = {
      username,
      email,
      password,
      hostelName,
      hostelLogo,
      roomConfig: {
        double: { count: doubleRooms, startRoom: doubleStartRoom },
        triple: { count: tripleRooms, startRoom: tripleStartRoom },
        four: { count: fourRooms, startRoom: fourStartRoom }
      }
    }
    
    setIsLoading(true)
    const result = await authAPI.register(adminData)
    setIsLoading(false)
    
    if (result.success) {
      alert('Registration successful! Welcome to your hostel management system.')
      navigate('/admin')
    } else {
      setErrorMessage(result.message || 'Registration failed')
    }
  }

  function handleLogoUpload(e) {
    const file = e.target.files?.[0]
    if (!file) return
    
    if (file.size > 2 * 1024 * 1024) {
      alert('Image size should be less than 2MB')
      return
    }
    
    const reader = new FileReader()
    reader.onload = () => {
      setHostelLogo(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <main style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',padding:'2rem 0',background:'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
      <style>{`
        :root { --c-primary:#667eea; --c-primary-dark:#764ba2; --c-bg:#f4f4f4; --c-bg-section:#ffffff; --c-text-primary:#333; --c-shadow:rgba(0,0,0,.15); }
        body.dark-mode { --c-bg:#121212; --c-bg-section:#1e1e1e; --c-text-primary:#f0f0f0; --c-shadow:rgba(0,0,0,.4); }
        body { color:var(--c-text-primary); }
        .login-container{background:var(--c-bg-section);padding:2.5rem;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,.3);width:min(580px,92vw);max-height:90vh;overflow-y:auto;position:relative}
        .login-container::before{content:'';position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#667eea,#764ba2);border-radius:20px 20px 0 0}
        .brand{text-align:center;margin-bottom:2rem}
        .brand h1{margin:0;font-size:2rem;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}
        .brand p{margin:.5rem 0 0;color:#888;font-size:.95rem}
        .actions{display:flex;justify-content:space-between;align-items:center;margin-top:1.5rem;gap:1rem;flex-wrap:wrap}
        input,select{width:100%;padding:.85rem 1rem;border:2px solid #e0e0e0;border-radius:12px;background:var(--c-bg-section);color:var(--c-text-primary);font-size:.95rem;transition:all .3s;box-sizing:border-box}
        input:focus,select:focus{outline:none;border-color:var(--c-primary);box-shadow:0 0 0 3px rgba(102,126,234,.1)}
        label{display:block;margin:1.2rem 0 .6rem;font-weight:600;color:var(--c-text-primary);font-size:.9rem}
        label:first-of-type{margin-top:.5rem}
        button{background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;border:none;padding:.85rem 1.5rem;border-radius:12px;cursor:pointer;font-weight:600;font-size:.95rem;transition:all .3s;box-shadow:0 4px 15px rgba(102,126,234,.4)}
        button:hover:not(:disabled){transform:translateY(-2px);box-shadow:0 6px 20px rgba(102,126,234,.6)}
        button:active:not(:disabled){transform:translateY(0)}
        button:disabled{opacity:.6;cursor:not-allowed}
        .back-link{color:#667eea;text-decoration:none;font-weight:500;transition:all .3s;display:flex;align-items:center;gap:.5rem}
        .back-link:hover{color:#764ba2;gap:.75rem}
        .room-config{background:linear-gradient(135deg,rgba(102,126,234,.08),rgba(118,75,162,.08));padding:1.5rem;border-radius:16px;margin-top:1.5rem;border:2px solid rgba(102,126,234,.15)}
        .room-config h4{margin:0 0 .5rem;background:linear-gradient(135deg,#667eea,#764ba2);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text;font-size:1.1rem}
        .room-config-subtitle{font-size:.85rem;color:#888;margin:0 0 1rem}
        .room-row{display:grid;grid-template-columns:2fr 1fr;gap:.75rem;align-items:start;margin-bottom:.5rem}
        .room-row > div{display:flex;flex-direction:column}
        .room-row label{margin:.3rem 0 .4rem;font-size:.85rem}
        .tabs{display:flex;gap:1rem;margin-bottom:2rem;background:#f5f5f5;padding:.5rem;border-radius:14px}
        body.dark-mode .tabs{background:#2a2a2a}
        .tab{flex:1;padding:.75rem;background:transparent;border:none;color:#666;border-radius:10px;cursor:pointer;font-weight:600;font-size:.95rem;transition:all .3s}
        .tab.active{background:linear-gradient(135deg,#667eea,#764ba2);color:white;box-shadow:0 4px 12px rgba(102,126,234,.3)}
        .tab:hover:not(.active){background:rgba(102,126,234,.1);color:#667eea}
        .stats-summary{background:linear-gradient(135deg,#667eea,#764ba2);color:white;padding:1rem;border-radius:12px;margin-top:1.2rem;text-align:center;font-size:.9rem;font-weight:500}
        .input-group{margin-bottom:.5rem}
        .input-icon{position:relative;margin-bottom:0}
        .input-icon input{padding-left:2.5rem}
        .input-icon::before{content:'';position:absolute;left:1rem;top:50%;transform:translateY(-50%);font-size:1.1rem;opacity:.5;z-index:1}
        .user-icon::before{content:'👤'}
        .lock-icon::before{content:'🔒'}
        .hotel-icon::before{content:'🏨'}
        .photo-upload-container{margin:1.5rem 0;text-align:center}
        .photo-preview{width:120px;height:120px;margin:0 auto 1rem;border-radius:50%;overflow:hidden;border:3px solid #667eea;background:linear-gradient(135deg,rgba(102,126,234,.1),rgba(118,75,162,.1));display:flex;align-items:center;justify-content:center;position:relative}
        .photo-preview img{width:100%;height:100%;object-fit:cover}
        .photo-preview-empty{font-size:3rem;opacity:.3}
        .upload-btn-wrapper{position:relative;display:inline-block}
        .upload-btn{background:linear-gradient(135deg,rgba(102,126,234,.15),rgba(118,75,162,.15));color:#667eea;border:2px dashed #667eea;padding:.6rem 1.2rem;border-radius:10px;cursor:pointer;font-weight:600;font-size:.85rem;transition:all .3s;display:inline-flex;align-items:center;gap:.5rem}
        .upload-btn:hover{background:linear-gradient(135deg,rgba(102,126,234,.25),rgba(118,75,162,.25));border-style:solid}
        .upload-btn-wrapper input[type=file]{position:absolute;left:0;top:0;opacity:0;width:100%;height:100%;cursor:pointer}
        .photo-upload-label{display:block;margin-bottom:.5rem;font-size:.85rem;color:#888}
        @media (max-width:600px){.room-row{grid-template-columns:1fr;gap:.5rem}.actions{flex-direction:column;align-items:stretch}.actions button,.actions .back-link{width:100%;justify-content:center}}
      `}</style>

      <div className="login-container">
        <div className="brand">
          <h1>🏨 Hostel Management</h1>
          <p>{mode === 'login' ? 'Welcome back! Sign in to your account' : 'Create your hostel management account'}</p>
        </div>
        
        <div className="tabs">
          <button className={`tab ${mode === 'login' ? 'active' : ''}`} onClick={() => setMode('login')}>
            🔐 Login
          </button>
          <button className={`tab ${mode === 'register' ? 'active' : ''}`} onClick={() => setMode('register')}>
            ✨ Register
          </button>
        </div>

        {mode === 'login' ? (
          <form onSubmit={handleLogin}>
            {errorMessage && (
              <div style={{
                background: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
                color: 'white',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                textAlign: 'center',
                fontWeight: '500',
                boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
              }}>
                ⚠️ {errorMessage}
              </div>
            )}
            
            <label>Username</label>
            <div className="input-icon user-icon">
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter your username" />
            </div>
            
            <label>Password</label>
            <div className="input-icon lock-icon">
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Enter your password" />
            </div>
            
            <div className="actions">
              <Link to="/" className="back-link">← Back to Home</Link>
              <button type="submit" disabled={isLoading}>
                {isLoading ? '⏳ Logging in...' : 'Login to Dashboard'}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleRegister}>
            {errorMessage && (
              <div style={{
                background: 'linear-gradient(135deg, #ff6b6b, #ee5a6f)',
                color: 'white',
                padding: '1rem',
                borderRadius: '12px',
                marginBottom: '1.5rem',
                textAlign: 'center',
                fontWeight: '500',
                boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)'
              }}>
                ⚠️ {errorMessage}
              </div>
            )}
            <div className="photo-upload-container">
              <div className="photo-preview">
                {hostelLogo ? (
                  <img src={hostelLogo} alt="Hostel Logo" />
                ) : (
                  <span className="photo-preview-empty">🏨</span>
                )}
              </div>
              <p className="photo-upload-label">Hostel Logo (Optional)</p>
              <div className="upload-btn-wrapper">
                <label className="upload-btn">
                  📸 Choose Photo
                  <input type="file" accept="image/*" onChange={handleLogoUpload} />
                </label>
              </div>
            </div>

            <label>Hostel Name *</label>
            <div className="input-icon hotel-icon">
              <input value={hostelName} onChange={e=>setHostelName(e.target.value)} placeholder="e.g., Rajesh Hostel" required />
            </div>
            
            <label>Username *</label>
            <div className="input-icon user-icon">
              <input value={username} onChange={e=>setUsername(e.target.value)} placeholder="Choose a username" required />
            </div>
            
            <label>Email Address *</label>
            <div className="input-icon email-icon">
              <input 
                type="email" 
                value={email} 
                onChange={e=>setEmail(e.target.value)} 
                placeholder="admin@example.com" 
                required 
              />
            </div>
            
            <label>Password *</label>
            <div className="input-icon lock-icon">
              <input type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Create a strong password" required />
            </div>
            
            <label>Confirm Password *</label>
            <div className="input-icon lock-icon">
              <input type="password" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} placeholder="Re-enter your password" required />
            </div>
            
            <div className="room-config">
              <h4>🏢 Room Configuration</h4>
              <p className="room-config-subtitle">Set up your hostel's room structure</p>
              
              <div className="input-group">
                <label>🛏️ Double Sharing Rooms</label>
                <div className="room-row">
                  <div>
                    <label style={{fontSize:'.8rem',opacity:.7}}>Number of Rooms</label>
                    <input type="number" min="0" value={doubleRooms} onChange={e=>setDoubleRooms(Number(e.target.value))} placeholder="e.g., 30" />
                  </div>
                  <div>
                    <label style={{fontSize:'.8rem',opacity:.7}}>Start Room #</label>
                    <input type="number" value={doubleStartRoom} onChange={e=>setDoubleStartRoom(Number(e.target.value))} placeholder="201" />
                  </div>
                </div>
              </div>
              
              <div className="input-group">
                <label>🛏️ Triple Sharing Rooms</label>
                <div className="room-row">
                  <div>
                    <label style={{fontSize:'.8rem',opacity:.7}}>Number of Rooms</label>
                    <input type="number" min="0" value={tripleRooms} onChange={e=>setTripleRooms(Number(e.target.value))} placeholder="e.g., 30" />
                  </div>
                  <div>
                    <label style={{fontSize:'.8rem',opacity:.7}}>Start Room #</label>
                    <input type="number" value={tripleStartRoom} onChange={e=>setTripleStartRoom(Number(e.target.value))} placeholder="301" />
                  </div>
                </div>
              </div>
              
              <div className="input-group">
                <label>🛏️ Four Sharing Rooms</label>
                <div className="room-row">
                  <div>
                    <label style={{fontSize:'.8rem',opacity:.7}}>Number of Rooms</label>
                    <input type="number" min="0" value={fourRooms} onChange={e=>setFourRooms(Number(e.target.value))} placeholder="e.g., 40" />
                  </div>
                  <div>
                    <label style={{fontSize:'.8rem',opacity:.7}}>Start Room #</label>
                    <input type="number" value={fourStartRoom} onChange={e=>setFourStartRoom(Number(e.target.value))} placeholder="401" />
                  </div>
                </div>
              </div>
              
              <div className="stats-summary">
                📊 Total: {doubleRooms + tripleRooms + fourRooms} rooms • 
                {doubleRooms * 2 + tripleRooms * 3 + fourRooms * 4} capacity
              </div>
            </div>
            
            <div className="actions">
              <Link to="/" className="back-link">← Back to Home</Link>
              <button type="submit" disabled={isLoading}>
                {isLoading ? '⏳ Registering...' : '🚀 Register & Setup'}
              </button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
