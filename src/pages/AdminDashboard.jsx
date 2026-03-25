import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

export default function AdminDashboard() {
  const navigate = useNavigate()
  const [hostelName, setHostelName] = useState('Hostel')
  const [hostelLogo, setHostelLogo] = useState('')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    const darkMode = savedTheme === 'dark'
    setIsDark(darkMode)
    document.body.classList.toggle('dark-mode', darkMode)
    
    const adminData = JSON.parse(localStorage.getItem('adminData') || '{}')
    if (adminData.hostelName) {
      setHostelName(adminData.hostelName)
    }
    if (adminData.hostelLogo) {
      setHostelLogo(adminData.hostelLogo)
    }
  }, [])

  function toggleTheme() {
    const newTheme = isDark ? 'light' : 'dark'
    setIsDark(!isDark)
    localStorage.setItem('theme', newTheme)
    document.body.classList.toggle('dark-mode', !isDark)
  }

  function logout() {
    localStorage.removeItem('adminToken')
    navigate('/login')
  }

  return (
    <div className="dashboard-wrapper">
      <style>{`
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        :root { 
          --c-primary: #667eea; 
          --c-secondary: #764ba2; 
          --c-bg: #f0f2f5; 
          --c-bg-section: #ffffff; 
          --c-text-primary: #2d3748; 
          --c-text-secondary: #718096; 
          --c-shadow: rgba(0,0,0,.08); 
          --c-hover-shadow: rgba(102,126,234,.15);
        }
        
        body.dark-mode { 
          --c-bg: #0f1419; 
          --c-bg-section: #1a202c; 
          --c-text-primary: #f7fafc; 
          --c-text-secondary: #a0aec0; 
          --c-shadow: rgba(0,0,0,.4); 
          --c-hover-shadow: rgba(102,126,234,.25);
        }
        
        body { 
          background: var(--c-bg); 
          color: var(--c-text-primary); 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          min-height: 100vh;
        }
        
        .dashboard-wrapper {
          min-height: 100vh;
          padding: 2rem 1rem;
          position: relative;
        }
        
        .container {
          width: 100%;
          max-width: 1000px;
          margin: 0 auto;
        }
        
        .dashboard-header {
          text-align: center;
          margin-bottom: 4rem;
          padding-top: 1rem;
        }
        
        .dashboard-title {
          background: linear-gradient(135deg, var(--c-primary), var(--c-secondary));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-size: 2.75rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          letter-spacing: -0.02em;
        }
        
        .header-controls {
          position: absolute;
          top: 2rem;
          right: 2rem;
          display: flex;
          gap: 0.75rem;
          align-items: center;
          z-index: 10;
        }
        
        .btn {
          padding: 0.65rem 1.5rem;
          border-radius: 50px;
          border: none;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.9rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          white-space: nowrap;
        }
        
        .btn-night {
          background: linear-gradient(135deg, #667eea, #764ba2);
          color: white;
          box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
        }
        
        .btn-night:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .btn-logout {
          background: #ef4444;
          color: white;
          box-shadow: 0 2px 8px rgba(239, 68, 68, 0.3);
        }
        
        .btn-logout:hover {
          background: #dc2626;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(239, 68, 68, 0.4);
        }
        
        .cards-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 2rem;
          padding: 0 1rem;
        }
        
        .dashboard-card {
          background: var(--c-bg-section);
          padding: 3rem 2rem;
          border-radius: 20px;
          box-shadow: 0 4px 20px var(--c-shadow);
          text-decoration: none;
          color: inherit;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          cursor: pointer;
          border: 1px solid transparent;
          min-height: 200px;
        }
        
        .dashboard-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 12px 40px var(--c-hover-shadow);
          border-color: var(--c-primary);
        }
        
        .card-icon {
          font-size: 4rem;
          margin-bottom: 1.25rem;
          line-height: 1;
          filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
        }
        
        .card-title {
          font-size: 1.35rem;
          font-weight: 700;
          margin-bottom: 0.5rem;
          color: var(--c-primary);
          letter-spacing: -0.01em;
        }
        
        .card-subtitle {
          font-size: 0.95rem;
          color: var(--c-text-secondary);
          font-weight: 500;
        }
        
        @media (max-width: 768px) {
          .dashboard-wrapper {
            padding: 1.5rem 0.5rem;
          }
          
          .cards-grid {
            grid-template-columns: 1fr;
            gap: 1.5rem;
            padding: 0;
          }
          
          .header-controls {
            position: static;
            justify-content: center;
            margin-bottom: 2rem;
            flex-wrap: wrap;
          }
          
          .dashboard-header {
            margin-bottom: 2.5rem;
            padding-top: 0;
          }
          
          .dashboard-title {
            font-size: 2rem;
          }
          
          .dashboard-card {
            padding: 2.5rem 1.5rem;
            min-height: 180px;
          }
          
          .card-icon {
            font-size: 3.5rem;
          }
          
          .btn {
            padding: 0.6rem 1.2rem;
            font-size: 0.85rem;
          }
        }
        
        @media (max-width: 480px) {
          .dashboard-title {
            font-size: 1.75rem;
          }
          
          .card-title {
            font-size: 1.2rem;
          }
          
          .card-subtitle {
            font-size: 0.9rem;
          }
        }
      `}</style>

      <div className="header-controls">
        <button onClick={toggleTheme} className="btn btn-night">
          {isDark ? '☀️' : '🌙'} {isDark ? 'Light' : 'Night'} Mode
        </button>
        <button onClick={logout} className="btn btn-logout">🚪 Logout</button>
      </div>

      <div className="container">
        <div className="dashboard-header">
          <h1 className="dashboard-title">Hostel Admin Dashboard</h1>
        </div>

        <div className="cards-grid">
          <Link to="/admin/double" className="dashboard-card">
            <div className="card-icon">🛏️</div>
            <h3 className="card-title">Double Sharing</h3>
            <p className="card-subtitle">Two-persons Sharing</p>
          </Link>

          <Link to="/admin/triple" className="dashboard-card">
            <div className="card-icon">👥</div>
            <h3 className="card-title">Triple Sharing</h3>
            <p className="card-subtitle">Three-person rooms</p>
          </Link>

          <Link to="/admin/four" className="dashboard-card">
            <div className="card-icon">👨‍👩‍👧‍👦</div>
            <h3 className="card-title">four persons Sharing</h3>
            <p className="card-subtitle"></p>
          </Link>

          <Link to="/admin/fees" className="dashboard-card">
            <div className="card-icon">₹</div>
            <h3 className="card-title">Fee Management</h3>
            <p className="card-subtitle">Payments and dues</p>
          </Link>
        </div>
      </div>
    </div>
  )
}
