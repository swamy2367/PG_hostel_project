import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Home from './pages/Home'
import HostelInfo from './pages/HostelInfo'
import MenuPage from './pages/MenuPage'
import Login from './pages/Login'
import AdminDashboard from './pages/AdminDashboard'
import DoubleSharing from './pages/DoubleSharing'
import TripleSharing from './pages/TripleSharing'
import FourSharing from './pages/FourSharing'
import FeeManagement from './pages/FeeManagement'
import ProtectedRoute from './components/ProtectedRoute'

function NotFound() {
  return (
    <div style={{padding: 24}}>
      <h2>Page not found</h2>
      <p><Link to="/">Go Home</Link></p>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/hostel-info" element={<HostelInfo />} />
      <Route path="/menu" element={<MenuPage />} />
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}> 
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/admin/double" element={<DoubleSharing />} />
        <Route path="/admin/triple" element={<TripleSharing />} />
        <Route path="/admin/four" element={<FourSharing />} />
        <Route path="/admin/fees" element={<FeeManagement />} />
      </Route>

      <Route path="/home" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  )
}
