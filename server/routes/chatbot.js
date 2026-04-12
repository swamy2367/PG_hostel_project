import express from 'express';
import jwt from 'jsonwebtoken';
import Student from '../models/Student.js';
import Booking from '../models/Booking.js';
import Hostel from '../models/Hostel.js';
import Room from '../models/Room.js';

const router = express.Router();

// Optional auth - get user if logged in
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
      req.userId = decoded.id;
      req.userRole = decoded.role;
    }
  } catch (error) {
    // Token invalid, continue without auth
  }
  next();
};

// @route   POST /api/chatbot/query
// @desc    Handle chatbot queries with database access (role-aware)
router.post('/query', optionalAuth, async (req, res) => {
  try {
    const { intent, query } = req.body;
    const userId = req.userId;
    const userRole = req.userRole;

    let response = { success: true, data: null, message: '', suggestions: [] };

    switch (intent) {
      // ==================== STUDENT QUERIES ====================

      case 'my_bookings':
        if (!userId || userRole !== 'student') {
          response.message = 'Please login as a student to view your bookings.';
          response.suggestions = ['How to register', 'Find hostels', 'Room types'];
        } else {
          const bookings = await Booking.find({ student: userId })
            .populate('hostel', 'name city address')
            .populate('room', 'roomNumber type price')
            .sort({ createdAt: -1 })
            .limit(5);

          if (bookings.length === 0) {
            response.message = "You don't have any bookings yet. Search for hostels and book a room to get started!";
            response.suggestions = ['Find hostels', 'Room types', 'How to book'];
          } else {
            response.data = bookings.map(b => ({
              hostel: b.hostel?.name || 'N/A',
              room: b.roomType || b.room?.roomNumber || 'N/A',
              type: b.roomType || b.room?.type || 'N/A',
              status: b.status,
              price: b.room?.price,
              date: b.createdAt
            }));
            response.message = `You have ${bookings.length} booking(s). Here are your recent bookings:`;
            response.suggestions = ['Booking status', 'Cancel booking', 'Payment info'];
          }
        }
        break;

      case 'my_booking_status':
        if (!userId || userRole !== 'student') {
          response.message = 'Please login to check your booking status.';
          response.suggestions = ['How to register', 'Find hostels'];
        } else {
          const latestBooking = await Booking.findOne({ student: userId })
            .populate('hostel', 'name')
            .sort({ createdAt: -1 });

          if (!latestBooking) {
            response.message = "You don't have any bookings yet.";
            response.suggestions = ['How to book', 'Find hostels', 'Room types'];
          } else {
            const statusMessages = {
              pending: `Your booking at "${latestBooking.hostel?.name}" is pending approval. The owner will review it soon.`,
              approved: `Great news! Your booking at "${latestBooking.hostel?.name}" has been approved! Contact the owner to arrange check-in.`,
              rejected: `Unfortunately, your booking at "${latestBooking.hostel?.name}" was not approved. You can try booking another room.`,
              cancelled: `Your booking at "${latestBooking.hostel?.name}" was cancelled.`,
              checked_in: `You are currently checked in at "${latestBooking.hostel?.name}".`,
              checked_out: `You have checked out from "${latestBooking.hostel?.name}".`
            };
            response.message = statusMessages[latestBooking.status] || `Your latest booking status is: ${latestBooking.status}`;
            response.data = { status: latestBooking.status, hostel: latestBooking.hostel?.name };
            response.suggestions = ['My bookings', 'Payment info', 'Contact support'];
          }
        }
        break;

      case 'my_dues':
        if (!userId || userRole !== 'student') {
          response.message = 'Please login to check your payment dues.';
          response.suggestions = ['How to register', 'Payment methods'];
        } else {
          const activeBooking = await Booking.findOne({
            student: userId,
            status: { $in: ['approved', 'checked_in'] }
          }).populate('room', 'price');

          if (!activeBooking) {
            response.message = "You don't have any active bookings with pending dues.";
            response.suggestions = ['My bookings', 'Find hostels'];
          } else {
            const monthlyRent = activeBooking.room?.price || 0;
            response.message = `Your monthly rent is Rs.${monthlyRent.toLocaleString()}. Contact your hostel owner for payment details and due dates.`;
            response.data = { monthlyRent };
            response.suggestions = ['Payment methods', 'My bookings', 'Contact owner'];
          }
        }
        break;

      // ==================== OWNER QUERIES ====================

      case 'owner_rooms':
        if (!userId || userRole !== 'owner') {
          response.message = 'Please login as an owner to view your rooms.';
          response.suggestions = ['How to register', 'Platform info'];
        } else {
          const ownerHostels = await Hostel.find({ owner: userId, isActive: true });
          if (ownerHostels.length === 0) {
            response.message = "You don't have any hostels yet. Add a hostel to get started!";
            response.suggestions = ['How to add hostel', 'Platform info'];
          } else {
            let allRooms = [];
            for (const hostel of ownerHostels) {
              const rooms = await Room.find({ hostel: hostel._id });
              allRooms.push({
                hostelName: hostel.name,
                totalRooms: rooms.length,
                occupied: rooms.filter(r => (r.occupants?.length || 0) >= r.capacity).length,
                available: rooms.filter(r => (r.occupants?.length || 0) < r.capacity).length
              });
            }
            response.message = `Here's your room summary across ${ownerHostels.length} hostel(s):`;
            response.data = allRooms;
            response.suggestions = ['Owner bookings', 'Revenue info', 'Complaints'];
          }
        }
        break;

      case 'owner_available_rooms':
        if (!userId || userRole !== 'owner') {
          response.message = 'Please login as an owner to view availability.';
        } else {
          const oHostels = await Hostel.find({ owner: userId, isActive: true });
          let available = [];
          for (const h of oHostels) {
            const rms = await Room.find({ hostel: h._id });
            const avail = rms.filter(r => (r.occupants?.length || 0) < r.capacity);
            if (avail.length > 0) {
              available.push({
                hostel: h.name,
                rooms: avail.map(r => ({ number: r.number || r.roomNumber, type: r.type, beds: r.capacity - (r.occupants?.length || 0) }))
              });
            }
          }
          if (available.length === 0) {
            response.message = 'All your rooms are currently occupied. Great job!';
          } else {
            response.message = `Here are your available rooms:`;
            response.data = available;
          }
          response.suggestions = ['Owner rooms', 'Owner bookings', 'Revenue info'];
        }
        break;

      case 'owner_bookings':
        if (!userId || userRole !== 'owner') {
          response.message = 'Please login as an owner to view bookings.';
        } else {
          const ownerH = await Hostel.find({ owner: userId });
          const hostelIds = ownerH.map(h => h._id);
          const ownerBookings = await Booking.find({ hostel: { $in: hostelIds } })
            .populate('student', 'name email')
            .populate('hostel', 'name')
            .sort({ createdAt: -1 })
            .limit(10);

          if (ownerBookings.length === 0) {
            response.message = "No bookings found for your hostels yet.";
          } else {
            const pending = ownerBookings.filter(b => b.status === 'pending').length;
            const approved = ownerBookings.filter(b => b.status === 'approved').length;
            response.message = `You have ${ownerBookings.length} booking(s): ${pending} pending, ${approved} approved.`;
            response.data = ownerBookings.slice(0, 5).map(b => ({
              student: b.student?.name || 'Unknown',
              hostel: b.hostel?.name || 'N/A',
              roomType: b.roomType || 'N/A',
              status: b.status,
              date: b.createdAt
            }));
          }
          response.suggestions = ['Owner rooms', 'Revenue info', 'Complaints'];
        }
        break;

      case 'owner_revenue':
        if (!userId || userRole !== 'owner') {
          response.message = 'Please login as an owner to view revenue.';
        } else {
          const revHostels = await Hostel.find({ owner: userId, isActive: true });
          let totalRevenue = 0;
          let totalOccupants = 0;
          for (const h of revHostels) {
            const rms = await Room.find({ hostel: h._id });
            rms.forEach(r => {
              const occ = r.occupants?.length || 0;
              totalOccupants += occ;
              totalRevenue += occ * (r.rent || 0);
            });
          }
          response.message = `Your estimated monthly revenue: Rs.${totalRevenue.toLocaleString()} from ${totalOccupants} occupant(s) across ${revHostels.length} hostel(s).`;
          response.data = { monthlyRevenue: totalRevenue, occupants: totalOccupants, hostels: revHostels.length };
          response.suggestions = ['Owner rooms', 'Owner bookings', 'Available rooms'];
        }
        break;

      case 'owner_complaints':
        if (!userId || userRole !== 'owner') {
          response.message = 'Please login as an owner to view complaints.';
        } else {
          // Fetch complaints via reviews marked as complaints
          const cHostels = await Hostel.find({ owner: userId });
          const hostelIdsForComplaints = cHostels.map(h => h._id);
          
          try {
            const Review = (await import('../models/Review.js')).default;
            const complaints = await Review.find({ 
              hostel: { $in: hostelIdsForComplaints }, 
              isComplaint: true 
            })
              .populate('student', 'name')
              .sort({ createdAt: -1 })
              .limit(5);
            
            if (complaints.length === 0) {
              response.message = 'No complaints found. Your hostels are running smoothly!';
            } else {
              response.message = `You have ${complaints.length} complaint(s):`;
              response.data = complaints.map(c => ({
                student: c.student?.name || 'Anonymous',
                comment: c.comment?.substring(0, 100) || 'N/A',
                rating: c.rating,
                date: c.createdAt
              }));
            }
          } catch (e) {
            response.message = 'No complaints found for your hostels.';
          }
          response.suggestions = ['Owner rooms', 'Owner bookings', 'Revenue info'];
        }
        break;

      // ==================== HOSTEL QUERIES (all roles) ====================

      case 'hostel_count':
        const hostelCount = await Hostel.countDocuments({ isActive: true });
        response.message = `We currently have ${hostelCount} hostels listed on our platform across various cities.`;
        response.data = { count: hostelCount };
        response.suggestions = ['Top rated hostels', 'Find hostels', 'Cheapest hostels'];
        break;

      case 'hostels_in_city':
        const city = query?.city?.toLowerCase();
        if (!city) {
          const cities = await Hostel.distinct('city');
          response.message = `We have hostels in: ${cities.filter(c => c).slice(0, 10).join(', ')}. Which city are you looking for?`;
          response.data = { cities: cities.filter(c => c) };
          response.suggestions = cities.filter(c => c).slice(0, 3).map(c => `Hostels in ${c}`);
        } else {
          const cityHostels = await Hostel.find({
            city: new RegExp(city, 'i'),
            isActive: true
          }).select('name city priceRange rating').limit(5);

          if (cityHostels.length === 0) {
            response.message = `No hostels found in "${city}". Try searching for nearby areas or check our full hostel list.`;
            response.suggestions = ['How many hostels', 'Top rated', 'Cheapest hostels'];
          } else {
            response.message = `Found ${cityHostels.length} hostel(s) in ${city}:`;
            response.data = cityHostels.map(h => ({
              name: h.name,
              city: h.city,
              priceRange: h.priceRange,
              rating: h.rating
            }));
            response.suggestions = ['Top rated hostels', 'Cheapest hostels', 'Room types'];
          }
        }
        break;

      case 'cheapest_hostels':
        const cheapHostels = await Hostel.find({ isActive: true })
          .sort({ 'priceRange.min': 1 })
          .limit(5)
          .select('name city priceRange');

        response.message = 'Here are the most affordable hostels:';
        response.data = cheapHostels.map(h => ({
          name: h.name,
          city: h.city,
          startingFrom: h.priceRange?.min || 'N/A'
        }));
        response.suggestions = ['Top rated hostels', 'Room types', 'How to book'];
        break;

      case 'top_rated_hostels':
        const topHostels = await Hostel.find({ isActive: true, rating: { $gt: 0 } })
          .sort({ rating: -1 })
          .limit(5)
          .select('name city rating reviewCount');

        if (topHostels.length === 0) {
          response.message = 'No rated hostels yet. Be the first to leave a review!';
        } else {
          response.message = 'Here are our top-rated hostels:';
          response.data = topHostels.map(h => ({
            name: h.name,
            city: h.city,
            rating: h.rating?.toFixed(1),
            reviews: h.reviewCount || 0
          }));
        }
        response.suggestions = ['Cheapest hostels', 'Find hostels', 'Room types'];
        break;

      case 'hostel_info':
        const hostelName = query?.hostelName;
        if (!hostelName) {
          response.message = 'Which hostel would you like to know about?';
        } else {
          const hostel = await Hostel.findOne({
            name: new RegExp(hostelName, 'i'),
            isActive: true
          });

          if (!hostel) {
            response.message = `Couldn't find a hostel named "${hostelName}". Try searching on our search page for more options.`;
          } else {
            response.message = `Here's information about ${hostel.name}:`;
            response.data = {
              name: hostel.name,
              city: hostel.city,
              address: hostel.address,
              priceRange: `Rs.${hostel.priceRange?.min || 'N/A'} - Rs.${hostel.priceRange?.max || 'N/A'}`,
              amenities: hostel.amenities?.slice(0, 5) || [],
              rating: hostel.rating?.toFixed(1) || 'Not rated',
              type: hostel.type
            };
          }
        }
        response.suggestions = ['Room types', 'How to book', 'Top rated'];
        break;

      // ==================== ROOM QUERIES ====================

      case 'room_types':
        response.message = 'We offer various room types:\n\n- **Single Room** - Private room for 1 person (most expensive)\n- **Double Sharing** - Room shared by 2 people\n- **Triple Sharing** - Room shared by 3 people\n- **Four Sharing** - Room shared by 4+ people (most affordable)\n\nPrices decrease with more sharing. What type interests you?';
        response.suggestions = ['Available rooms', 'Find hostels', 'How to book'];
        break;

      case 'available_rooms':
        const availableRooms = await Room.aggregate([
          { $match: { isActive: true } },
          { $addFields: { available: { $subtract: ['$capacity', '$currentOccupancy'] } } },
          { $match: { available: { $gt: 0 } } },
          { $group: { _id: '$type', count: { $sum: 1 }, avgPrice: { $avg: '$price' } } }
        ]);

        if (availableRooms.length === 0) {
          response.message = 'Checking room availability... Please search specific hostels for accurate availability.';
        } else {
          response.message = 'Here\'s the current availability across all hostels:';
          response.data = availableRooms.map(r => ({
            type: r._id,
            availableRooms: r.count,
            avgPrice: Math.round(r.avgPrice)
          }));
        }
        response.suggestions = ['Find hostels', 'Room types', 'How to book'];
        break;

      // ==================== STATISTICS ====================

      case 'platform_stats':
        const [totalHostels, totalStudents, totalBookings] = await Promise.all([
          Hostel.countDocuments({ isActive: true }),
          Student.countDocuments(),
          Booking.countDocuments()
        ]);

        response.message = `Platform Statistics:\n- ${totalHostels} active hostels\n- ${totalStudents} registered students\n- ${totalBookings} total bookings made`;
        response.data = { hostels: totalHostels, students: totalStudents, bookings: totalBookings };
        response.suggestions = ['Find hostels', 'Top rated', 'Room types'];
        break;

      default:
        response.message = "I can help you with booking info, hostel search, room availability, and payment queries. What would you like to know?";
        response.suggestions = ['My bookings', 'Find hostels', 'Room types', 'Payment info'];
    }

    res.json(response);
  } catch (error) {
    console.error('Chatbot query error:', error);
    res.status(500).json({
      success: false,
      message: 'Sorry, I encountered an error. Please try again or contact support.',
      suggestions: ['Find hostels', 'Room types', 'Payment info']
    });
  }
});

export default router;
