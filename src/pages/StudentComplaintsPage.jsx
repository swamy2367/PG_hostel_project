import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { authAPI, bookingsAPI } from '../services/api';
import StudentComplaints from '../components/StudentComplaints';
import DashboardLayout from '../components/DashboardLayout';

export default function StudentComplaintsPage() {
  const navigate = useNavigate();
  const [activeBooking, setActiveBooking] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      const [userResult, bookingsResult] = await Promise.all([
        authAPI.getMe(),
        bookingsAPI.getMyBookings(),
      ]);

      if (!userResult.success) {
        navigate('/login');
        return;
      }

      if (bookingsResult.success) {
        const active = bookingsResult.bookings.find(
          b => b.status === 'active' || b.status === 'approved'
        );
        setActiveBooking(active || null);
      }

      setIsLoading(false);
    }
    fetchData();
  }, []);

  if (isLoading) {
    return (
      <DashboardLayout role="student">
        <div style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: 'var(--space-4)',
        }}>
          <div className="spinner spinner-lg" />
          <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      <div style={{ marginBottom: 'var(--space-6)' }}>
        <h1 style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 700,
          letterSpacing: 'var(--tracking-tighter)',
          marginBottom: 'var(--space-2)',
        }}>
          Complaints
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
          Report and track issues with your hostel
        </p>
      </div>

      <StudentComplaints activeBooking={activeBooking} />
    </DashboardLayout>
  );
}
