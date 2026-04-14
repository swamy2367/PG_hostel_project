import Notification from '../models/Notification.js';
import { emitToUser } from '../socket.js';

/**
 * Create a notification and emit it in real-time.
 */
export async function createNotification({
  recipientId,
  recipientModel, // 'Student' | 'Owner' | 'Admin'
  type,
  title,
  message,
  relatedId = null,
  relatedType = null,
}) {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      recipientModel,
      type,
      title,
      message,
      relatedId,
      relatedType,
    });

    // Emit real-time
    emitToUser(recipientId.toString(), {
      _id: notification._id,
      type: notification.type,
      title: notification.title,
      message: notification.message,
      relatedId: notification.relatedId,
      relatedType: notification.relatedType,
      isRead: false,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (err) {
    console.error('Notification create error:', err.message);
    return null;
  }
}

/**
 * Send notifications to multiple recipients.
 */
export async function createBulkNotifications(recipients, data) {
  const promises = recipients.map(r =>
    createNotification({ ...data, recipientId: r.id, recipientModel: r.model })
  );
  return Promise.allSettled(promises);
}
