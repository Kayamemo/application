// ============================================================
// Notification Service
// Creates a DB notification AND emits a real-time Socket.io event
// so the frontend receives it instantly without polling.
// ============================================================
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Create a notification in the DB and emit it to the user's socket room.
 *
 * @param {import('socket.io').Server} io - Socket.io server instance (req.io)
 * @param {object} opts
 * @param {string} opts.userId      - Recipient user ID
 * @param {string} opts.type        - NotificationType enum value
 * @param {string} opts.title       - Short title
 * @param {string} opts.body        - Longer description
 * @param {string} [opts.link]      - Frontend route to navigate to
 */
async function createNotification(io, { userId, type, title, body, link }) {
  const notification = await prisma.notification.create({
    data: { userId, type, title, body, link },
  });

  // Emit to user's private room (user joins this room on connect)
  if (io) {
    io.to(`user:${userId}`).emit('notification', notification);
  }

  return notification;
}

module.exports = { createNotification };
