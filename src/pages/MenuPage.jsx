import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'

export default function MenuPage() {
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme')
    document.body.classList.toggle('dark-mode', savedTheme === 'dark')
  }, [])

  function toggleTheme() {
    const dark = !document.body.classList.contains('dark-mode')
    document.body.classList.toggle('dark-mode', dark)
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  }

  const weeklyMenu = [
    {
      day: 'Monday',
      breakfast: ['Poha / Upma', 'Bread Toast', 'Milk/Tea'],
      lunch: ['White Rice', 'Dal Tadka', 'Mix Veg Curry', 'Chicken Curry (Optional)'],
      evening: ['Tea/Coffee', 'Pakora'],
      dinner: ['Chapati', 'Aloo Matar Sabzi', 'Dal Fry']
    },
    {
      day: 'Tuesday',
      breakfast: ['Idli / Vada', 'Coconut Chutney', 'Milk/Coffee'],
      lunch: ['Lemon Rice', 'Sambar', 'Cabbage Poriyal', 'Egg Curry (Optional)'],
      evening: ['Tea/Coffee', 'Cutlet'],
      dinner: ['Chapati', 'Paneer Butter Masala', 'Dal Fry']
    },
    {
      day: 'Wednesday',
      breakfast: ['Dosa / Uttapam', 'Aloo Sabzi', 'Milk/Tea'],
      lunch: ['Pulav', 'Raita', 'Green Beans Stir Fry', 'Fish Curry (Optional)'],
      evening: ['Tea/Coffee', 'Samosa'],
      dinner: ['Roti', 'Mix Veg Dal', 'Salad']
    },
    {
      day: 'Thursday',
      breakfast: ['Upma', 'Chutney', 'Boiled Eggs (Optional)'],
      lunch: ['Rice', 'Dal Makhani', 'Bhindi Fry', 'Chicken Biryani (Optional)'],
      evening: ['Tea/Coffee', 'Lassi'],
      dinner: ['Chapati', 'Chana Masala', 'Dal']
    },
    {
      day: 'Friday',
      breakfast: ['Dosa', 'Sambar', 'Tomato Chutney'],
      lunch: ['Rice', 'Rasam', 'Beans Fry', 'Mutton Curry (Optional)'],
      evening: ['Tea/Coffee', 'Pakora'],
      dinner: ['Chapati', 'Dal Tadka', 'Mix Veg Sabzi']
    },
    {
      day: 'Saturday',
      breakfast: ['Puri', 'Aloo Sabzi', 'Milk/Tea'],
      lunch: ['Rice', 'Dal Makhani', 'Jeera Aloo', 'Egg Curry (Optional)'],
      evening: ['Tea/Coffee', 'Toast Sandwich'],
      dinner: ['Chapati', 'Matar Paneer', 'Dal']
    }
  ]

  return (
    <main>
      <style>{`
        :root { --c-primary:#0d6efd; --c-bg:#f4f4f4; --c-bg-section:#ffffff; --c-bg-dark-section:#1a1a1a; --c-text-primary:#333; --c-text-secondary:#f0f0f0; --c-text-muted:#ccc; --c-border:#eee; --c-shadow:rgba(0,0,0,.1); }
        body.dark-mode { --c-bg:#121212; --c-bg-section:#1e1e1e; --c-bg-dark-section:#1e1e1e; --c-text-primary:#f0f0f0; --c-text-secondary:#f0f0f0; --c-text-muted:#888; --c-border:#333; --c-shadow:rgba(0,0,0,.3); }
        body { background:var(--c-bg); color:var(--c-text-primary); font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif; line-height:1.6; transition:background-color .3s,color .3s; }
        .container{width:90%;max-width:1100px;margin:0 auto}
        .header{position:absolute;top:0;left:0;width:100%;padding:1.5rem 0;z-index:100;background:linear-gradient(to bottom,rgba(0,0,0,.5),rgba(0,0,0,0))}
        .navbar{display:flex;justify-content:space-between;align-items:center}
        .nav-left-cluster{display:flex;align-items:center;gap:.75rem}
        .nav-logo{font-size:1.5rem;font-weight:bold;color:white}
        .back-button{color:white;display:flex;align-items:center;padding:.25rem;border-radius:50%;transition:background-color .3s}
        .back-button:hover{background-color:rgba(255,255,255,.2)}
        .nav-right-cluster{display:flex;align-items:center;gap:1.5rem}
        #theme-toggle{background:none;border:none;cursor:pointer;color:white;width:24px;height:24px}
        .menu-hero{height:30vh;min-height:250px;color:white;position:relative;overflow:hidden;display:flex;align-items:center;justify-content:center;background:linear-gradient(rgba(0,0,0,.6),rgba(0,0,0,.6)),url('https://source.unsplash.com/1600x900/?food,dining') no-repeat center/cover;padding-top:60px}
        .menu-hero-content{position:relative;z-index:3;text-align:center}
        .menu-hero-content h1{font-size:3rem;color:white;margin-bottom:.5rem}
        .menu-hero-content p{font-size:1.1rem;color:#eee}
        .weekly-menu-section{padding:4rem 0;background:var(--c-bg)}
        .menu-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:2rem}
        .day-card{background:var(--c-bg-section);border-radius:8px;box-shadow:0 4px 15px var(--c-shadow);overflow:hidden;transition:transform .3s,box-shadow .3s}
        .day-card:hover{transform:translateY(-5px);box-shadow:0 8px 25px var(--c-shadow)}
        .day-title{background:var(--c-primary);color:white;padding:1rem 1.5rem;font-size:1.6rem;font-weight:bold;border-bottom:2px solid rgba(255,255,255,.2)}
        .meal-section{padding:1rem 1.5rem;border-bottom:1px solid var(--c-border)}
        .meal-section:last-of-type{border-bottom:none}
        .meal-type{font-size:1.2rem;font-weight:600;color:var(--c-primary);margin-bottom:.75rem;display:flex;align-items:center;gap:.5rem}
        .food-list{list-style:none;padding-left:0}
        .food-list li{display:flex;align-items:center;gap:.5rem;font-size:.95rem;color:var(--c-text-primary);margin-bottom:.4rem}
        .food-list li::before{content:'✓';color:green;font-weight:bold;flex-shrink:0}
        .food-list li.optional{font-style:italic;color:var(--c-text-muted)}
        .food-list li.optional::before{color:var(--c-text-muted)}
        .footer{background:var(--c-bg-dark-section);color:var(--c-text-muted)}
        .footer-bottom{text-align:center;padding:1.5rem 0;border-top:1px solid var(--c-border);font-size:.9rem}
        @media (max-width:768px){.menu-hero-content h1{font-size:2.5rem}.menu-grid{grid-template-columns:1fr}.day-title{font-size:1.4rem}.meal-type{font-size:1.1rem}}
      `}</style>

      <header className="header">
        <nav className="navbar container">
          <div className="nav-left-cluster">
            <Link to="/hostel-info" className="back-button" title="Back to Hostel Info">←</Link>
            <Link to="/" className="nav-logo">Rajesh Hostel</Link>
          </div>
          <div className="nav-right-cluster">
            <button id="theme-toggle" onClick={toggleTheme} title="Toggle dark mode">🌓</button>
          </div>
        </nav>
      </header>

      <section className="menu-hero">
        <div className="menu-hero-content container">
          <h1>Weekly Hostel Menu</h1>
          <p>Nutritious meals served daily</p>
        </div>
      </section>

      <section className="weekly-menu-section">
        <div className="container menu-grid">
          {weeklyMenu.map(day => (
            <div key={day.day} className="day-card">
              <div className="day-title">{day.day}</div>
              
              <div className="meal-section">
                <h4 className="meal-type">🌅 Breakfast</h4>
                <ul className="food-list">
                  {day.breakfast.map((item, idx) => (
                    <li key={idx} className={item.includes('Optional') ? 'optional' : ''}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="meal-section">
                <h4 className="meal-type">🍛 Lunch</h4>
                <ul className="food-list">
                  {day.lunch.map((item, idx) => (
                    <li key={idx} className={item.includes('Optional') ? 'optional' : ''}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="meal-section">
                <h4 className="meal-type">☕ Evening</h4>
                <ul className="food-list">
                  {day.evening.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="meal-section">
                <h4 className="meal-type">🌙 Dinner</h4>
                <ul className="food-list">
                  {day.dinner.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
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
