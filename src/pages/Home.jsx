import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function Home() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    document.body.classList.toggle('dark-mode', savedTheme === 'dark')
    
    // Hero carousel
    let currentSlide = 0
    const slides = document.querySelectorAll('.hero-slide')
    
    function nextSlide() {
      slides[currentSlide].classList.remove('active')
      currentSlide = (currentSlide + 1) % slides.length
      slides[currentSlide].classList.add('active')
    }
    
    const interval = setInterval(nextSlide, 4000)
    
    return () => clearInterval(interval)
  }, [])

  function toggleTheme() {
    const dark = !document.body.classList.contains('dark-mode')
    document.body.classList.toggle('dark-mode', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }

  return (
    <main>
      <style>{`
        :root { --c-primary:#0d6efd; --c-bg:#f4f4f4; --c-bg-section:#ffffff; --c-bg-dark-section:#1a1a1a; --c-bg-dark-card:#2a2a2a; --c-text-primary:#333; --c-text-secondary:#f0f0f0; --c-text-muted:#ccc; --c-border:#eee; --c-shadow:rgba(0,0,0,.1); }
        body.dark-mode { --c-bg:#121212; --c-bg-section:#1e1e1e; --c-bg-dark-section:#1e1e1e; --c-bg-dark-card:#2c2c2c; --c-text-primary:#f0f0f0; --c-text-secondary:#f0f0f0; --c-text-muted:#888; --c-border:#333; --c-shadow:rgba(0,0,0,.3); }
        body { background:var(--c-bg); color:var(--c-text-primary); }
        a { text-decoration: none; }
        a:hover { text-decoration: none; }
        .container{width:90%;max-width:1100px;margin:0 auto}
        .header{position:absolute;top:0;left:0;width:100%;padding:1.5rem 0;z-index:100;background:linear-gradient(to bottom, rgba(0,0,0,.5), rgba(0,0,0,0))}
        .navbar{display:flex;justify-content:space-between;align-items:center}
        .nav-logo{font-size:1.5rem;font-weight:bold;color:white}
        .nav-right-cluster{display:flex;align-items:center;gap:1.5rem}
        .nav-links{display:flex;list-style:none;gap:1.5rem}
        .nav-links a{color:white;font-weight:500}
        #theme-toggle{background:none;border:none;cursor:pointer;color:white;width:24px;height:24px}
        .hero{height:90vh;min-height:600px;color:white;position:relative;overflow:hidden;display:flex;align-items:center}
        .hero::before{content:'';position:absolute;inset:0;background:rgba(0,0,0,.6);z-index:2}
        .hero-slide{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity 1.5s ease;z-index:1}
        .hero-slide.active{opacity:1}
        .slide-1{background-image:url('/images/hostel1.png')}
        .slide-2{background-image:url('/images/hostel2.png')}
        .slide-3{background-image:url('/images/hostel3.png')}
        .hero-content{position:relative;z-index:3}
        .hero h1{font-size:3.5rem;margin-bottom:1rem;color:white}
        .hero p{font-size:1.2rem;max-width:500px;margin-bottom:2rem;color:white}
        .hero-btn{background:var(--c-primary);color:white;padding:.8rem 1.5rem;font-weight:bold;border:2px solid var(--c-primary);border-radius:5px}
        .about-section{padding:4rem 0;background:var(--c-bg-section)}
        .about-content{display:flex;gap:2rem;align-items:center}
        .about-image img{border-radius:8px;box-shadow:0 4px 15px var(--c-shadow)}
        .room-options{padding:4rem 0;background:var(--c-bg-dark-section)}
        .room-options-title{color:var(--c-text-secondary);text-align:center;font-size:2.5rem;margin-bottom:3rem}
        .room-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:1.5rem;text-align:center}
        .room-card{background:var(--c-bg-dark-card);padding:2rem;border-radius:8px}
        .footer{background:var(--c-bg-dark-section);color:var(--c-text-muted);padding-top:4rem}
        .footer-bottom{text-align:center;padding:1.5rem 0;border-top:1px solid var(--c-border)}
      `}</style>

      <header className="header">
        <nav className="navbar container">
          <Link to="/" className="nav-logo">Rajesh Hostel</Link>
          <div className="nav-right-cluster">
            <ul className="nav-links">
              <li><Link to="/">Home</Link></li>
              <li><a href="#about">About</a></li>
              <li><a href="#rooms">Rooms</a></li>
              <li><Link to="/hostel-info">Hostel Info</Link></li>
            </ul>
            <Link to="/login" className="admin-login" style={{color:'#fff',border:'1px solid #fff',padding:'.5rem 1rem',borderRadius:5}}>Admin Login</Link>
            <button id="theme-toggle" onClick={toggleTheme} title="Toggle dark mode">🌓</button>
          </div>
        </nav>
      </header>

      <section className="hero">
        <div className="hero-slide slide-1 active"></div>
        <div className="hero-slide slide-2"></div>
        <div className="hero-slide slide-3"></div>
        <div className="hero-content container">
          <h1>Premium Student <br/> Accommodation</h1>
          <p>Safe, comfortable and convenient living spaces for SRKR Engineering College students.</p>
          <Link to="/hostel-info" className="hero-btn">Explore Rooms</Link>
        </div>
      </section>

      <section id="about" className="about-section">
        <div className="container">
          <h2 className="about-title" style={{textAlign:'center',fontSize:'2.5rem',marginBottom:'3rem'}}>About Our Hostel</h2>
          <div className="about-content">
            <div className="about-image" style={{flex:1}}>
              <img src="/images/hostel4.png" alt="Rajesh Hostel Building" style={{width:'100%',height:'auto',maxWidth:'500px'}} />
            </div>
            <div className="about-text" style={{flex:1}}>
              <h3>Welcome to Rajesh Hostel</h3>
              <p>Our private hostel is strategically located near SRKR Engineering College, Bhimavaram, providing convenient and comfortable accommodation for students studying in nearby institutions.</p>
              <p>We offer a peaceful and safe environment designed to help students focus on their academics while enjoying a home-like atmosphere. Our facilities are modern, clean, and maintained to the highest standards.</p>
              <p>With 24/7 security, high-speed WiFi, laundry services, and nutritious meals, we provide everything students need for a productive academic life.</p>
              <Link to="/hostel-info" className="about-details-link" style={{display:'inline-block',marginTop:'1rem',color:'var(--c-primary)',fontWeight:'bold'}}>More Details →</Link>
            </div>
          </div>
        </div>
      </section>

      <section id="rooms" className="room-options">
        <div className="container">
          <h2 className="room-options-title">Our Room Options</h2>
          <div className="room-grid">
            <div className="room-card"><h4 style={{color:'#fff'}}>Total Rooms</h4><p style={{color:'#fff',fontSize:'2.5rem',margin:0}}>100</p></div>
            <div className="room-card"><h4 style={{color:'#fff'}}>2-Person Sharing</h4><p style={{color:'#fff',fontSize:'2.5rem',margin:0}}>30</p></div>
            <div className="room-card"><h4 style={{color:'#fff'}}>3-Person Sharing</h4><p style={{color:'#fff',fontSize:'2.5rem',margin:0}}>30</p></div>
            <div className="room-card"><h4 style={{color:'#fff'}}>4-Person Sharing</h4><p style={{color:'#fff',fontSize:'2.5rem',margin:0}}>40</p></div>
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
