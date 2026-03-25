const API_URL = 'http://localhost:5000/api';

// Get token from localStorage
const getToken = () => localStorage.getItem('token');

// Set token to localStorage
const setToken = (token) => localStorage.setItem('token', token);

// Remove token from localStorage
const removeToken = () => localStorage.removeItem('token');

// Auth API
export const authAPI = {
  // Register new admin
  register: async (adminData) => {
    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(adminData),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        localStorage.setItem('adminData', JSON.stringify(data.admin));
      }

      return data;
    } catch (error) {
      console.error('Register error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Login admin
  login: async (username, password) => {
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setToken(data.token);
        localStorage.setItem('adminData', JSON.stringify(data.admin));
        localStorage.setItem('adminToken', 'true');
      }

      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Get current admin
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
      return data;
    } catch (error) {
      console.error('Get me error:', error);
      return { success: false, message: 'Network error' };
    }
  },

  // Logout
  logout: () => {
    removeToken();
    localStorage.removeItem('adminData');
    localStorage.removeItem('adminToken');
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
