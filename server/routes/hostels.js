import express from 'express';
import Hostel from '../models/Hostel.js';
import Room from '../models/Room.js';
import { authenticateOwner } from '../middleware/auth.js';

const router = express.Router();

// @route   GET /api/hostels/owner/my
// @desc    Get all owner's hostels
// @access  Private (Owner only)
router.get('/owner/my', authenticateOwner, async (req, res) => {
  try {
    const hostels = await Hostel.find({ owner: req.user.id }).sort({ createdAt: -1 });

    if (!hostels || hostels.length === 0) {
      return res.json({
        success: true,
        hostels: [],
        hostel: null,
        message: 'No hostels found. Create your first hostel!'
      });
    }

    // Get room statistics for each hostel
    const hostelsWithStats = await Promise.all(
      hostels.map(async (hostel) => {
        const roomStats = await Room.aggregate([
          { $match: { hostelId: hostel._id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 }
            }
          }
        ]);

        const stats = {};
        roomStats.forEach(stat => {
          stats[stat._id] = stat.count;
        });

        return {
          ...hostel.toObject(),
          roomStats: stats
        };
      })
    );

    res.json({
      success: true,
      hostels: hostelsWithStats,
      hostel: hostelsWithStats[0] || null // Legacy support for old code
    });

  } catch (error) {
    console.error('Get owner hostels error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hostels',
      error: error.message
    });
  }
});

// @route   GET /api/hostels/search
// @desc    Search hostels (public) - supports unified q param, city, name, sorted by relevance + rating
// @access  Public
router.get('/search', async (req, res) => {
  try {
    const { q, city, name, gender, minRent, maxRent, page = 1, limit = 20, userLat, userLng } = req.query;

    // Build query - only require isActive
    const query = {
      isActive: true
    };

    // Unified search: q searches across name, city, state, address
    if (q && q.trim()) {
      const terms = q.trim().split(/\s+/).filter(t => t.length > 0);
      // Each term must match at least one field (AND logic across terms)
      query.$and = terms.map(term => ({
        $or: [
          { name: new RegExp(term, 'i') },
          { city: new RegExp(term, 'i') },
          { state: new RegExp(term, 'i') },
          { address: new RegExp(term, 'i') },
        ]
      }));
    } else {
      // Legacy: separate city/name params (backward compatibility)
      if (city) {
        query.city = new RegExp(city.trim(), 'i');
      }
      if (name) {
        query.name = new RegExp(name.trim(), 'i');
      }
    }

    // Gender filter
    if (gender && ['male', 'female', 'coed'].includes(gender)) {
      query.gender = gender;
    }

    // Execute search with pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const hostels = await Hostel.find(query)
      .populate('owner', 'username email')
      .select('-__v')
      .sort({ 'rating.average': -1, 'rating.count': -1, createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    // Get total count for pagination
    const total = await Hostel.countDocuments(query);

    // Filter by rent if specified (check all room types)
    let filteredHostels = hostels;
    if (minRent || maxRent) {
      filteredHostels = hostels.filter(hostel => {
        const rents = [
          hostel.roomConfig?.single?.rent,
          hostel.roomConfig?.double?.rent,
          hostel.roomConfig?.triple?.rent,
          hostel.roomConfig?.four?.rent
        ].filter(r => r > 0);

        if (rents.length === 0) return true;

        const minHostelRent = Math.min(...rents);
        const maxHostelRent = Math.max(...rents);

        if (minRent && maxHostelRent < parseInt(minRent)) return false;
        if (maxRent && minHostelRent > parseInt(maxRent)) return false;

        return true;
      });
    }

    // Calculate distance from user location if provided
    const hostelsWithDistance = filteredHostels.map(hostel => {
      const hostelObj = hostel.toObject();
      
      if (userLat && userLng && hostel.coordinates?.lat && hostel.coordinates?.lng) {
        hostelObj.distance = calculateDistance(
          parseFloat(userLat),
          parseFloat(userLng),
          hostel.coordinates.lat,
          hostel.coordinates.lng
        );
      } else {
        hostelObj.distance = null;
      }

      // Add relevance scoring for unified search
      if (q && q.trim()) {
        let score = 0;
        const lowerQ = q.toLowerCase();
        const lowerName = (hostel.name || '').toLowerCase();
        const lowerCity = (hostel.city || '').toLowerCase();

        // Exact name match = highest
        if (lowerName === lowerQ) score += 100;
        else if (lowerName.startsWith(lowerQ)) score += 80;
        else if (lowerName.includes(lowerQ)) score += 60;

        // Exact city match
        if (lowerCity === lowerQ) score += 90;
        else if (lowerCity.startsWith(lowerQ)) score += 70;
        else if (lowerCity.includes(lowerQ)) score += 50;

        // Rating boost
        score += (hostel.rating?.average || 0) * 5;

        hostelObj._relevanceScore = score;
      }
      
      return hostelObj;
    });

    // Sort: relevance first (if q used), then rating, then distance
    hostelsWithDistance.sort((a, b) => {
      // Primary: relevance score (if searching)
      if (q && q.trim()) {
        const scoreA = a._relevanceScore || 0;
        const scoreB = b._relevanceScore || 0;
        if (scoreB !== scoreA) return scoreB - scoreA;
      }

      // Secondary: rating
      const ratingA = a.rating?.average || 0;
      const ratingB = b.rating?.average || 0;
      if (ratingB !== ratingA) return ratingB - ratingA;
      
      // Tertiary: review count
      const countA = a.rating?.count || 0;
      const countB = b.rating?.count || 0;
      if (countB !== countA) return countB - countA;
      
      // Quaternary: distance
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      
      return 0;
    });

    res.json({
      success: true,
      hostels: hostelsWithDistance,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });

  } catch (error) {
    console.error('Hostel search error:', error);
    res.status(500).json({
      success: false,
      message: 'Error searching hostels',
      error: error.message
    });
  }
});

// @route   GET /api/hostels/suggest
// @desc    Autocomplete suggestions for search (hostel names + cities)
// @access  Public
router.get('/suggest', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || q.trim().length < 2) {
      return res.json({ success: true, suggestions: [] });
    }

    const regex = new RegExp(q.trim(), 'i');

    // Find matching hostels (by name)
    const hostelMatches = await Hostel.find(
      { isActive: true, $or: [{ name: regex }, { city: regex }] },
      { name: 1, city: 1, state: 1, rating: 1 }
    ).limit(8).lean();

    // Build suggestions: hostel names + unique cities
    const suggestions = [];
    const seenCities = new Set();

    for (const h of hostelMatches) {
      // Add hostel name suggestion
      suggestions.push({
        type: 'hostel',
        text: h.name,
        subtext: `${h.city}, ${h.state}`,
        rating: h.rating?.average || 0,
      });

      // Add city suggestion (deduplicated)
      const cityKey = (h.city || '').toLowerCase();
      if (cityKey && !seenCities.has(cityKey)) {
        seenCities.add(cityKey);
        suggestions.push({
          type: 'city',
          text: h.city,
          subtext: h.state || '',
        });
      }
    }

    // Sort: cities first, then hostels
    suggestions.sort((a, b) => {
      if (a.type === 'city' && b.type !== 'city') return -1;
      if (a.type !== 'city' && b.type === 'city') return 1;
      return 0;
    });

    res.json({ success: true, suggestions: suggestions.slice(0, 8) });
  } catch (error) {
    console.error('Suggest error:', error);
    res.json({ success: true, suggestions: [] });
  }
});

// Helper function to calculate distance between two coordinates (Haversine formula)
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10; // Distance in km, rounded to 1 decimal
}

function toRad(deg) {
  return deg * (Math.PI / 180);
}

// @route   GET /api/hostels/:id
// @desc    Get hostel by ID (public)
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id)
      .populate('owner', 'username email contactPhone contactEmail');

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }

    // Get rooms with availability info - calculate available beds per room
    const rooms = await Room.find({ hostelId: hostel._id });
    
    // Build availability by room type
    const roomAvailability = {};
    const roomDetails = {};
    
    rooms.forEach(room => {
      const type = room.type;
      // Calculate available beds: capacity - occupants - pending bookings
      const occupantsCount = room.occupants?.length || 0;
      const pendingBookingsCount = room.currentBookings?.length || 0;
      const availableBeds = room.capacity - occupantsCount - pendingBookingsCount;
      
      if (!roomAvailability[type]) {
        roomAvailability[type] = {
          totalRooms: 0,
          totalBeds: 0,
          availableBeds: 0,
          rooms: []
        };
      }
      
      roomAvailability[type].totalRooms++;
      roomAvailability[type].totalBeds += room.capacity;
      roomAvailability[type].availableBeds += Math.max(0, availableBeds);
      
      // Include room details for UI
      if (availableBeds > 0) {
        roomAvailability[type].rooms.push({
          id: room._id,
          number: room.number,
          capacity: room.capacity,
          availableBeds: availableBeds,
          occupantsCount: occupantsCount,
          pendingBookingsCount: pendingBookingsCount,
          rent: room.rent
        });
      }
    });

    res.json({
      success: true,
      hostel: {
        ...hostel.toObject(),
        roomAvailability
      }
    });

  } catch (error) {
    console.error('Get hostel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching hostel details',
      error: error.message
    });
  }
});

// @route   GET /api/hostels/:id/rooms
// @desc    Get available rooms for a hostel (public)
// @access  Public
router.get('/:id/rooms', async (req, res) => {
  try {
    const { type } = req.query;

    const query = {
      hostelId: req.params.id,
      status: 'available'
    };

    if (type) {
      query.type = type;
    }

    const rooms = await Room.find(query)
      .select('number type capacity rent status')
      .sort({ number: 1 });

    res.json({
      success: true,
      rooms
    });

  } catch (error) {
    console.error('Get rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching rooms',
      error: error.message
    });
  }
});

// @route   POST /api/hostels
// @desc    Create a new hostel
// @access  Private (Owner only)
router.post('/', authenticateOwner, async (req, res) => {
  try {
    const {
      name,
      description,
      logo,
      address,
      city,
      state,
      pincode,
      coordinates,
      roomConfig,
      amenities,
      gender,
      images,
      contactPhone,
      contactEmail
    } = req.body;

    // Validate required fields
    if (!name || !address || !city || !state || !coordinates || !gender) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required fields'
      });
    }

    // Create hostel
    console.log('Creating new hostel for owner:', req.user.id);
    console.log('Payload:', { name, city, state, gender, roomConfig });
    
    const hostel = await Hostel.create({
      name,
      description,
      logo,
      address,
      city,
      state,
      pincode,
      coordinates,
      roomConfig: roomConfig || {
        single: { count: 0, startRoom: 101, rent: 10000 },
        double: { count: 0, startRoom: 201, rent: 8000 },
        triple: { count: 0, startRoom: 301, rent: 6500 },
        four: { count: 0, startRoom: 401, rent: 5000 }
      },
      amenities: amenities || [],
      gender,
      images: images || [],
      contactPhone,
      contactEmail,
      owner: req.user.id,
      isActive: true,
      isVerified: false // Requires admin verification
    });

    // Generate rooms based on configuration
    const rooms = [];

    // Define default start room numbers
    const defaultStartRooms = {
      single: 101,
      double: 201,
      triple: 301,
      four: 401
    };

    // Single sharing rooms
    if (roomConfig?.single?.count > 0) {
      const startRoom = roomConfig.single.startRoom || defaultStartRooms.single;
      for (let i = 0; i < roomConfig.single.count; i++) {
        rooms.push({
          number: startRoom + i,
          type: 'single',
          capacity: 1,
          rent: roomConfig.single.rent || 0,
          status: 'available',
          occupants: [],
          currentBookings: [],
          hostelId: hostel._id
        });
      }
    }

    // Double sharing rooms
    if (roomConfig?.double?.count > 0) {
      const startRoom = roomConfig.double.startRoom || defaultStartRooms.double;
      for (let i = 0; i < roomConfig.double.count; i++) {
        rooms.push({
          number: startRoom + i,
          type: 'double',
          capacity: 2,
          rent: roomConfig.double.rent || 0,
          status: 'available',
          occupants: [],
          currentBookings: [],
          hostelId: hostel._id
        });
      }
    }

    // Triple sharing rooms
    if (roomConfig?.triple?.count > 0) {
      const startRoom = roomConfig.triple.startRoom || defaultStartRooms.triple;
      for (let i = 0; i < roomConfig.triple.count; i++) {
        rooms.push({
          number: startRoom + i,
          type: 'triple',
          capacity: 3,
          rent: roomConfig.triple.rent || 0,
          status: 'available',
          occupants: [],
          currentBookings: [],
          hostelId: hostel._id
        });
      }
    }

    // Four sharing rooms
    if (roomConfig?.four?.count > 0) {
      const startRoom = roomConfig.four.startRoom || defaultStartRooms.four;
      for (let i = 0; i < roomConfig.four.count; i++) {
        rooms.push({
          number: startRoom + i,
          type: 'four',
          capacity: 4,
          rent: roomConfig.four.rent || 0,
          status: 'available',
          occupants: [],
          currentBookings: [],
          hostelId: hostel._id
        });
      }
    }

    console.log(`Creating ${rooms.length} rooms for hostel ${hostel._id}`);
    
    if (rooms.length > 0) {
      await Room.insertMany(rooms);
      console.log('✅ Rooms created successfully');
    }

    // Add hostel to owner's hostels array
    const Owner = (await import('../models/Owner.js')).default;
    await Owner.findByIdAndUpdate(req.user.id, { 
      $push: { hostels: hostel._id }
    });

    console.log('✅ Hostel created successfully:', hostel._id);

    res.status(201).json({
      success: true,
      message: 'Hostel created successfully',
      hostel
    });

  } catch (error) {
    console.error('Create hostel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating hostel',
      error: error.message
    });
  }
});

// @route   PUT /api/hostels/:id
// @desc    Update hostel
// @access  Private (Owner only)
router.put('/:id', authenticateOwner, async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }

    // Verify ownership
    if (hostel.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this hostel'
      });
    }

    // Update fields
    const allowedUpdates = [
      'name', 'description', 'logo', 'address', 'city', 'state',
      'pincode', 'coordinates', 'amenities', 'gender', 'images',
      'contactPhone', 'contactEmail', 'isActive'
    ];

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        hostel[field] = req.body[field];
      }
    });

    await hostel.save();

    res.json({
      success: true,
      message: 'Hostel updated successfully',
      hostel
    });

  } catch (error) {
    console.error('Update hostel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating hostel',
      error: error.message
    });
  }
});

// @route   DELETE /api/hostels/:id
// @desc    Delete hostel
// @access  Private (Owner only)
router.delete('/:id', authenticateOwner, async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);

    if (!hostel) {
      return res.status(404).json({
        success: false,
        message: 'Hostel not found'
      });
    }

    // Verify ownership
    if (hostel.owner.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this hostel'
      });
    }

    // Check for active bookings
    const Booking = (await import('../models/Booking.js')).default;
    const activeBookings = await Booking.countDocuments({
      hostel: hostel._id,
      status: { $in: ['pending', 'approved', 'active'] }
    });

    if (activeBookings > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete hostel with active bookings'
      });
    }

    // Delete associated rooms
    await Room.deleteMany({ hostelId: hostel._id });

    // Remove from owner's hostels array
    const Owner = (await import('../models/Owner.js')).default;
    await Owner.findByIdAndUpdate(req.user.id, {
      $pull: { hostels: hostel._id }
    });

    // Delete hostel
    await hostel.deleteOne();

    res.json({
      success: true,
      message: 'Hostel deleted successfully'
    });

  } catch (error) {
    console.error('Delete hostel error:', error);
    res.status(500).json({
      success: false,
      message: 'Error deleting hostel',
      error: error.message
    });
  }
});

// @route   POST /api/hostels/:id/sync-rooms
// @desc    Create Room documents from roomConfig (for hostels created before fix)
// @access  Private (Owner)
router.post('/:id/sync-rooms', authenticateOwner, async (req, res) => {
  try {
    const hostel = await Hostel.findById(req.params.id);
    
    if (!hostel) {
      return res.status(404).json({ success: false, message: 'Hostel not found' });
    }

    // Check ownership
    if (hostel.owner.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // Check if rooms already exist
    const existingRooms = await Room.find({ hostelId: hostel._id });
    if (existingRooms.length > 0) {
      return res.json({
        success: true,
        message: `Hostel already has ${existingRooms.length} rooms`,
        roomsCreated: 0
      });
    }

    // Create rooms from roomConfig
    const rooms = [];
    const roomConfig = hostel.roomConfig || {};
    const roomTypes = ['single', 'double', 'triple', 'four'];
    const defaultStartRooms = { single: 101, double: 201, triple: 301, four: 401 };

    for (const roomType of roomTypes) {
      const config = roomConfig[roomType];
      if (config && config.count > 0) {
        const startRoom = config.startRoom || defaultStartRooms[roomType];
        const capacity = roomType === 'single' ? 1 : 
                        roomType === 'double' ? 2 : 
                        roomType === 'triple' ? 3 : 4;

        for (let i = 0; i < config.count; i++) {
          rooms.push({
            number: startRoom + i,
            type: roomType,
            capacity: capacity,
            rent: config.rent || 0,
            status: 'available',
            occupants: [],
            currentBookings: [],
            hostelId: hostel._id
          });
        }
      }
    }

    if (rooms.length > 0) {
      await Room.insertMany(rooms);
    }

    res.json({
      success: true,
      message: `Created ${rooms.length} rooms for hostel`,
      roomsCreated: rooms.length
    });

  } catch (error) {
    console.error('Sync rooms error:', error);
    res.status(500).json({
      success: false,
      message: 'Error syncing rooms',
      error: error.message
    });
  }
});

export default router;
