import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import toast from 'react-hot-toast'
import DashboardLayout from '../components/DashboardLayout'

export default function AddHostel() {
  const navigate = useNavigate()
  const { id: hostelId } = useParams()
  const isEditMode = !!hostelId
  const [isDark, setIsDark] = useState(false)
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    description: '',
    contactPhone: '',
    gender: 'coed',
    amenities: []
  })
  const [rooms, setRooms] = useState({
    single: { count: 0, price: '', roomNumbers: '' },
    double: { count: 0, price: '', roomNumbers: '' },
    triple: { count: 0, price: '', roomNumbers: '' },
    four: { count: 0, price: '', roomNumbers: '' }
  })
  const [images, setImages] = useState([])
  const [mainImageIndex, setMainImageIndex] = useState(0)
  const [uploadingImages, setUploadingImages] = useState(false)
  const [coordinates, setCoordinates] = useState({ lat: 0, lng: 0 })
  const [locationStatus, setLocationStatus] = useState('')

  const amenitiesList = [
    '🛏️ WiFi',
    '🧊 AC',
    '🚿 Hot Water',
    '👨‍⚖️ Security',
    '🍽️ Meals',
    '🧹 Cleaning',
    '🔒 Locker',
    '🎮 Gaming Area',
    '📖 Study Room',
    '🧘 Yoga Studio',
    '🏋️ Gym',
    '📚 Library'
  ]

  // Get hostel location using geocoding based on address
  const getCoordinatesFromAddress = async (address, city, state) => {
    try {
      setLocationStatus('getting')
      // Use a simple geocoding approach - Nominatim (OpenStreetMap)
      const query = encodeURIComponent(`${address}, ${city}, ${state}, India`)
      const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${query}`)
      const data = await response.json()
      
      if (data && data.length > 0) {
        setCoordinates({
          lat: parseFloat(data[0].lat),
          lng: parseFloat(data[0].lon)
        })
        setLocationStatus('success')
        return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
      } else {
        setLocationStatus('not_found')
        return null
      }
    } catch (err) {
      console.error('Geocoding error:', err)
      setLocationStatus('error')
      return null
    }
  }

  // Get current location as fallback
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('unsupported')
      return
    }
    
    setLocationStatus('getting')
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoordinates({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        })
        setLocationStatus('success')
      },
      () => {
        setLocationStatus('denied')
      },
      { timeout: 10000 }
    )
  }

  useEffect(() => {
    // Initialize theme
    const savedTheme = localStorage.getItem('theme')
    setIsDark(savedTheme === 'dark')
    
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-theme')
    } else {
      document.body.classList.remove('dark-theme')
    }

    // Listen for theme changes
    const handleThemeChange = () => {
      const newTheme = localStorage.getItem('theme')
      setIsDark(newTheme === 'dark')
      if (newTheme === 'dark') {
        document.body.classList.add('dark-theme')
      } else {
        document.body.classList.remove('dark-theme')
      }
    }

    window.addEventListener('themeChange', handleThemeChange)
    
    // Load hostel data if in edit mode
    if (isEditMode) {
      loadHostelData()
    }
    
    return () => {
      window.removeEventListener('themeChange', handleThemeChange)
    }
  }, [isEditMode])

  const loadHostelData = async () => {
    try {
      setLoading(true)
      const token = localStorage.getItem('token')
      const response = await fetch(`/api/hostels/${hostelId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await response.json()

      if (response.ok && data.hostel) {
        const h = data.hostel
        
        // Pre-fill form data
        setFormData({
          name: h.name || '',
          address: h.address || '',
          city: h.city || '',
          state: h.state || '',
          pincode: h.pincode || '',
          description: h.description || '',
          contactPhone: h.contactPhone || '',
          gender: h.gender || 'coed',
          amenities: h.amenities || []
        })

        // Pre-fill room data
        setRooms({
          single: {
            count: h.roomConfig?.single?.count || 0,
            price: h.roomConfig?.single?.rent || '',
            roomNumbers: h.roomConfig?.single?.roomNumbers || ''
          },
          double: {
            count: h.roomConfig?.double?.count || 0,
            price: h.roomConfig?.double?.rent || '',
            roomNumbers: h.roomConfig?.double?.roomNumbers || ''
          },
          triple: {
            count: h.roomConfig?.triple?.count || 0,
            price: h.roomConfig?.triple?.rent || '',
            roomNumbers: h.roomConfig?.triple?.roomNumbers || ''
          },
          four: {
            count: h.roomConfig?.four?.count || 0,
            price: h.roomConfig?.four?.rent || '',
            roomNumbers: h.roomConfig?.four?.roomNumbers || ''
          }
        })

        // Pre-fill images
        if (h.images && h.images.length > 0) {
          setImages(h.images)
          // Find main image index
          const mainIdx = h.images.findIndex(img => img === h.mainImage)
          setMainImageIndex(mainIdx >= 0 ? mainIdx : 0)
        }
      } else {
        setError('Failed to load hostel data')
      }
    } catch (err) {
      console.error('Load hostel error:', err)
      setError('Failed to load hostel data')
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleRoomChange = (roomType, field, value) => {
    setRooms(prev => ({
      ...prev,
      [roomType]: { ...prev[roomType], [field]: value }
    }))
  }

  const handleTotalRoomsChange = (value) => {
    const total = parseInt(value) || 0
    setRooms(prev => ({ ...prev, totalRooms: value }))
  }

  const toggleAmenity = (amenity) => {
    setFormData(prev => ({
      ...prev,
      amenities: prev.amenities.includes(amenity)
        ? prev.amenities.filter(a => a !== amenity)
        : [...prev.amenities, amenity]
    }))
  }

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files)
    if (files.length === 0) return

    setUploadingImages(true)
    
    try {
      const newImages = []
      
      for (const file of files) {
        // Convert to base64
        const reader = new FileReader()
        const base64Promise = new Promise((resolve) => {
          reader.onload = () => resolve(reader.result)
          reader.readAsDataURL(file)
        })
        const base64 = await base64Promise
        newImages.push(base64)
      }
      
      setImages(prev => [...prev, ...newImages])
    } catch (err) {
      console.error('Image upload error:', err)
      setError('Failed to upload images')
    } finally {
      setUploadingImages(false)
    }
  }

  const removeImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index))
    // Adjust main image index if needed
    if (index === mainImageIndex) {
      setMainImageIndex(0)
    } else if (index < mainImageIndex) {
      setMainImageIndex(prev => prev - 1)
    }
  }

  const setAsMainImage = (index) => {
    setMainImageIndex(index)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (step === 1) {
      // Validate step 1 with specific error messages
      if (!formData.name?.trim()) {
        setError('Hostel Name is required')
        return
      }
      if (!formData.city?.trim()) {
        setError('City is required')
        return
      }
      if (!formData.state?.trim()) {
        setError('State is required')
        return
      }
      if (!formData.address?.trim()) {
        setError('Address is required')
        return
      }
      if (!formData.contactPhone?.trim()) {
        setError('Contact Phone is required')
        return
      }
      setStep(2)
      return
    }

    // Validate step 2
    const totalConfigured = (parseInt(rooms.single.count) || 0) +
                           (parseInt(rooms.double.count) || 0) +
                           (parseInt(rooms.triple.count) || 0) +
                           (parseInt(rooms.four.count) || 0)

    if (totalConfigured === 0) {
      setError('Please add at least one room type')
      return
    }

    // Validate that prices are set for configured rooms
    if ((parseInt(rooms.single.count) || 0) > 0 && !rooms.single.price) {
      setError('Please set price for Single rooms')
      return
    }
    if ((parseInt(rooms.double.count) || 0) > 0 && !rooms.double.price) {
      setError('Please set price for Double rooms')
      return
    }
    if ((parseInt(rooms.triple.count) || 0) > 0 && !rooms.triple.price) {
      setError('Please set price for Triple rooms')
      return
    }
    if ((parseInt(rooms.four.count) || 0) > 0 && !rooms.four.price) {
      setError('Please set price for Four-person rooms')
      return
    }

    setLoading(true)

    try {
      const token = localStorage.getItem('token')

      // Try to get coordinates from address if not already set
      let hostelCoords = coordinates
      if (coordinates.lat === 0 && coordinates.lng === 0) {
        const geocoded = await getCoordinatesFromAddress(
          formData.address.trim(), 
          formData.city.trim(), 
          formData.state.trim()
        )
        if (geocoded) {
          hostelCoords = geocoded
        }
      }

      // Create hostel with proper roomConfig structure
      const hostelPayload = {
        name: formData.name.trim(),
        address: formData.address.trim(),
        city: formData.city.trim(),
        state: formData.state.trim(),
        pincode: formData.pincode.trim() || '0',
        description: formData.description.trim(),
        contactPhone: formData.contactPhone.trim(),
        gender: formData.gender,
        amenities: formData.amenities,
        images: images,
        mainImage: images.length > 0 ? images[mainImageIndex] : '',
        coordinates: hostelCoords,
        roomConfig: {
          single: {
            count: parseInt(rooms.single.count) || 0,
            rent: parseInt(rooms.single.price) || 0,
            roomNumbers: rooms.single.roomNumbers.trim() || ''
          },
          double: {
            count: parseInt(rooms.double.count) || 0,
            rent: parseInt(rooms.double.price) || 0,
            roomNumbers: rooms.double.roomNumbers.trim() || ''
          },
          triple: {
            count: parseInt(rooms.triple.count) || 0,
            rent: parseInt(rooms.triple.price) || 0,
            roomNumbers: rooms.triple.roomNumbers.trim() || ''
          },
          four: {
            count: parseInt(rooms.four.count) || 0,
            rent: parseInt(rooms.four.price) || 0,
            roomNumbers: rooms.four.roomNumbers.trim() || ''
          }
        }
      }

      console.log('Sending payload:', hostelPayload)

      const url = isEditMode 
        ? `/api/hostels/${hostelId}`
        : '/api/hostels'
      
      const method = isEditMode ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(hostelPayload)
      })

      const data = await response.json()
      console.log('Response:', data)

      if (response.ok && (data.success || data.hostel)) {
        toast.success(isEditMode ? 'Hostel updated successfully!' : 'Hostel created successfully!')
        navigate('/owner/hostels')
      } else {
        // Handle subscription required error
        if (data.requiresSubscription) {
          toast.error('Please complete the one-time payment to list your hostel')
          navigate('/owner/subscription')
          return
        }
        // Handle one-hostel limit error
        if (data.hostelId) {
          toast.error('You already have a hostel')
          navigate(`/owner/hostels/${data.hostelId}/edit`)
          return
        }
        setError(data.message || 'Failed to save hostel')
      }
    } catch (err) {
      setError(err.message || 'Failed to create hostel')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <DashboardLayout role="owner">
      <div className={`add-hostel-wrapper ${isDark ? 'dark-theme' : 'light-theme'}`}>
      <style>{`
        .add-hostel-wrapper {
          min-height: 100vh;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', sans-serif;
          transition: all 0.2s ease;
        }

        .light-theme {
          background: #ffffff;
          color: #111827;
        }

        .dark-theme {
          background: #0f172a;
          color: #f1f5f9;
        }

        .add-hostel-container {
          max-width: 900px;
          margin: 0 auto;
          padding: 2.5rem 2rem;
        }

        .page-header {
          margin-bottom: 2rem;
        }

        .page-title {
          font-size: 1.875rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 0.375rem;
          letter-spacing: -0.025em;
        }

        .dark-theme .page-title {
          color: #f1f5f9;
        }

        .page-subtitle {
          font-size: 0.9375rem;
          color: #6b7280;
        }

        .dark-theme .page-subtitle {
          color: #94a3b8;
        }

        .form-card {
          background: #ffffff;
          border-radius: 1rem;
          padding: 1.5rem;
          border: 1px solid #e2e8f0;
        }

        .dark-theme .form-card {
          background: #1e293b;
          border-color: #334155;
        }

        .progress-bar {
          height: 4px;
          background: #e2e8f0;
          border-radius: 2px;
          margin-bottom: 1.5rem;
          overflow: hidden;
        }

        .dark-theme .progress-bar {
          background: #334155;
        }

        .progress-fill {
          height: 100%;
          background: #111827;
          transition: width 0.3s ease;
        }

        .dark-theme .progress-fill {
          background: #3b82f6;
        }

        .room-config-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
          gap: 1.25rem;
          margin-bottom: 1.5rem;
        }

        .room-type-card {
          border: 1px solid #e2e8f0;
          border-radius: 1rem;
          padding: 1.25rem;
          transition: all 0.2s ease;
          background: #f8fafc;
        }

        .dark-theme .room-type-card {
          border-color: #334155;
          background: #0f172a;
        }

        .room-type-card:hover {
          border-color: #cbd5e1;
        }

        .dark-theme .room-type-card:hover {
          border-color: #475569;
        }

        .room-type-header {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .dark-theme .room-type-header {
          color: #f1f5f9;
          border-bottom-color: #334155;
        }

        .room-type-inputs {
          display: flex;
          flex-direction: column;
          gap: 0.875rem;
        }

        .input-group {
          display: flex;
          flex-direction: column;
          gap: 0.375rem;
        }

        .input-label {
          font-size: 0.75rem;
          font-weight: 500;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .dark-theme .input-label {
          color: #94a3b8;
        }

        .room-type-card .form-input {
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
        }

        .form-section {
          margin-bottom: 1.5rem;
        }

        .section-title {
          font-size: 1rem;
          font-weight: 600;
          color: #111827;
          margin-bottom: 1rem;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid #e2e8f0;
        }

        .dark-theme .section-title {
          color: #f1f5f9;
          border-bottom-color: #334155;
        }

        .form-group {
          margin-bottom: 1.25rem;
        }

        .form-label {
          display: block;
          font-size: 0.875rem;
          font-weight: 500;
          color: #374151;
          margin-bottom: 0.375rem;
        }

        .dark-theme .form-label {
          color: #e2e8f0;
        }

        .form-input,
        .form-textarea {
          width: 100%;
          padding: 0.625rem 0.875rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          font-size: 0.875rem;
          transition: all 0.2s ease;
          font-family: inherit;
          background: #ffffff;
          color: #111827;
        }

        .dark-theme .form-input,
        .dark-theme .form-textarea {
          background: #0f172a;
          border-color: #334155;
          color: #f1f5f9;
        }

        .form-input:focus,
        .form-textarea:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
        }

        .form-textarea {
          resize: vertical;
          min-height: 80px;
        }

        .form-row {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
          gap: 1.25rem;
        }

        .amenities-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 0.75rem;
        }

        .amenity-checkbox {
          position: relative;
          cursor: pointer;
        }

        .amenity-checkbox input {
          position: absolute;
          opacity: 0;
          cursor: pointer;
        }

        .amenity-label {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0.75rem;
          border: 1px solid #e2e8f0;
          border-radius: 0.5rem;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          font-size: 0.8125rem;
          color: #6b7280;
          background: #ffffff;
        }

        .dark-theme .amenity-label {
          background: #0f172a;
          border-color: #334155;
          color: #94a3b8;
        }

        .amenity-label:hover {
          border-color: #cbd5e1;
        }

        .dark-theme .amenity-label:hover {
          border-color: #475569;
        }

        .amenity-checkbox input:checked + .amenity-label {
          background: #111827;
          border-color: #111827;
          color: white;
        }

        .dark-theme .amenity-checkbox input:checked + .amenity-label {
          background: #3b82f6;
          border-color: #3b82f6;
        }

        .form-actions {
          display: flex;
          gap: 0.75rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid #e2e8f0;
        }

        .dark-theme .form-actions {
          border-top-color: #334155;
        }

        .btn {
          padding: 0.625rem 1.5rem;
          border: none;
          border-radius: 0.5rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          font-size: 0.875rem;
          display: flex;
          align-items: center;
          gap: 0.375rem;
        }

        .btn-primary {
          background: #111827;
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: #1f2937;
        }

        .dark-theme .btn-primary {
          background: #3b82f6;
        }

        .dark-theme .btn-primary:hover:not(:disabled) {
          background: #2563eb;
        }

        .btn-primary:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: #f8fafc;
          color: #374151;
          border: 1px solid #e2e8f0;
        }

        .dark-theme .btn-secondary {
          background: #334155;
          color: #f1f5f9;
          border-color: #475569;
        }

        .btn-secondary:hover {
          background: #f1f5f9;
        }

        .dark-theme .btn-secondary:hover {
          background: #475569;
        }

        .error-message {
          background: #fef2f2;
          color: #991b1b;
          padding: 0.875rem 1rem;
          border-radius: 0.5rem;
          margin-bottom: 1.25rem;
          border-left: 3px solid #dc2626;
          font-size: 0.875rem;
        }

        .dark-theme .error-message {
          background: rgba(153, 27, 27, 0.15);
          color: #fca5a5;
        }

        @media (max-width: 768px) {
          .add-hostel-container {
            padding: 1.5rem 1rem;
          }

          .page-title {
            font-size: 1.5rem;
          }

          .form-card {
            padding: 1.25rem;
          }

          .form-row {
            grid-template-columns: 1fr;
          }

          .amenities-grid {
            grid-template-columns: repeat(auto-fill, minmax(110px, 1fr));
          }

          .form-actions {
            flex-direction: column-reverse;
          }

          .btn {
            width: 100%;
            justify-content: center;
          }
        }
      `}</style>

      <div className="add-hostel-container">
        <div className="page-header">
          <h1 className="page-title">{isEditMode ? 'Edit Hostel' : 'Add New Hostel'}</h1>
          <p className="page-subtitle">Step {step} of 2 - {step === 1 ? 'Basic Information' : 'Room Configuration'}</p>
        </div>

        <div className="form-card">
          <div className="progress-bar">
            <div className="progress-fill" style={{ width: `${step * 50}%` }}></div>
          </div>

          {error && <div className="error-message">{error}</div>}

          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <>
                {/* Basic Information */}
                <div className="form-section">
                  <h2 className="section-title">Basic Information</h2>

                  <div className="form-group">
                    <label className="form-label">Hostel Name *</label>
                    <input
                      type="text"
                      name="name"
                      className="form-input"
                      placeholder="e.g., Cozy Stay Hostel"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">City *</label>
                      <input
                        type="text"
                        name="city"
                        className="form-input"
                        placeholder="e.g., Mumbai"
                        value={formData.city}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">State *</label>
                      <input
                        type="text"
                        name="state"
                        className="form-input"
                        placeholder="e.g., Maharashtra"
                        value={formData.state}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Address *</label>
                      <input
                        type="text"
                        name="address"
                        className="form-input"
                        placeholder="e.g., Bandra, Mumbai"
                        value={formData.address}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Pincode</label>
                      <input
                        type="text"
                        name="pincode"
                        className="form-input"
                        placeholder="e.g., 400050"
                        value={formData.pincode}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Location Status */}
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '1rem', 
                    marginBottom: '1rem',
                    padding: '0.75rem 1rem',
                    background: coordinates.lat !== 0 ? '#d1fae5' : '#f1f5f9',
                    borderRadius: '0.5rem',
                    fontSize: '0.875rem'
                  }}>
                    <span>
                      {coordinates.lat !== 0 
                        ? `Location set: ${coordinates.lat.toFixed(4)}, ${coordinates.lng.toFixed(4)}`
                        : 'Location will be auto-detected from address'}
                    </span>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      style={{
                        padding: '0.375rem 0.75rem',
                        background: '#4f46e5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '0.375rem',
                        cursor: 'pointer',
                        fontSize: '0.75rem',
                        fontWeight: 500
                      }}
                    >
                      {locationStatus === 'getting' ? 'Getting...' : 'Use My Location'}
                    </button>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label className="form-label">Contact Phone *</label>
                      <input
                        type="tel"
                        name="contactPhone"
                        className="form-input"
                        placeholder="e.g., +91 9876543210"
                        value={formData.contactPhone}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Hostel Type *</label>
                      <select
                        name="gender"
                        className="form-input"
                        value={formData.gender}
                        onChange={handleChange}
                        required
                      >
                        <option value="male">Male Only</option>
                        <option value="female">Female Only</option>
                        <option value="coed">Co-ed</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div className="form-section">
                  <h2 className="section-title">Description</h2>

                  <div className="form-group">
                    <label className="form-label">About Your Hostel</label>
                    <textarea
                      name="description"
                      className="form-textarea"
                      placeholder="Tell students about your hostel, facilities, and atmosphere..."
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Amenities */}
                <div className="form-section">
                  <h2 className="section-title">Amenities</h2>

                  <div className="amenities-grid">
                    {amenitiesList.map(amenity => (
                      <div key={amenity} className="amenity-checkbox">
                        <input
                          type="checkbox"
                          id={amenity}
                          checked={formData.amenities.includes(amenity)}
                          onChange={() => toggleAmenity(amenity)}
                        />
                        <label htmlFor={amenity} className="amenity-label">
                          {amenity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hostel Images */}
                <div className="form-section">
                  <h2 className="section-title">📷 Hostel Images</h2>
                  <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.9rem' }}>
                    Upload photos of your hostel. The first image (or selected main image) will be shown in search results.
                  </p>

                  <div style={{ marginBottom: '1rem' }}>
                    <label 
                      className="btn"
                      style={{ 
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        padding: '0.75rem 1.5rem',
                        background: 'var(--primary)',
                        color: 'white',
                        borderRadius: '0.5rem',
                        cursor: 'pointer',
                        fontWeight: 500
                      }}
                    >
                      {uploadingImages ? '⏳ Uploading...' : '📤 Upload Images'}
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                        style={{ display: 'none' }}
                        disabled={uploadingImages}
                      />
                    </label>
                    <span style={{ marginLeft: '1rem', color: '#6b7280', fontSize: '0.875rem' }}>
                      {images.length} image{images.length !== 1 ? 's' : ''} uploaded
                    </span>
                  </div>

                  {images.length > 0 && (
                    <div style={{ 
                      display: 'grid', 
                      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                      gap: '1rem' 
                    }}>
                      {images.map((img, index) => (
                        <div 
                          key={index} 
                          style={{ 
                            position: 'relative',
                            borderRadius: '0.5rem',
                            overflow: 'hidden',
                            border: index === mainImageIndex ? '3px solid #4f46e5' : '1px solid var(--border)',
                            aspectRatio: '4/3'
                          }}
                        >
                          <img 
                            src={img} 
                            alt={`Hostel ${index + 1}`}
                            style={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover' 
                            }}
                          />
                          
                          {/* Main image badge */}
                          {index === mainImageIndex && (
                            <div style={{
                              position: 'absolute',
                              top: '0.5rem',
                              left: '0.5rem',
                              background: '#4f46e5',
                              color: 'white',
                              padding: '0.25rem 0.5rem',
                              borderRadius: '0.25rem',
                              fontSize: '0.6875rem',
                              fontWeight: 600
                            }}>
                              MAIN
                            </div>
                          )}

                          {/* Action buttons */}
                          <div style={{
                            position: 'absolute',
                            bottom: '0.5rem',
                            left: '0.5rem',
                            right: '0.5rem',
                            display: 'flex',
                            gap: '0.5rem'
                          }}>
                            {index !== mainImageIndex && (
                              <button
                                type="button"
                                onClick={() => setAsMainImage(index)}
                                style={{
                                  flex: 1,
                                  padding: '0.375rem',
                                  background: 'rgba(255,255,255,0.9)',
                                  border: 'none',
                                  borderRadius: '0.25rem',
                                  fontSize: '0.6875rem',
                                  cursor: 'pointer',
                                  fontWeight: 500
                                }}
                              >
                                Set Main
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              style={{
                                padding: '0.375rem 0.5rem',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '0.25rem',
                                fontSize: '0.6875rem',
                                cursor: 'pointer',
                                fontWeight: 500
                              }}
                            >
                              ✕
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                {/* Room Configuration */}
                <div className="form-section">
                  <h2 className="section-title">🛏️ Room Configuration</h2>
                  <p style={{ color: '#6b7280', marginBottom: '1.5rem', fontSize: '0.95rem' }}>
                    Configure the room types and pricing for your hostel
                  </p>

                  <div className="room-config-grid">
                    {/* Single Room */}
                    <div className="room-type-card">
                      <div className="room-type-header">🛏️ Single Room</div>
                      <div className="room-type-inputs">
                        <div className="input-group">
                          <label className="input-label">Number of Rooms</label>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            placeholder="0"
                            value={rooms.single.count}
                            onChange={(e) => handleRoomChange('single', 'count', e.target.value)}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Monthly Fee (₹)</label>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            placeholder="0"
                            value={rooms.single.price}
                            onChange={(e) => handleRoomChange('single', 'price', e.target.value)}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Room Numbers (e.g., 101-110 or 101,102,103)</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="101-110"
                            value={rooms.single.roomNumbers}
                            onChange={(e) => handleRoomChange('single', 'roomNumbers', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Double Sharing */}
                    <div className="room-type-card">
                      <div className="room-type-header">👥 Double Sharing</div>
                      <div className="room-type-inputs">
                        <div className="input-group">
                          <label className="input-label">Number of Rooms</label>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            placeholder="0"
                            value={rooms.double.count}
                            onChange={(e) => handleRoomChange('double', 'count', e.target.value)}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Monthly Fee (₹)</label>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            placeholder="0"
                            value={rooms.double.price}
                            onChange={(e) => handleRoomChange('double', 'price', e.target.value)}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Room Numbers (e.g., 201-215 or 201,202,203)</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="201-215"
                            value={rooms.double.roomNumbers}
                            onChange={(e) => handleRoomChange('double', 'roomNumbers', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Triple Sharing */}
                    <div className="room-type-card">
                      <div className="room-type-header">👨‍👨‍👦 Triple Sharing</div>
                      <div className="room-type-inputs">
                        <div className="input-group">
                          <label className="input-label">Number of Rooms</label>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            placeholder="0"
                            value={rooms.triple.count}
                            onChange={(e) => handleRoomChange('triple', 'count', e.target.value)}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Monthly Fee (₹)</label>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            placeholder="0"
                            value={rooms.triple.price}
                            onChange={(e) => handleRoomChange('triple', 'price', e.target.value)}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Room Numbers (e.g., 301-320 or 301,302,303)</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="301-320"
                            value={rooms.triple.roomNumbers}
                            onChange={(e) => handleRoomChange('triple', 'roomNumbers', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Four Sharing */}
                    <div className="room-type-card">
                      <div className="room-type-header">👨‍👩‍👧‍👦 Four Person</div>
                      <div className="room-type-inputs">
                        <div className="input-group">
                          <label className="input-label">Number of Rooms</label>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            placeholder="0"
                            value={rooms.four.count}
                            onChange={(e) => handleRoomChange('four', 'count', e.target.value)}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Monthly Fee (₹)</label>
                          <input
                            type="number"
                            min="0"
                            className="form-input"
                            placeholder="0"
                            value={rooms.four.price}
                            onChange={(e) => handleRoomChange('four', 'price', e.target.value)}
                          />
                        </div>
                        <div className="input-group">
                          <label className="input-label">Room Numbers (e.g., 401-412 or 401,402,403)</label>
                          <input
                            type="text"
                            className="form-input"
                            placeholder="401-412"
                            value={rooms.four.roomNumbers}
                            onChange={(e) => handleRoomChange('four', 'roomNumbers', e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{
                    background: '#f0f9ff',
                    border: '1px solid #bfdbfe',
                    borderRadius: '0.5rem',
                    padding: '1rem',
                    marginTop: '1.5rem',
                    color: '#1e40af',
                    fontSize: '0.9rem'
                  }}>
                    💡 <strong>Total Rooms Configured:</strong> {
                      (parseInt(rooms.single.count) || 0) +
                      (parseInt(rooms.double.count) || 0) +
                      (parseInt(rooms.triple.count) || 0) +
                      (parseInt(rooms.four.count) || 0)
                    } rooms
                  </div>
                </div>
              </>
            )}

            {/* Actions */}
            <div className="form-actions">
              {step === 2 && (
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                >
                  ← Back
                </button>
              )}
              <button type="button" onClick={() => navigate('/owner/dashboard')} className="btn btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn btn-primary">
                {step === 1 ? 'Next' : loading ? 'Saving...' : isEditMode ? 'Update Hostel' : 'Create Hostel'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
    </DashboardLayout>
  )
}
