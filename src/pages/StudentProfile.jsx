import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import DashboardLayout from '../components/DashboardLayout';
import { UserIcon, EditIcon, CheckCircleIcon } from '../components/Icons';

export default function StudentProfile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    name: '',
    phone: '',
    course: '',
    year: ''
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchProfile();
  }, []);

  async function fetchProfile() {
    setIsLoading(true);
    const result = await authAPI.getMe();

    if (result.success) {
      setUser(result.user);
      setEditData({
        name: result.user.name || '',
        phone: result.user.phone || '',
        course: result.user.course || '',
        year: result.user.year || ''
      });
    } else {
      navigate('/login');
    }

    setIsLoading(false);
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/students/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editData)
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setUser({ ...user, ...editData });
        setIsEditing(false);
        setMessage('Profile updated successfully!');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage(data.message || 'Failed to update profile');
      }
    } catch (err) {
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  }

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
          <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)' }}>
            Loading profile...
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="student">
      {/* Page Header */}
      <div style={{ marginBottom: 'var(--space-8)' }}>
        <h1 style={{
          fontSize: 'var(--text-3xl)',
          fontWeight: 700,
          letterSpacing: 'var(--tracking-tighter)',
          marginBottom: 'var(--space-2)',
        }}>
          My Profile
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-base)' }}>
          Manage your account details
        </p>
      </div>

      <div style={{ maxWidth: 720 }}>
        <div className="card">
          <div className="card-body">
            {/* Profile Header */}
            <div style={{
              textAlign: 'center',
              marginBottom: 'var(--space-6)',
              paddingBottom: 'var(--space-6)',
              borderBottom: '1px solid var(--border-light)',
            }}>
              <div style={{
                width: 80,
                height: 80,
                background: 'linear-gradient(135deg, var(--primary), var(--accent))',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto var(--space-4)',
                color: 'white',
              }}>
                <UserIcon size={32} />
              </div>
              <h2 style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 600,
                marginBottom: 'var(--space-1)',
              }}>
                {user?.name}
              </h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
                {user?.email}
              </p>
            </div>

            {/* Message */}
            {message && (
              <div style={{
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--radius-md)',
                marginBottom: 'var(--space-5)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
                background: message.includes('success') ? 'var(--success-light)' : 'var(--danger-light)',
                color: message.includes('success') ? 'var(--success-dark)' : 'var(--danger-dark)',
                borderLeft: `4px solid ${message.includes('success') ? 'var(--success)' : 'var(--danger)'}`,
              }}>
                {message}
              </div>
            )}

            {/* Personal Information */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 'var(--space-4)',
              }}>
                <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 600 }}>
                  Personal Information
                </h3>
                {!isEditing && (
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsEditing(true)}
                  >
                    <EditIcon size={14} />
                    Edit
                  </button>
                )}
              </div>

              {[
                { label: 'Full Name', key: 'name', value: user?.name, editable: true, type: 'text' },
                { label: 'Email', key: 'email', value: user?.email, editable: false },
                { label: 'Phone Number', key: 'phone', value: user?.phone || 'Not provided', editable: true, type: 'tel', placeholder: 'Enter phone number' },
                { label: 'Course', key: 'course', value: user?.course || 'Not provided', editable: true, type: 'text', placeholder: 'e.g. B.Tech, MBA' },
                { label: 'Year', key: 'year', value: user?.year || 'Not provided', editable: true, type: 'text', placeholder: 'e.g. 1st Year, 2nd Year' },
              ].map(({ label, key, value, editable, type, placeholder }) => (
                <div key={key} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: 'var(--space-3-5) 0',
                  borderBottom: '1px solid var(--border-light)',
                }}>
                  <span style={{
                    color: 'var(--text-secondary)',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 500,
                  }}>
                    {label}
                  </span>
                  {isEditing && editable ? (
                    <input
                      type={type}
                      className="form-input"
                      style={{ width: 220, textAlign: 'right' }}
                      value={editData[key]}
                      onChange={(e) => setEditData({ ...editData, [key]: e.target.value })}
                      placeholder={placeholder}
                    />
                  ) : (
                    <span style={{
                      fontWeight: 500,
                      fontSize: 'var(--text-sm)',
                    }}>
                      {value}
                    </span>
                  )}
                </div>
              ))}

              {isEditing && (
                <div style={{
                  display: 'flex',
                  gap: 'var(--space-3)',
                  marginTop: 'var(--space-5)',
                  justifyContent: 'flex-end',
                }}>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={() => setIsEditing(false)}
                  >
                    Cancel
                  </button>
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {/* Verification Status */}
            <div style={{ marginBottom: 'var(--space-8)' }}>
              <h3 style={{
                fontSize: 'var(--text-base)',
                fontWeight: 600,
                marginBottom: 'var(--space-4)',
              }}>
                Verification Status
              </h3>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-3-5) 0',
                borderBottom: '1px solid var(--border-light)',
              }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                  Email Verification
                </span>
                {user?.isEmailVerified ? (
                  <span className="badge badge-success">Verified</span>
                ) : (
                  <span className="badge badge-warning">Not Verified</span>
                )}
              </div>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: 'var(--space-3-5) 0',
              }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}>
                  Member Since
                </span>
                <span style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>
                  {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
