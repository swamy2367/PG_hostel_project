import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';

export default function Register() {
  const navigate = useNavigate();
  const [role, setRole] = useState('');
  const [step, setStep] = useState(1); // 1 = Details, 2 = OTP, 3 = Success
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', password: '', confirmPassword: '',
    username: '', hostelName: '',
  });
  const [otpValue, setOtpValue] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(null);
  const otpRefs = useRef([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
  }, []);

  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(countdownRef.current);
  }, [countdown]);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  // ── Step 1 → Step 2: Send OTP ────────────────────────────────────────
  const handleSendOtp = async (e) => {
    e?.preventDefault();
    setError('');

    if (role === 'student') {
      if (!formData.name || !formData.email || !formData.phone || !formData.password) {
        setError('Please fill in all fields');
        return;
      }
    } else {
      if (!formData.username || !formData.email || !formData.phone || !formData.password) {
        setError('Please fill in all fields');
        return;
      }
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    const result = await authAPI.sendOtp({ email: formData.email, role });
    setIsLoading(false);

    if (result.success) {
      setStep(2);
      setCountdown(30);
      setOtpValue('');
    } else {
      setError(result.message || 'Failed to send OTP');
    }
  };

  // ── Resend OTP ───────────────────────────────────────────────────────
  const handleResendOtp = async () => {
    if (countdown > 0) return;
    setError('');
    setSuccess('');
    setIsLoading(true);
    const result = await authAPI.sendOtp({ email: formData.email, role });
    setIsLoading(false);

    if (result.success) {
      setCountdown(30);
      setSuccess('New OTP sent successfully!');
      setOtpValue('');
      setTimeout(() => setSuccess(''), 3000);
    } else {
      setError(result.message);
    }
  };

  // ── Step 2 → Step 3: Verify OTP & Register ───────────────────────────
  const handleVerifyAndRegister = async (e) => {
    e?.preventDefault();
    setError('');

    if (otpValue.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);

    // Step A: Verify OTP
    const verifyResult = await authAPI.verifyOtp({
      email: formData.email,
      emailOtp: otpValue,
      role,
    });

    if (!verifyResult.success) {
      setIsLoading(false);
      setError(verifyResult.message || 'OTP verification failed');
      return;
    }

    // Step B: Create account
    let registerResult;
    if (role === 'student') {
      registerResult = await authAPI.studentRegister({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
    } else {
      registerResult = await authAPI.ownerRegister({
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        password: formData.password,
      });
    }

    setIsLoading(false);

    if (registerResult.success) {
      setStep(3);
      setTimeout(() => navigate('/login'), 3000);
    } else {
      setError(registerResult.message || 'Registration failed');
    }
  };

  // ── OTP digit input handler ──────────────────────────────────────────
  function handleOtpDigit(index, value) {
    if (!/^\d?$/.test(value)) return;
    const arr = otpValue.split('');
    while (arr.length < 6) arr.push('');
    arr[index] = value;
    setOtpValue(arr.join(''));
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otpValue[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  function handleOtpPaste(e) {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (paste.length > 0) setOtpValue(paste.padEnd(6, '').slice(0, 6));
  }

  // ── Render: Role Selection ───────────────────────────────────────────
  if (!role) {
    return (
      <>
        <style>{registerStyles}</style>
        <div className="reg-container">
          <div className="reg-role-selection">
            <div className="reg-header">
              <h1 className="reg-title">Create Account</h1>
              <p className="reg-subtitle">Choose your account type to get started</p>
            </div>
            <div className="reg-roles-grid">
              <div className="reg-role-card" onClick={() => setRole('student')}>
                <div className="reg-role-icon">🎓</div>
                <h2 className="reg-role-title">Student</h2>
                <p className="reg-role-desc">
                  Search and book hostels, manage your reservations, and connect with hostel owners.
                </p>
              </div>
              <div className="reg-role-card" onClick={() => setRole('owner')}>
                <div className="reg-role-icon">🏢</div>
                <h2 className="reg-role-title">Hostel Owner</h2>
                <p className="reg-role-desc">
                  List your hostel, manage bookings, track payments, and grow your business.
                </p>
              </div>
            </div>
            <div className="reg-back-link">
              <Link to="/login">Already have an account? Login</Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── Render: Step 3 — Success ─────────────────────────────────────────
  if (step === 3) {
    return (
      <>
        <style>{registerStyles}</style>
        <div className="reg-container">
          <div className="reg-form-card" style={{ textAlign: 'center' }}>
            <div className="reg-success-anim">
              <svg viewBox="0 0 52 52" className="reg-checkmark">
                <circle cx="26" cy="26" r="24" fill="none" stroke="#22c55e" strokeWidth="3" />
                <path fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round"
                  d="M14 27l7.8 7.8L38 18" className="reg-check-path" />
              </svg>
            </div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.5rem' }}>
              Account Created!
            </h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Your email has been verified. Redirecting to login...
            </p>
            <div className="reg-spinner" />
          </div>
        </div>
      </>
    );
  }

  // ── Render: Step 1 & 2 ───────────────────────────────────────────────
  return (
    <>
      <style>{registerStyles}</style>
      <div className="reg-container">
        <div className="reg-form-card">
          {/* Header */}
          <div className="reg-form-header">
            <span className="reg-role-badge">{role === 'student' ? '🎓 Student' : '🏢 Owner'}</span>
            <h1 className="reg-form-title">Create Account</h1>
            <p className="reg-form-subtitle">Join HostelHub today</p>
          </div>

          {/* Step Indicator */}
          <div className="reg-steps">
            <div className={`reg-step ${step >= 1 ? 'active' : ''} ${step > 1 ? 'done' : ''}`}>
              <div className="reg-step-dot">{step > 1 ? '✓' : '1'}</div>
              <span>Details</span>
            </div>
            <div className="reg-step-line" />
            <div className={`reg-step ${step >= 2 ? 'active' : ''}`}>
              <div className="reg-step-dot">2</div>
              <span>Verify Email</span>
            </div>
          </div>

          {/* Messages */}
          {error && <div className="reg-error">{error}</div>}
          {success && <div className="reg-success">{success}</div>}

          {/* ──── STEP 1: Details Form ──── */}
          {step === 1 && (
            <form onSubmit={handleSendOtp}>
              {role === 'student' ? (
                <>
                  <div className="reg-group">
                    <label className="reg-label">Full Name</label>
                    <input type="text" name="name" className="reg-input" value={formData.name}
                      onChange={handleInputChange} required placeholder="Enter your full name" />
                  </div>
                  <div className="reg-group">
                    <label className="reg-label">Email</label>
                    <input type="email" name="email" className="reg-input" value={formData.email}
                      onChange={handleInputChange} required placeholder="Enter your email" />
                  </div>
                  <div className="reg-group">
                    <label className="reg-label">Phone Number</label>
                    <input type="tel" name="phone" className="reg-input" value={formData.phone}
                      onChange={handleInputChange} required placeholder="10-digit mobile number" />
                  </div>
                </>
              ) : (
                <>
                  <div className="reg-group">
                    <label className="reg-label">Username</label>
                    <input type="text" name="username" className="reg-input" value={formData.username}
                      onChange={handleInputChange} required placeholder="Choose a username" />
                  </div>
                  <div className="reg-group">
                    <label className="reg-label">Email</label>
                    <input type="email" name="email" className="reg-input" value={formData.email}
                      onChange={handleInputChange} required placeholder="Enter your email" />
                  </div>
                  <div className="reg-group">
                    <label className="reg-label">Phone Number</label>
                    <input type="tel" name="phone" className="reg-input" value={formData.phone}
                      onChange={handleInputChange} required placeholder="10-digit mobile number" />
                  </div>
                </>
              )}

              <div className="reg-group">
                <label className="reg-label">Password</label>
                <input type="password" name="password" className="reg-input" value={formData.password}
                  onChange={handleInputChange} required placeholder="Min 6 characters" minLength={6} />
              </div>
              <div className="reg-group">
                <label className="reg-label">Confirm Password</label>
                <input type="password" name="confirmPassword" className="reg-input" value={formData.confirmPassword}
                  onChange={handleInputChange} required placeholder="Confirm your password" />
              </div>

              <button type="submit" className="reg-btn" disabled={isLoading}>
                {isLoading ? (
                  <><span className="reg-btn-spinner" /> Sending OTP...</>
                ) : (
                  'Send OTP & Continue →'
                )}
              </button>
            </form>
          )}

          {/* ──── STEP 2: OTP Verification ──── */}
          {step === 2 && (
            <form onSubmit={handleVerifyAndRegister}>
              <div className="reg-otp-info">
                <p>We've sent a verification code to:</p>
                <div className="reg-otp-targets">
                  <span>📧 {formData.email}</span>
                </div>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.5rem' }}>
                  Check your inbox (and spam folder) for the 6-digit code.
                </p>
              </div>

              {/* Email OTP */}
              <div className="reg-otp-section">
                <label className="reg-label">Enter Verification Code</label>
                <div className="reg-otp-digits" onPaste={handleOtpPaste}>
                  {[0, 1, 2, 3, 4, 5].map(i => (
                    <input
                      key={i}
                      ref={el => otpRefs.current[i] = el}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      className="reg-otp-digit"
                      value={otpValue[i] || ''}
                      onChange={e => handleOtpDigit(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      autoFocus={i === 0}
                    />
                  ))}
                </div>
              </div>

              {/* Resend */}
              <div className="reg-resend">
                {countdown > 0 ? (
                  <span>Resend OTP in <strong>{countdown}s</strong></span>
                ) : (
                  <button type="button" className="reg-resend-btn" onClick={handleResendOtp} disabled={isLoading}>
                    Resend OTP
                  </button>
                )}
              </div>

              <button type="submit" className="reg-btn" disabled={isLoading}>
                {isLoading ? (
                  <><span className="reg-btn-spinner" /> Verifying...</>
                ) : (
                  '✓ Verify & Create Account'
                )}
              </button>

              <button type="button" className="reg-back-btn" onClick={() => { setStep(1); setError(''); }}>
                ← Back to Details
              </button>
            </form>
          )}

          {/* Footer */}
          <div className="reg-footer">
            <button type="button" onClick={() => { setRole(''); setStep(1); setError(''); }}>
              ← Change Account Type
            </button>
            <br />
            <span>Already have an account? </span>
            <Link to="/login">Login</Link>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── STYLES ────────────────────────────────────────────────────────────
const registerStyles = `
  * { margin: 0; padding: 0; box-sizing: border-box; }

  :root {
    --primary: #4f46e5;
    --accent: #06b6d4;
    --success: #22c55e;
    --danger: #ef4444;
    --bg: #ffffff;
    --bg-secondary: #fafafa;
    --bg-tertiary: #f3f4f6;
    --text: #0a0a0a;
    --text-secondary: #525252;
    --text-tertiary: #a3a3a3;
    --border: #e5e5e5;
    --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.08);
  }

  body.dark-mode {
    --bg: #0a0a0a;
    --bg-secondary: #171717;
    --bg-tertiary: #262626;
    --text: #fafafa;
    --text-secondary: #a3a3a3;
    --text-tertiary: #737373;
    --border: #262626;
    --shadow-lg: 0 20px 25px -5px rgba(0, 0, 0, 0.4);
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
    background: var(--bg-secondary);
    color: var(--text);
    -webkit-font-smoothing: antialiased;
  }

  .reg-container {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2rem;
  }

  .reg-role-selection { max-width: 900px; width: 100%; }
  .reg-header { text-align: center; margin-bottom: 3rem; }
  .reg-title { font-size: 2.5rem; font-weight: 700; letter-spacing: -0.03em; margin-bottom: 0.75rem; }
  .reg-subtitle { font-size: 1.125rem; color: var(--text-secondary); }

  .reg-roles-grid {
    display: grid; grid-template-columns: repeat(2, 1fr);
    gap: 2rem; margin-bottom: 2.5rem;
  }

  .reg-role-card {
    background: var(--bg); border: 1.5px solid var(--border);
    border-radius: 1.125rem; padding: 2.5rem;
    cursor: pointer; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    text-align: center;
  }
  .reg-role-card:hover {
    transform: translateY(-4px);
    box-shadow: var(--shadow-lg);
    border-color: var(--primary);
  }
  .reg-role-icon { font-size: 3.5rem; margin-bottom: 1.5rem; }
  .reg-role-title { font-size: 1.5rem; font-weight: 600; margin-bottom: 0.75rem; }
  .reg-role-desc { color: var(--text-secondary); line-height: 1.6; font-size: 0.9375rem; }
  .reg-back-link { text-align: center; }
  .reg-back-link a { color: var(--text-secondary); text-decoration: none; font-size: 0.9375rem; }
  .reg-back-link a:hover { color: var(--primary); }

  .reg-form-card {
    background: var(--bg); border: 1.5px solid var(--border);
    border-radius: 1.125rem; padding: 2.5rem;
    max-width: 520px; width: 100%; box-shadow: var(--shadow-lg);
  }
  .reg-form-header { text-align: center; margin-bottom: 1.5rem; }
  .reg-role-badge {
    display: inline-block; padding: 0.4375rem 1rem;
    background: linear-gradient(135deg, rgba(79,70,229,0.08), rgba(6,182,212,0.08));
    border: 1.5px solid rgba(79,70,229,0.15); border-radius: 100px;
    font-size: 0.8125rem; font-weight: 600; color: var(--primary);
    margin-bottom: 1rem; text-transform: uppercase; letter-spacing: 0.02em;
  }
  .reg-form-title { font-size: 1.875rem; font-weight: 700; margin-bottom: 0.5rem; letter-spacing: -0.03em; }
  .reg-form-subtitle { color: var(--text-secondary); font-size: 0.9375rem; }

  .reg-steps {
    display: flex; align-items: center; justify-content: center;
    gap: 0; margin-bottom: 2rem;
  }
  .reg-step {
    display: flex; flex-direction: column; align-items: center; gap: 6px;
    opacity: 0.4; transition: all 0.3s;
  }
  .reg-step.active { opacity: 1; }
  .reg-step-dot {
    width: 32px; height: 32px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 0.75rem; font-weight: 700;
    border: 2px solid var(--border); color: var(--text-secondary);
    transition: all 0.3s;
  }
  .reg-step.active .reg-step-dot {
    border-color: var(--primary); color: white;
    background: var(--primary);
  }
  .reg-step.done .reg-step-dot {
    border-color: var(--success); background: var(--success); color: white;
  }
  .reg-step span { font-size: 0.75rem; font-weight: 600; color: var(--text-secondary); }
  .reg-step.active span { color: var(--primary); }
  .reg-step.done span { color: var(--success); }
  .reg-step-line {
    width: 60px; height: 2px; background: var(--border); margin: 0 12px;
    position: relative; top: -10px;
  }

  .reg-group { margin-bottom: 1.25rem; }
  .reg-label {
    display: flex; align-items: center; gap: 6px;
    margin-bottom: 0.5rem; font-weight: 500; font-size: 0.875rem;
  }
  .reg-input {
    width: 100%; padding: 0.8rem 1rem;
    border: 1.5px solid var(--border); border-radius: 0.75rem;
    background: var(--bg-secondary); color: var(--text);
    font-size: 0.9375rem; font-family: inherit;
    transition: all 0.2s;
  }
  .reg-input:focus {
    outline: none; border-color: var(--primary);
    background: var(--bg); box-shadow: 0 0 0 3px rgba(79,70,229,0.08);
  }

  .reg-error {
    background: linear-gradient(135deg, #ef4444, #dc2626);
    color: white; padding: 0.8rem 1rem; border-radius: 0.75rem;
    margin-bottom: 1.25rem; font-size: 0.875rem; font-weight: 500; text-align: center;
  }
  .reg-success {
    background: linear-gradient(135deg, #22c55e, #16a34a);
    color: white; padding: 0.8rem 1rem; border-radius: 0.75rem;
    margin-bottom: 1.25rem; font-size: 0.875rem; font-weight: 500; text-align: center;
  }

  .reg-btn {
    width: 100%; padding: 0.9rem; margin-top: 0.5rem;
    background: linear-gradient(135deg, var(--primary), var(--accent));
    color: white; border: none; border-radius: 0.75rem;
    font-weight: 600; font-size: 0.9375rem; cursor: pointer;
    transition: all 0.3s; box-shadow: 0 4px 12px rgba(79,70,229,0.25);
    display: flex; align-items: center; justify-content: center; gap: 8px;
    font-family: inherit;
  }
  .reg-btn:hover:not(:disabled) { transform: translateY(-2px); box-shadow: 0 8px 20px rgba(79,70,229,0.35); }
  .reg-btn:disabled { opacity: 0.6; cursor: not-allowed; }

  .reg-btn-spinner {
    width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.3);
    border-top-color: white; border-radius: 50%;
    animation: regSpin 0.6s linear infinite;
    display: inline-block;
  }

  .reg-back-btn {
    width: 100%; padding: 0.75rem; margin-top: 0.75rem;
    background: transparent; color: var(--text-secondary);
    border: 1.5px solid var(--border); border-radius: 0.75rem;
    font-weight: 500; font-size: 0.875rem; cursor: pointer;
    transition: all 0.2s; font-family: inherit;
  }
  .reg-back-btn:hover { border-color: var(--primary); color: var(--primary); }

  .reg-otp-info {
    text-align: center; padding: 1rem;
    background: var(--bg-tertiary); border-radius: 0.75rem;
    margin-bottom: 1.5rem;
  }
  .reg-otp-info p { font-size: 0.875rem; color: var(--text-secondary); margin-bottom: 0.5rem; }
  .reg-otp-targets {
    display: flex; flex-direction: column; gap: 4px;
    font-size: 0.875rem; font-weight: 600;
  }

  .reg-otp-section { margin-bottom: 1.5rem; }
  .reg-otp-digits {
    display: flex; gap: 8px; justify-content: center; margin-top: 8px;
  }
  .reg-otp-digit {
    width: 48px; height: 54px; text-align: center;
    font-size: 1.25rem; font-weight: 700; font-family: inherit;
    border: 2px solid var(--border); border-radius: 0.625rem;
    background: var(--bg-secondary); color: var(--text);
    transition: all 0.2s; outline: none;
  }
  .reg-otp-digit:focus {
    border-color: var(--primary); background: var(--bg);
    box-shadow: 0 0 0 3px rgba(79,70,229,0.12);
  }

  .reg-resend {
    text-align: center; margin: 1rem 0; font-size: 0.8125rem; color: var(--text-tertiary);
  }
  .reg-resend-btn {
    background: none; border: none; color: var(--primary);
    font-weight: 600; cursor: pointer; text-decoration: underline;
    font-size: 0.875rem; font-family: inherit;
  }
  .reg-resend-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .reg-footer {
    margin-top: 1.5rem; text-align: center; font-size: 0.875rem;
    color: var(--text-secondary);
  }
  .reg-footer button {
    background: none; border: none; color: var(--primary);
    cursor: pointer; font-weight: 500; padding: 0;
    text-decoration: underline; font-family: inherit; font-size: inherit;
  }
  .reg-footer a { color: var(--primary); text-decoration: none; font-weight: 500; }
  .reg-footer a:hover { text-decoration: underline; }

  .reg-success-anim { margin: 1rem auto 1.5rem; width: 72px; height: 72px; }
  .reg-checkmark { width: 72px; height: 72px; }
  .reg-checkmark circle {
    stroke-dasharray: 166; stroke-dashoffset: 166;
    animation: regStroke 0.6s cubic-bezier(0.65,0,0.45,1) forwards;
  }
  .reg-check-path {
    stroke-dasharray: 48; stroke-dashoffset: 48;
    animation: regStroke 0.3s cubic-bezier(0.65,0,0.45,1) 0.4s forwards;
  }

  .reg-spinner {
    width: 24px; height: 24px; margin: 1rem auto;
    border: 3px solid var(--border); border-top-color: var(--primary);
    border-radius: 50%; animation: regSpin 0.7s linear infinite;
  }

  @keyframes regStroke { to { stroke-dashoffset: 0; } }
  @keyframes regSpin { to { transform: rotate(360deg); } }

  @media (max-width: 768px) {
    .reg-roles-grid { grid-template-columns: 1fr; }
    .reg-title { font-size: 2rem; }
  }
  @media (max-width: 480px) {
    .reg-form-card { padding: 2rem 1.5rem; }
    .reg-form-title { font-size: 1.625rem; }
    .reg-otp-digit { width: 42px; height: 48px; font-size: 1.125rem; }
  }
`;
