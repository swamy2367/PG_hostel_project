import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../services/api';
import {
  ArrowLeftIcon, MailIcon, KeyIcon, GraduationCapIcon,
  BuildingIcon, CheckCircleIcon, AlertCircleIcon
} from '../components/Icons';

// Lock icon (inline since it may not exist in Icons.jsx)
function LockIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

// Shield icon
function ShieldIcon({ size = 24 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    </svg>
  );
}

export default function ForgotPassword() {
  const navigate = useNavigate();

  // Step: 'role' → 'email' → 'otp' → 'reset' → 'done'
  const [step, setStep] = useState('role');
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Resend cooldown
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef(null);

  // OTP expiry countdown (5 min)
  const [otpExpiry, setOtpExpiry] = useState(0);
  const expiryRef = useRef(null);

  // OTP input refs for auto-focus
  const otpRefs = useRef([]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
  }, []);

  // Cleanup timers
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current);
      if (expiryRef.current) clearInterval(expiryRef.current);
    };
  }, []);

  function startResendCooldown() {
    setResendCooldown(30);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(cooldownRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function startOtpExpiry() {
    setOtpExpiry(300); // 5 minutes
    if (expiryRef.current) clearInterval(expiryRef.current);
    expiryRef.current = setInterval(() => {
      setOtpExpiry(prev => {
        if (prev <= 1) { clearInterval(expiryRef.current); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Password strength
  function getPasswordStrength(pwd) {
    if (!pwd) return { level: 0, label: '', color: '' };
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 8) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;

    if (score <= 1) return { level: 1, label: 'Weak', color: 'var(--danger)' };
    if (score <= 2) return { level: 2, label: 'Fair', color: 'var(--warning)' };
    if (score <= 3) return { level: 3, label: 'Good', color: 'var(--accent)' };
    return { level: 4, label: 'Strong', color: 'var(--success)' };
  }

  // ── STEP HANDLERS ──────────────────────────────────────────

  function handleRoleSelect(selectedRole) {
    setRole(selectedRole);
    setStep('email');
    setError('');
  }

  async function handleSendOtp(e) {
    if (e) e.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    setIsLoading(true);
    const result = await authAPI.forgotPassword({ email: email.trim(), role });
    setIsLoading(false);

    if (result.success) {
      setStep('otp');
      setSuccess('OTP sent to your email');
      startResendCooldown();
      startOtpExpiry();
      // Focus the first OTP input after a tick
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } else {
      setError(result.message || 'Failed to send OTP');
    }
  }

  async function handleResendOtp() {
    if (resendCooldown > 0) return;
    setError('');
    setSuccess('');
    setOtp(['', '', '', '', '', '']);

    setIsLoading(true);
    const result = await authAPI.forgotPassword({ email: email.trim(), role });
    setIsLoading(false);

    if (result.success) {
      setSuccess('New OTP sent to your email');
      startResendCooldown();
      startOtpExpiry();
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } else {
      setError(result.message || 'Failed to resend OTP');
    }
  }

  function handleOtpChange(index, value) {
    if (value.length > 1) {
      // Handle paste: spread digits across inputs
      const digits = value.replace(/\D/g, '').slice(0, 6).split('');
      const newOtp = [...otp];
      digits.forEach((d, i) => { if (index + i < 6) newOtp[index + i] = d; });
      setOtp(newOtp);
      const nextIdx = Math.min(index + digits.length, 5);
      otpRefs.current[nextIdx]?.focus();
      return;
    }

    if (value && !/^\d$/.test(value)) return; // Only digits

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    // Auto-focus next
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    const otpString = otp.join('');
    if (otpString.length !== 6) {
      setError('Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    const result = await authAPI.verifyResetOtp({ email: email.trim(), otp: otpString, role });
    setIsLoading(false);

    if (result.success) {
      setStep('reset');
      setSuccess('OTP verified! Set your new password.');
      // Stop the expiry timer
      if (expiryRef.current) clearInterval(expiryRef.current);
    } else {
      setError(result.message || 'Invalid OTP');
    }
  }

  async function handleResetPassword(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!newPassword) {
      setError('Please enter a new password');
      return;
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);
    const result = await authAPI.resetPassword({ email: email.trim(), newPassword, role });
    setIsLoading(false);

    if (result.success) {
      setStep('done');
    } else {
      setError(result.message || 'Failed to reset password');
    }
  }

  const pwdStrength = getPasswordStrength(newPassword);

  // ── STYLES ─────────────────────────────────────────────────
  const pageStyles = `
    .fp-page {
      min-height: 100vh;
      display: flex;
      background: var(--bg-body);
    }

    .fp-left {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-8);
    }

    .fp-right {
      flex: 1;
      background: linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 50%, var(--accent-dark) 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--space-8);
      position: relative;
      overflow: hidden;
    }

    .fp-right::before {
      content: '';
      position: absolute;
      top: -30%;
      right: -20%;
      width: 60%;
      height: 150%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1) 0%, transparent 70%);
      animation: float 20s ease-in-out infinite;
    }

    .fp-right-content {
      position: relative;
      z-index: 1;
      text-align: center;
      color: white;
      max-width: 380px;
    }

    .fp-right-icon {
      width: 72px;
      height: 72px;
      border-radius: var(--radius-xl);
      background: rgba(255,255,255,0.15);
      backdrop-filter: blur(8px);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--space-6);
    }

    .fp-right-title {
      font-size: var(--text-3xl);
      font-weight: 800;
      margin-bottom: var(--space-3);
      letter-spacing: var(--tracking-tighter);
      line-height: var(--leading-tight);
    }

    .fp-right-text {
      font-size: var(--text-base);
      opacity: 0.85;
      line-height: var(--leading-relaxed);
    }

    .fp-content {
      max-width: 420px;
      width: 100%;
      animation: fadeInUp 0.5s ease both;
    }

    .fp-back {
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      color: var(--text-secondary);
      font-size: var(--text-sm);
      font-weight: 500;
      margin-bottom: var(--space-6);
      cursor: pointer;
      background: none;
      border: none;
      padding: 0;
      transition: color var(--duration-fast) var(--ease-default);
    }

    .fp-back:hover {
      color: var(--primary);
    }

    .fp-header {
      margin-bottom: var(--space-6);
    }

    .fp-title {
      font-size: var(--text-2xl);
      font-weight: 700;
      margin-bottom: var(--space-2);
      letter-spacing: var(--tracking-tighter);
      color: var(--text);
    }

    .fp-subtitle {
      color: var(--text-secondary);
      font-size: var(--text-sm);
      line-height: var(--leading-relaxed);
    }

    .fp-email-display {
      background: var(--bg-secondary);
      border: 1px solid var(--border);
      border-radius: var(--radius-md);
      padding: var(--space-2-5) var(--space-3);
      font-size: var(--text-sm);
      color: var(--text-secondary);
      display: inline-flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-5);
    }

    /* Role cards */
    .fp-roles {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: var(--space-4);
      margin-bottom: var(--space-6);
    }

    .fp-role-card {
      background: var(--bg);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-xl);
      padding: var(--space-6) var(--space-4);
      cursor: pointer;
      transition: all var(--duration-normal) var(--ease-default);
      text-align: center;
    }

    .fp-role-card:hover {
      transform: translateY(-3px);
      box-shadow: var(--shadow-lg);
      border-color: var(--primary-300);
    }

    .fp-role-icon {
      width: 48px;
      height: 48px;
      background: var(--primary-50);
      border-radius: var(--radius-lg);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--space-3);
      color: var(--primary);
      border: 1px solid var(--primary-200);
    }

    body.dark-mode .fp-role-icon,
    body.dark-theme .fp-role-icon {
      background: rgba(99, 102, 241, 0.12);
      border-color: rgba(99, 102, 241, 0.25);
    }

    .fp-role-title {
      font-size: var(--text-base);
      font-weight: 600;
      color: var(--text);
    }

    /* Alert boxes */
    .fp-error {
      background: var(--danger-light);
      color: var(--danger-dark);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-4);
      font-size: var(--text-sm);
      font-weight: 500;
      border-left: 3px solid var(--danger);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      animation: fadeInDown 0.3s ease both;
    }

    .fp-success {
      background: var(--success-light);
      color: var(--success-dark);
      padding: var(--space-3) var(--space-4);
      border-radius: var(--radius-md);
      margin-bottom: var(--space-4);
      font-size: var(--text-sm);
      font-weight: 500;
      border-left: 3px solid var(--success);
      display: flex;
      align-items: center;
      gap: var(--space-2);
      animation: fadeInDown 0.3s ease both;
    }

    body.dark-mode .fp-error, body.dark-theme .fp-error { color: var(--danger); }
    body.dark-mode .fp-success, body.dark-theme .fp-success { color: var(--success); }

    /* OTP inputs */
    .fp-otp-row {
      display: flex;
      gap: var(--space-2);
      justify-content: center;
      margin-bottom: var(--space-5);
    }

    .fp-otp-input {
      width: 48px;
      height: 56px;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-md);
      text-align: center;
      font-size: var(--text-xl);
      font-weight: 700;
      font-family: inherit;
      background: var(--bg-secondary);
      color: var(--text);
      outline: none;
      transition: all 0.2s;
      letter-spacing: 0.1em;
    }

    .fp-otp-input:focus {
      border-color: var(--primary);
      background: var(--bg);
      box-shadow: 0 0 0 3px var(--ring);
    }

    .fp-otp-input.filled {
      border-color: var(--primary-300);
      background: var(--primary-50);
    }

    body.dark-mode .fp-otp-input.filled,
    body.dark-theme .fp-otp-input.filled {
      background: rgba(99, 102, 241, 0.1);
    }

    .fp-otp-meta {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: var(--space-5);
      font-size: var(--text-xs);
    }

    .fp-expiry {
      color: var(--text-tertiary);
      font-weight: 500;
    }

    .fp-expiry.urgent {
      color: var(--danger);
      font-weight: 600;
    }

    .fp-resend {
      background: none;
      border: none;
      color: var(--primary);
      font-weight: 600;
      font-size: var(--text-xs);
      cursor: pointer;
      padding: 0;
    }

    .fp-resend:disabled {
      color: var(--text-muted);
      cursor: not-allowed;
    }

    .fp-resend:not(:disabled):hover {
      text-decoration: underline;
    }

    /* Password strength bar */
    .fp-strength {
      margin-top: var(--space-2);
      margin-bottom: var(--space-4);
    }

    .fp-strength-bar {
      height: 4px;
      background: var(--bg-tertiary);
      border-radius: var(--radius-full);
      overflow: hidden;
      margin-bottom: var(--space-1);
    }

    .fp-strength-fill {
      height: 100%;
      border-radius: var(--radius-full);
      transition: all 0.3s ease;
    }

    .fp-strength-label {
      font-size: var(--text-xs);
      font-weight: 500;
    }

    /* Input icon */
    .fp-input-wrap {
      position: relative;
    }

    .fp-input-icon {
      position: absolute;
      left: var(--space-3);
      top: 50%;
      transform: translateY(-50%);
      color: var(--text-tertiary);
      pointer-events: none;
    }

    .fp-input-wrap .form-input {
      padding-left: 2.5rem;
    }

    /* Done state */
    .fp-done {
      text-align: center;
      padding: var(--space-6) 0;
    }

    .fp-done-icon {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: var(--success-light);
      color: var(--success);
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto var(--space-5);
      border: 2px solid var(--success);
      animation: scaleIn 0.4s ease both;
    }

    @keyframes scaleIn {
      from { transform: scale(0.5); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .fp-done-title {
      font-size: var(--text-xl);
      font-weight: 700;
      margin-bottom: var(--space-2);
      color: var(--text);
    }

    .fp-done-text {
      color: var(--text-secondary);
      font-size: var(--text-sm);
      margin-bottom: var(--space-6);
      line-height: var(--leading-relaxed);
    }

    /* Step indicator */
    .fp-steps {
      display: flex;
      align-items: center;
      gap: var(--space-2);
      margin-bottom: var(--space-6);
    }

    .fp-step-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--border);
      transition: all 0.3s;
    }

    .fp-step-dot.active {
      background: var(--primary);
      width: 24px;
      border-radius: var(--radius-full);
    }

    .fp-step-dot.done {
      background: var(--success);
    }

    .fp-footer {
      margin-top: var(--space-6);
      text-align: center;
      font-size: var(--text-sm);
    }

    .fp-footer-link {
      color: var(--primary);
      font-weight: 500;
    }

    .fp-footer-link:hover {
      text-decoration: underline;
    }

    @media (max-width: 768px) {
      .fp-right { display: none; }
      .fp-roles { grid-template-columns: 1fr; }
      .fp-title { font-size: var(--text-xl); }
      .fp-otp-input { width: 42px; height: 48px; font-size: var(--text-lg); }
    }
  `;

  // Step indicator
  const stepOrder = ['role', 'email', 'otp', 'reset', 'done'];
  const currentStepIdx = stepOrder.indexOf(step);

  function goBack() {
    setError('');
    setSuccess('');
    if (step === 'email') setStep('role');
    else if (step === 'otp') setStep('email');
    else if (step === 'reset') setStep('otp');
    else navigate('/login');
  }

  // ── RENDER ─────────────────────────────────────────────────

  return (
    <>
      <style>{pageStyles}</style>
      <div className="fp-page">
        <div className="fp-left">
          <div className="fp-content">

            {/* Back button */}
            {step !== 'done' && (
              <button className="fp-back" onClick={step === 'role' ? () => navigate('/login') : goBack}>
                <ArrowLeftIcon size={16} />
                {step === 'role' ? 'Back to Login' : 'Back'}
              </button>
            )}

            {/* Step dots */}
            {step !== 'done' && (
              <div className="fp-steps">
                {stepOrder.slice(0, 4).map((s, i) => (
                  <div
                    key={s}
                    className={`fp-step-dot ${i === currentStepIdx ? 'active' : ''} ${i < currentStepIdx ? 'done' : ''}`}
                  />
                ))}
              </div>
            )}

            {/* Alerts */}
            {error && <div className="fp-error"><AlertCircleIcon size={16} />{error}</div>}
            {success && <div className="fp-success"><CheckCircleIcon size={16} />{success}</div>}

            {/* ── STEP: Role Selection ──────────────── */}
            {step === 'role' && (
              <>
                <div className="fp-header">
                  <h1 className="fp-title">Forgot Password?</h1>
                  <p className="fp-subtitle">
                    Select your account type and we'll send you a verification code to reset your password.
                  </p>
                </div>

                <div className="fp-roles">
                  <div className="fp-role-card" onClick={() => handleRoleSelect('student')}>
                    <div className="fp-role-icon">
                      <GraduationCapIcon size={22} />
                    </div>
                    <div className="fp-role-title">Student</div>
                  </div>

                  <div className="fp-role-card" onClick={() => handleRoleSelect('owner')}>
                    <div className="fp-role-icon">
                      <BuildingIcon size={22} />
                    </div>
                    <div className="fp-role-title">Hostel Owner</div>
                  </div>
                </div>
              </>
            )}

            {/* ── STEP: Email Input ────────────────── */}
            {step === 'email' && (
              <>
                <div className="fp-header">
                  <h1 className="fp-title">Enter Your Email</h1>
                  <p className="fp-subtitle">
                    Enter the email address linked to your {role === 'student' ? 'student' : 'owner'} account.
                  </p>
                </div>

                <form onSubmit={handleSendOtp}>
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div className="fp-input-wrap">
                      <MailIcon size={16} className="fp-input-icon" />
                      <input
                        type="email"
                        className="form-input"
                        value={email}
                        onChange={(e) => { setEmail(e.target.value); setError(''); }}
                        placeholder="Enter your registered email"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="spinner spinner-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                        Sending OTP...
                      </>
                    ) : 'Send Verification Code'}
                  </button>
                </form>
              </>
            )}

            {/* ── STEP: OTP Verification ───────────── */}
            {step === 'otp' && (
              <>
                <div className="fp-header">
                  <h1 className="fp-title">Verify OTP</h1>
                  <p className="fp-subtitle">
                    Enter the 6-digit code sent to your email.
                  </p>
                  <div className="fp-email-display">
                    <MailIcon size={14} />
                    {email}
                  </div>
                </div>

                <form onSubmit={handleVerifyOtp}>
                  <div className="fp-otp-row">
                    {otp.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => otpRefs.current[i] = el}
                        type="text"
                        inputMode="numeric"
                        maxLength={6}
                        className={`fp-otp-input ${digit ? 'filled' : ''}`}
                        value={digit}
                        onChange={(e) => handleOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleOtpKeyDown(i, e)}
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>

                  <div className="fp-otp-meta">
                    <span className={`fp-expiry ${otpExpiry <= 60 && otpExpiry > 0 ? 'urgent' : ''}`}>
                      {otpExpiry > 0 ? `Expires in ${formatTime(otpExpiry)}` : 'OTP expired'}
                    </span>
                    <button
                      type="button"
                      className="fp-resend"
                      disabled={resendCooldown > 0 || isLoading}
                      onClick={handleResendOtp}
                    >
                      {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                    </button>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary btn-full btn-lg"
                    disabled={isLoading || otp.join('').length !== 6}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner spinner-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                        Verifying...
                      </>
                    ) : 'Verify Code'}
                  </button>
                </form>
              </>
            )}

            {/* ── STEP: New Password ────────────────── */}
            {step === 'reset' && (
              <>
                <div className="fp-header">
                  <h1 className="fp-title">Set New Password</h1>
                  <p className="fp-subtitle">
                    Create a strong password for your account.
                  </p>
                </div>

                <form onSubmit={handleResetPassword}>
                  <div className="form-group">
                    <label className="form-label">New Password</label>
                    <div className="fp-input-wrap">
                      <KeyIcon size={16} className="fp-input-icon" />
                      <input
                        type="password"
                        className="form-input"
                        value={newPassword}
                        onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                        placeholder="Enter new password"
                        required
                        minLength={6}
                        autoFocus
                      />
                    </div>

                    {newPassword && (
                      <div className="fp-strength">
                        <div className="fp-strength-bar">
                          <div
                            className="fp-strength-fill"
                            style={{
                              width: `${(pwdStrength.level / 4) * 100}%`,
                              background: pwdStrength.color,
                            }}
                          />
                        </div>
                        <span className="fp-strength-label" style={{ color: pwdStrength.color }}>
                          {pwdStrength.label}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Password</label>
                    <div className="fp-input-wrap">
                      <KeyIcon size={16} className="fp-input-icon" />
                      <input
                        type="password"
                        className="form-input"
                        value={confirmPassword}
                        onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                        placeholder="Confirm new password"
                        required
                        minLength={6}
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={isLoading}>
                    {isLoading ? (
                      <>
                        <span className="spinner spinner-sm" style={{ borderTopColor: 'white', borderColor: 'rgba(255,255,255,0.3)' }} />
                        Resetting...
                      </>
                    ) : 'Reset Password'}
                  </button>
                </form>
              </>
            )}

            {/* ── STEP: Done ────────────────────────── */}
            {step === 'done' && (
              <div className="fp-done">
                <div className="fp-done-icon">
                  <CheckCircleIcon size={32} />
                </div>
                <h2 className="fp-done-title">Password Reset Complete</h2>
                <p className="fp-done-text">
                  Your password has been updated successfully. You can now log in with your new password.
                </p>
                <button
                  className="btn btn-primary btn-lg btn-full"
                  onClick={() => navigate('/login')}
                >
                  Go to Login
                </button>
              </div>
            )}

            {/* Footer */}
            {step !== 'done' && (
              <div className="fp-footer">
                <span style={{ color: 'var(--text-secondary)' }}>Remember your password? </span>
                <Link to="/login" className="fp-footer-link">Login</Link>
              </div>
            )}

          </div>
        </div>

        <div className="fp-right">
          <div className="fp-right-content">
            <div className="fp-right-icon">
              <ShieldIcon size={32} />
            </div>
            <h2 className="fp-right-title">Secure Password Reset</h2>
            <p className="fp-right-text">
              We use OTP-based verification to make sure only you can reset your password. The code expires in 5 minutes for your safety.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
