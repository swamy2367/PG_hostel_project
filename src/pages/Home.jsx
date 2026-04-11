import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import LocationAutocomplete from '../components/LocationAutocomplete';
import {
  SearchIcon, CheckCircleIcon, HomeIcon, EditIcon, UsersIcon,
  WalletIcon, ArrowRightIcon, SparklesIcon, ShieldCheckIcon
} from '../components/Icons';

export default function Home() {
  const navigate = useNavigate();
  const [searchLocation, setSearchLocation] = useState(null);
  const [hostelName, setHostelName] = useState('');

  function handleSearch() {
    const params = new URLSearchParams();
    if (searchLocation?.city) {
      params.append('city', searchLocation.city);
    }
    if (hostelName.trim()) {
      params.append('name', hostelName.trim());
    }

    if (params.toString()) {
      navigate(`/search?${params.toString()}`);
    } else {
      alert('Please enter a city or hostel name to search');
    }
  }

  return (
    <main>
      <style>{`
        /* ─── HERO ─── */
        .home-hero {
          padding: 6rem 0 5rem;
          position: relative;
          overflow: hidden;
          background: var(--bg-body);
        }

        .home-hero::before {
          content: '';
          position: absolute;
          top: -40%;
          left: -15%;
          width: 55%;
          height: 140%;
          background: radial-gradient(circle, rgba(99, 102, 241, 0.06) 0%, transparent 70%);
          animation: float 25s ease-in-out infinite;
        }

        .home-hero::after {
          content: '';
          position: absolute;
          bottom: -40%;
          right: -10%;
          width: 50%;
          height: 130%;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.06) 0%, transparent 70%);
          animation: float 30s ease-in-out infinite reverse;
        }

        .hero-inner {
          max-width: 860px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 1;
          padding: 0 var(--space-6);
        }

        .hero-badge {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          background: var(--bg);
          border: 1px solid var(--border);
          padding: 0.5rem 1rem;
          border-radius: var(--radius-full);
          color: var(--text-secondary);
          font-size: var(--text-sm);
          font-weight: 500;
          margin-bottom: var(--space-8);
          box-shadow: var(--shadow-sm);
          animation: fadeInUp 0.5s ease both;
        }

        .hero-badge svg {
          color: var(--warning);
        }

        .hero-title {
          font-size: clamp(2.5rem, 5vw, 4rem);
          font-weight: 800;
          color: var(--text);
          margin: 0 0 var(--space-5);
          line-height: 1.08;
          letter-spacing: -0.04em;
          animation: fadeInUp 0.6s ease both;
          animation-delay: 100ms;
        }

        .hero-title-accent {
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .hero-subtitle {
          font-size: var(--text-xl);
          color: var(--text-secondary);
          margin: 0 0 var(--space-10);
          font-weight: 400;
          line-height: var(--leading-relaxed);
          max-width: 600px;
          margin-left: auto;
          margin-right: auto;
          animation: fadeInUp 0.6s ease both;
          animation-delay: 200ms;
        }

        /* ─── SEARCH CARD ─── */
        .search-card {
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          box-shadow: var(--shadow-xl);
          max-width: 800px;
          margin: 0 auto;
          animation: fadeInUp 0.7s ease both;
          animation-delay: 300ms;
          transition: box-shadow var(--duration-slow) var(--ease-default);
        }

        .search-card:hover {
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.12);
        }

        body.dark-mode .search-card:hover,
        body.dark-theme .search-card:hover {
          box-shadow: 0 30px 60px -15px rgba(0, 0, 0, 0.5);
        }

        .search-grid {
          display: grid;
          grid-template-columns: 1.3fr 1fr auto;
          gap: var(--space-3);
          align-items: stretch;
        }

        .search-btn {
          padding: 0.75rem 1.75rem;
          background: linear-gradient(135deg, var(--primary), var(--primary-600));
          color: white;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: var(--text-sm);
          cursor: pointer;
          transition: all var(--duration-normal) var(--ease-default);
          white-space: nowrap;
          box-shadow: var(--shadow-primary);
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }

        .search-btn:hover {
          transform: translateY(-1px);
          box-shadow: var(--shadow-primary-lg);
        }

        .search-btn:active {
          transform: translateY(0);
        }

        .search-input {
          padding: 0.75rem 1rem;
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          background: var(--bg-secondary);
          color: var(--text);
          transition: all var(--duration-normal) var(--ease-default);
        }

        .search-input:focus {
          outline: none;
          border-color: var(--primary);
          background: var(--bg);
          box-shadow: 0 0 0 3px var(--ring);
        }

        /* ─── FEATURES ─── */
        .features-section {
          padding: var(--space-20) 0;
        }

        .section-header {
          text-align: center;
          margin-bottom: var(--space-12);
        }

        .section-tag {
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          padding: 0.4rem 1rem;
          background: var(--primary-50);
          color: var(--primary);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 600;
          margin-bottom: var(--space-4);
          letter-spacing: 0.06em;
          text-transform: uppercase;
          border: 1px solid var(--primary-200);
        }

        body.dark-mode .section-tag,
        body.dark-theme .section-tag {
          background: rgba(99, 102, 241, 0.1);
          border-color: rgba(99, 102, 241, 0.2);
        }

        .section-title {
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          font-weight: 700;
          color: var(--text);
          margin: 0 0 var(--space-3);
          letter-spacing: var(--tracking-tighter);
          line-height: var(--leading-tight);
        }

        .section-subtitle {
          font-size: var(--text-lg);
          color: var(--text-secondary);
          line-height: var(--leading-relaxed);
        }

        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--space-6);
        }

        .feature-card {
          background: var(--bg);
          padding: var(--space-8);
          border-radius: var(--radius-xl);
          border: 1px solid var(--border);
          transition: all var(--duration-slow) var(--ease-default);
          position: relative;
          overflow: hidden;
        }

        .feature-card::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, rgba(99, 102, 241, 0.03), rgba(6, 182, 212, 0.03));
          opacity: 0;
          transition: opacity var(--duration-slow) var(--ease-default);
        }

        .feature-card:hover {
          transform: translateY(-6px);
          box-shadow: var(--shadow-lg);
          border-color: var(--primary-200);
        }

        .feature-card:hover::before {
          opacity: 1;
        }

        .feature-icon {
          width: 48px;
          height: 48px;
          background: linear-gradient(135deg, var(--primary-50), rgba(6, 182, 212, 0.08));
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: var(--space-5);
          color: var(--primary);
          border: 1px solid var(--primary-200);
          transition: all var(--duration-slow) var(--ease-default);
          position: relative;
          z-index: 1;
        }

        body.dark-mode .feature-icon,
        body.dark-theme .feature-icon {
          background: rgba(99, 102, 241, 0.12);
          border-color: rgba(99, 102, 241, 0.2);
        }

        .feature-card:hover .feature-icon {
          transform: scale(1.08) rotate(3deg);
          box-shadow: 0 4px 12px rgba(99, 102, 241, 0.2);
        }

        .feature-title {
          font-size: var(--text-lg);
          font-weight: 600;
          color: var(--text);
          margin: 0 0 var(--space-2);
          position: relative;
          z-index: 1;
        }

        .feature-desc {
          color: var(--text-secondary);
          line-height: var(--leading-relaxed);
          font-size: var(--text-sm);
          position: relative;
          z-index: 1;
        }

        /* ─── CTA ─── */
        .cta-section {
          padding: var(--space-20) 0;
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-700) 50%, var(--accent-dark) 100%);
          position: relative;
          overflow: hidden;
        }

        .cta-section::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -20%;
          width: 70%;
          height: 200%;
          background: radial-gradient(circle, rgba(255, 255, 255, 0.08) 0%, transparent 70%);
          animation: float 25s ease-in-out infinite;
        }

        .cta-inner {
          max-width: 700px;
          margin: 0 auto;
          text-align: center;
          position: relative;
          z-index: 1;
          padding: 0 var(--space-6);
        }

        .cta-title {
          font-size: clamp(1.75rem, 3vw, 2.5rem);
          font-weight: 700;
          color: white;
          margin: 0 0 var(--space-3);
          letter-spacing: var(--tracking-tighter);
          line-height: var(--leading-tight);
        }

        .cta-subtitle {
          font-size: var(--text-lg);
          color: rgba(255, 255, 255, 0.85);
          margin: 0 0 var(--space-8);
          line-height: var(--leading-relaxed);
        }

        .cta-btn {
          padding: 0.875rem 2.25rem;
          background: white;
          color: var(--primary-700);
          border: none;
          border-radius: var(--radius-md);
          font-weight: 600;
          font-size: var(--text-base);
          cursor: pointer;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          transition: all var(--duration-normal) var(--ease-default);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
        }

        .cta-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.2);
        }

        /* ─── FOOTER ─── */
        .home-footer {
          background: var(--bg);
          padding: var(--space-10) 0;
          border-top: 1px solid var(--border);
        }

        .footer-inner {
          max-width: var(--max-width);
          margin: 0 auto;
          padding: 0 var(--space-6);
          text-align: center;
        }

        .footer-brand {
          font-size: var(--text-xl);
          font-weight: 700;
          margin-bottom: var(--space-2);
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }

        .footer-text {
          color: var(--text-tertiary);
          font-size: var(--text-sm);
          margin: var(--space-1) 0;
        }

        /* ─── STATS BAR ─── */
        .stats-bar {
          display: flex;
          justify-content: center;
          gap: var(--space-12);
          padding: var(--space-12) 0;
          border-bottom: 1px solid var(--border);
        }

        .stat-item {
          text-align: center;
        }

        .stat-number {
          font-size: var(--text-4xl);
          font-weight: 800;
          letter-spacing: var(--tracking-tighter);
          background: linear-gradient(135deg, var(--primary), var(--accent));
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          line-height: 1;
          margin-bottom: var(--space-1);
        }

        .stat-label {
          font-size: var(--text-sm);
          color: var(--text-secondary);
          font-weight: 500;
        }

        /* ─── RESPONSIVE ─── */
        @media (max-width: 768px) {
          .home-hero {
            padding: 3rem 0 3rem;
          }
          .search-grid {
            grid-template-columns: 1fr;
          }
          .features-grid {
            grid-template-columns: 1fr;
            gap: var(--space-4);
          }
          .stats-bar {
            flex-direction: column;
            gap: var(--space-6);
            padding: var(--space-8) 0;
          }
        }
      `}</style>

      {/* ═══════ HERO ═══════ */}
      <section className="home-hero">
        <div className="hero-inner">
          <div className="hero-badge">
            <SparklesIcon size={16} />
            <span>Trusted by 10,000+ Students</span>
          </div>

          <h1 className="hero-title">
            Find Your Perfect<br />
            <span className="hero-title-accent">Student Hostel</span>
          </h1>

          <p className="hero-subtitle">
            Discover verified hostels across India with the best amenities, reviews, and prices — all in one place.
          </p>

          <div className="search-card">
            <div className="search-grid">
              <LocationAutocomplete
                onSelect={setSearchLocation}
                placeholder="City or Location"
              />
              <input
                type="text"
                className="search-input"
                placeholder="Hostel Name (Optional)"
                value={hostelName}
                onChange={e => setHostelName(e.target.value)}
                onKeyPress={e => e.key === 'Enter' && handleSearch()}
              />
              <button className="search-btn" onClick={handleSearch}>
                <SearchIcon size={16} />
                Search
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ STATS ═══════ */}
      <div className="container">
        <div className="stats-bar animate-stagger">
          <div className="stat-item">
            <div className="stat-number">500+</div>
            <div className="stat-label">Verified Hostels</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">10K+</div>
            <div className="stat-label">Happy Students</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">50+</div>
            <div className="stat-label">Cities Covered</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">4.8</div>
            <div className="stat-label">Average Rating</div>
          </div>
        </div>
      </div>

      {/* ═══════ HOW IT WORKS ═══════ */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <span className="section-tag">How It Works</span>
            <h2 className="section-title">Simple Steps to Your New Home</h2>
            <p className="section-subtitle">Find and book your perfect hostel in minutes</p>
          </div>

          <div className="features-grid animate-stagger">
            <div className="feature-card">
              <div className="feature-icon">
                <SearchIcon size={22} />
              </div>
              <h3 className="feature-title">Search & Compare</h3>
              <p className="feature-desc">
                Browse hundreds of verified hostels. Filter by location, price, and amenities to find your perfect match.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <CheckCircleIcon size={22} />
              </div>
              <h3 className="feature-title">Book Instantly</h3>
              <p className="feature-desc">
                Create your profile, submit booking requests, and connect directly with hostel owners instantly.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <HomeIcon size={22} />
              </div>
              <h3 className="feature-title">Move In</h3>
              <p className="feature-desc">
                Once approved, complete the payment and move into your comfortable new home away from home.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ FOR OWNERS ═══════ */}
      <section className="features-section" style={{ background: 'var(--bg-secondary)' }}>
        <div className="container">
          <div className="section-header">
            <span className="section-tag">For Owners</span>
            <h2 className="section-title">List Your Hostel</h2>
            <p className="section-subtitle">Reach thousands of students looking for accommodation</p>
          </div>

          <div className="features-grid animate-stagger">
            <div className="feature-card">
              <div className="feature-icon">
                <EditIcon size={22} />
              </div>
              <h3 className="feature-title">Easy Setup</h3>
              <p className="feature-desc">
                Create your hostel profile in minutes with our intuitive registration process.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <UsersIcon size={22} />
              </div>
              <h3 className="feature-title">Manage Bookings</h3>
              <p className="feature-desc">
                Review requests, approve bookings, and manage everything from one dashboard.
              </p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">
                <WalletIcon size={22} />
              </div>
              <h3 className="feature-title">Track Payments</h3>
              <p className="feature-desc">
                Monitor rent payments, generate receipts, and manage finances effortlessly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════ CTA ═══════ */}
      <section className="cta-section">
        <div className="cta-inner">
          <h2 className="cta-title">Ready to Find Your Hostel?</h2>
          <p className="cta-subtitle">
            Join thousands of students who found their perfect accommodation
          </p>
          <Link to="/register" className="cta-btn">
            Get Started Free
            <ArrowRightIcon size={18} />
          </Link>
        </div>
      </section>

      {/* ═══════ FOOTER ═══════ */}
      <footer className="home-footer">
        <div className="footer-inner">
          <div className="footer-brand">HostelHub</div>
          <p className="footer-text">Your Trusted Student Accommodation Platform</p>
          <p className="footer-text" style={{ marginTop: 'var(--space-4)' }}>
            &copy; 2026 HostelHub. All rights reserved.
          </p>
        </div>
      </footer>
    </main>
  );
}
