import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';

let io = null;
// Map userId -> Set of socketIds
const userSockets = new Map();

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
  });

  io.on('connection', (socket) => {
    const { token } = socket.handshake.auth;
    if (!token) { socket.disconnect(); return; }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;
      const role = decoded.role;
      socket.userId = userId;
      socket.userRole = role;

      // Track socket
      if (!userSockets.has(userId)) userSockets.set(userId, new Set());
      userSockets.get(userId).add(socket.id);

      // Join role-based room
      socket.join(`role:${role}`);
      socket.join(`user:${userId}`);

      console.log(`🔌 Socket connected: ${role}:${userId}`);

      socket.on('disconnect', () => {
        const sockets = userSockets.get(userId);
        if (sockets) {
          sockets.delete(socket.id);
          if (sockets.size === 0) userSockets.delete(userId);
        }
      });
    } catch (err) {
      socket.disconnect();
    }
  });

  return io;
}

export function getIO() {
  return io;
}

/**
 * Send a real-time notification to a specific user.
 * @param {string} userId
 * @param {object} notification - the saved notification document (or plain object)
 */
export function emitToUser(userId, notification) {
  if (!io) return;
  io.to(`user:${userId}`).emit('notification', notification);
}

/**
 * Send a notification to all users with a specific role.
 * @param {'student'|'owner'|'admin'} role
 * @param {object} notification
 */
export function emitToRole(role, notification) {
  if (!io) return;
  io.to(`role:${role}`).emit('notification', notification);
}
