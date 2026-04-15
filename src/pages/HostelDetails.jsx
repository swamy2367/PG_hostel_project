import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { hostelsAPI, bookingsAPI, reviewsAPI } from '../services/api';
import {
  MapPinIcon, StarIcon, PhoneIcon, MailIcon, ArrowLeftIcon,
  ChevronLeftIcon, ChevronRightIcon, XIcon, CheckCircleIcon,
  BedIcon, UsersIcon, BuildingIcon, ShieldCheckIcon, ImageIcon,
  ShareIcon, HeartIcon, ClipboardIcon
} from '../components/Icons';

/* ── Scroll Reveal Hook ────────────────────────────────────── */
function useScrollReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { el.classList.add('visible'); obs.unobserve(el); } },
      { threshold: 0.1 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, className = '', style = {} }) {
  const ref = useScrollReveal();
  return <div ref={ref} className={`reveal ${className}`} style={style}>{children}</div>;
}

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════ */
export default function HostelDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hostel, setHostel] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedRoomType, setSelectedRoomType] = useState('');
  const [isBooking, setIsBooking] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAllPhotos, setShowAllPhotos] = useState(false);
  const [aboutExpanded, setAboutExpanded] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    document.body.classList.toggle('dark-mode', savedTheme === 'dark');
    document.body.classList.toggle('dark-theme', savedTheme === 'dark');
    fetchHostelDetails();
    fetchReviews();
  }, [id]);

  async function fetchReviews() {
    const result = await reviewsAPI.getByHostel(id);
    if (result.success) setReviews(result.reviews || []);
  }

  async function fetchHostelDetails() {
    setIsLoading(true);
    const result = await hostelsAPI.getById(id);
    if (result.success) {
      const hostelData = result.hostel;
      const availability = hostelData.availability || {};
      const roomConfig = hostelData.roomConfig || {};
      const hasRoomConfig = Object.values(roomConfig).some(c => c && c.count > 0);
      const hasRoomDocuments = Object.values(availability).some(a => a && a.totalRooms > 0);

      if (hasRoomConfig && !hasRoomDocuments) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/hostels/${id}/sync-rooms`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
          });
          const syncResult = await response.json();
          if (syncResult.success && syncResult.roomsCreated > 0) {
            const refreshed = await hostelsAPI.getById(id);
            if (refreshed.success) { setHostel(refreshed.hostel); setIsLoading(false); return; }
          }
        } catch (err) { console.log('Could not sync rooms:', err.message); }
      }
      setHostel(hostelData);
    } else {
      setError(result.message || 'Failed to load hostel details');
    }
    setIsLoading(false);
  }

  async function handleBookRoom(roomType, durationType = 'month', durationValue = 1) {
    const token = localStorage.getItem('token');
    const userRole = localStorage.getItem('userRole');
    if (!token) {
      toast.error('Please login as a student to book a room');
      navigate('/login');
      return;
    }
    if (userRole !== 'student') { toast.error('Only students can book rooms'); return; }

    setSelectedRoomType(roomType);
    setIsBooking(true);
    const result = await bookingsAPI.create({
      hostelId: id,
      roomType,
      durationType,
      durationValue,
      studentNotes: ''
    });
    setIsBooking(false);

    if (result.success) {
      toast.success(`Payment successful! Your verification code is: ${result.verificationCode}`);
      navigate('/student/dashboard');
    } else {
      toast.error(result.message || 'Payment failed. Please try again.');
    }
  }

  /* ── Derived Data ────────────────────────────────────────── */
  const images = hostel?.images?.length > 0 ? hostel.images
    : hostel?.mainImage ? [hostel.mainImage]
    : hostel?.logo ? [hostel.logo] : [];

  const avgRating = reviews.length > 0
    ? (reviews.reduce((s, r) => s + r.rating, 0) / reviews.length).toFixed(1) : null;

  const lowestPrice = hostel ? Math.min(
    ...[hostel.roomConfig?.single?.rent, hostel.roomConfig?.double?.rent,
        hostel.roomConfig?.triple?.rent, hostel.roomConfig?.four?.rent]
      .filter(Boolean)
  ) : 0;

  const roomTypes = hostel ? [
    hostel.roomConfig?.single?.count > 0 && { type: 'single', name: 'Single Room', ...hostel.roomConfig.single, avail: hostel.roomAvailability?.single },
    hostel.roomConfig?.double?.count > 0 && { type: 'double', name: 'Double Sharing', ...hostel.roomConfig.double, avail: hostel.roomAvailability?.double },
    hostel.roomConfig?.triple?.count > 0 && { type: 'triple', name: 'Triple Sharing', ...hostel.roomConfig.triple, avail: hostel.roomAvailability?.triple },
    hostel.roomConfig?.four?.count > 0 && { type: 'four', name: 'Four Sharing', ...hostel.roomConfig.four, avail: hostel.roomAvailability?.four },
  ].filter(Boolean) : [];

  function handleShare() {
    if (navigator.share) {
      navigator.share({ title: hostel.name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard!');
    }
  }

  /* ── Loading State ───────────────────────────────────────── */
  if (isLoading) {
    return (
      <div className="hd-loading">
        <style>{pageStyles}</style>
        <div className="spinner spinner-lg" />
        <p>Loading hostel details...</p>
      </div>
    );
  }

  /* ── Error State ─────────────────────────────────────────── */
  if (error || !hostel) {
    return (
      <div className="hd-loading">
        <style>{pageStyles}</style>
        <div className="empty-state-icon"><BuildingIcon size={32} /></div>
        <h2 style={{ fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>{error || 'Hostel not found'}</h2>
        <Link to="/" className="btn btn-primary" style={{ gap: 'var(--space-2)' }}>
          <ArrowLeftIcon size={16} /> Back to Home
        </Link>
      </div>
    );
  }

  /* ── Page Render ─────────────────────────────────────────── */
  return (
    <>
      <style>{pageStyles}</style>

      {/* ─── Lightbox ────────────────────────────── */}
      {showAllPhotos && images.length > 0 && (
        <div className="hd-lightbox" onClick={() => setShowAllPhotos(false)}>
          <button className="hd-lightbox-close" onClick={() => setShowAllPhotos(false)}>
            <XIcon size={24} />
          </button>
          <div className="hd-lightbox-inner" onClick={e => e.stopPropagation()}>
            <img src={images[selectedImage]} alt={hostel.name} className="hd-lightbox-img" />
            {images.length > 1 && (
              <>
                <button className="hd-lightbox-nav hd-lightbox-prev" onClick={() => setSelectedImage(i => (i - 1 + images.length) % images.length)}>
                  <ChevronLeftIcon size={24} />
                </button>
                <button className="hd-lightbox-nav hd-lightbox-next" onClick={() => setSelectedImage(i => (i + 1) % images.length)}>
                  <ChevronRightIcon size={24} />
                </button>
              </>
            )}
            <div className="hd-lightbox-counter">{selectedImage + 1} / {images.length}</div>
          </div>
        </div>
      )}

      <div className="hd-page">
        {/* ═══ HERO GALLERY ═══════════════════════════ */}
        <section className="hd-gallery">
          <div className="hd-gallery-main" onClick={() => images.length > 0 && setShowAllPhotos(true)}>
            {images.length > 0 ? (
              <img src={images[selectedImage] || images[0]} alt={hostel.name} />
            ) : (
              <div className="hd-gallery-placeholder">
                <BuildingIcon size={48} />
                <span>No photos available</span>
              </div>
            )}
            {/* Overlay Info */}
            <div className="hd-gallery-overlay">
              <div className="hd-gallery-overlay-top">
                <Link to="/search" className="hd-back-btn">
                  <ArrowLeftIcon size={16} /> Back
                </Link>
                <div className="hd-gallery-actions">
                  <button className="hd-action-pill" onClick={e => { e.stopPropagation(); handleShare(); }}>
                    <ShareIcon size={16} /> Share
                  </button>
                  <button className={`hd-action-pill ${liked ? 'liked' : ''}`} onClick={e => { e.stopPropagation(); setLiked(!liked); }}>
                    <HeartIcon size={16} /> {liked ? 'Saved' : 'Save'}
                  </button>
                </div>
              </div>
              {images.length > 0 && (
                <button className="hd-view-photos" onClick={e => { e.stopPropagation(); setShowAllPhotos(true); }}>
                  <ImageIcon size={16} /> View all {images.length} photos
                </button>
              )}
            </div>
            {/* Rating Badge */}
            {avgRating && (
              <div className="hd-gallery-badge">
                <StarIcon size={14} /> {avgRating}
              </div>
            )}
          </div>

          {/* Thumbnails */}
          {images.length > 1 && (
            <div className="hd-thumbs">
              {images.slice(0, 5).map((img, idx) => (
                <div
                  key={idx}
                  className={`hd-thumb ${selectedImage === idx ? 'active' : ''}`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <img src={img} alt={`${hostel.name} ${idx + 1}`} />
                  {idx === 4 && images.length > 5 && (
                    <div className="hd-thumb-more" onClick={e => { e.stopPropagation(); setShowAllPhotos(true); }}>
                      +{images.length - 5}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ═══ CONTENT GRID ══════════════════════════ */}
        <div className="hd-container">
          <div className="hd-grid">

            {/* ─── LEFT: Information ─────────────────── */}
            <div className="hd-content">
              {/* Title Section */}
              <Reveal>
                <div className="hd-title-section">
                  <div className="hd-breadcrumb">
                    <Link to="/">Home</Link>
                    <span>/</span>
                    <Link to="/search">Search</Link>
                    <span>/</span>
                    <span>{hostel.name}</span>
                  </div>
                  <h1 className="hd-title">{hostel.name}</h1>
                  <div className="hd-meta">
                    <div className="hd-meta-item">
                      <MapPinIcon size={16} />
                      <span>{hostel.address}, {hostel.city}{hostel.state ? `, ${hostel.state}` : ''}</span>
                    </div>
                    {avgRating && (
                      <div className="hd-meta-item hd-meta-rating">
                        <StarIcon size={14} />
                        <span>{avgRating}</span>
                        <span className="hd-meta-dot">·</span>
                        <span>{reviews.length} review{reviews.length !== 1 ? 's' : ''}</span>
                      </div>
                    )}
                    {hostel.hostelType && (
                      <div className="hd-meta-item">
                        <UsersIcon size={14} />
                        <span style={{ textTransform: 'capitalize' }}>{hostel.hostelType}</span>
                      </div>
                    )}
                  </div>
                  {lowestPrice > 0 && (
                    <div className="hd-price-highlight">
                      Starting from <strong>₹{lowestPrice.toLocaleString()}</strong>/month
                    </div>
                  )}
                </div>
              </Reveal>

              {/* About */}
              <Reveal>
                <div className="hd-section">
                  <h2 className="hd-section-title">About This Hostel</h2>
                  <p className={`hd-description ${aboutExpanded ? 'expanded' : ''}`}>
                    {hostel.description || 'A comfortable and affordable hostel for students with all essential amenities and a great living environment.'}
                  </p>
                  {(hostel.description?.length > 300) && (
                    <button className="hd-readmore" onClick={() => setAboutExpanded(!aboutExpanded)}>
                      {aboutExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </div>
              </Reveal>

              {/* Amenities */}
              {hostel.amenities?.length > 0 && (
                <Reveal>
                  <div className="hd-section">
                    <h2 className="hd-section-title">Amenities</h2>
                    <div className="hd-amenities">
                      {hostel.amenities.map((amenity, i) => (
                        <div key={i} className="hd-amenity-chip">
                          <CheckCircleIcon size={14} />
                          <span>{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </Reveal>
              )}

              {/* Contact */}
              <Reveal>
                <div className="hd-section">
                  <h2 className="hd-section-title">Contact Information</h2>
                  <div className="hd-contact-card">
                    {hostel.contactPhone && (
                      <a href={`tel:${hostel.contactPhone}`} className="hd-contact-item">
                        <div className="hd-contact-icon"><PhoneIcon size={18} /></div>
                        <div>
                          <div className="hd-contact-label">Phone</div>
                          <div className="hd-contact-value">{hostel.contactPhone}</div>
                        </div>
                      </a>
                    )}
                    {hostel.contactEmail && (
                      <a href={`mailto:${hostel.contactEmail}`} className="hd-contact-item">
                        <div className="hd-contact-icon"><MailIcon size={18} /></div>
                        <div>
                          <div className="hd-contact-label">Email</div>
                          <div className="hd-contact-value">{hostel.contactEmail}</div>
                        </div>
                      </a>
                    )}
                    <div className="hd-contact-item">
                      <div className="hd-contact-icon"><MapPinIcon size={18} /></div>
                      <div>
                        <div className="hd-contact-label">Address</div>
                        <div className="hd-contact-value">{hostel.address}, {hostel.city}</div>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>

              {/* Reviews */}
              <Reveal>
                <div className="hd-section">
                  <div className="hd-reviews-header">
                    <h2 className="hd-section-title" style={{ marginBottom: 0 }}>Reviews</h2>
                    {avgRating && (
                      <div className="hd-rating-summary">
                        <div className="hd-rating-big">{avgRating}</div>
                        <div>
                          <div className="hd-rating-stars">
                            {[1,2,3,4,5].map(s => (
                              <StarIcon key={s} size={14} style={{ color: s <= Math.round(avgRating) ? '#fbbf24' : 'var(--text-muted)' }} />
                            ))}
                          </div>
                          <div className="hd-rating-count">{reviews.length} review{reviews.length !== 1 ? 's' : ''}</div>
                        </div>
                      </div>
                    )}
                  </div>

                  {reviews.length === 0 ? (
                    <div className="hd-empty-reviews">
                      <ClipboardIcon size={24} />
                      <p>No reviews yet. Be the first to review this hostel!</p>
                    </div>
                  ) : (
                    <div className="hd-reviews-list">
                      {reviews.slice(0, 6).map(review => (
                        <div key={review._id} className={`hd-review-card ${review.isComplaint ? 'complaint' : ''}`}>
                          <div className="hd-review-top">
                            <div className="hd-review-user">
                              <div className="avatar avatar-sm">{(review.student?.name || 'A').charAt(0).toUpperCase()}</div>
                              <div>
                                <div className="hd-review-name">
                                  {review.student?.name || 'Anonymous'}
                                  {review.isComplaint && <span className="badge badge-danger" style={{ marginLeft: 'var(--space-2)', fontSize: '0.625rem' }}>Complaint</span>}
                                </div>
                                <div className="hd-review-date">{new Date(review.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                              </div>
                            </div>
                            <div className="hd-review-stars">
                              {[1,2,3,4,5].map(s => (
                                <StarIcon key={s} size={12} style={{ color: s <= review.rating ? '#fbbf24' : 'var(--text-muted)' }} />
                              ))}
                            </div>
                          </div>
                          {review.comment && <p className="hd-review-text">{review.comment}</p>}
                          {review.ownerResponse && (
                            <div className="hd-owner-response">
                              <div className="hd-owner-response-label">Owner Response</div>
                              <p>{review.ownerResponse}</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </Reveal>
            </div>

            {/* ─── RIGHT: Sticky Booking Panel ──────── */}
            <div className="hd-sidebar">
              <div className="hd-booking-panel">
                <div className="hd-booking-header">
                  <div>
                    <div className="hd-booking-label">Available Rooms</div>
                    <div className="hd-booking-hostel">{hostel.name}</div>
                  </div>
                  {avgRating && (
                    <div className="hd-booking-rating">
                      <StarIcon size={14} /> {avgRating}
                    </div>
                  )}
                </div>

                <div className="hd-room-list">
                  {roomTypes.length > 0 ? roomTypes.map(room => (
                    <RoomCard
                      key={room.type}
                      type={room.type}
                      name={room.name}
                      rent={room.rent}
                      totalRooms={room.count}
                      availability={room.avail}
                      onBook={handleBookRoom}
                      isBooking={isBooking && selectedRoomType === room.type}
                      hostelId={id}
                    />
                  )) : (
                    <div className="hd-no-rooms">
                      <BedIcon size={24} />
                      <p>No rooms configured yet</p>
                    </div>
                  )}
                </div>

                <div className="hd-booking-footer">
                  <ShieldCheckIcon size={14} />
                  <span>Verified hostel · Instant booking confirmation</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ─── Mobile Bottom Bar ────────────────── */}
        {roomTypes.length > 0 && (
          <div className="hd-mobile-bar">
            <div className="hd-mobile-bar-info">
              <div className="hd-mobile-bar-price">
                From <strong>₹{lowestPrice.toLocaleString()}</strong><span>/mo</span>
              </div>
              {avgRating && (
                <div className="hd-mobile-bar-rating"><StarIcon size={12} /> {avgRating}</div>
              )}
            </div>
            <a href="#hd-rooms" className="btn btn-primary" style={{ padding: '0.75rem 1.5rem' }}>
              View Rooms
            </a>
          </div>
        )}
      </div>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════
   ROOM CARD SUB-COMPONENT — with flexible duration pricing
   ═══════════════════════════════════════════════════════════════ */
function RoomCard({ type, name, rent, availability, totalRooms, onBook, isBooking, hostelId }) {
  const [expanded, setExpanded] = useState(false);
  const [durationType, setDurationType] = useState('month');
  const [durationValue, setDurationValue] = useState(1);
  const [priceBreakdown, setPriceBreakdown] = useState(null);
  const [calcLoading, setCalcLoading] = useState(false);

  const hasRoomDocuments = availability && availability.totalRooms > 0;

  function getCapacity(t) {
    return { single: 1, double: 2, triple: 3, four: 4 }[t] || 1;
  }

  let availableBeds, totalBeds, availableRooms;
  if (hasRoomDocuments) {
    availableBeds = availability.availableBeds || 0;
    totalBeds = availability.totalBeds || 0;
    availableRooms = availability.rooms || [];
  } else {
    const cap = getCapacity(type);
    availableBeds = totalRooms * cap;
    totalBeds = totalRooms * cap;
    availableRooms = [];
  }
  const hasAvailability = availableBeds > 0;

  // Client-side instant calculation (no API call needed for preview)
  const perDay = Math.round(rent / 30);
  const perWeek = Math.round((rent / 30) * 7);
  const displayPrice = durationType === 'day' ? perDay : durationType === 'week' ? perWeek : rent;
  const displayUnit = durationType === 'day' ? 'day' : durationType === 'week' ? 'week' : 'month';
  const totalPrice = displayPrice * durationValue;

  const handleDurationTypeChange = (newType) => {
    setDurationType(newType);
    setDurationValue(1);
    setPriceBreakdown(null);
  };

  const handleDurationValueChange = (val) => {
    const num = Math.max(1, Math.min(365, parseInt(val) || 1));
    setDurationValue(num);
  };

  return (
    <div className={`hd-room-card ${!hasAvailability ? 'unavailable' : ''}`} id="hd-rooms">
      <div className="hd-room-card-top" onClick={() => availableRooms.length > 0 && setExpanded(!expanded)}>
        <div className="hd-room-card-icon">
          <BedIcon size={18} />
        </div>
        <div className="hd-room-card-info">
          <div className="hd-room-card-name">{name}</div>
          <div className="hd-room-card-avail">
            {hasAvailability
              ? <><span className="hd-avail-dot available" />{availableBeds} bed{availableBeds !== 1 ? 's' : ''} available</>
              : <><span className="hd-avail-dot" />No beds available</>
            }
          </div>
        </div>
        <div className="hd-room-card-price">
          <div className="hd-room-card-amount">₹{rent?.toLocaleString()}</div>
          <div className="hd-room-card-period">/month</div>
        </div>
      </div>

      {/* Expandable room details */}
      {expanded && availableRooms.length > 0 && (
        <div className="hd-room-details animate-fade-in">
          <div className="hd-room-chips">
            {availableRooms.slice(0, 6).map(room => (
              <span key={room.id} className="chip">
                Room {room.number} ({room.availableBeds}/{room.capacity})
              </span>
            ))}
            {availableRooms.length > 6 && (
              <span className="chip">+{availableRooms.length - 6} more</span>
            )}
          </div>
        </div>
      )}

      {/* ── Duration Selector ──────────────── */}
      {hasAvailability && (
        <div className="hd-duration-section">
          <div className="hd-duration-label">Stay Duration</div>

          {/* Duration Type Tabs */}
          <div className="hd-duration-tabs">
            {[
              { key: 'day', label: 'Days' },
              { key: 'week', label: 'Weeks' },
              { key: 'month', label: 'Months' },
            ].map(opt => (
              <button
                key={opt.key}
                className={`hd-duration-tab ${durationType === opt.key ? 'active' : ''}`}
                onClick={() => handleDurationTypeChange(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Duration Value Input */}
          <div className="hd-duration-input-row">
            <button
              className="hd-duration-stepper"
              onClick={() => handleDurationValueChange(durationValue - 1)}
              disabled={durationValue <= 1}
            >
              -
            </button>
            <input
              type="number"
              className="hd-duration-input"
              value={durationValue}
              onChange={e => handleDurationValueChange(e.target.value)}
              min="1"
              max="365"
            />
            <button
              className="hd-duration-stepper"
              onClick={() => handleDurationValueChange(durationValue + 1)}
            >
              +
            </button>
            <span className="hd-duration-unit">{displayUnit}{durationValue !== 1 ? 's' : ''}</span>
          </div>

          {/* Price Breakdown */}
          <div className="hd-price-breakdown">
            <div className="hd-price-row">
              <span>₹{displayPrice.toLocaleString()} x {durationValue} {displayUnit}{durationValue !== 1 ? 's' : ''}</span>
              <span>₹{totalPrice.toLocaleString()}</span>
            </div>
            <div className="hd-price-total">
              <span>Total</span>
              <span>₹{totalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )}

      <button
        className="btn btn-primary btn-full hd-book-btn"
        onClick={() => onBook(type, durationType, durationValue)}
        disabled={!hasAvailability || isBooking}
      >
        {isBooking
          ? 'Processing Payment...'
          : hasAvailability
            ? `Pay & Book · ₹${totalPrice.toLocaleString()}`
            : 'No Beds Available'}
      </button>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════
   STYLES
   ═══════════════════════════════════════════════════════════════ */
const pageStyles = `
  /* ── Loading ────────────────────────────── */
  .hd-loading {
    min-height: 80vh;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: var(--space-4);
    color: var(--text-secondary);
    animation: fadeIn 0.3s ease both;
  }

  /* ── Page ───────────────────────────────── */
  .hd-page {
    min-height: 100vh;
    background: var(--bg-body);
    padding-bottom: var(--space-16);
  }

  /* ── Gallery ────────────────────────────── */
  .hd-gallery {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: var(--space-4) var(--space-6) 0;
  }

  .hd-gallery-main {
    position: relative;
    width: 100%;
    height: 420px;
    border-radius: var(--radius-xl);
    overflow: hidden;
    cursor: pointer;
    background: var(--bg-tertiary);
  }

  .hd-gallery-main img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    transition: transform 0.5s var(--ease-out);
  }

  .hd-gallery-main:hover img {
    transform: scale(1.03);
  }

  .hd-gallery-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-3);
    color: var(--text-tertiary);
    font-size: var(--text-sm);
  }

  .hd-gallery-overlay {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    padding: var(--space-5);
    background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 35%, transparent 65%, rgba(0,0,0,0.4) 100%);
    opacity: 1;
    transition: opacity 0.3s;
  }

  .hd-gallery-overlay-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .hd-back-btn {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0.5rem 1rem;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(8px);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: 500;
    color: #0f172a;
    transition: all 0.2s;
    text-decoration: none;
  }

  .hd-back-btn:hover { background: #fff; transform: translateY(-1px); }

  .hd-gallery-actions {
    display: flex;
    gap: var(--space-2);
  }

  .hd-action-pill {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1-5);
    padding: 0.5rem 1rem;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(8px);
    border-radius: var(--radius-full);
    font-size: var(--text-xs);
    font-weight: 500;
    color: #0f172a;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .hd-action-pill:hover { background: #fff; transform: translateY(-1px); }
  .hd-action-pill.liked { background: #fef2f2; color: #dc2626; }

  .hd-view-photos {
    align-self: flex-end;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: 0.5rem 1.25rem;
    background: rgba(255,255,255,0.9);
    backdrop-filter: blur(8px);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: 500;
    color: #0f172a;
    cursor: pointer;
    border: none;
    transition: all 0.2s;
  }

  .hd-view-photos:hover { background: #fff; transform: translateY(-1px); }

  .hd-gallery-badge {
    position: absolute;
    bottom: var(--space-5);
    left: var(--space-5);
    display: flex;
    align-items: center;
    gap: var(--space-1-5);
    padding: 0.375rem 0.875rem;
    background: rgba(0,0,0,0.7);
    backdrop-filter: blur(8px);
    color: #fbbf24;
    font-weight: 600;
    font-size: var(--text-sm);
    border-radius: var(--radius-full);
  }

  /* Thumbnails */
  .hd-thumbs {
    display: flex;
    gap: var(--space-2);
    margin-top: var(--space-3);
    overflow-x: auto;
    padding-bottom: var(--space-2);
  }

  .hd-thumb {
    position: relative;
    width: 80px;
    height: 60px;
    border-radius: var(--radius);
    overflow: hidden;
    cursor: pointer;
    border: 2px solid transparent;
    flex-shrink: 0;
    transition: all 0.2s;
  }

  .hd-thumb.active { border-color: var(--primary); }
  .hd-thumb:hover { border-color: var(--primary-300); opacity: 0.9; }
  .hd-thumb img { width: 100%; height: 100%; object-fit: cover; }

  .hd-thumb-more {
    position: absolute;
    inset: 0;
    background: rgba(0,0,0,0.55);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: var(--text-sm);
  }

  /* ── Lightbox ──────────────────────────── */
  .hd-lightbox {
    position: fixed;
    inset: 0;
    z-index: 9999;
    background: rgba(0,0,0,0.92);
    display: flex;
    align-items: center;
    justify-content: center;
    animation: fadeIn 0.2s ease both;
  }

  .hd-lightbox-close {
    position: absolute;
    top: var(--space-6);
    right: var(--space-6);
    background: rgba(255,255,255,0.1);
    border: none;
    color: white;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 10;
  }

  .hd-lightbox-close:hover { background: rgba(255,255,255,0.2); }

  .hd-lightbox-inner {
    position: relative;
    max-width: 90vw;
    max-height: 85vh;
  }

  .hd-lightbox-img {
    max-width: 90vw;
    max-height: 85vh;
    object-fit: contain;
    border-radius: var(--radius);
  }

  .hd-lightbox-nav {
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    background: rgba(255,255,255,0.12);
    border: none;
    color: white;
    width: 44px;
    height: 44px;
    border-radius: var(--radius-full);
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: all 0.2s;
  }

  .hd-lightbox-nav:hover { background: rgba(255,255,255,0.25); }
  .hd-lightbox-prev { left: -60px; }
  .hd-lightbox-next { right: -60px; }

  .hd-lightbox-counter {
    text-align: center;
    color: rgba(255,255,255,0.7);
    margin-top: var(--space-4);
    font-size: var(--text-sm);
  }

  /* ── Container & Grid ──────────────────── */
  .hd-container {
    max-width: var(--max-width);
    margin: 0 auto;
    padding: var(--space-8) var(--space-6);
  }

  .hd-grid {
    display: grid;
    grid-template-columns: 1fr 380px;
    gap: var(--space-10);
    align-items: start;
  }

  /* ── Content (Left) ────────────────────── */
  .hd-content {
    display: flex;
    flex-direction: column;
    gap: var(--space-2);
  }

  .hd-breadcrumb {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    margin-bottom: var(--space-3);
  }

  .hd-breadcrumb a {
    color: var(--text-secondary);
    transition: color 0.2s;
  }

  .hd-breadcrumb a:hover { color: var(--primary); }

  .hd-title {
    font-size: var(--text-4xl);
    font-weight: 800;
    letter-spacing: var(--tracking-tighter);
    line-height: var(--leading-tight);
    margin-bottom: var(--space-4);
  }

  .hd-meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-4);
    margin-bottom: var(--space-3);
  }

  .hd-meta-item {
    display: flex;
    align-items: center;
    gap: var(--space-1-5);
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .hd-meta-rating { color: var(--text); font-weight: 500; }
  .hd-meta-dot { color: var(--text-tertiary); }

  .hd-price-highlight {
    display: inline-flex;
    padding: var(--space-2) var(--space-4);
    background: var(--success-light);
    color: var(--success-dark);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: 500;
    margin-top: var(--space-2);
  }

  body.dark-mode .hd-price-highlight,
  body.dark-theme .hd-price-highlight {
    color: var(--success);
  }

  /* ── Sections ──────────────────────────── */
  .hd-section {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    padding: var(--space-7);
    margin-top: var(--space-4);
  }

  .hd-section-title {
    font-size: var(--text-xl);
    font-weight: 700;
    letter-spacing: var(--tracking-tight);
    margin-bottom: var(--space-5);
  }

  .hd-description {
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    font-size: var(--text-base);
    max-height: 6.5em;
    overflow: hidden;
    transition: max-height 0.4s var(--ease-default);
  }

  .hd-description.expanded { max-height: 500px; }

  .hd-readmore {
    display: inline-block;
    margin-top: var(--space-3);
    font-size: var(--text-sm);
    font-weight: 600;
    color: var(--primary);
    cursor: pointer;
    background: none;
    border: none;
    padding: 0;
  }

  .hd-readmore:hover { text-decoration: underline; }

  /* Amenities */
  .hd-amenities {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .hd-amenity-chip {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-4);
    background: var(--bg-tertiary);
    border: 1px solid var(--border);
    border-radius: var(--radius-full);
    font-size: var(--text-sm);
    font-weight: 500;
    color: var(--text);
    transition: all 0.2s;
  }

  .hd-amenity-chip:hover {
    border-color: var(--primary-200);
    color: var(--primary);
    transform: translateY(-1px);
    box-shadow: var(--shadow-sm);
  }

  .hd-amenity-chip svg { color: var(--success); flex-shrink: 0; }

  /* Contact */
  .hd-contact-card {
    display: flex;
    flex-direction: column;
    gap: var(--space-1);
  }

  .hd-contact-item {
    display: flex;
    align-items: center;
    gap: var(--space-4);
    padding: var(--space-4);
    border-radius: var(--radius-lg);
    transition: background 0.2s;
    text-decoration: none;
    color: inherit;
  }

  .hd-contact-item:hover { background: var(--bg-tertiary); }

  .hd-contact-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-lg);
    background: var(--primary-50);
    border: 1px solid var(--primary-200);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--primary);
    flex-shrink: 0;
  }

  body.dark-mode .hd-contact-icon,
  body.dark-theme .hd-contact-icon {
    background: rgba(99, 102, 241, 0.1);
    border-color: rgba(99, 102, 241, 0.2);
  }

  .hd-contact-label {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
    margin-bottom: 2px;
  }

  .hd-contact-value {
    font-size: var(--text-sm);
    font-weight: 500;
  }

  /* Reviews */
  .hd-reviews-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--space-5);
  }

  .hd-rating-summary {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .hd-rating-big {
    font-size: var(--text-3xl);
    font-weight: 800;
    letter-spacing: var(--tracking-tighter);
    color: var(--text);
  }

  .hd-rating-stars {
    display: flex;
    gap: 2px;
    margin-bottom: 2px;
  }

  .hd-rating-count {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  .hd-empty-reviews {
    text-align: center;
    padding: var(--space-8);
    color: var(--text-tertiary);
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-3);
  }

  .hd-reviews-list {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-4);
  }

  .hd-review-card {
    padding: var(--space-5);
    background: var(--bg-secondary);
    border-radius: var(--radius-lg);
    border: 1px solid var(--border-light);
    transition: all 0.2s;
  }

  .hd-review-card:hover {
    border-color: var(--border);
    box-shadow: var(--shadow-sm);
  }

  .hd-review-card.complaint { border-color: rgba(239, 68, 68, 0.3); }

  .hd-review-top {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: var(--space-3);
  }

  .hd-review-user {
    display: flex;
    align-items: center;
    gap: var(--space-3);
  }

  .hd-review-name {
    font-weight: 600;
    font-size: var(--text-sm);
  }

  .hd-review-date {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  .hd-review-stars { display: flex; gap: 1px; }

  .hd-review-text {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    line-height: var(--leading-relaxed);
    margin: 0;
  }

  .hd-owner-response {
    margin-top: var(--space-3);
    padding-top: var(--space-3);
    border-top: 1px solid var(--border);
    padding-left: var(--space-4);
    border-left: 3px solid var(--primary);
  }

  .hd-owner-response-label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--primary);
    margin-bottom: var(--space-1);
  }

  .hd-owner-response p {
    font-size: var(--text-sm);
    color: var(--text-secondary);
    margin: 0;
  }

  /* ── Sidebar (Booking Panel) ───────────── */
  .hd-sidebar {
    position: sticky;
    top: calc(var(--header-height) + var(--space-6));
  }

  .hd-booking-panel {
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: var(--radius-xl);
    overflow: hidden;
    box-shadow: var(--shadow-md);
  }

  .hd-booking-header {
    padding: var(--space-6);
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
  }

  .hd-booking-label {
    font-size: var(--text-xs);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.06em;
    color: var(--text-tertiary);
    margin-bottom: var(--space-1);
  }

  .hd-booking-hostel {
    font-size: var(--text-lg);
    font-weight: 700;
    letter-spacing: var(--tracking-tight);
  }

  .hd-booking-rating {
    display: flex;
    align-items: center;
    gap: var(--space-1-5);
    font-weight: 600;
    font-size: var(--text-sm);
    color: var(--text);
    background: var(--bg-tertiary);
    padding: var(--space-1-5) var(--space-3);
    border-radius: var(--radius-full);
  }

  .hd-booking-rating svg { color: #fbbf24; }

  .hd-room-list {
    padding: var(--space-4);
    display: flex;
    flex-direction: column;
    gap: var(--space-3);
  }

  .hd-room-card {
    border: 1px solid var(--border);
    border-radius: var(--radius-lg);
    overflow: hidden;
    transition: all 0.2s;
  }

  .hd-room-card:hover {
    border-color: var(--primary-200);
    box-shadow: var(--shadow-sm);
  }

  .hd-room-card.unavailable { opacity: 0.5; }

  .hd-room-card-top {
    display: flex;
    align-items: center;
    gap: var(--space-3);
    padding: var(--space-4);
    cursor: pointer;
  }

  .hd-room-card-icon {
    width: 40px;
    height: 40px;
    border-radius: var(--radius-md);
    background: var(--bg-tertiary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--text-secondary);
    flex-shrink: 0;
  }

  .hd-room-card-info { flex: 1; min-width: 0; }

  .hd-room-card-name {
    font-weight: 600;
    font-size: var(--text-sm);
    margin-bottom: 2px;
  }

  .hd-room-card-avail {
    display: flex;
    align-items: center;
    gap: var(--space-1-5);
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  .hd-avail-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--danger);
    flex-shrink: 0;
  }

  .hd-avail-dot.available { background: var(--success); }

  .hd-room-card-price { text-align: right; flex-shrink: 0; }

  .hd-room-card-amount {
    font-size: var(--text-lg);
    font-weight: 700;
    color: var(--success-dark);
    letter-spacing: var(--tracking-tight);
  }

  body.dark-mode .hd-room-card-amount,
  body.dark-theme .hd-room-card-amount {
    color: var(--success);
  }

  .hd-room-card-period {
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  .hd-room-details {
    padding: 0 var(--space-4) var(--space-3);
  }

  .hd-room-chips {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--bg-secondary);
    border-radius: var(--radius);
  }

  /* ── Duration Selector ───────────────── */
  .hd-duration-section {
    padding: var(--space-3) var(--space-4);
    border-top: 1px solid var(--border-light);
  }

  .hd-duration-label {
    font-size: var(--text-xs);
    font-weight: 600;
    color: var(--text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--space-2);
  }

  .hd-duration-tabs {
    display: flex;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    overflow: hidden;
    margin-bottom: var(--space-3);
  }

  .hd-duration-tab {
    flex: 1;
    padding: 6px 0;
    border: none;
    background: var(--bg);
    color: var(--text-secondary);
    font-size: var(--text-xs);
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    font-family: inherit;
    border-right: 1px solid var(--border);
  }

  .hd-duration-tab:last-child { border-right: none; }

  .hd-duration-tab.active {
    background: var(--primary);
    color: white;
  }

  .hd-duration-tab:not(.active):hover {
    background: var(--bg-tertiary);
  }

  .hd-duration-input-row {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    margin-bottom: var(--space-3);
  }

  .hd-duration-stepper {
    width: 32px;
    height: 32px;
    border-radius: var(--radius-full);
    border: 1px solid var(--border);
    background: var(--bg);
    color: var(--text);
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s;
    flex-shrink: 0;
    font-family: inherit;
  }

  .hd-duration-stepper:hover:not(:disabled) {
    background: var(--primary);
    color: white;
    border-color: var(--primary);
  }

  .hd-duration-stepper:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .hd-duration-input {
    width: 56px;
    text-align: center;
    padding: 6px;
    border: 1px solid var(--border);
    border-radius: var(--radius);
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--text);
    background: var(--bg);
    font-family: inherit;
    outline: none;
    -moz-appearance: textfield;
  }

  .hd-duration-input::-webkit-outer-spin-button,
  .hd-duration-input::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
  }

  .hd-duration-input:focus {
    border-color: var(--primary);
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .hd-duration-unit {
    font-size: var(--text-sm);
    color: var(--text-tertiary);
    font-weight: 500;
  }

  .hd-price-breakdown {
    background: var(--bg-secondary);
    border-radius: var(--radius);
    padding: var(--space-3);
  }

  .hd-price-row {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-sm);
    color: var(--text-secondary);
    padding-bottom: var(--space-2);
    margin-bottom: var(--space-2);
    border-bottom: 1px solid var(--border-light);
  }

  .hd-price-total {
    display: flex;
    justify-content: space-between;
    font-size: var(--text-base);
    font-weight: 700;
    color: var(--text);
  }

  .hd-book-btn {
    margin: 0 var(--space-4) var(--space-4);
    width: calc(100% - var(--space-8));
  }

  .hd-no-rooms {
    text-align: center;
    padding: var(--space-8) var(--space-4);
    color: var(--text-tertiary);
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
  }

  .hd-booking-footer {
    padding: var(--space-4) var(--space-6);
    border-top: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-xs);
    color: var(--text-tertiary);
  }

  .hd-booking-footer svg { color: var(--success); flex-shrink: 0; }

  /* ── Mobile Bottom Bar ─────────────────── */
  .hd-mobile-bar {
    display: none;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 800;
    background: var(--bg);
    border-top: 1px solid var(--border);
    padding: var(--space-4) var(--space-6);
    justify-content: space-between;
    align-items: center;
    box-shadow: 0 -4px 12px rgba(0,0,0,0.06);
  }

  .hd-mobile-bar-price {
    font-size: var(--text-sm);
    color: var(--text-secondary);
  }

  .hd-mobile-bar-price strong {
    font-size: var(--text-xl);
    color: var(--text);
    font-weight: 700;
  }

  .hd-mobile-bar-price span { font-size: var(--text-xs); }

  .hd-mobile-bar-rating {
    display: flex;
    align-items: center;
    gap: var(--space-1);
    font-size: var(--text-xs);
    font-weight: 500;
    color: var(--text-secondary);
    margin-top: 2px;
  }

  .hd-mobile-bar-rating svg { color: #fbbf24; }

  /* ── Responsive ────────────────────────── */
  @media (max-width: 1024px) {
    .hd-grid {
      grid-template-columns: 1fr;
    }

    .hd-sidebar {
      position: static;
    }

    .hd-mobile-bar {
      display: flex;
    }

    .hd-page {
      padding-bottom: calc(var(--space-16) + 80px);
    }

    .hd-reviews-list {
      grid-template-columns: 1fr;
    }
  }

  @media (max-width: 768px) {
    .hd-gallery {
      padding: var(--space-2) var(--space-3) 0;
    }

    .hd-gallery-main {
      height: 280px;
      border-radius: var(--radius-lg);
    }

    .hd-container {
      padding: var(--space-4) var(--space-3);
    }

    .hd-title {
      font-size: var(--text-2xl);
    }

    .hd-section {
      padding: var(--space-5);
      border-radius: var(--radius-lg);
    }

    .hd-meta {
      flex-direction: column;
      gap: var(--space-2);
    }

    .hd-gallery-actions {
      gap: var(--space-1);
    }

    .hd-action-pill span:not(svg) {
      display: none;
    }

    .hd-lightbox-prev { left: var(--space-3); }
    .hd-lightbox-next { right: var(--space-3); }
  }

  @media (max-width: 480px) {
    .hd-gallery-main { height: 220px; }
    .hd-title { font-size: var(--text-xl); }
    .hd-thumb { width: 60px; height: 45px; }

    .hd-reviews-header {
      flex-direction: column;
      gap: var(--space-3);
      align-items: flex-start;
    }
  }
`;
