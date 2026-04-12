import { Link } from 'react-router-dom';
import { MapPinIcon, StarIcon, BuildingIcon } from './Icons';

export default function HostelCard({ hostel }) {
  const getMinRent = () => {
    const rents = [
      hostel.roomConfig?.single?.rent,
      hostel.roomConfig?.double?.rent,
      hostel.roomConfig?.triple?.rent,
      hostel.roomConfig?.four?.rent
    ].filter(r => r > 0);
    return rents.length > 0 ? Math.min(...rents) : 0;
  };

  const rating = hostel.rating?.average || 0;
  const reviewCount = hostel.rating?.count || 0;
  
  const formatDistance = (km) => {
    if (km === null || km === undefined) return null;
    if (km < 1) return `${Math.round(km * 1000)} m`;
    return `${km} km`;
  };

  const amenityIcons = {
    'WiFi': '📶', 'Hot Water': '🚿', 'Meals': '🍽', 'Cleaning': '🧹',
    'Laundry': '👕', 'AC': '❄️', 'Gym': '💪', 'Parking': '🅿️',
  };

  return (
    <Link to={`/hostel/${hostel._id}`} style={{ textDecoration: 'none', height: '100%' }}>
      <div className="card" style={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        padding: 0,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
        onMouseEnter={e => {
          e.currentTarget.style.transform = 'translateY(-4px)';
          e.currentTarget.style.boxShadow = 'var(--shadow-lg)';
          e.currentTarget.style.borderColor = 'var(--primary)';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '';
          e.currentTarget.style.borderColor = '';
        }}
      >
        {/* Image */}
        <div style={{
          position: 'relative',
          width: '100%',
          height: 180,
          overflow: 'hidden',
          background: 'linear-gradient(135deg, var(--primary), var(--primary-700))',
          flexShrink: 0,
        }}>
          {(hostel.mainImage || hostel.images?.[0] || hostel.logo) ? (
            <img 
              src={hostel.mainImage || hostel.images?.[0] || hostel.logo} 
              alt={hostel.name} 
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transition: 'transform 0.4s ease',
              }}
            />
          ) : (
            <div style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'rgba(255, 255, 255, 0.9)',
            }}>
              <BuildingIcon size={48} />
            </div>
          )}

          {/* Badges */}
          <div style={{
            position: 'absolute',
            top: 'var(--space-3)',
            left: 'var(--space-3)',
            right: 'var(--space-3)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: 'var(--space-2)',
          }}>
            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              {hostel.gender && (
                <span style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  background: 'rgba(255, 255, 255, 0.95)',
                  color: 'var(--primary)',
                }}>
                  {hostel.gender === 'male' ? '♂ MALE' : hostel.gender === 'female' ? '♀ FEMALE' : 'CO-ED'}
                </span>
              )}
              {hostel.isVerified && (
                <span style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '6px',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  background: 'var(--success)',
                  color: 'white',
                }}>
                  Verified
                </span>
              )}
            </div>
            {rating > 0 && (
              <span style={{
                padding: '0.375rem 0.75rem',
                borderRadius: '6px',
                fontSize: '0.6875rem',
                fontWeight: 600,
                background: '#fbbf24',
                color: '#78350f',
                display: 'flex',
                alignItems: 'center',
                gap: '0.25rem',
              }}>
                ★ {rating.toFixed(1)}
              </span>
            )}
          </div>
        </div>

        {/* Content */}
        <div style={{
          padding: 'var(--space-5)',
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
        }}>
          <h3 style={{
            fontSize: 'var(--text-lg)',
            fontWeight: 600,
            margin: '0 0 var(--space-2)',
            lineHeight: 1.3,
            letterSpacing: '-0.01em',
          }}>
            {hostel.name}
          </h3>

          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-1-5)',
            marginBottom: 'var(--space-3)',
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              color: 'var(--text-secondary)',
              fontSize: 'var(--text-sm)',
            }}>
              <MapPinIcon size={14} />
              {hostel.city}, {hostel.state}
            </div>
            
            {hostel.distance !== null && hostel.distance !== undefined && (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 'var(--space-2)',
                color: 'var(--primary)',
                fontSize: 'var(--text-sm)',
                fontWeight: 500,
              }}>
                <MapPinIcon size={14} />
                {formatDistance(hostel.distance)} away
              </div>
            )}

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 'var(--space-2)',
              fontSize: 'var(--text-sm)',
            }}>
              {rating > 0 ? (
                <>
                  <span style={{ color: '#fbbf24' }}>{'★'.repeat(Math.round(rating))}</span>
                  <span style={{ fontWeight: 600 }}>{rating.toFixed(1)}</span>
                  <span style={{ color: 'var(--text-secondary)' }}>({reviewCount} reviews)</span>
                </>
              ) : (
                <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>No ratings yet</span>
              )}
            </div>
          </div>

          {hostel.amenities && hostel.amenities.length > 0 && (
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 'var(--space-2)',
              marginBottom: 'var(--space-4)',
            }}>
              {hostel.amenities.slice(0, 4).map((amenity, index) => (
                <span key={index} className="chip" style={{ fontSize: '0.6875rem' }}>
                  {amenityIcons[amenity] || '✓'} {amenity}
                </span>
              ))}
              {hostel.amenities.length > 4 && (
                <span className="chip" style={{ fontSize: '0.6875rem' }}>
                  +{hostel.amenities.length - 4}
                </span>
              )}
            </div>
          )}

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingTop: 'var(--space-4)',
            marginTop: 'auto',
            borderTop: '1px solid var(--border-light)',
          }}>
            <div>
              <div style={{
                fontSize: '0.6875rem',
                color: 'var(--text-secondary)',
                fontWeight: 500,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}>
                STARTING FROM
              </div>
              <span style={{
                fontSize: 'var(--text-xl)',
                fontWeight: 700,
                color: 'var(--success)',
                lineHeight: 1.2,
              }}>
                ₹{getMinRent().toLocaleString()}
                <span style={{
                  fontSize: 'var(--text-xs)',
                  fontWeight: 500,
                  color: 'var(--text-secondary)',
                }}>/mo</span>
              </span>
            </div>

            <span className="btn btn-primary btn-sm">
              View Details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
