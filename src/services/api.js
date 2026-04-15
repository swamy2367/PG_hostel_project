const API_URL = '/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token') || localStorage.getItem('adminToken');

// Set token to localStorage
const setToken = (token) => localStorage.setItem('token', token);

// Remove token from localStorage
const removeToken = () => localStorage.removeItem('token');

// Auth API
export const authAPI = {
  // Owner registration
  ownerRegister: async (ownerData) => {
    try {
      const response = await fetch(`${API_URL}/auth/owner/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(ownerData),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userName', data.user.name || data.user.username);
      }

      return data;
    } catch (error) {
      console.error('Owner register error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Owner login
  ownerLogin: async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/owner/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userName', data.user.name || data.user.username);
      }

      return data;
    } catch (error) {
      console.error('Owner login error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Student registration
  studentRegister: async (studentData) => {
    try {
      const response = await fetch(`${API_URL}/auth/student/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(studentData),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userName', data.user.name || data.user.email);
      }

      return data;
    } catch (error) {
      console.error('Student register error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Student login
  studentLogin: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/student/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userName', data.user.name || data.user.email);
      }

      return data;
    } catch (error) {
      console.error('Student login error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get current user (works for both roles)
  getMe: async () => {
    try {
      const token = getToken();
      if (!token) return { success: false, message: 'No token' };

      const response = await fetch(`${API_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();

      // Auto-clear stale/corrupt tokens so they stop spamming requests
      if (!data.success && (data.tokenInvalid || data.tokenExpired)) {
        removeToken();
        localStorage.removeItem('userData');
        localStorage.removeItem('userRole');
        localStorage.removeItem('userName');
      }

      return data;
    } catch (error) {
      console.error('Get me error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Logout
  logout: () => {
    removeToken();
    localStorage.removeItem('userData');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('adminData'); // Legacy cleanup
    localStorage.removeItem('adminToken'); // Legacy cleanup
  },

  // Send OTP for registration verification
  sendOtp: async ({ email, role }) => {
    try {
      const response = await fetch(`${API_URL}/auth/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, role }),
      });
      return await response.json();
    } catch (error) {
      console.error('Send OTP error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Verify OTP
  verifyOtp: async ({ email, emailOtp, role }) => {
    try {
      const response = await fetch(`${API_URL}/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, emailOtp, role }),
      });
      return await response.json();
    } catch (error) {
      console.error('Verify OTP error:', error);
      return { success: false, message: 'Network error' };
    }
  },
};

// Students API
export const studentsAPI = {
  // Get all students
  getAll: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/students`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get students error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Add new student
  add: async (studentData) => {
    try {
      const token = getToken();
      console.log('Making request to:', `${API_URL}/students`);
      console.log('With token:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${API_URL}/students`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(studentData),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      
      return data;
    } catch (error) {
      console.error('Add student error:', error);
      return { success: false, message: 'Network error: ' + error.message };
    }
  },

  // Remove student
  remove: async (studentId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Remove student error:', error);
      return { success: false, message: 'Network error' };
    }
  },
};

// Rooms API
export const roomsAPI = {
  // Get all rooms
  getAll: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/rooms`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get rooms error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get rooms by type
  getByType: async (type) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/rooms/${type}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get rooms by type error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Update room status
  updateStatus: async (roomId, status) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/rooms/${roomId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      return await response.json();
    } catch (error) {
      console.error('Update room status error:', error);
      return { success: false, message: 'Network error' };
    }
  },
};

// Fees API
export const feesAPI = {
  // Add payment
  addPayment: async (paymentData) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/fees/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(paymentData),
      });

      return await response.json();
    } catch (error) {
      console.error('Add payment error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get payment history
  getHistory: async (studentId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/fees/student/${studentId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      return await response.json();
    } catch (error) {
      console.error('Get payment history error:', error);
      return { success: false, message: 'Network error' };
    }
  },
};

// Hostels API
export const hostelsAPI = {
  // Search hostels (public)
  search: async (params) => {
    try {
      const queryString = new URLSearchParams(params).toString();
      const response = await fetch(`${API_URL}/hostels/search?${queryString}`);
      return await response.json();
    } catch (error) {
      console.error('Search hostels error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get hostel by ID (public)
  getById: async (id) => {
    try {
      const response = await fetch(`${API_URL}/hostels/${id}`);
      return await response.json();
    } catch (error) {
      console.error('Get hostel error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get rooms for a hostel (public)
  getRooms: async (id, type = null) => {
    try {
      const queryString = type ? `?type=${type}` : '';
      const response = await fetch(`${API_URL}/hostels/${id}/rooms${queryString}`);
      return await response.json();
    } catch (error) {
      console.error('Get hostel rooms error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Create hostel (owner only)
  create: async (hostelData) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/hostels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(hostelData),
      });
      return await response.json();
    } catch (error) {
      console.error('Create hostel error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Update hostel (owner only)
  update: async (id, hostelData) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/hostels/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(hostelData),
      });
      return await response.json();
    } catch (error) {
      console.error('Update hostel error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get owner's hostel (owner only)
  getMyHostel: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/hostels/owner/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get my hostel error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Autocomplete suggestions (public)
  suggest: async (query) => {
    try {
      const response = await fetch(`${API_URL}/hostels/suggest?q=${encodeURIComponent(query)}`);
      return await response.json();
    } catch (error) {
      console.error('Suggest error:', error);
      return { success: true, suggestions: [] };
    }
  },
};

// Location API
export const locationAPI = {
  // Autocomplete city search (public)
  autocomplete: async (query) => {
    try {
      const response = await fetch(`${API_URL}/location/autocomplete?q=${encodeURIComponent(query)}`);
      return await response.json();
    } catch (error) {
      console.error('Location autocomplete error:', error);
      return { success: false, message: 'Network error' };
    }
  },
};

// Bookings API
export const bookingsAPI = {
  // Calculate price for flexible duration
  calculatePrice: async (hostelId, roomType, durationType, durationValue) => {
    try {
      const response = await fetch(`${API_URL}/bookings/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hostelId, roomType, durationType, durationValue }),
      });
      return await response.json();
    } catch (error) {
      console.error('Calculate price error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Create booking request (student only)
  create: async (bookingData) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/bookings/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(bookingData),
      });
      return await response.json();
    } catch (error) {
      console.error('Create booking error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get student's bookings (student only)
  getMyBookings: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/bookings/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get my bookings error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Cancel booking (student only)
  cancel: async (bookingId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/bookings/${bookingId}/cancel`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Cancel booking error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get pending bookings for hostel (owner only)
  getPending: async (hostelId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/bookings/hostel/${hostelId}/pending`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get pending bookings error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get active bookings for hostel (owner only)
  getActive: async (hostelId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/bookings/hostel/${hostelId}/active`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get active bookings error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Approve booking (owner only)
  approve: async (bookingId, notes = '', checkInDate = null) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/bookings/${bookingId}/approve`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ownerNotes: notes, checkInDate }),
      });
      return await response.json();
    } catch (error) {
      console.error('Approve booking error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Reject booking (owner only)
  reject: async (bookingId, notes = '') => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/bookings/${bookingId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ ownerNotes: notes }),
      });
      return await response.json();
    } catch (error) {
      console.error('Reject booking error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get all bookings for owner across all hostels (owner only)
  getAllOwnerBookings: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/bookings/owner/all`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get all owner bookings error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Checkout a booking (owner only)
  checkout: async (bookingId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/bookings/${bookingId}/checkout`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Checkout booking error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Request refund (student only)
  refund: async (bookingId, reason) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/bookings/${bookingId}/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ reason }),
      });
      return await response.json();
    } catch (error) {
      console.error('Refund error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Confirm booking with verification code (owner only)
  confirmCode: async (code) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/bookings/confirm-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      });
      return await response.json();
    } catch (error) {
      console.error('Confirm code error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Switch booking to different hostel (student only)
  switchBooking: async (bookingId, data) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/bookings/${bookingId}/switch`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Switch booking error:', error);
      return { success: false, message: 'Network error' };
    }
  },
};

// Reviews API
export const reviewsAPI = {
  // Create a review (student only)
  create: async (reviewData) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(reviewData),
      });
      return await response.json();
    } catch (error) {
      console.error('Create review error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get reviews for a hostel (public)
  getByHostel: async (hostelId) => {
    try {
      const response = await fetch(`${API_URL}/reviews/hostel/${hostelId}`);
      return await response.json();
    } catch (error) {
      console.error('Get hostel reviews error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get student's reviews
  getMyReviews: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/reviews/my`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get my reviews error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Update a review
  update: async (reviewId, data) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/reviews/${reviewId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      console.error('Update review error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Owner respond to review
  respond: async (reviewId, ownerResponse, complaintStatus) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/reviews/${reviewId}/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ response: ownerResponse, complaintStatus }),
      });
      return await res.json();
    } catch (error) {
      console.error('Respond to review error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get complaints for owner
  getComplaints: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/reviews/owner/complaints`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      return await response.json();
    } catch (error) {
      console.error('Get complaints error:', error);
      return { success: false, message: 'Network error' };
    }
  },
};

// Payments API (Razorpay escrow)
export const paymentsAPI = {
  getRazorpayKey: async () => {
    try {
      const response = await fetch(`${API_URL}/payments/razorpay-key`);
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
  createOrder: async (bookingId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/payments/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ bookingId }),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
  verifyPayment: async (data) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/payments/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(data),
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
  getStatus: async (bookingId) => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/payments/status/${bookingId}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
  getWallet: async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_URL}/payments/wallet`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return await response.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
};

// Admin API
export const adminAPI = {
  login: async (email, password) => {
    try {
      const response = await fetch(`${API_URL}/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (data.success) {
        localStorage.setItem('adminToken', data.token);
        localStorage.setItem('userData', JSON.stringify(data.user));
        localStorage.setItem('userRole', 'admin');
      }
      return data;
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
  getDashboard: async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/dashboard`, { headers: { 'Authorization': `Bearer ${token}` } });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
  getPayments: async (status = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      const q = status ? `?status=${status}` : '';
      const res = await fetch(`${API_URL}/admin/payments${q}`, { headers: { 'Authorization': `Bearer ${token}` } });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
  releasePayment: async (paymentId, notes = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/payments/${paymentId}/release`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ notes }),
      });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
  getBookings: async (status = '') => {
    try {
      const token = localStorage.getItem('adminToken');
      const q = status ? `?status=${status}` : '';
      const res = await fetch(`${API_URL}/admin/bookings${q}`, { headers: { 'Authorization': `Bearer ${token}` } });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
  getRefunds: async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/refunds`, { headers: { 'Authorization': `Bearer ${token}` } });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
  getStudents: async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/users/students`, { headers: { 'Authorization': `Bearer ${token}` } });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
  getOwners: async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/users/owners`, { headers: { 'Authorization': `Bearer ${token}` } });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
  blockUser: async (userId, role, block) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/users/${userId}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ role, block }),
      });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
  getHostels: async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/hostels`, { headers: { 'Authorization': `Bearer ${token}` } });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
  toggleHostel: async (hostelId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/hostels/${hostelId}/toggle`, {
        method: 'PUT', headers: { 'Authorization': `Bearer ${token}` },
      });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
  getTransactions: async (page = 1) => {
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_URL}/admin/transactions?page=${page}`, { headers: { 'Authorization': `Bearer ${token}` } });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
};

// Subscription API (One-Time Payment)
export const subscriptionAPI = {
  getPlan: async () => {
    try {
      const res = await fetch(`${API_URL}/subscription/plans`);
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },

  getStatus: async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/subscription/status`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },

  pay: async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/subscription/pay`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
};

// Notification API
export const notificationAPI = {
  getAll: async (unreadOnly = false) => {
    try {
      const token = getToken();
      const url = `${API_URL}/notifications${unreadOnly ? '?unreadOnly=true' : ''}`;
      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },

  markRead: async (id) => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/notifications/${id}/read`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },

  markAllRead: async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/notifications/read-all`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      return await res.json();
    } catch (error) {
      return { success: false, message: 'Network error' };
    }
  },
};
