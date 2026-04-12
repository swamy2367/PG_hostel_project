import React from 'react'
import { Routes, Route, Navigate, Link } from 'react-router-dom'
import Home from './pages/Home'
import HostelInfo from './pages/HostelInfo'
import SearchResults from './pages/SearchResults'
import HostelDetails from './pages/HostelDetails'
import Login from './pages/Login'
import Register from './pages/Register'
import StudentDashboard from './pages/StudentDashboard'
import StudentProfile from './pages/StudentProfile'
import StudentBookings from './pages/StudentBookings'
import StudentComplaintsPage from './pages/StudentComplaintsPage'
import AdminDashboard from './pages/AdminDashboard'
import DoubleSharing from './pages/DoubleSharing'
import TripleSharing from './pages/TripleSharing'
import FourSharing from './pages/FourSharing'
import FeeManagement from './pages/FeeManagement'
import OwnerDashboard from './pages/OwnerDashboard'
import OwnerHostels from './pages/OwnerHostels'
import AddHostel from './pages/AddHostel'
import ManageRooms from './pages/ManageRooms'
import OwnerBookings from './pages/OwnerBookings'
import OwnerComplaints from './pages/OwnerComplaints'
import ProtectedRoute from './components/ProtectedRoute'
import ChatBot from './components/ChatBot'
import Navbar from './components/Navbar'
import { ArrowLeftIcon } from './components/Icons'

// Smart Home component that redirects logged-in users to their dashboard
function SmartHome() {
  const token = localStorage.getItem('token');
  const userRole = localStorage.getItem('userRole');

  // If logged in, redirect to appropriate dashboard
  if (token && userRole) {
    if (userRole === 'student') {
      return <Navigate to="/student/dashboard" replace />;
    } else if (userRole === 'owner') {
      return <Navigate to="/owner/dashboard" replace />;
    }
  }

  // If not logged in, show the landing page
  return <Home />;
}

function NotFound() {
  return (
    <div style={{
      minHeight: 'calc(100vh - var(--header-height))',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexDirection: 'column',
      gap: 'var(--space-6)',
      padding: 'var(--space-8)',
      textAlign: 'center',
      animation: 'fadeInUp 0.4s ease both',
    }}>
      <div style={{
        fontSize: '6rem',
        fontWeight: 800,
        letterSpacing: '-0.05em',
        lineHeight: 1,
        background: 'linear-gradient(135deg, var(--primary), var(--accent))',
        WebkitBackgroundClip: 'text',
        WebkitTextFillColor: 'transparent',
      }}>
        404
      </div>
      <div>
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
          Page Not Found
        </h2>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)', maxWidth: 400 }}>
          The page you're looking for doesn't exist or has been moved.
        </p>
      </div>
      <Link to="/" className="btn btn-primary" style={{ gap: 'var(--space-2)' }}>
        <ArrowLeftIcon size={16} />
        Back to Home
      </Link>
    </div>
  )
}

// Pages that should NOT show the main navbar (login/register handle their own nav)
const noNavbarRoutes = ['/login', '/register'];

export default function App() {
  const showNavbar = !noNavbarRoutes.some(
    route => window.location.pathname.startsWith(route)
  );

  return (
    <>
      {/* Conditionally render Navbar */}
      <AppContent />
      
      {/* Global ChatBot - appears on all pages */}
      <ChatBot />
    </>
  )
}

function AppContent() {
  return (
    <Routes>
      {/* Smart Home - redirects logged-in users to dashboard */}
      <Route path="/" element={<><Navbar /><SmartHome /></>} />
      
      {/* Landing page for non-logged-in users */}
      <Route path="/landing" element={<><Navbar /><Home /></>} />
      
      {/* Public Routes */}
      <Route path="/search" element={<><Navbar /><SearchResults /></>} />
      <Route path="/hostel/:id" element={<><Navbar /><HostelDetails /></>} />
      <Route path="/hostel-info" element={<><Navbar /><HostelInfo /></>} />

      {/* Auth Routes - No navbar, they have their own layout */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Protected Student Routes */}
      <Route element={<ProtectedRoute role="student" />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/profile" element={<StudentProfile />} />
        <Route path="/student/bookings" element={<StudentBookings />} />
        <Route path="/student/complaints" element={<StudentComplaintsPage />} />
      </Route>

      {/* Protected Admin/Owner Routes */}
      <Route element={<ProtectedRoute role="owner" />}>
        <Route path="/admin" element={<><Navbar /><AdminDashboard /></>} />
        <Route path="/admin/double" element={<><Navbar /><DoubleSharing /></>} />
        <Route path="/admin/triple" element={<><Navbar /><TripleSharing /></>} />
        <Route path="/admin/four" element={<><Navbar /><FourSharing /></>} />
        <Route path="/admin/fees" element={<><Navbar /><FeeManagement /></>} />
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        <Route path="/owner/hostels" element={<OwnerHostels />} />
        <Route path="/owner/hostels/add" element={<AddHostel />} />
        <Route path="/owner/hostels/:id/edit" element={<AddHostel />} />
        <Route path="/owner/rooms" element={<ManageRooms />} />
        <Route path="/owner/rooms/add" element={<ManageRooms />} />
        <Route path="/owner/bookings" element={<OwnerBookings />} />
        <Route path="/owner/complaints" element={<OwnerComplaints />} />
      </Route>

      {/* Redirects */}
      <Route path="/home" element={<Navigate to="/" replace />} />

      {/* 404 */}
      <Route path="*" element={<><Navbar /><NotFound /></>} />
    </Routes>
  );
}
