import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function HostelInfo() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    document.body.classList.toggle('dark-mode', savedTheme === 'dark')
  }, [])

  function toggleTheme() {
    const dark = !document.body.classList.contains('dark-mode')
    document.body.classList.toggle('dark-mode', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }

  return (
    <main>
      <style>{`
        :root { --c-primary:#0d6efd; --c-bg:#f4f4f4; --c-bg-section:#ffffff; --c-bg-dark-section:#1a1a1a; --c-bg-dark-card:#2a2a2a; --c-text-primary:#333; --c-text-secondary:#f0f0f0; --c-text-muted:#ccc; --c-border:#eee; --c-shadow:rgba(0,0,0,.1); --c-blue-banner:#4A69FF; }
        body.dark-mode { --c-bg:#121212; --c-bg-section:#1e1e1e; --c-bg-dark-section:#1e1e1e; --c-bg-dark-card:#2c2c2c; --c-text-primary:#f0f0f0; --c-text-secondary:#f0f0f0; --c-text-muted:#888; --c-border:#333; --c-shadow:rgba(0,0,0,.3); }
        body { background:var(--c-bg); color:var(--c-text-primary); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; line-height:1.6; transition:background-color .3s,color .3s; }
        .container{width:90%;max-width:1100px;margin:0 auto}
        .header{position:absolute;top:0;left:0;width:100%;padding:1.5rem 0;z-index:100;background:linear-gradient(to bottom,rgba(0,0,0,.5),rgba(0,0,0,0))}
        .navbar{display:flex;justify-content:space-between;align-items:center}
        .nav-logo{font-size:1.5rem;font-weight:bold;color:white}
        .nav-right-cluster{display:flex;align-items:center;gap:1.5rem}
        #theme-toggle{background:none;border:none;cursor:pointer;color:white;width:24px;height:24px}
        .hero-small{height:40vh;min-height:300px;color:white;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background:linear-gradient(rgba(0,0,0,.6),rgba(0,0,0,.6)),url('https://source.unsplash.com/1600x900/?hostel,lounge') no-repeat center/cover}
        .hero-small-content{position:relative;z-index:3;text-align:center}
        .hero-small-content h1{font-size:3rem;color:white;margin-bottom:1rem}
        .hero-small-content p{font-size:1.1rem;color:#eee}
        .facilities-grid{padding:4rem 0;background:var(--c-bg)}
        .grid-wrapper{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2rem}
        .facility-card{background:var(--c-bg-section);border-radius:8px;box-shadow:0 4px 15px var(--c-shadow);overflow:hidden;transition:transform .3s,box-shadow .3s}
        .facility-card:hover{transform:translateY(-5px) scale(1.03);box-shadow:0 8px 25px var(--c-shadow)}
        .card-image{height:220px;overflow:hidden}
        .card-image img{width:100%;height:100%;object-fit:cover}
        .card-content{padding:1.5rem}
        .card-tag{display:inline-block;background:var(--c-primary);color:white;padding:.2rem .6rem;font-size:.8rem;font-weight:bold;border-radius:4px;margin-bottom:.75rem}
        .card-content h3{font-size:1.5rem;color:var(--c-text-primary);margin-bottom:.5rem}
        .card-content p{font-size:.9rem;color:var(--c-text-primary);margin-bottom:1rem}
        .features-list{list-style:none;margin-bottom:1rem}
        .features-list li{display:flex;align-items:center;gap:.5rem;font-size:.9rem;color:var(--c-text-primary);margin-bottom:.5rem}
        .features-list li::before{content:'✓';color:var(--c-primary);font-weight:bold}
        .card-link{font-weight:bold;font-size:.9rem;color:var(--c-primary)}
        .why-choose-us{padding:4rem 0;background:var(--c-blue-banner);color:white}
        .why-title{text-align:center;margin-bottom:3rem}
        .why-title h2{font-size:2.5rem;color:white;margin-bottom:.5rem}
        .why-title p{font-size:1.1rem;color:#eee}
        .stats-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:2rem;text-align:center}
        .stat-item{padding:1rem}
        .stat-number{display:block;font-size:3rem;font-weight:bold;color:white}
        .stat-label{display:block;font-size:1rem;color:#eee}
        .booking-section{padding:4rem 0;background:var(--c-bg-section)}
        .booking-title{text-align:center;font-size:2.5rem;margin-bottom:3rem;color:var(--c-text-primary)}
        .booking-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2rem}
        .booking-card{background:var(--c-bg);border:1px solid var(--c-border);padding:2rem;border-radius:8px;text-align:center;box-shadow:0 4px 15px var(--c-shadow);transition:transform .3s,box-shadow .3s}
        .booking-card:hover{transform:translateY(-5px) scale(1.03);box-shadow:0 8px 25px var(--c-shadow)}
        .booking-card h3{font-size:1.8rem;color:var(--c-text-primary);margin-bottom:.5rem}
        .booking-card p{color:var(--c-text-primary);margin-bottom:1rem}
        .price{display:block;font-size:2rem;font-weight:bold;color:var(--c-primary);margin:.5rem 0 1.5rem}
        .book-now-btn{display:inline-block;background:var(--c-primary);color:white;padding:.8rem 2rem;border-radius:5px;font-weight:bold;transition:transform .3s,box-shadow .3s;text-decoration:none}
        .book-now-btn:hover{transform:scale(1.05);box-shadow:0 4px 10px rgba(13,110,253,.4)}
        .footer{background:var(--c-bg-dark-section);color:var(--c-text-muted)}
        .footer-bottom{text-align:center;padding:1.5rem 0;border-top:1px solid var(--c-border);font-size:.9rem}
        @media (max-width:768px){.hero-small-content h1{font-size:2.5rem}.stats-grid{grid-template-columns:1fr 1fr}}
      `}</style>

      <header className="header">
        <nav className="navbar container">
          <Link to="/" className="nav-logo">Rajesh Hostel</Link>
          <div className="nav-right-cluster">
            <button id="theme-toggle" onClick={toggleTheme} title="Toggle dark mode">🌓</button>
          </div>
        </nav>
      </header>

      <section className="hero-small">
        <div className="hero-small-content container">
          <h1>Our Facilities</h1>
          <p>Experience premium amenities designed for student comfort and productivity.</p>
        </div>
      </section>

      <section className="facilities-grid">
        <div className="container grid-wrapper">
          <div className="facility-card">
            <div className="card-image">
              <img src="images/hostel5.png" alt="Modern Hostel Bathroom" />
            </div>
            <div className="card-content">
              <span className="card-tag">Living Spaces</span>
              <h3>AC & Non-AC Rooms</h3>
              <p>Comfortable living spaces with options for all budgets.</p>
              <ul className="features-list">
                <li>Single/Double/Triple occupancy</li>
                <li>Attached bathrooms</li>
                <li>Daily housekeeping</li>
              </ul>
              <a href="#" className="card-link">View Details →</a>
            </div>
          </div>

          <div className="facility-card">
            <div className="card-image">
              <img src="images/hostel6.png" alt="Hostel Dining Hall" />
            </div>
            <div className="card-content">
              <span className="card-tag">Dining</span>
              <h3>Modern Dining Hall</h3>
              <p>Clean and hygienic environment with delicious food.</p>
              <ul className="features-list">
                <li>4 meals per day</li>
                <li>Vegetarian & non-vegetarian options</li>
                <li>Special diet accommodations</li>
              </ul>
              <Link to="/menu" className="card-link">View Menu →</Link>
            </div>
          </div>

          <div className="facility-card">
            <div className="card-image">
              <img src="images/hostel7.png" alt="Students in Study Room" />
            </div>
            <div className="card-content">
              <span className="card-tag">Study Areas</span>
              <h3>24/7 Study Room</h3>
              <p>A quiet environment with ample resources for learning.</p>
              <ul className="features-list">
                <li>Individual study carrels</li>
                <li>High-speed WiFi</li>
                <li>Reference books available</li>
              </ul>
              <a href="#" className="card-link">View Timings →</a>
            </div>
          </div>

          <div className="facility-card">
            <div className="card-image">
              <img src="images/hostel8.png" alt="Hostel Fitness Center" />
            </div>
            <div className="card-content">
              <span className="card-tag">Recreation</span>
              <h3>Fitness Center</h3>
              <p>Stay active with our modern gym equipment.</p>
              <ul className="features-list">
                <li>Cardio machines</li>
                <li>Weights & strength</li>
                <li>Yoga mats available</li>
              </ul>
              <a href="#" className="card-link">View Schedule →</a>
            </div>
          </div>

          <div className="facility-card">
            <div className="card-image">
              <img src="images/security.png" alt="CCTV Security Camera" />
            </div>
            <div className="card-content">
              <span className="card-tag">Security</span>
              <h3>24/7 Security</h3>
              <p>Your safety is our top priority, round the clock.</p>
              <ul className="features-list">
                <li>CCTV surveillance</li>
                <li>Biometric entry</li>
                <li>Night patrols</li>
              </ul>
              <a href="#" className="card-link">View Protocols →</a>
            </div>
          </div>

          <div className="facility-card">
            <div className="card-image">
              <img src="images/tv.png" alt="Student in TV Lounge" />
            </div>
            <div className="card-content">
              <span className="card-tag">Recreation</span>
              <h3>TV Lounge</h3>
              <p>Relax and unwind in our common area with friends.</p>
              <ul className="features-list">
                <li>Large LED TV</li>
                <li>Comfortable seating</li>
                <li>Streaming services</li>
              </ul>
              <a href="#" className="card-link">View Schedule →</a>
            </div>
          </div>
        </div>
      </section>

      <section className="why-choose-us">
        <div className="container">
          <div className="why-title">
            <h2>Why Choose Our Hostel?</h2>
            <p>Numbers that speak for our quality services</p>
          </div>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">100+</span>
              <span className="stat-label">Happy Students</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">24/7</span>
              <span className="stat-label">Security & Support</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">15+</span>
              <span className="stat-label">Amenities</span>
            </div>
            <div className="stat-item">
              <span className="stat-number">5 min</span>
              <span className="stat-label">From College</span>
            </div>
          </div>
        </div>
      </section>

      <section className="booking-section">
        <div className="container">
          <h2 className="booking-title">Book Your Stay</h2>
          <div className="booking-grid">
            <div className="booking-card">
              <h3>Double Sharing</h3>
              <p>The perfect balance of privacy and community. Fully furnished with study desks.</p>
              <span className="price">₹8,000/month</span>
              <a href="#" className="book-now-btn">Book Now</a>
            </div>

            <div className="booking-card">
              <h3>Triple Sharing</h3>
              <p>A cost-effective and social option, with personal storage for everyone.</p>
              <span className="price">₹6,500/month</span>
              <a href="#" className="book-now-btn">Book Now</a>
            </div>

            <div className="booking-card">
              <h3>Four Sharing</h3>
              <p>Our most affordable and lively room, ideal for making new friends.</p>
              <span className="price">₹5,000/month</span>
              <a href="#" className="book-now-btn">Book Now</a>
            </div>
          </div>
        </div>
      </section>

      <footer className="footer">
        <div className="footer-bottom">
          <p>© 2025 SRKR Hostel Management. All rights reserved.</p>
        </div>
      </footer>
    </main>
  )
}
