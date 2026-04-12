import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { hostelsAPI } from '../services/api';
import HostelCard from '../components/HostelCard';
import SearchAutocomplete from '../components/SearchAutocomplete';
import {
  SearchIcon, MapPinIcon, ArrowLeftIcon, FilterIcon,
  XIcon, StarIcon, ChevronDownIcon
} from '../components/Icons';

export default function SearchResults() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [hostels, setHostels] = useState([]);
  const [filteredHostels, setFilteredHostels] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [userLocation, setUserLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Filters state
  const [filters, setFilters] = useState({
    priceRange: [0, 20000],
    minRating: 0,
    gender: 'all',
    amenities: [],
    sortBy: 'rating',
  });

  const q = searchParams.get('q') || '';
  const city = searchParams.get('city') || '';
  const name = searchParams.get('name') || '';
  const displayQuery = q || city || name || 'All Hostels';

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
    getUserLocation();
  }, []);

  useEffect(() => {
    fetchHostels();
  }, [q, city, name, userLocation]);

  useEffect(() => {
    applyFilters();
  }, [hostels, filters]);

  function getUserLocation() {
    if (!navigator.geolocation) { setLocationStatus('error'); return; }
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationStatus('granted');
      },
      () => setLocationStatus('denied'),
      { timeout: 10000, enableHighAccuracy: false }
    );
  }

  async function fetchHostels() {
    setIsLoading(true);
    setError('');
    const params = {};
    if (q) params.q = q;
    else {
      if (city) params.city = city;
      if (name) params.name = name;
    }
    if (userLocation) {
      params.userLat = userLocation.lat;
      params.userLng = userLocation.lng;
    }
    const result = await hostelsAPI.search(params);
    setIsLoading(false);
    if (result.success) {
      setHostels(result.hostels);
    } else {
      setError(result.message || 'Failed to search hostels');
    }
  }

  function handleReSearch(newQuery) {
    setSearchParams({ q: newQuery });
  }

  function applyFilters() {
    let result = [...hostels];

    // Price filter
    result = result.filter(h => {
      const rents = [
        h.roomConfig?.single?.rent,
        h.roomConfig?.double?.rent,
        h.roomConfig?.triple?.rent,
        h.roomConfig?.four?.rent,
      ].filter(r => r > 0);
      if (rents.length === 0) return true;
      const minRent = Math.min(...rents);
      return minRent >= filters.priceRange[0] && minRent <= filters.priceRange[1];
    });

    // Rating filter
    if (filters.minRating > 0) {
      result = result.filter(h => (h.rating?.average || 0) >= filters.minRating);
    }

    // Gender filter
    if (filters.gender !== 'all') {
      result = result.filter(h => h.gender === filters.gender);
    }

    // Amenities filter
    if (filters.amenities.length > 0) {
      result = result.filter(h =>
        filters.amenities.every(a => h.amenities?.includes(a))
      );
    }

    // Sort
    if (filters.sortBy === 'rating') {
      result.sort((a, b) => (b.rating?.average || 0) - (a.rating?.average || 0));
    } else if (filters.sortBy === 'price_low') {
      const getMin = (h) => {
        const r = [h.roomConfig?.single?.rent, h.roomConfig?.double?.rent, h.roomConfig?.triple?.rent, h.roomConfig?.four?.rent].filter(x => x > 0);
        return r.length > 0 ? Math.min(...r) : 99999;
      };
      result.sort((a, b) => getMin(a) - getMin(b));
    } else if (filters.sortBy === 'price_high') {
      const getMin = (h) => {
        const r = [h.roomConfig?.single?.rent, h.roomConfig?.double?.rent, h.roomConfig?.triple?.rent, h.roomConfig?.four?.rent].filter(x => x > 0);
        return r.length > 0 ? Math.min(...r) : 0;
      };
      result.sort((a, b) => getMin(b) - getMin(a));
    }

    setFilteredHostels(result);
  }

  function toggleAmenity(amenity) {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }));
  }

  function resetFilters() {
    setFilters({
      priceRange: [0, 20000],
      minRating: 0,
      gender: 'all',
      amenities: [],
      sortBy: 'rating',
    });
  }

  const allAmenities = ['WiFi', 'Hot Water', 'Meals', 'Cleaning', 'Laundry', 'AC', 'Gym', 'Parking'];
  const hasActiveFilters = filters.minRating > 0 || filters.gender !== 'all' || filters.amenities.length > 0 || filters.priceRange[1] < 20000;

  return (
    <div style={{ minHeight: 'calc(100vh - var(--header-height))' }}>
      <style>{`
        .search-page {
          min-height: calc(100vh - var(--header-height));
          background: var(--bg-secondary);
        }
        .search-hero {
          background: linear-gradient(135deg, var(--primary) 0%, var(--accent) 100%);
          padding: 2rem 2.5rem 2.5rem;
          position: relative;
          overflow: hidden;
        }
        .search-hero::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -20%;
          width: 60%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .search-hero-inner {
          max-width: var(--max-width);
          margin: 0 auto;
          position: relative;
          z-index: 1;
        }
        .search-hero h1 {
          font-size: var(--text-3xl);
          font-weight: 700;
          color: white;
          margin-bottom: var(--space-2);
          letter-spacing: var(--tracking-tighter);
        }
        .search-hero-tags {
          display: flex;
          gap: var(--space-2);
          flex-wrap: wrap;
        }
        .search-tag {
          background: rgba(255,255,255,0.15);
          color: white;
          padding: 0.375rem 0.875rem;
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          display: inline-flex;
          align-items: center;
          gap: var(--space-2);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
        }
        .search-body {
          max-width: var(--max-width);
          margin: 0 auto;
          padding: var(--space-6);
          display: grid;
          grid-template-columns: 280px 1fr;
          gap: var(--space-6);
        }
        .filter-sidebar {
          position: sticky;
          top: calc(var(--header-height) + var(--space-6));
          height: fit-content;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-xl);
          padding: var(--space-5);
          overflow: hidden;
        }
        .filter-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-5);
          padding-bottom: var(--space-4);
          border-bottom: 1px solid var(--border-light);
        }
        .filter-title {
          font-size: var(--text-base);
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: var(--space-2);
        }
        .filter-reset {
          font-size: var(--text-xs);
          color: var(--primary);
          font-weight: 500;
          cursor: pointer;
          background: none;
          border: none;
          padding: 0.25rem 0.5rem;
          border-radius: var(--radius);
          transition: background var(--duration-fast);
        }
        .filter-reset:hover { background: var(--primary-50); }
        .filter-section {
          margin-bottom: var(--space-5);
        }
        .filter-section:last-child { margin-bottom: 0; }
        .filter-label {
          font-size: var(--text-sm);
          font-weight: 600;
          margin-bottom: var(--space-3);
          color: var(--text);
        }
        .filter-select {
          width: 100%;
          padding: var(--space-2-5) var(--space-3);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          background: var(--bg);
          color: var(--text);
          cursor: pointer;
        }
        .filter-select:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.1);
        }
        .filter-pills {
          display: flex;
          flex-wrap: wrap;
          gap: var(--space-2);
        }
        .filter-pill {
          padding: 0.375rem 0.75rem;
          border: 1px solid var(--border);
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: 500;
          cursor: pointer;
          background: var(--bg);
          color: var(--text-secondary);
          transition: all var(--duration-fast);
        }
        .filter-pill:hover { border-color: var(--primary); color: var(--primary); }
        .filter-pill.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .rating-options {
          display: flex;
          flex-direction: column;
          gap: var(--space-2);
        }
        .rating-option {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-3);
          border: 1px solid var(--border);
          border-radius: var(--radius-md);
          cursor: pointer;
          font-size: var(--text-sm);
          transition: all var(--duration-fast);
          background: var(--bg);
        }
        .rating-option:hover { border-color: var(--primary); }
        .rating-option.active {
          border-color: var(--primary);
          background: var(--primary-50);
          color: var(--primary);
        }
        body.dark-mode .rating-option.active {
          background: rgba(99, 102, 241, 0.12);
        }
        .price-range-display {
          display: flex;
          justify-content: space-between;
          font-size: var(--text-xs);
          color: var(--text-secondary);
          margin-top: var(--space-2);
        }
        .price-slider {
          width: 100%;
          accent-color: var(--primary);
        }
        .results-area {
          min-height: 400px;
        }
        .results-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--space-5);
          flex-wrap: wrap;
          gap: var(--space-3);
        }
        .results-count {
          font-size: var(--text-base);
          color: var(--text-secondary);
          font-weight: 500;
        }
        .results-count strong {
          color: var(--primary);
          font-weight: 700;
        }
        .results-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: var(--space-5);
        }
        .mobile-filter-btn {
          display: none;
          position: fixed;
          bottom: var(--space-6);
          right: var(--space-6);
          z-index: 100;
          padding: var(--space-3) var(--space-5);
          background: var(--primary);
          color: white;
          border: none;
          border-radius: var(--radius-full);
          font-weight: 500;
          font-size: var(--text-sm);
          cursor: pointer;
          box-shadow: var(--shadow-lg);
          align-items: center;
          gap: var(--space-2);
        }
        .filter-overlay {
          display: none;
        }
        @media (max-width: 900px) {
          .search-body {
            grid-template-columns: 1fr;
          }
          .filter-sidebar {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 1001;
            border-radius: 0;
            overflow-y: auto;
            padding: var(--space-6);
          }
          .filter-sidebar.mobile-open {
            display: block;
          }
          .filter-overlay.mobile-open {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.5);
            z-index: 1000;
          }
          .mobile-filter-btn {
            display: flex;
          }
          .results-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="search-page">
        {/* Hero */}
        <div className="search-hero">
          <div className="search-hero-inner">
            <Link to="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: 'var(--space-2)',
              color: 'rgba(255,255,255,0.9)', textDecoration: 'none', fontWeight: 500,
              marginBottom: 'var(--space-4)', fontSize: 'var(--text-sm)',
            }}>
              <ArrowLeftIcon size={16} /> Back to Home
            </Link>
            <h1>Search Results</h1>
            <div className="search-hero-tags">
              {displayQuery !== 'All Hostels' && <span className="search-tag"><SearchIcon size={14} /> {displayQuery}</span>}
              {userLocation && <span className="search-tag"><MapPinIcon size={14} /> Near you</span>}
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="search-body">
          {/* Filter Sidebar */}
          <div className={`filter-overlay ${showFilters ? 'mobile-open' : ''}`} onClick={() => setShowFilters(false)} />
          <aside className={`filter-sidebar ${showFilters ? 'mobile-open' : ''}`}>
            <div className="filter-header">
              <div className="filter-title">
                <FilterIcon size={16} /> Filters
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                {hasActiveFilters && (
                  <button className="filter-reset" onClick={resetFilters}>Reset</button>
                )}
                <button className="filter-reset" onClick={() => setShowFilters(false)} style={{ display: showFilters ? 'block' : 'none' }}>
                  <XIcon size={14} />
                </button>
              </div>
            </div>

            {/* Sort */}
            <div className="filter-section">
              <div className="filter-label">Sort By</div>
              <select
                className="filter-select"
                value={filters.sortBy}
                onChange={e => setFilters(f => ({ ...f, sortBy: e.target.value }))}
              >
                <option value="rating">Highest Rated</option>
                <option value="price_low">Price: Low to High</option>
                <option value="price_high">Price: High to Low</option>
              </select>
            </div>

            {/* Price Range */}
            <div className="filter-section">
              <div className="filter-label">Max Price (₹/month)</div>
              <input
                type="range"
                className="price-slider"
                min={0}
                max={20000}
                step={500}
                value={filters.priceRange[1]}
                onChange={e => setFilters(f => ({ ...f, priceRange: [0, parseInt(e.target.value)] }))}
              />
              <div className="price-range-display">
                <span>₹0</span>
                <span style={{ fontWeight: 600, color: 'var(--primary)' }}>
                  {filters.priceRange[1] >= 20000 ? 'Any' : `₹${filters.priceRange[1].toLocaleString()}`}
                </span>
              </div>
            </div>

            {/* Rating */}
            <div className="filter-section">
              <div className="filter-label">Minimum Rating</div>
              <div className="rating-options">
                {[0, 3, 3.5, 4, 4.5].map(r => (
                  <div
                    key={r}
                    className={`rating-option ${filters.minRating === r ? 'active' : ''}`}
                    onClick={() => setFilters(f => ({ ...f, minRating: r }))}
                  >
                    {r === 0 ? 'All Ratings' : (
                      <>
                        {'★'.repeat(Math.floor(r))}
                        {r % 1 !== 0 && '½'}
                        {' '}{r}+
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div className="filter-section">
              <div className="filter-label">Hostel Type</div>
              <div className="filter-pills">
                {[
                  { value: 'all', label: 'All' },
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'coed', label: 'Co-ed' },
                ].map(opt => (
                  <button
                    key={opt.value}
                    className={`filter-pill ${filters.gender === opt.value ? 'active' : ''}`}
                    onClick={() => setFilters(f => ({ ...f, gender: opt.value }))}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Amenities */}
            <div className="filter-section">
              <div className="filter-label">Amenities</div>
              <div className="filter-pills">
                {allAmenities.map(a => (
                  <button
                    key={a}
                    className={`filter-pill ${filters.amenities.includes(a) ? 'active' : ''}`}
                    onClick={() => toggleAmenity(a)}
                  >
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </aside>

          {/* Results */}
          <div className="results-area">
            {/* Inline Re-search Bar with Autocomplete */}
            <div style={{
              display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-5)',
              background: 'var(--bg)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: 'var(--space-3)',
              alignItems: 'center',
            }}>
              <SearchAutocomplete
                onSearch={handleReSearch}
                initialValue={q || city || name || ''}
                compact={true}
              />
              <button
                className="btn btn-primary btn-sm"
                style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 'var(--space-2)', flexShrink: 0 }}
                onClick={() => handleReSearch(q || city || name || '')}
              >
                <SearchIcon size={14} /> Search
              </button>
            </div>
            {error && (
              <div style={{
                background: 'var(--danger)', color: 'white',
                padding: 'var(--space-4) var(--space-5)', borderRadius: 'var(--radius-lg)',
                marginBottom: 'var(--space-5)', fontWeight: 500, fontSize: 'var(--text-sm)',
              }}>
                {error}
              </div>
            )}

            {isLoading ? (
              <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                <div className="spinner spinner-lg" style={{ margin: '0 auto var(--space-4)' }} />
                <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-secondary)' }}>
                  {locationStatus === 'requesting' ? 'Getting your location...' : 'Searching for hostels...'}
                </div>
              </div>
            ) : filteredHostels.length > 0 ? (
              <>
                <div className="results-bar">
                  <div className="results-count">
                    Found <strong>{filteredHostels.length}</strong> hostel{filteredHostels.length !== 1 ? 's' : ''}
                    {filteredHostels.length !== hostels.length && (
                      <span style={{ fontWeight: 400, fontSize: 'var(--text-sm)', marginLeft: 'var(--space-2)' }}>
                        ({hostels.length} total, {hostels.length - filteredHostels.length} filtered out)
                      </span>
                    )}
                  </div>
                  {userLocation && (
                    <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                      <MapPinIcon size={14} /> Distance from you
                    </div>
                  )}
                </div>
                <div className="results-grid">
                  {filteredHostels.map(hostel => (
                    <HostelCard key={hostel._id} hostel={hostel} />
                  ))}
                </div>
              </>
            ) : hostels.length > 0 ? (
              <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                <div style={{ width: 64, height: 64, margin: '0 auto var(--space-5)', borderRadius: 'var(--radius-xl)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                  <FilterIcon size={28} />
                </div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>No Results Match Filters</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
                  Try adjusting your filters to see more results.
                </p>
                <button className="btn btn-outline btn-sm" onClick={resetFilters}>Reset All Filters</button>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '5rem 2rem' }}>
                <div style={{ width: 64, height: 64, margin: '0 auto var(--space-5)', borderRadius: 'var(--radius-xl)', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-tertiary)' }}>
                  <SearchIcon size={28} />
                </div>
                <h2 style={{ fontSize: 'var(--text-xl)', fontWeight: 600, marginBottom: 'var(--space-2)' }}>No Hostels Found</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', maxWidth: 400, margin: '0 auto var(--space-5)' }}>
                  We couldn't find any hostels matching your search. Try a different city.
                </p>
                <Link to="/" className="btn btn-primary">
                  <ArrowLeftIcon size={16} /> Try New Search
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Filter FAB */}
        <button className="mobile-filter-btn" onClick={() => setShowFilters(true)}>
          <FilterIcon size={16} />
          Filters {hasActiveFilters && `(${filters.amenities.length + (filters.minRating > 0 ? 1 : 0) + (filters.gender !== 'all' ? 1 : 0)})`}
        </button>
      </div>
    </div>
  );
}
