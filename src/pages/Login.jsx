import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import { GraduationCapIcon, BuildingIcon, ArrowLeftIcon, KeyIcon, MailIcon, UserIcon, HomeIcon } from '../components/Icons';

export default function Login() {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [formData, setFormData] = useState({
    // Student fields
    email: '',
    // Owner fields
    username: '',
    // Common
    password: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
  }, []);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    setIsLoading(true);

    let result;
    if (role === 'student') {
      result = await authAPI.studentLogin(formData.email, formData.password);
    } else {
      result = await authAPI.ownerLogin(formData.username, formData.password);
    }

    setIsLoading(false);

    if (result.success) {
      if (role === 'student') {
        navigate('/student/dashboard');
      } else {
        navigate('/owner/dashboard');
      }
    } else {
      setError(result.message || 'Invalid credentials');
    }
  };

  const pageStyles = `
    .auth-page {
      min-height: 100vh;
      display: flex;
      background: var(--bg-body);
    }

    .auth-left {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-8);
    }

    .auth-right {
      flex: 1;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 50%, var(--accent-dark) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-8);
      position: relative;
      overflow: hidden;
    }

    .auth-right::before {
      content: '';
      position: absolute;
      top: -30%;
      right: -20%;
      width: 60%;
      height: 150%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      animation: float 20s ease-in-out infinite;
    }

    .auth-right-content {
      position: relative;
      z-index: 1;
      text-align: center;
      color: white;
      max-width: 400px;
    }

    .auth-right-title {
      font-size: var(--text-4xl);
      font-weight: 800;
      margin-bottom: var(--space-4);
      letter-spacing: var(--tracking-tighter);
      line-height: var(--leading-tight);
    }

    .auth-right-text {
      font-size: var(--text-lg);
      opacity: 0.85;
      line-height: var(--leading-relaxed);
    }

    .auth-content {
      max-width: 420px;
      width: 100%;
      animation: fadeInUp 0.5s ease both;
    }

    .auth-back {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--text-secondary);
      font-size: var(--text-sm);
      font-weight: 500;
      margin-bottom: var(--space-8);
      transition: color var(--duration-fast) var(--ease-default);
    }

    .auth-back:hover {
      color: var(--primary);
    }

    .auth-header {
      margin-bottom: var(--space-8);
    }

    .auth-title {
      font-size: var(--text-3xl);
      font-weight: 700;
      margin-bottom: var(--space-2);
      letter-spacing: var(--tracking-tighter);
      color: var(--text);
    }

    .auth-subtitle {
      color: var(--text-secondary);
      font-size: var(--text-base);
    }

    .role-badge {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      padding: 0.375rem 0.875rem;
      background: var(--primary-50);
      color: var(--primary);
      border: 1px solid var(--primary-200);
      border-radius: var(--radius-full);
      font-size: var(--text-xs);
      font-weight: 600;
      margin-bottom: var(--space-4);
      letter-spacing: 0.03em;
      text-transform: uppercase;
    }

    body.dark-mode .role-badge,
    body.dark-theme .role-badge {
      background: rgba(99, 102, 241, 0.12);
      border-color: rgba(99, 102, 241, 0.25);
    }

    .roles-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-8);
    }

    .role-card {
      background: var(--bg);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-xl);
      padding: var(--space-8) var(--space-6);
      cursor: pointer;
      transition: all var(--duration-normal) var(--ease-default);
      text-align: center;
      position: relative;
    }

    .role-card:hover {
      transform: translateY(-4px);
      box-shadow: var(--shadow-lg);
      border-color: var(--primary-300);
    }

    .role-card-icon {
      width: 56px;
      height: 56px;
      background: var(--primary-50);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--space-4);
      color: var(--primary);
      border: 1px solid var(--primary-200);
      transition: all var(--duration-normal) var(--ease-default);
    }

    body.dark-mode .role-card-icon,
    body.dark-theme .role-card-icon {
      background: rgba(99, 102, 241, 0.12);
      border-color: rgba(99, 102, 241, 0.25);
    }

    .role-card:hover .role-card-icon {
      transform: scale(1.08);
    }

    .role-card-title {
      font-size: var(--text-lg);
      font-weight: 600;
      margin-bottom: var(--space-2);
      color: var(--text);
    }

    .role-card-desc {
      color: var(--text-secondary);
      font-size: var(--text-sm);
      line-height: var(--leading-relaxed);
    }

    .auth-error {
      background: var(--danger-light);
      color: var(--danger-dark);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-5);
      font-size: var(--text-sm);
      font-weight: 500;
      border: 1px solid rgba(239, 68, 68, 0.15);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      animation: fadeInDown 0.3s ease both;
    }

    .auth-footer {
      margin-top: var(--space-6);
      text-align: center;
      display: flex;
      flex-direction: column;
      gap: var(--space-3);
      font-size: var(--text-sm);
    }

    .auth-footer-link {
      color: var(--primary);
      font-weight: 500;
    }

    .auth-footer-link:hover {
      text-decoration: underline;
    }

    .auth-footer-text {
      color: var(--text-secondary);
    }

    .auth-change-btn {
      color: var(--primary);
      font-weight: 500;
      font-size: var(--text-sm);
      background: none;
      border: none;
      cursor: pointer;
      padding: 0;
      display: inline-flex;
      align-items: center;
      gap: var(--space-1);
    }

    .auth-change-btn:hover {
      text-decoration: underline;
    }

    .input-icon-wrap {
      position: relative;
    }

    .input-icon {
      position: absolute;
      left: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-tertiary);
      pointer-events: none;
    }

    .input-icon + .form-input {
      padding-left: 2.5rem;
    }

    @media (max-width: 768px) {
      .auth-right { display: none; }
      .roles-grid { grid-template-columns: 1fr; }
      .auth-title { font-size: var(--text-2xl); }
    }
  `;

  if (!role) {
    return (
      <>
        <style>{pageStyles}</style>
        <div className="auth-page">
          <div className="auth-left">
            <div className="auth-content">
              <Link to="/" className="auth-back">
                <ArrowLeftIcon size={16} />
                Back to Home
              </Link>

              <div className="auth-header">
                <h1 className="auth-title">Welcome Back</h1>
                <p className="auth-subtitle">Select your account type to continue</p>
              </div>

              <div className="roles-grid">
                <div className="role-card" onClick={() => setRole('student')}>
                  <div className="role-card-icon">
                    <GraduationCapIcon size={24} />
                  </div>
                  <h2 className="role-card-title">Student</h2>
                  <p className="role-card-desc">
                    Access your bookings, search hostels, and manage your profile.
                  </p>
                </div>

                <div className="role-card" onClick={() => setRole('owner')}>
                  <div className="role-card-icon">
                    <BuildingIcon size={24} />
                  </div>
                  <h2 className="role-card-title">Hostel Owner</h2>
                  <p className="role-card-desc">
                    Manage your hostel, review bookings, and track payments.
                  </p>
                </div>
              </div>

              <div className="auth-footer">
                <div>
                  <span className="auth-footer-text">Don't have an account? </span>
                  <Link to="/register" className="auth-footer-link">Register</Link>
                </div>
              </div>
            </div>
          </div>

          <div className="auth-right">
            <div className="auth-right-content">
              <h2 className="auth-right-title">Your Home<br />Away From Home</h2>
              <p className="auth-right-text">
                Trusted by thousands of students and hostel owners across India.
              </p>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <style>{pageStyles}</style>
      <div className="auth-page">
        <div className="auth-left">
          <div className="auth-content">
            <Link to="/" className="auth-back">
              <ArrowLeftIcon size={16} />
              Back to Home
            </Link>

            <div className="auth-header">
              <div className="role-badge">
                {role === 'student' ? <GraduationCapIcon size={14} /> : <BuildingIcon size={14} />}
                {role === 'student' ? 'Student' : 'Owner'}
              </div>
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Login to your account</p>
            </div>

            {error && <div className="auth-error">{error}</div>}

            <form onSubmit={handleSubmit}>
              {role === 'student' ? (
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <div className="input-icon-wrap">
                    <MailIcon size={16} className="input-icon" />
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your email"
                      autoFocus
                    />
                  </div>
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label">Username</label>
                  <div className="input-icon-wrap">
                    <UserIcon size={16} className="input-icon" />
                    <input
                      type="text"
                      name="username"
                      className="form-input"
                      value={formData.username}
                      onChange={handleInputChange}
                      required
                      placeholder="Enter your username"
                      autoFocus
                    />
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-icon-wrap">
                  <KeyIcon size={16} className="input-icon" />
                  <input
                    type="password"
                    name="password"
                    className="form-input"
                    value={formData.password}
                    onChange={handleInputChange}
                    required
                    placeholder="Enter your password"
                  />
                </div>
                <div style={{ textAlign: 'right', marginTop: 'var(--space-2)' }}>
                  <Link to="/forgot-password" style={{ fontSize: 'var(--text-xs)', color: 'var(--primary)', fontWeight: 500 }}>
                    Forgot Password?
                  </Link>
                </div>
              </div>

              <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner spinner-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }}></span>
                    Logging in...
                  </>
                ) : 'Login'}
              </button>
            </form>

            <div className="auth-footer">
              <button type="button" className="auth-change-btn" onClick={() => setRole('')}>
                <ArrowLeftIcon size={14} />
                Change Account Type
              </button>
              <div>
                <span className="auth-footer-text">Don't have an account? </span>
                <Link to="/register" className="auth-footer-link">Register</Link>
              </div>
            </div>
          </div>
        </div>

        <div className="auth-right">
          <div className="auth-right-content">
            <h2 className="auth-right-title">Your Home<br />Away From Home</h2>
            <p className="auth-right-text">
              Trusted by thousands of students and hostel owners across India.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
