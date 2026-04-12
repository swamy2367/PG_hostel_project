import { useState, useEffect, useRef } from 'react';
import { hostelsAPI } from '../services/api';
import {
  SearchIcon, MapPinIcon, BuildingIcon, StarIcon
} from './Icons';

/**
 * SearchAutocomplete — Reusable Airbnb-style search input with autocomplete.
 *
 * Props:
 *   onSearch(query)   — called when user submits a search (Enter / button)
 *   initialValue      — initial input value
 *   placeholder       — input placeholder
 *   autoFocus         — auto-focus the input on mount
 *   compact           — smaller variant for inline use (search results page)
 */
export default function SearchAutocomplete({
  onSearch,
  initialValue = '',
  placeholder = 'Search by city or hostel name...',
  autoFocus = false,
  compact = false,
}) {
  const [query, setQuery] = useState(initialValue);
  const [suggestions, setSuggestions] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const wrapperRef = useRef(null);
  const inputRef = useRef(null);
  const debounceRef = useRef(null);

  // Sync initialValue changes (e.g. URL param changes)
  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  // Close on outside click
  useEffect(() => {
    function onClick(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Debounced suggestions fetch
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setSuggestions([]);
      setShowDropdown(false);
      setActiveIndex(-1);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const result = await hostelsAPI.suggest(trimmed);
      setLoading(false);
      if (result.success) {
        setSuggestions(result.suggestions || []);
        setShowDropdown(true);
        setActiveIndex(-1);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  // Flat list of clickable suggestions (for keyboard nav indexing)
  const flatItems = suggestions;

  function submitSearch(value) {
    const q = (value || query).trim();
    if (!q) return;
    setShowDropdown(false);
    setActiveIndex(-1);
    onSearch?.(q);
  }

  function handleKeyDown(e) {
    if (!showDropdown || flatItems.length === 0) {
      if (e.key === 'Enter') { e.preventDefault(); submitSearch(); }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex(prev => (prev < flatItems.length - 1 ? prev + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex(prev => (prev > 0 ? prev - 1 : flatItems.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0 && flatItems[activeIndex]) {
          const item = flatItems[activeIndex];
          setQuery(item.text);
          submitSearch(item.text);
        } else {
          submitSearch();
        }
        break;
      case 'Escape':
        setShowDropdown(false);
        setActiveIndex(-1);
        break;
    }
  }

  function handleSuggestionClick(item) {
    setQuery(item.text);
    setShowDropdown(false);
    setActiveIndex(-1);
    submitSearch(item.text);
  }

  function clearInput() {
    setQuery('');
    setSuggestions([]);
    setShowDropdown(false);
    setActiveIndex(-1);
    inputRef.current?.focus();
  }

  // Group suggestions by type for section headers
  const citySuggestions = suggestions.filter(s => s.type === 'city');
  const hostelSuggestions = suggestions.filter(s => s.type === 'hostel');

  // Map flat index to grouped position
  let flatIdx = 0;
  function getAndIncrementIdx() {
    return flatIdx++;
  }

  // Reset flatIdx for each render
  flatIdx = 0;

  const inputHeight = compact ? '40px' : '46px';

  return (
    <div
      ref={wrapperRef}
      className="sa-wrapper"
      style={{ position: 'relative', flex: 1 }}
    >
      <style>{`
        .sa-wrapper { position: relative; }

        .sa-icon {
          position: absolute;
          left: ${compact ? '10px' : '14px'};
          top: 50%;
          transform: translateY(-50%);
          color: var(--text-tertiary);
          pointer-events: none;
          z-index: 2;
        }

        .sa-input {
          width: 100%;
          height: ${inputHeight};
          padding: 0 2.5rem 0 ${compact ? '2.25rem' : '2.75rem'};
          border: 1.5px solid var(--border);
          border-radius: var(--radius-md);
          font-size: var(--text-sm);
          font-family: inherit;
          background: var(--bg-secondary);
          color: var(--text);
          transition: all 0.2s;
          outline: none;
        }

        .sa-input:focus {
          border-color: var(--primary);
          background: var(--bg);
          box-shadow: 0 0 0 3px var(--ring);
        }

        .sa-clear {
          position: absolute;
          right: 10px;
          top: 50%;
          transform: translateY(-50%);
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: none;
          background: var(--bg-tertiary);
          color: var(--text-secondary);
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.15s;
          z-index: 2;
          line-height: 1;
        }
        .sa-clear:hover { background: var(--danger); color: white; }

        /* ── Dropdown ────────────────────── */
        .sa-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: var(--bg);
          border: 1px solid var(--border);
          border-radius: var(--radius-lg);
          box-shadow: 0 16px 48px -12px rgba(0,0,0,0.18);
          z-index: 200;
          overflow: hidden;
          animation: saFadeIn 0.18s ease;
          max-height: 380px;
          overflow-y: auto;
        }

        @keyframes saFadeIn {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .sa-section-header {
          padding: 8px 16px 4px;
          font-size: 0.6875rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: var(--text-tertiary);
          display: flex;
          align-items: center;
          gap: 6px;
          border-top: 1px solid var(--border-light);
        }
        .sa-section-header:first-child { border-top: none; }

        .sa-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 10px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          text-align: left;
          font-family: inherit;
          transition: background 0.1s;
          color: var(--text);
        }

        .sa-item:hover,
        .sa-item.sa-active {
          background: var(--bg-tertiary);
        }

        .sa-item-icon {
          width: 34px;
          height: 34px;
          border-radius: var(--radius-md);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .sa-item-icon.city {
          background: rgba(6, 182, 212, 0.08);
          color: #0891b2;
        }
        body.dark-mode .sa-item-icon.city {
          background: rgba(6, 182, 212, 0.12);
          color: #22d3ee;
        }

        .sa-item-icon.hostel {
          background: rgba(99, 102, 241, 0.08);
          color: var(--primary);
        }
        body.dark-mode .sa-item-icon.hostel {
          background: rgba(99, 102, 241, 0.12);
        }

        .sa-item-text {
          flex: 1;
          min-width: 0;
        }

        .sa-item-main {
          font-size: var(--text-sm);
          font-weight: 600;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sa-item-sub {
          font-size: 0.6875rem;
          color: var(--text-tertiary);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .sa-item-rating {
          display: flex;
          align-items: center;
          gap: 3px;
          font-size: 0.6875rem;
          color: #f59e0b;
          font-weight: 600;
          flex-shrink: 0;
        }

        .sa-item-badge {
          font-size: 0.5625rem;
          font-weight: 700;
          padding: 2px 7px;
          border-radius: 100px;
          text-transform: uppercase;
          letter-spacing: 0.04em;
          flex-shrink: 0;
        }
        .sa-item-badge.city {
          background: rgba(6, 182, 212, 0.1);
          color: #0891b2;
        }
        body.dark-mode .sa-item-badge.city {
          background: rgba(6, 182, 212, 0.15);
          color: #22d3ee;
        }
        .sa-item-badge.hostel {
          background: var(--primary-50, rgba(99,102,241,0.08));
          color: var(--primary);
        }
        body.dark-mode .sa-item-badge.hostel {
          background: rgba(99, 102, 241, 0.15);
        }

        /* Loading / Empty */
        .sa-status {
          padding: 20px 16px;
          text-align: center;
          color: var(--text-tertiary);
          font-size: var(--text-sm);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
        }

        .sa-spinner {
          width: 20px;
          height: 20px;
          border: 2px solid var(--border);
          border-top-color: var(--primary);
          border-radius: 50%;
          animation: saSpin 0.6s linear infinite;
        }

        @keyframes saSpin {
          to { transform: rotate(360deg); }
        }

        .sa-footer {
          padding: 8px 16px;
          border-top: 1px solid var(--border-light);
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 0.625rem;
          color: var(--text-tertiary);
        }

        .sa-kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 20px;
          padding: 1px 5px;
          background: var(--bg-secondary);
          border: 1px solid var(--border);
          border-radius: 4px;
          font-size: 0.5625rem;
          font-weight: 600;
          color: var(--text-secondary);
          font-family: inherit;
        }
      `}</style>

      {/* Search Icon */}
      <SearchIcon size={compact ? 15 : 18} className="sa-icon" />

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        className="sa-input"
        placeholder={placeholder}
        value={query}
        onChange={e => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0 && query.trim().length >= 2) setShowDropdown(true);
        }}
        autoComplete="off"
        autoFocus={autoFocus}
      />

      {/* Clear button */}
      {query && (
        <button className="sa-clear" onClick={clearInput} type="button">&times;</button>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="sa-dropdown">
          {loading ? (
            <div className="sa-status">
              <div className="sa-spinner" />
              <span>Searching...</span>
            </div>
          ) : suggestions.length === 0 ? (
            <div className="sa-status">
              <SearchIcon size={20} />
              <span>No suggestions found for "{query}"</span>
            </div>
          ) : (
            <>
              {/* City suggestions */}
              {citySuggestions.length > 0 && (
                <>
                  <div className="sa-section-header">
                    <MapPinIcon size={12} /> Cities
                  </div>
                  {citySuggestions.map((item) => {
                    const idx = getAndIncrementIdx();
                    return (
                      <button
                        key={`city-${item.text}`}
                        className={`sa-item ${activeIndex === idx ? 'sa-active' : ''}`}
                        onClick={() => handleSuggestionClick(item)}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        <span className="sa-item-icon city">
                          <MapPinIcon size={16} />
                        </span>
                        <span className="sa-item-text">
                          <span className="sa-item-main">{item.text}</span>
                          {item.subtext && <span className="sa-item-sub">{item.subtext}</span>}
                        </span>
                        <span className="sa-item-badge city">City</span>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Hostel suggestions */}
              {hostelSuggestions.length > 0 && (
                <>
                  <div className="sa-section-header">
                    <BuildingIcon size={12} /> Hostels
                  </div>
                  {hostelSuggestions.map((item) => {
                    const idx = getAndIncrementIdx();
                    return (
                      <button
                        key={`hostel-${item.text}`}
                        className={`sa-item ${activeIndex === idx ? 'sa-active' : ''}`}
                        onClick={() => handleSuggestionClick(item)}
                        onMouseEnter={() => setActiveIndex(idx)}
                      >
                        <span className="sa-item-icon hostel">
                          <BuildingIcon size={16} />
                        </span>
                        <span className="sa-item-text">
                          <span className="sa-item-main">{item.text}</span>
                          {item.subtext && <span className="sa-item-sub">{item.subtext}</span>}
                        </span>
                        {item.rating > 0 && (
                          <span className="sa-item-rating">
                            <StarIcon size={11} /> {item.rating.toFixed(1)}
                          </span>
                        )}
                        <span className="sa-item-badge hostel">Hostel</span>
                      </button>
                    );
                  })}
                </>
              )}

              {/* Footer with keyboard hints */}
              <div className="sa-footer">
                <span className="sa-kbd">↑</span>
                <span className="sa-kbd">↓</span> navigate
                <span style={{ margin: '0 4px' }}>·</span>
                <span className="sa-kbd">↵</span> select
                <span style={{ margin: '0 4px' }}>·</span>
                <span className="sa-kbd">esc</span> close
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
