import express from 'express';
import { createServer } from 'http';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import { initSocket } from './socket.js';
import authRoutes from './routes/auth.js';
import roomRoutes from './routes/rooms.js';
import studentRoutes from './routes/students.js';
import feeRoutes from './routes/fees.js';
import hostelRoutes from './routes/hostels.js';
import locationRoutes from './routes/location.js';
import bookingRoutes from './routes/bookings.js';
import reviewRoutes from './routes/reviews.js';
import chatbotRoutes from './routes/chatbot.js';
import complaintRoutes from './routes/complaints.js';
import paymentRoutes from './routes/payments.js';
import adminRoutes from './routes/admin.js';
import subscriptionRoutes from './routes/subscription.js';
import notificationRoutes from './routes/notifications.js';
import ownerRequestRoutes from './routes/ownerRequests.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Initialize Socket.io
initSocket(httpServer);

// Middleware
app.use(cors({
  origin: "*"
}));
app.use(express.json({ limit: '50mb' })); // Increase limit for photo uploads
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hostel_management';

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected Successfully'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/students', studentRoutes);
app.use('/api/fees', feeRoutes);
app.use('/api/hostels', hostelRoutes);
app.use('/api/location', locationRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/complaints', complaintRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/subscription', subscriptionRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/owner-requests', ownerRequestRoutes);

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Hostel Management API is running' });
});

const PORT = process.env.PORT || 5000;

httpServer.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🔌 Socket.io ready`);
});
